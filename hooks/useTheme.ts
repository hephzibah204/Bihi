export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  darkMode: boolean;
  fontFamily: string;
}

export const defaultTheme: ThemeSettings = {
  primaryColor: '#2563EB',
  secondaryColor: '#1E3A8A',
  accentColor: '#06B6D4',
  logoUrl: '',
  darkMode: false,
  fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif",
};

// Validate hex color of formats #RGB, #RRGGBB
export function isValidHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

// Normalize to #RRGGBB
export function normalizeHex(value: string): string {
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) {
    const r = v[1], g = v[2], b = v[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return value;
}

// Map a font input to a safe stack with fallbacks
export function withFontFallback(input: string): string {
  const baseFallback = "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif";
  const cleaned = (input || '').trim();
  if (!cleaned) return `Inter, ${baseFallback}`;
  // Ensure quotes around multi-word fonts
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean).map(p => {
    const needsQuotes = /\s/.test(p) && !(p.startsWith('"') || p.startsWith("'"));
    return needsQuotes ? `'${p}'` : p;
  });
  const stack = parts.join(', ');
  // Always append base fallback
  return `${stack}, ${baseFallback}`;
}

export function applyThemeToDocument(theme: ThemeSettings) {
  const root = document.documentElement;
  root.style.setProperty('--brand-color-primary', normalizeHex(theme.primaryColor));
  root.style.setProperty('--brand-color-secondary', normalizeHex(theme.secondaryColor));
  root.style.setProperty('--brand-color-accent', normalizeHex(theme.accentColor));
  root.style.setProperty('--brand-font-family', withFontFallback(theme.fontFamily));
  // Optional derived shades could be added here if needed

  // Toggle dark mode attribute for global CSS hooks
  const body = document.body;
  if (theme.darkMode) {
    body.setAttribute('data-theme', 'dark');
  } else {
    body.removeAttribute('data-theme');
  }
}