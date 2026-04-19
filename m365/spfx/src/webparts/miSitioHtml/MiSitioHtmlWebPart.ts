import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPHttpClient } from '@microsoft/sp-http';
import appHtml from './components/app.html';
import './components/styles.css';
import { initApp, IMarkdownDataProvider } from './components/app';
import * as strings from 'MiSitioHtmlWebPartStrings';

export interface IMiSitioHtmlWebPartProps {
  description: string;
  dataSiteUrl: string;
  dataFileServerRelativeUrl: string;
  enableMaintainer: boolean;
}

export default class MiSitioHtmlWebPart extends BaseClientSideWebPart<IMiSitioHtmlWebPartProps> {

  private getEffectiveSiteUrl(): string {
    return (this.properties.dataSiteUrl || '').trim() || this.context.pageContext.web.absoluteUrl;
  }

  private getFileServerRelativeUrl(): string {
    return (this.properties.dataFileServerRelativeUrl || '').trim();
  }

  private buildFileApiRoot(siteUrl: string, serverRelativeUrl: string): string {
    const base = siteUrl.replace(/\/$/, '');
    const escaped = serverRelativeUrl.replace(/'/g, "''");
    return `${base}/_api/web/GetFileByServerRelativePath(decodedurl='${escaped}')`;
  }

  private async loadRemoteMarkdown(): Promise<{ content: string; etag: string }> {
    const siteUrl = this.getEffectiveSiteUrl();
    const fileUrl = this.getFileServerRelativeUrl();

    if (!fileUrl) {
      throw new Error('No se configuro la ruta del archivo proyectos.md en el WebPart.');
    }

    const fileApiRoot = this.buildFileApiRoot(siteUrl, fileUrl);

    const metadataResponse = await this.context.spHttpClient.get(
      fileApiRoot,
      SPHttpClient.configurations.v1,
      {
        headers: {
          'Accept': 'application/json;odata=nometadata'
        }
      }
    );

    if (!metadataResponse.ok) {
      throw new Error(`No se pudo leer metadatos del archivo remoto (HTTP ${metadataResponse.status}).`);
    }

    const metadata = await metadataResponse.json();
    const etag = metadata && metadata['@odata.etag'] ? metadata['@odata.etag'] : '*';

    const contentResponse = await this.context.spHttpClient.get(
      `${fileApiRoot}/$value`,
      SPHttpClient.configurations.v1
    );

    if (!contentResponse.ok) {
      throw new Error(`No se pudo leer el contenido remoto de proyectos.md (HTTP ${contentResponse.status}).`);
    }

    const content = await contentResponse.text();
    return { content, etag };
  }

  private async saveRemoteMarkdown(content: string, etag: string): Promise<string> {
    const siteUrl = this.getEffectiveSiteUrl();
    const fileUrl = this.getFileServerRelativeUrl();

    if (!fileUrl) {
      throw new Error('No se configuro la ruta del archivo proyectos.md en el WebPart.');
    }

    const fileApiRoot = this.buildFileApiRoot(siteUrl, fileUrl);
    const saveResponse = await this.context.spHttpClient.post(
      `${fileApiRoot}/$value`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          'IF-MATCH': etag || '*',
          'X-HTTP-Method': 'PUT'
        },
        body: content
      }
    );

    if (saveResponse.status === 412) {
      throw new Error('Conflicto de edicion detectado. Recarga los datos antes de guardar nuevamente.');
    }

    if (!saveResponse.ok) {
      throw new Error(`No se pudo guardar el archivo remoto (HTTP ${saveResponse.status}).`);
    }

    const metadataResponse = await this.context.spHttpClient.get(
      fileApiRoot,
      SPHttpClient.configurations.v1,
      {
        headers: {
          'Accept': 'application/json;odata=nometadata'
        }
      }
    );

    if (!metadataResponse.ok) {
      return '*';
    }

    const metadata = await metadataResponse.json();
    return metadata && metadata['@odata.etag'] ? metadata['@odata.etag'] : '*';
  }

  private getDataProvider(): IMarkdownDataProvider {
    const filePath = this.getFileServerRelativeUrl();

    return {
      loadRemoteMarkdown: () => this.loadRemoteMarkdown(),
      saveRemoteMarkdown: (content: string, etag: string) => this.saveRemoteMarkdown(content, etag),
      editorEnabled: !!this.properties.enableMaintainer,
      remotePathLabel: filePath || '(sin configurar)'
    };
  }

  public render(): void {
    this.domElement.innerHTML = appHtml;
    initApp(this.domElement, this.getDataProvider());
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('dataSiteUrl', {
                  label: strings.DataSiteUrlFieldLabel,
                  description: strings.DataSiteUrlFieldDescription,
                  placeholder: 'https://contoso.sharepoint.com/sites/mi-sitio'
                }),
                PropertyPaneTextField('dataFileServerRelativeUrl', {
                  label: strings.DataFilePathFieldLabel,
                  description: strings.DataFilePathFieldDescription,
                  placeholder: '/sites/mi-sitio/Shared Documents/proyectos.md'
                }),
                PropertyPaneToggle('enableMaintainer', {
                  label: strings.EnableMaintainerFieldLabel,
                  onText: strings.EnableMaintainerOnText,
                  offText: strings.EnableMaintainerOffText
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
