import type { Theme, ThemeStyle } from '../types';

export const THEMES: Record<Theme, ThemeStyle> = {
  dark: {
    name: 'Dark',
    backgroundColor: '#1a1a1a',
    headerColor: '#2d2d2d',
    textColor: '#e5e5e5',
    borderColor: '#404040',
    hoverColor: '#2a2a2a',
  },
  light: {
    name: 'Light',
    backgroundColor: '#ffffff',
    headerColor: '#f0f0f0',
    textColor: '#333333',
    borderColor: '#d0d0d0',
    hoverColor: '#f5f5f5',
  },
  business: {
    name: 'Business',
    backgroundColor: '#f8fafc',
    headerColor: '#0f172a',
    textColor: '#1e293b',
    borderColor: '#cbd5e1',
    hoverColor: '#f1f5f9',
  },
};
