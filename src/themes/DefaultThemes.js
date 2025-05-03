import ThemeManager from './ThemeManager';

/**
 * Varsayılan temalar
 * Uygulama için temel temalar
 */
export const LightTheme = {
  id: 'light',
  name: 'Açık Tema',
  description: 'Varsayılan açık tema',
  styles: {
    // Ana renkler
    'primary-color': '#2563eb',
    'secondary-color': '#4f46e5',
    'success-color': '#16a34a',
    'warning-color': '#eab308',
    'error-color': '#dc2626',
    'info-color': '#0ea5e9',
    
    // Arka plan renkleri
    'background-color': '#ffffff',
    'background-secondary': '#f9fafb',
    'background-tertiary': '#f3f4f6',
    
    // Metin renkleri
    'text-color': '#1f2937',
    'text-secondary': '#4b5563',
    'text-tertiary': '#9ca3af',
    
    // Kenarlık renkleri
    'border-color': '#e5e7eb',
    'border-secondary': '#d1d5db',
    
    // Bileşen renkleri
    'sidebar-background': '#f3f4f6',
    'sidebar-text': '#1f2937',
    'sidebar-active': '#2563eb',
    'sidebar-active-text': '#ffffff',
    
    'header-background': '#ffffff',
    'header-text': '#1f2937',
    
    'editor-background': '#ffffff',
    'editor-text': '#1f2937',
    'editor-line-number': '#9ca3af',
    'editor-cursor': '#2563eb',
    'editor-selection': 'rgba(37, 99, 235, 0.2)',
    
    'terminal-background': '#1e1e1e',
    'terminal-text': '#f9fafb',
    
    // Diğer
    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    
    'radius-sm': '0.125rem',
    'radius-md': '0.375rem',
    'radius-lg': '0.5rem',
    
    'transition-fast': '0.15s ease',
    'transition-normal': '0.3s ease',
    'transition-slow': '0.5s ease',
    
    // Tema tipi
    'isDark': false
  }
};

export const DarkTheme = {
  id: 'dark',
  name: 'Koyu Tema',
  description: 'Varsayılan koyu tema',
  styles: {
    // Ana renkler
    'primary-color': '#3b82f6',
    'secondary-color': '#6366f1',
    'success-color': '#22c55e',
    'warning-color': '#facc15',
    'error-color': '#ef4444',
    'info-color': '#38bdf8',
    
    // Arka plan renkleri
    'background-color': '#111827',
    'background-secondary': '#1f2937',
    'background-tertiary': '#374151',
    
    // Metin renkleri
    'text-color': '#f9fafb',
    'text-secondary': '#e5e7eb',
    'text-tertiary': '#9ca3af',
    
    // Kenarlık renkleri
    'border-color': '#374151',
    'border-secondary': '#4b5563',
    
    // Bileşen renkleri
    'sidebar-background': '#1f2937',
    'sidebar-text': '#f9fafb',
    'sidebar-active': '#3b82f6',
    'sidebar-active-text': '#ffffff',
    
    'header-background': '#111827',
    'header-text': '#f9fafb',
    
    'editor-background': '#1f2937',
    'editor-text': '#f9fafb',
    'editor-line-number': '#9ca3af',
    'editor-cursor': '#3b82f6',
    'editor-selection': 'rgba(59, 130, 246, 0.3)',
    
    'terminal-background': '#111827',
    'terminal-text': '#f9fafb',
    
    // Diğer
    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
    'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
    
    'radius-sm': '0.125rem',
    'radius-md': '0.375rem',
    'radius-lg': '0.5rem',
    
    'transition-fast': '0.15s ease',
    'transition-normal': '0.3s ease',
    'transition-slow': '0.5s ease',
    
    // Tema tipi
    'isDark': true
  }
};

