import React, { useState } from 'react';
import { Palette, Check, RefreshCw, Sparkles, Moon, Sun, Monitor } from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { ThemeConfig } from '../types';

export const ThemeStudio: React.FC = () => {
  const { theme, setTheme, addLog } = useInvoiceFlowStore();

  const [formTheme, setFormTheme] = useState<ThemeConfig>({ ...theme });
  const [activePreset, setActivePreset] = useState<string>(theme.theme_key || 'SLATE');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const presets: Record<string, Partial<ThemeConfig>> = {
    SLATE: {
      theme_key: 'SLATE',
      theme_name: 'Enterprise Slate (Dark)',
      color_bg: '#0c0e12',
      color_surface: '#141820',
      color_primary: '#3b82f6',
      color_accent: '#f59e0b',
      color_success: '#10b981',
      color_warning: '#f59e0b',
      color_error: '#ef4444',
      radius_sm: '6px',
    },
    LIGHT: {
      theme_key: 'LIGHT',
      theme_name: 'Enterprise Light (Daylight)',
      color_bg: '#f8fafc',
      color_surface: '#ffffff',
      color_primary: '#2563eb',
      color_accent: '#d97706',
      color_success: '#059669',
      color_warning: '#d97706',
      color_error: '#dc2626',
      radius_sm: '6px',
    },
    SAP_MIDNIGHT: {
      theme_key: 'SAP_MIDNIGHT',
      theme_name: 'SAP Fiori Horizon',
      color_bg: '#12171f',
      color_surface: '#1b222d',
      color_primary: '#0ea5e9',
      color_accent: '#38bdf8',
      color_success: '#22c55e',
      color_warning: '#eab308',
      color_error: '#f43f5e',
      radius_sm: '4px',
    },
    EMERALD_FOREST: {
      theme_key: 'EMERALD_FOREST',
      theme_name: 'ITC / SNPL Corporate Green',
      color_bg: '#09130d',
      color_surface: '#112217',
      color_primary: '#10b981',
      color_accent: '#34d399',
      color_success: '#10b981',
      color_warning: '#f59e0b',
      color_error: '#ef4444',
      radius_sm: '6px',
    },
    NORDIC_FROST: {
      theme_key: 'NORDIC_FROST',
      theme_name: 'Deep Navy Frost',
      color_bg: '#0a0f1d',
      color_surface: '#131c31',
      color_primary: '#38bdf8',
      color_accent: '#818cf8',
      color_success: '#34d399',
      color_warning: '#fbbf24',
      color_error: '#f87171',
      radius_sm: '8px',
    },
    HIGH_CONTRAST: {
      theme_key: 'HIGH_CONTRAST',
      theme_name: 'WCAG AAA High Contrast',
      color_bg: '#000000',
      color_surface: '#111111',
      color_primary: '#60a5fa',
      color_accent: '#fbbf24',
      color_success: '#4ade80',
      color_warning: '#facc15',
      color_error: '#f87171',
      radius_sm: '2px',
    },
  };

  const handleApplyPreset = (key: string) => {
    setActivePreset(key);
    const updated: ThemeConfig = { ...formTheme, ...presets[key] } as ThemeConfig;
    setFormTheme(updated);
    setTheme(updated);
    addLog('THEME', 'PRESET_APPLIED', 'SUCCESS', `Theme preset applied: ${updated.theme_name}`);
    setSaveSuccessMsg(`Preset applied: ${updated.theme_name}`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSaveTheme = () => {
    setTheme(formTheme);
    addLog('THEME', 'TOKENS_UPDATED', 'SUCCESS', `Custom theme tokens emitted to CSS properties`);
    setSaveSuccessMsg('Theme tokens saved and emitted across all UI components!');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };


  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            Custom Theme &amp; Branding Studio
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Zero CSS constants. Color palettes, radii, and fonts are stored in database master tables and emitted as CSS custom properties.
          </p>
        </div>

        <button
          onClick={handleSaveTheme}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm"
        >
          <Check className="w-4 h-4" />
          <span>Save &amp; Apply Tokens</span>
        </button>
      </div>

      {/* Save Toast Notification */}
      {saveSuccessMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-fadeIn">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Preset Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-neutral-400 font-medium">Quick Presets:</span>
        {Object.keys(presets).map((key) => (
          <button
            key={key}
            onClick={() => handleApplyPreset(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activePreset === key
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            {presets[key].theme_name}
          </button>
        ))}
      </div>


      {/* Design Token Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Colors Token Group */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Color Palette Tokens</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1">Canvas Background (--color-bg)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formTheme.color_bg}
                  onChange={(e) => setFormTheme({ ...formTheme, color_bg: e.target.value })}
                  className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={formTheme.color_bg}
                  onChange={(e) => setFormTheme({ ...formTheme, color_bg: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Surface Card (--color-surface)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formTheme.color_surface}
                  onChange={(e) => setFormTheme({ ...formTheme, color_surface: e.target.value })}
                  className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={formTheme.color_surface}
                  onChange={(e) => setFormTheme({ ...formTheme, color_surface: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Primary Action Accent (--color-primary)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formTheme.color_primary}
                  onChange={(e) => setFormTheme({ ...formTheme, color_primary: e.target.value })}
                  className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={formTheme.color_primary}
                  onChange={(e) => setFormTheme({ ...formTheme, color_primary: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Warning / Review Accent (--color-warning)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formTheme.color_warning}
                  onChange={(e) => setFormTheme({ ...formTheme, color_warning: e.target.value })}
                  className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={formTheme.color_warning}
                  onChange={(e) => setFormTheme({ ...formTheme, color_warning: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Geometry & Radii */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Geometry &amp; Radii</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1">Control Radius (--radius-sm)</label>
              <select
                value={formTheme.radius_sm}
                onChange={(e) => setFormTheme({ ...formTheme, radius_sm: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              >
                <option value="0px">0px (Strict Sharp)</option>
                <option value="2px">2px (Industrial)</option>
                <option value="4px">4px (SAP Standard)</option>
                <option value="6px">6px (Refined Default)</option>
                <option value="8px">8px (Modern Rounded)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Display Typography Family</label>
              <input
                type="text"
                value={formTheme.font_display}
                onChange={(e) => setFormTheme({ ...formTheme, font_display: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Body Text Family</label>
              <input
                type="text"
                value={formTheme.font_sans}
                onChange={(e) => setFormTheme({ ...formTheme, font_sans: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Live Token Preview */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
          <h2 className="text-sm font-semibold text-white">Live Emitted CSS Preview</h2>
          <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-[11px] font-mono text-neutral-300 space-y-1">
            <div className="text-neutral-500">:root &#123;</div>
            <div className="pl-4 text-blue-400">--color-bg: {formTheme.color_bg};</div>
            <div className="pl-4 text-blue-400">--color-surface: {formTheme.color_surface};</div>
            <div className="pl-4 text-blue-400">--color-primary: {formTheme.color_primary};</div>
            <div className="pl-4 text-blue-400">--color-warning: {formTheme.color_warning};</div>
            <div className="pl-4 text-blue-400">--radius-sm: {formTheme.radius_sm};</div>
            <div className="text-neutral-500">&#125;</div>
          </div>

          <div
            style={{
              backgroundColor: formTheme.color_surface,
              borderRadius: formTheme.radius_sm,
              borderColor: formTheme.color_primary,
            }}
            className="p-4 border text-center space-y-2"
          >
            <div style={{ color: formTheme.color_primary }} className="font-bold text-xs">
              Live Token Rendering Card
            </div>
            <button
              style={{
                backgroundColor: formTheme.color_primary,
                borderRadius: formTheme.radius_sm,
              }}
              className="px-3 py-1 text-white text-xs font-semibold"
            >
              Action Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
