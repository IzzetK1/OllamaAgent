import PluginManager from './PluginManager';

/**
 * Eklenti yükleme sistemi
 * Eklentileri dinamik olarak yükler
 */
class PluginLoader {
  constructor() {
    this.loadedPlugins = new Set();
  }

  /**
   * Eklenti yükler
   * @param {string} pluginUrl - Eklenti URL'si veya yolu
   * @returns {Promise<Object>} - Yüklenen eklenti
   */
  async loadPlugin(pluginUrl) {
    try {
      if (this.loadedPlugins.has(pluginUrl)) {
        console.warn(`"${pluginUrl}" eklentisi zaten yüklü`);
        return null;
      }

      // Eklentiyi dinamik olarak yükle
      const pluginModule = await import(/* webpackIgnore: true */ pluginUrl);
      const plugin = pluginModule.default || pluginModule;

      if (!plugin || typeof plugin !== 'object') {
        throw new Error('Geçerli bir eklenti nesnesi bulunamadı');
      }

      // Eklentiyi kaydet
      PluginManager.register(plugin);
      this.loadedPlugins.add(pluginUrl);

      return plugin;
    } catch (error) {
      console.error(`"${pluginUrl}" eklentisi yüklenirken hata oluştu:`, error);
      throw error;
    }
  }

  /**
   * Birden fazla eklenti yükler
   * @param {Array<string>} pluginUrls - Eklenti URL'leri
   * @returns {Promise<Array<Object>>} - Yüklenen eklentiler
   */
  async loadPlugins(pluginUrls) {
    const results = await Promise.allSettled(
      pluginUrls.map(url => this.loadPlugin(url))
    );

    const loaded = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        url: pluginUrls[index],
        error: result.reason
      }));

    if (failed.length > 0) {
      console.warn('Bazı eklentiler yüklenemedi:', failed);
    }

    return loaded;
  }

  /**
   * Yerel depodan eklentileri yükler
   * @returns {Promise<Array<Object>>} - Yüklenen eklentiler
   */
  async loadLocalPlugins() {
    try {
      // Yerel depodan eklenti listesini al
      const response = await fetch('/api/plugins/local');
      const plugins = await response.json();
      
      return this.loadPlugins(plugins.map(plugin => plugin.url));
    } catch (error) {
      console.error('Yerel eklentiler yüklenirken hata oluştu:', error);
      return [];
    }
  }

  /**
   * Marketplace'den eklentileri yükler
   * @returns {Promise<Array<Object>>} - Yüklenen eklentiler
   */
  async loadMarketplacePlugins() {
    try {
      // Kullanıcının yüklediği marketplace eklentilerini al
      const response = await fetch('/api/plugins/marketplace/installed');
      const plugins = await response.json();
      
      return this.loadPlugins(plugins.map(plugin => plugin.url));
    } catch (error) {
      console.error('Marketplace eklentileri yüklenirken hata oluştu:', error);
      return [];
    }
  }
}

export default new PluginLoader();