import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { useStore } from '../../components/useStore';
import PasteInput from '../../components/PasteInput';
import TablePreview from '../../components/TablePreview';
import ThemeSelector from '../../components/ThemeSelector';
import ExportButton from '../../components/ExportButton';
import type { ExportFormat } from '../../components/types';
import './DashboardPage.css';

export default function DashboardPage() {
  const tableRef = useRef<HTMLDivElement>(null);
  const {
    tableData,
    selectedTheme,
    creditsRemaining,
    hasCredits,
    setTableData,
    setTheme,
    decrementCredits,
  } = useStore();

  const handleExport = async (format: ExportFormat) => {
    if (!tableRef.current || !tableData) return;

    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
      });

      const dataUrl = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 0.95);

      // Create download link
      const link = document.createElement('a');
      link.download = `table-export.${format}`;
      link.href = dataUrl;
      link.click();

      decrementCredits();
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Beautiful Table</h1>
        <p className="dashboard-subtitle">
          Transform your data into stunning, styled tables
        </p>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-section">
          <h2 className="section-title">Input</h2>
          <PasteInput onDataParsed={setTableData} />
        </section>

        {tableData && (
          <>
            <section className="dashboard-section">
              <h2 className="section-title">Theme</h2>
              <ThemeSelector selectedTheme={selectedTheme} onSelect={setTheme} />
            </section>

            <section className="dashboard-section">
              <h2 className="section-title">Preview</h2>
              <div ref={tableRef} className="table-preview-wrapper">
                <TablePreview data={tableData} theme={selectedTheme} />
              </div>
            </section>

            <section className="dashboard-section">
              <h2 className="section-title">Export</h2>
              <ExportButton
                creditsRemaining={creditsRemaining}
                hasData={!!tableData}
                onExport={handleExport}
              />
            </section>
          </>
        )}

        {!tableData && (
          <section className="dashboard-section">
            <div className="dashboard-empty">
              <p>📊 Paste your data above to get started</p>
              <p className="dashboard-empty-hint">
                Supports Excel, Google Sheets, CSV, and TSV formats
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
