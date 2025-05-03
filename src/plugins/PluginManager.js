/**
 * Eklenti yönetim sistemi
 * Uygulamaya dinamik olarak eklenti eklemeyi sağlar
 */
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = {
      'editor:beforeInit': [],
      'editor:afterInit': [],
      'file:beforeCreate': [],
      'file:afterCreate': [],
      'file:beforeDelete': [],
      'file:afterDelete': [],
      'project:beforeRun': [],
      'project:afterRun': [],
      'terminal:beforeCommand': [],
      'terminal:afterCommand': [],
      'ui:render': []
    };
  }

  /**
   * Eklenti kaydeder
   * @param {Object} plugin - Eklenti nesnesi
   */
  register(plugin) {
    if (!plugin.id || !plugin.name) {
      throw new Error('Eklenti ID ve isim içermelidir');
    }

    if (this.plugins.has(plugin.id)) {
      throw new Error(`"${plugin.id}" ID'li eklenti zaten kayıtlı`);
    }

    // Eklentiyi kaydet
    this.plugins.set(plugin.id, {
      ...plugin,
      enabled: plugin.enabled !== false
    });

    // Eklentinin hook'larını kaydet
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, callback]) => {
        if (this.hooks[hookName]) {
          this.hooks[hookName].push({
            pluginId: plugin.id,
            callback
          });
        }
      });
    }

    console.log(`"${plugin.name}" eklentisi başarıyla kaydedildi`);
    return true;
  }

  /**
   * Eklentiyi etkinleştirir
   * @param {string} pluginId - Eklenti ID'si
   */
  enable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`"${pluginId}" ID'li eklenti bulunamadı`);
    }
    
    plugin.enabled = true;
    if (typeof plugin.onEnable === 'function') {
      plugin.onEnable();
    }
  }

  /**
   * Eklentiyi devre dışı bırakır
   * @param {string} pluginId - Eklenti ID'si
   */
  disable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`"${pluginId}" ID'li eklenti bulunamadı`);
    }
    
    plugin.enabled = false;
    if (typeof plugin.onDisable === 'function') {
      plugin.onDisable();
    }
  }

  /**
   * Hook çalıştırır
   * @param {string} hookName - Hook adı
   * @param {Object} context - Hook bağlamı
   * @returns {Promise<Array>} - Hook sonuçları
   */
  async executeHook(hookName, context = {}) {
    if (!this.hooks[hookName]) {
      return [];
    }

    const results = [];
    
    for (const { pluginId, callback } of this.hooks[hookName]) {
      const plugin = this.plugins.get(pluginId);
      
      if (plugin && plugin.enabled) {
        try {
          const result = await Promise.resolve(callback(context));
          results.push({ pluginId, result });
        } catch (error) {
          console.error(`"${pluginId}" eklentisinin "${hookName}" hook'u çalıştırılırken hata oluştu:`, error);
        }
      }
    }
    
    return results;
  }

  /**
   * Tüm eklentileri döndürür
   * @returns {Array} - Eklenti listesi
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Etkin eklentileri döndürür
   * @returns {Array} - Etkin eklenti listesi
   */
  getEnabledPlugins() {
    return this.getAllPlugins().filter(plugin => plugin.enabled);
  }
}

export default new PluginManager();