import type { Theme } from '../types';
import { THEMES } from '../TablePreview/themes';
import './ThemeSelector.css';

interface ThemeSelectorProps {
  selectedTheme: Theme;
  onSelect: (theme: Theme) => void;
}

export default function ThemeSelector({ selectedTheme, onSelect }: ThemeSelectorProps) {
  const themes: Theme[] = ['dark', 'light', 'business'];

  const handleSelect = (theme: Theme) => {
    if (theme !== selectedTheme) {
      onSelect(theme);
    }
  };

  return (
    <div className="theme-selector">
      <div className="theme-selector-label">Select Theme</div>
      <div className="theme-selector-buttons">
        {themes.map((theme) => {
          const themeStyle = THEMES[theme];
          const isSelected = selectedTheme === theme;

          return (
            <button
              key={theme}
              onClick={() => handleSelect(theme)}
              className={`theme-selector-button ${
                isSelected ? 'theme-selector-button-selected' : ''
              }`}
              aria-label={`${theme} theme`}
              aria-pressed={isSelected}
            >
              <div
                className="theme-selector-preview"
                style={{
                  backgroundColor: themeStyle.backgroundColor,
                  border: `2px solid ${themeStyle.borderColor}`,
                }}
              >
                <div
                  className="theme-selector-preview-header"
                  style={{ backgroundColor: themeStyle.headerColor }}
                />
                <div className="theme-selector-preview-rows">
                  <div
                    className="theme-selector-preview-row"
                    style={{ backgroundColor: themeStyle.hoverColor }}
                  />
                  <div
                    className="theme-selector-preview-row"
                    style={{ backgroundColor: themeStyle.hoverColor }}
                  />
                </div>
              </div>
              <span className="theme-selector-button-label">{themeStyle.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
