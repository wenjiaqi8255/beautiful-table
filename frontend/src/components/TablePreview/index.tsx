import type { TableData, Theme } from '../types';
import { THEMES } from './themes';
import './TablePreview.css';

interface TablePreviewProps {
  data: TableData | null;
  theme: Theme;
}

export default function TablePreview({ data, theme }: TablePreviewProps) {
  const themeStyles = THEMES[theme];

  if (!data || data.headers.length === 0) {
    return (
      <div className="table-preview-empty">
        <p>No data to display</p>
        <p className="table-preview-empty-hint">Paste data in the input area to see a preview</p>
      </div>
    );
  }

  const { headers, rows } = data;
  const rowCount = rows.length;
  const columnCount = headers.length;

  return (
    <div className="table-preview-container">
      <div className="table-preview-info">
        <span>{rowCount} row{rowCount !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span>{columnCount} column{columnCount !== 1 ? 's' : ''}</span>
      </div>

      <table
        className="table-preview-table"
        style={{
          backgroundColor: themeStyles.backgroundColor,
          color: themeStyles.textColor,
          border: `1px solid ${themeStyles.borderColor}`,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: `2px solid ${themeStyles.borderColor}`,
            }}
          >
            {headers.map((header, index) => (
              <th
                key={index}
                style={{
                  backgroundColor: themeStyles.headerColor,
                  borderColor: themeStyles.borderColor,
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                borderBottom: `1px solid ${themeStyles.borderColor}`,
              }}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    borderColor: themeStyles.borderColor,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
