import React, { useEffect, useMemo, useState } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings, apiUploadSchoolLogo } from '../../services/api';
import { usePlatformPermission } from '../../utils/usePlatformPermission';
import { defaultTheme, applyThemeToDocument, isValidHexColor, normalizeHex, withFontFallback, ThemeSettings } from '../../hooks/useTheme';

const ThemeManager = () => {
    const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{ primaryColor?: string; secondaryColor?: string; accentColor?: string; fontFamily?: string } | null>(null);
    const { can } = usePlatformPermission();

    useEffect(() => {
        const load = async () => {
            try {
                setError(null);
                const settings = await apiGetPlatformSettings();
                const existing = (settings as any)?.theme || defaultTheme;
                const next = { ...defaultTheme, ...existing } as ThemeSettings;
                setTheme(next);
                // Apply immediately on load
                if (typeof window !== 'undefined') applyThemeToDocument(next);
            } catch (e: any) {
                setError(e?.message || 'Failed to load theme settings');
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    // Live-apply as user edits
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') applyThemeToDocument(theme);
        } catch {}
    }, [theme]);

    // Validation memo
    const isValidTheme = useMemo(() => {
        const errs: any = {};
        if (!isValidHexColor(theme.primaryColor)) errs.primaryColor = 'Invalid hex color';
        if (!isValidHexColor(theme.secondaryColor)) errs.secondaryColor = 'Invalid hex color';
        if (!isValidHexColor(theme.accentColor)) errs.accentColor = 'Invalid hex color';
        const ff = withFontFallback(theme.fontFamily);
        if (!ff || ff.length < 3) errs.fontFamily = 'Provide at least one font';
        setValidationErrors(Object.keys(errs).length ? errs : null);
        return Object.keys(errs).length === 0;
    }, [theme]);

    const onFileChange = async (file?: File | null) => {
        if (!file) return;
        try {
            setSaving(true);
            const url = await apiUploadSchoolLogo(file);
            setTheme(prev => ({ ...prev, logoUrl: url }));
        } catch (e: any) {
            const msg = e?.message || 'Logo upload failed';
            setError(msg);
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: msg } }));
        } finally {
            setSaving(false);
        }
    };

    const save = async () => {
        try {
            if (!isValidTheme) {
                setError('Please fix validation errors before saving');
                return;
            }
            // Confirm save action
            if (!window.confirm('Apply and save theme changes?')) return;
            setSaving(true);
            setError(null);
            const settings = await apiGetPlatformSettings();
            const merged = { ...settings, theme: {
                ...theme,
                primaryColor: normalizeHex(theme.primaryColor),
                secondaryColor: normalizeHex(theme.secondaryColor),
                accentColor: normalizeHex(theme.accentColor),
                fontFamily: withFontFallback(theme.fontFamily),
            }};
            await apiSavePlatformSettings(merged);
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Theme settings saved' } }));
        } catch (e: any) {
            const msg = e?.message || 'Failed to save theme settings';
            setError(msg);
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: msg } }));
        } finally {
            setSaving(false);
        }
    };

    const resetToDefaults = () => {
        if (!window.confirm('Reset theme to defaults?')) return;
        setTheme(defaultTheme);
        setValidationErrors(null);
        setError(null);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Theme Manager</h1>
                <p className="opacity-80">Customize platform appearance and branding</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                {error && (
                    <div className="mb-4 px-4 py-2 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>
                )}

                {loading ? (
                    <div className="text-slate-500">Loading theme settings...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm text-slate-600">Primary Color</span>
                                <input
                                    type="color"
                                    value={theme.primaryColor}
                                    onChange={e => can('manage_content') && setTheme({ ...theme, primaryColor: e.target.value })}
                                    className="w-16 h-10 p-1 border rounded ml-2 align-middle"
                                />
                                {validationErrors?.primaryColor && (
                                    <div className="text-red-600 text-xs mt-1">{validationErrors.primaryColor}</div>
                                )}
                            </label>
                            <label className="block">
                                <span className="text-sm text-slate-600">Secondary Color</span>
                                <input
                                    type="color"
                                    value={theme.secondaryColor}
                                    onChange={e => can('manage_content') && setTheme({ ...theme, secondaryColor: e.target.value })}
                                    className="w-16 h-10 p-1 border rounded ml-2 align-middle"
                                />
                                {validationErrors?.secondaryColor && (
                                    <div className="text-red-600 text-xs mt-1">{validationErrors.secondaryColor}</div>
                                )}
                            </label>
                            <label className="block">
                                <span className="text-sm text-slate-600">Accent Color</span>
                                <input
                                    type="color"
                                    value={theme.accentColor}
                                    onChange={e => can('manage_content') && setTheme({ ...theme, accentColor: e.target.value })}
                                    className="w-16 h-10 p-1 border rounded ml-2 align-middle"
                                />
                                {validationErrors?.accentColor && (
                                    <div className="text-red-600 text-xs mt-1">{validationErrors.accentColor}</div>
                                )}
                            </label>
                            <label className="block">
                                <span className="text-sm text-slate-600">Font Family</span>
                                <input
                                    type="text"
                                    value={theme.fontFamily}
                                    onChange={e => can('manage_content') && setTheme({ ...theme, fontFamily: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                                    placeholder="Inter, system-ui, sans-serif"
                                />
                                {validationErrors?.fontFamily && (
                                    <div className="text-red-600 text-xs mt-1">{validationErrors.fontFamily}</div>
                                )}
                            </label>
                            <label className="block">
                                <span className="text-sm text-slate-600">Dark Mode</span>
                                <div className="mt-1">
                                    <input
                                        type="checkbox"
                                        checked={theme.darkMode}
                                        onChange={e => setTheme({ ...theme, darkMode: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-slate-700">Enable dark mode</span>
                                </div>
                            </label>
                            <div className="space-y-2">
                                <span className="text-sm text-slate-600">Logo</span>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => { if (can('manage_content')) onFileChange(e.target.files?.[0]); }}
                                        className="block"
                                    />
                                    {theme.logoUrl && (
                                        <img src={theme.logoUrl} alt="Logo" className="h-10 w-auto rounded border" />
                                    )}
                                </div>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={save}
                                    disabled={!can('manage_content') || saving || !!validationErrors}
className={`btn ${!can('manage_content') ? 'btn-disabled' : 'btn-primary'} disabled:opacity-50`}
                                >
                                    {saving ? 'Saving...' : 'Save Theme'}
                                </button>
                                <button
                                    onClick={resetToDefaults}
                                    disabled={!can('manage_content') || saving}
className={`btn ${!can('manage_content') ? 'btn-disabled' : 'btn-secondary'} disabled:opacity-50`}
                                >
                                    Reset to Defaults
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="border rounded-xl overflow-hidden">
                                <div
                                    className="p-6"
                                    style={{
                                        background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                                        color: '#fff',
                                        fontFamily: theme.fontFamily
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {theme.logoUrl ? (
                                            <img src={theme.logoUrl} alt="Logo" className="h-10 w-auto rounded bg-white/10 p-1" />
                                        ) : (
                                            <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center text-xl">🎓</div>
                                        )}
                                        <div>
                                            <div className="text-xl font-semibold">Brand Preview</div>
                                            <div className="text-sm opacity-80">Header and primary UI elements</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6" style={{ fontFamily: theme.fontFamily }}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <button className="px-4 py-2 rounded text-white" style={{ backgroundColor: theme.primaryColor }}>Primary Button</button>
                                        <button className="px-4 py-2 rounded text-white" style={{ backgroundColor: theme.secondaryColor }}>Secondary Button</button>
                                        <button className="px-4 py-2 rounded text-white" style={{ backgroundColor: theme.accentColor }}>Accent Button</button>
                                    </div>
                                    <div className="mt-6">
                                        <p className="text-slate-700">Sample body text with the chosen font family. This preview helps visualize how the theme affects common UI elements and layout.</p>
                                        <div className="mt-3 flex items-center gap-3">
                                            <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: theme.primaryColor }}></span>
                                            <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: theme.secondaryColor }}></span>
                                            <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: theme.accentColor }}></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThemeManager;