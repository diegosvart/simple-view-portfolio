import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import appHtml from './components/app.html';
import './components/styles.css';
import { initApp } from './components/app';
import * as strings from 'MiSitioHtmlWebPartStrings';

export interface IMiSitioHtmlWebPartProps {
  description: string;
}

export default class MiSitioHtmlWebPart extends BaseClientSideWebPart<IMiSitioHtmlWebPartProps> {

  public render(): void {
    this.domElement.innerHTML = appHtml;
    initApp(this.domElement);
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
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
