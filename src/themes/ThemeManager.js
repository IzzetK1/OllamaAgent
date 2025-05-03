/**
 * Tema Yönetim Sistemi
 * Uygulamanın görünümünü özelleştirmeyi sağlar
 */
class ThemeManager {
  constructor() {
    this.themes = new Map();
    this.activeTheme = null;
    this.defaultTheme = 'light';
    this.listeners = [];
  }

  /**
   * Tema kaydeder
   * @param {Object} theme - Tema nesnesi
   */
  register(theme) {
    if (!theme.id || !theme.name || !theme.styles) {
      throw new Error('Tema ID, isim ve stiller içermelidir');
    }

    if (this.themes.has(theme.id)) {
      console.warn(`"${theme.id}" ID'li tema zaten kayıtlı, üzerine yazılıyor`);
    }

    this.themes.set(theme.id, theme);
    console.log(`"${theme.name}" teması başarıyla kaydedildi`);
    
    // İlk tema ise aktif et
    if (this.themes.size === 1) {
      this.setActiveTheme(theme.id);
    }
    
    return true;
  }

  /**
   * Aktif temayı ayarlar
   * @param {string} themeId - Tema ID'si
   */
  setActiveTheme(themeId) {
    // Tema var mı kontrol et
    if (!this.themes.has(themeId)) {
      console.error(`"${themeId}" ID'li tema bulunamadı`);
      return false;
    }

    const theme = this.themes.get(themeId);
    
    // Önceki tema varsa kaldır
    if (this.activeTheme) {
      const prevTheme = this.themes.get(this.activeTheme);
      if (prevTheme && prevTheme.styleElement) {
        document.head.removeChild(prevTheme.styleElement);
      }
      
      // Önceki tema sınıfını kaldır
      document.body.classList.remove(`theme-${this.activeTheme}`);
    }
    
    // Yeni temayı uygula
    this.activeTheme = themeId;
    
    // Tema sınıfını ekle
    document.body.classList.add(`theme-${themeId}`);
    
    // Tema stillerini uygula
    if (!theme.styleElement) {
      theme.styleElement = document.createElement('style');
      theme.styleElement.id = `theme-${themeId}-styles`;
      theme.styleElement.textContent = this.generateCSSVariables(theme.styles);
    }
    
    document.head.appendChild(theme.styleElement);
    
    // Tema değişikliğini kaydet
    localStorage.setItem('active-theme', themeId);
    
    // Dinleyicileri bilgilendir
    this.notifyListeners();
    
    console.log(`"${theme.name}" teması aktifleştirildi`);
    return true;
  }

  /**
   * CSS değişkenlerini oluşturur
   * @param {Object} styles - Tema stilleri
   * @returns {string} - CSS değişkenleri
   */
  generateCSSVariables(styles) {
    let css = ':root {\n';
    
    Object.entries(styles).forEach(([key, value]) => {
      css += `  --${key}: ${value};\n`;
    });
    
    css += '}\n';
    
    // Koyu tema için medya sorgusu
    if (styles.isDark) {
      css += `
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}
`;
    }
    
    return css;
  }

  /**
   * Aktif temayı döndürür
   * @returns {Object} - Aktif tema
   */
  getActiveTheme() {
    return this.activeTheme ? this.themes.get(this.activeTheme) : null;
  }

  /**
   * Tüm temaları döndürür
   * @returns {Array} - Tema listesi
   */
  getAllThemes() {
    return Array.from(this.themes.values());
  }

  /**
   * Tema değişikliği dinleyicisi ekler
   * @param {Function} listener - Dinleyici fonksiyon
   */
  addChangeListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  /**
   * Tema değişikliği dinleyicisini kaldırır
   * @param {Function} listener - Dinleyici fonksiyon
   */
  removeChangeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Dinleyicileri bilgilendirir
   */
  notifyListeners() {
    const activeTheme = this.getActiveTheme();
    this.listeners.forEach(listener => {
      try {
        listener(activeTheme);
      } catch (error) {
        console.error('Tema değişikliği dinleyicisi çalıştırılırken hata oluştu:', error);
      }
    });
  }

  /**
   * Kaydedilmiş temayı yükler
   */
  loadSavedTheme() {
    const savedThemeId = localStorage.getItem('active-theme');
    
    if (savedThemeId && this.themes.has(savedThemeId)) {
      this.setActiveTheme(savedThemeId);
    } else if (this.themes.has(this.defaultTheme)) {
      this.setActiveTheme(this.defaultTheme);
    } else if (this.themes.size > 0) {
      // İlk temayı kullan
      const firstTheme = this.themes.keys().next().value;
      this.setActiveTheme(firstTheme);
    }
  }

  /**
   * Editör temasını günceller
   * @param {Object} editor - Monaco editör nesnesi
   */
  updateEditorTheme(editor) {
    if (!editor) return;
    
    const theme = this.getActiveTheme();
    if (!theme) return;
    
    // Editör temasını ayarla
    const isDark = theme.styles.isDark || false;
    const editorTheme = isDark ? 'vs-dark' : 'vs';
    
    editor.updateOptions({ theme: editorTheme });
  }
}

export default new ThemeManager();
