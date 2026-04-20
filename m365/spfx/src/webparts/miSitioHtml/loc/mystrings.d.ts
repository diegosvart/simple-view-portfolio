declare interface IMiSitioHtmlWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  DataSiteUrlFieldLabel: string;
  DataSiteUrlFieldDescription: string;
  DataFilePathFieldLabel: string;
  DataFilePathFieldDescription: string;
  EnableMaintainerFieldLabel: string;
  EnableMaintainerOnText: string;
  EnableMaintainerOffText: string;
}

declare module 'MiSitioHtmlWebPartStrings' {
  const strings: IMiSitioHtmlWebPartStrings;
  export = strings;
}
