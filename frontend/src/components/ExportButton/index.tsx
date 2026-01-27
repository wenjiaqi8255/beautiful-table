import { useState } from 'react';
import type { ExportFormat } from '../types';
import './ExportButton.css';

interface ExportButtonProps {
  creditsRemaining: number;
  hasData: boolean;
  onExport: (format: ExportFormat) => Promise<void>;
}

export default function ExportButton({
  creditsRemaining,
  hasData,
  onExport,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      await onExport(format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = hasData && creditsRemaining > 0 && !isExporting;

  return (
    <div className="export-button-container">
      <div className="export-button-credits">
        {creditsRemaining === 0
          ? 'No credits remaining'
          : creditsRemaining === 1
            ? '1 credit remaining'
            : `${creditsRemaining} credits remaining`}
      </div>

      <div className="export-button-buttons">
        <button
          onClick={() => handleExport('png')}
          disabled={!canExport}
          className="export-button"
          aria-label="Export as PNG"
        >
          {isExporting ? 'Exporting...' : 'Export as PNG'}
        </button>

        <button
          onClick={() => handleExport('jpg')}
          disabled={!canExport}
          className="export-button"
          aria-label="Export as JPG"
        >
          {isExporting ? 'Exporting...' : 'Export as JPG'}
        </button>
      </div>
    </div>
  );
}
