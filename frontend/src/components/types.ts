export interface TableData {
  headers: string[];
  rows: string[][];
}

export type Theme = 'dark' | 'light' | 'business';

export interface ThemeStyle {
  name: string;
  backgroundColor: string;
  headerColor: string;
  textColor: string;
  borderColor: string;
  hoverColor: string;
}

export type ExportFormat = 'png' | 'jpg';

export interface ApiParseResponse {
  success: boolean;
  data?: TableData;
  error?: string;
}

export interface ApiExportResponse {
  success: boolean;
  error?: string;
}
