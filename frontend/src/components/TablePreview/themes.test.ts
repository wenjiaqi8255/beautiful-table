import { THEMES } from './themes';

describe('THEMES', () => {
  it('should have all three themes', () => {
    expect(THEMES).toHaveProperty('dark');
    expect(THEMES).toHaveProperty('light');
    expect(THEMES).toHaveProperty('business');
  });

  it('should have correct theme names', () => {
    expect(THEMES.dark.name).toBe('Dark');
    expect(THEMES.light.name).toBe('Light');
    expect(THEMES.business.name).toBe('Business');
  });

  it('should have all required color properties for dark theme', () => {
    expect(THEMES.dark).toMatchObject({
      name: 'Dark',
      backgroundColor: expect.any(String),
      headerColor: expect.any(String),
      textColor: expect.any(String),
      borderColor: expect.any(String),
      hoverColor: expect.any(String),
    });
  });

  it('should have all required color properties for light theme', () => {
    expect(THEMES.light).toMatchObject({
      name: 'Light',
      backgroundColor: expect.any(String),
      headerColor: expect.any(String),
      textColor: expect.any(String),
      borderColor: expect.any(String),
      hoverColor: expect.any(String),
    });
  });

  it('should have all required color properties for business theme', () => {
    expect(THEMES.business).toMatchObject({
      name: 'Business',
      backgroundColor: expect.any(String),
      headerColor: expect.any(String),
      textColor: expect.any(String),
      borderColor: expect.any(String),
      hoverColor: expect.any(String),
    });
  });

  it('should have valid hex color codes for dark theme', () => {
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    expect(THEMES.dark.backgroundColor).toMatch(hexColorRegex);
    expect(THEMES.dark.headerColor).toMatch(hexColorRegex);
    expect(THEMES.dark.textColor).toMatch(hexColorRegex);
    expect(THEMES.dark.borderColor).toMatch(hexColorRegex);
    expect(THEMES.dark.hoverColor).toMatch(hexColorRegex);
  });

  it('should have valid hex color codes for light theme', () => {
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    expect(THEMES.light.backgroundColor).toMatch(hexColorRegex);
    expect(THEMES.light.headerColor).toMatch(hexColorRegex);
    expect(THEMES.light.textColor).toMatch(hexColorRegex);
    expect(THEMES.light.borderColor).toMatch(hexColorRegex);
    expect(THEMES.light.hoverColor).toMatch(hexColorRegex);
  });

  it('should have valid hex color codes for business theme', () => {
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    expect(THEMES.business.backgroundColor).toMatch(hexColorRegex);
    expect(THEMES.business.headerColor).toMatch(hexColorRegex);
    expect(THEMES.business.textColor).toMatch(hexColorRegex);
    expect(THEMES.business.borderColor).toMatch(hexColorRegex);
    expect(THEMES.business.hoverColor).toMatch(hexColorRegex);
  });
});
