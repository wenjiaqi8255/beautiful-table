import { useState } from 'react';
import type { TableData } from '../types';
import './PasteInput.css';

interface PasteInputProps {
  onDataParsed: (data: TableData) => void;
}

export default function PasteInput({ onDataParsed }: PasteInputProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    setText(pastedText);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: pastedText }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Failed to parse data';
        setError(errorMessage);
        return;
      }

      if (result.data) {
        onDataParsed(result.data);
        setText(''); // Clear textarea on success
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="paste-input-container">
      <textarea
        value={text}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder="Paste your data here (supports Excel, Google Sheets, CSV, TSV)..."
        className="paste-input-textarea"
        disabled={isLoading}
      />
      {isLoading && <div className="paste-input-loading">Parsing...</div>}
      {error && <div className="paste-input-error">{error}</div>}
    </div>
  );
}