// Özel temalar
export const NordTheme = {
  id: 'nord',
  name: 'Nord Tema',
  description: 'Kuzey ışıklarından ilham alan tema',
  styles: {
    // Ana renkler
    'primary-color': '#88c0d0',
    'secondary-color': '#81a1c1',
    'success-color': '#a3be8c',
    'warning-color': '#ebcb8b',
    'error-color': '#bf616a',
    'info-color': '#5e81ac',
    
    // Arka plan renkleri
    'background-color': '#2e3440',
    'background-secondary': '#3b4252',
    'background-tertiary': '#434c5e',
    
    // Metin renkleri
    'text-color': '#eceff4',
    'text-secondary': '#e5e9f0',
    'text-tertiary': '#d8dee9',
    
    // Kenarlık renkleri
    'border-color': '#4c566a',
    'border-secondary': '#434c5e',
    
    // Bileşen renkleri
    'sidebar-background': '#3b4252',
    'sidebar-text': '#eceff4',
    'sidebar-active': '#88c0d0',
    'sidebar-active-text': '#2e3440',
    
    'header-background': '#2e3440',
    'header-text': '#eceff4',
    
    'editor-background': '#2e3440',
    'editor-text': '#eceff4',
    'editor-line-number': '#4c566a',
    'editor-cursor': '#88c0d0',
    'editor-selection': 'rgba(136, 192, 208, 0.3)',
    
    'terminal-background': '#2e3440',
    'terminal-text': '#eceff4',
    
    // Diğer
    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    
    'radius-sm': '0.125rem',
    'radius-md': '0.375rem',
    'radius-lg': '0.5rem',
    
    'transition-fast': '0.15s ease',
    'transition-normal': '0.3s ease',
    'transition-slow': '0.5s ease',
    
    // Tema tipi
    'isDark': true
  }
};

export const SolarizedLightTheme = {
  id: 'solarized-light',
  name: 'Solarized Açık',
  description: 'Ethan Schoonover\'ın Solarized açık teması',
  styles: {
    // Ana renkler
    'primary-color': '#268bd2',
    'secondary-color': '#6c71c4',
    'success-color': '#859900',
    'warning-color': '#b58900',
    'error-color': '#dc322f',
    'info-color': '#2aa198',
    
    // Arka plan renkleri
    'background-color': '#fdf6e3',
    'background-secondary': '#eee8d5',
    'background-tertiary': '#e0dbcc',
    
    // Metin renkleri
    'text-color': '#657b83',
    'text-secondary': '#586e75',
    'text-tertiary': '#93a1a1',
    
    // Kenarlık renkleri
    'border-color': '#eee8d5',
    'border-secondary': '#e0dbcc',
    
    // Bileşen renkleri
    'sidebar-background': '#eee8d5',
    'sidebar-text': '#657b83',
    'sidebar-active': '#268bd2',
    'sidebar-active-text': '#fdf6e3',
    
    'header-background': '#fdf6e3',
    'header-text': '#657b83',
    
    'editor-background': '#fdf6e3',
    'editor-text': '#657b83',
    'editor-line-number': '#93a1a1',
    'editor-cursor': '#268bd2',
    'editor-selection': 'rgba(38, 139, 210, 0.2)',
    
    'terminal-background': '#002b36',
    'terminal-text': '#839496',
    
    // Diğer
    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
    
    'radius-sm': '0.125rem',
    'radius-md': '0.375rem',
    'radius-lg': '0.5rem',
    
    'transition-fast': '0.15s ease',
    'transition-normal': '0.3s ease',
    'transition-slow': '0.5s ease',
    
    // Tema tipi
    'isDark': false
  }
};

// Temaları kaydet
export const registerDefaultThemes = () => {
  ThemeManager.register(LightTheme);
  ThemeManager.register(DarkTheme);
  ThemeManager.register(NordTheme);
  ThemeManager.register(SolarizedLightTheme);
  
  // Kaydedilmiş temayı yükle
  ThemeManager.loadSavedTheme();
};

export default {
  LightTheme,
  DarkTheme,
  NordTheme,
  SolarizedLightTheme,
  registerDefaultThemes
};

