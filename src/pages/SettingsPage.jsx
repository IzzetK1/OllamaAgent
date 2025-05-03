import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    aiEndpoint: 'http://localhost:11434',
    aiModel: '',
    editorFontSize: 14,
    editorTheme: 'vs-dark',
    editorFontFamily: 'Fira Code, monospace',
    autoSave: false,
    tabSize: 2,
    systemPrompt: `Sen gelişmiş bir AI kod asistanısın. Kullanıcının isteklerine göre sıfırdan kod yazma, dosya oluşturma ve programlama sorularını yanıtlama konusunda uzmansın. Kullanıcının projesiyle ilgili dosyalara erişimin var ve onları değiştirebilirsin.

Kod yazarken, şu formatta kod blokları kullan: \`\`\`dil:dosyaadi.uzanti
kod içeriği
\`\`\`

Örneğin: \`\`\`javascript:app.js
console.log('Merhaba Dünya');
\`\`\`

Bu şekilde yazdığın kodlar otomatik olarak dosya olarak kaydedilecektir. Birden fazla dosya oluşturabilirsin. Dosya adı belirtmezsen, otomatik olarak bir isim atanacaktır.

ÇOK ÖNEMLİ: Kullanıcı senden kod yazmanı istediğinde, önce düşün ve planla, sonra tüm kodu eksiksiz olarak yaz. Yarım kod yazmak yerine, tam ve çalışan kod yaz. Web uygulaması yazarken, mutlaka index.html dosyası oluştur ve gerekli CSS ve JavaScript dosyalarını da ekle. Tüm dosyaları tek bir yanıtta gönder, parça parça gönderme.`
  });
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Ayarları yükle
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (e) {
        console.error('Error loading saved settings:', e);
      }
    }
    
    // Modelleri yükle
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:11434/api/tags');
      
      if (!response.ok) {
        throw new Error('Modeller yüklenirken bir hata oluştu');
      }
      
      const data = await response.json();
      
      if (data.models && Array.isArray(data.models)) {
        setModels(data.models);
        
        // Eğer model seçilmemişse ve modeller varsa, ilk modeli seç
        if (!settings.aiModel && data.models.length > 0) {
          setSettings(prev => ({ ...prev, aiModel: data.models[0].name }));
        }
      }
    } catch (err) {
      console.error('Error fetching models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    // Ayarları kaydet
    localStorage.setItem('app-settings', JSON.stringify(settings));
    
    // Başarılı mesajı göster
    setSaveStatus('Ayarlar başarıyla kaydedildi');
    
    // 3 saniye sonra mesajı temizle
    setTimeout(() => {
      setSaveStatus('');
    }, 3000);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <button
          onClick={handleSave}
          className="btn btn-primary flex items-center"
        >
          <FiSave className="mr-2" />
          Kaydet
        </button>
      </div>
      
      {saveStatus && (
        <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-md mb-6">
          <p>{saveStatus}</p>
        </div>
      )}
      
      <div className="bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Genel Ayarlar</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tema
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => toggleTheme()}
                className={`px-4 py-2 rounded-md ${
                  theme === 'light'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-dark-600 dark:text-gray-300'
                }`}
              >
                Açık
              </button>
              <button
                onClick={() => toggleTheme()}
                className={`px-4 py-2 rounded-md ${
                  theme === 'dark'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-dark-600 dark:text-gray-300'
                }`}
              >
                Koyu
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="autoSave" className="flex items-center space-x-2 text-sm font-medium">
              <input
                type="checkbox"
                id="autoSave"
                name="autoSave"
                checked={settings.autoSave}
                onChange={handleChange}
                className="rounded border-gray-300 dark:border-dark-500 text-primary-600 focus:ring-primary-500 dark:bg-dark-800"
              />
              <span>Otomatik Kaydet</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Editör Ayarları</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="editorTheme" className="block text-sm font-medium mb-2">
              Editör Teması
            </label>
            <select
              id="editorTheme"
              name="editorTheme"
              value={settings.editorTheme}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-dark-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
            >
              <option value="vs">Açık</option>
              <option value="vs-dark">Koyu</option>
              <option value="hc-black">Yüksek Kontrast</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="editorFontSize" className="block text-sm font-medium mb-2">
              Font Boyutu
            </label>
            <input
              type="number"
              id="editorFontSize"
              name="editorFontSize"
              value={settings.editorFontSize}
              onChange={handleChange}
              min="10"
              max="24"
              className="w-full border border-gray-300 dark:border-dark-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
            />
          </div>
          
          <div>
            <label htmlFor="editorFontFamily" className="block text-sm font-medium mb-2">
              Font Ailesi
            </label>
            <select
              id="editorFontFamily"
              name="editorFontFamily"
              value={settings.editorFontFamily}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-dark-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
            >
              <option value="Fira Code, monospace">Fira Code</option>
              <option value="Consolas, monospace">Consolas</option>
              <option value="Monaco, monospace">Monaco</option>
              <option value="'Source Code Pro', monospace">Source Code Pro</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="tabSize" className="block text-sm font-medium mb-2">
              Tab Boyutu
            </label>
            <select
              id="tabSize"
              name="tabSize"
              value={settings.tabSize}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-dark-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
            >
              <option value="2">2 Boşluk</option>
              <option value="4">4 Boşluk</option>
              <option value="8">8 Boşluk</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">AI Ayarları</h2>
          <button
            onClick={fetchModels}
            className="btn btn-outline flex items-center"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600 mr-2"></div>
            ) : (
              <FiRefreshCw className="mr-2" />
            )}
            Modelleri Yenile
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="aiEndpoint" className="block text-sm font-medium mb-2">
              Ollama Endpoint
            </label>
            <input
              type="text"
              id="aiEndpoint"
              name="aiEndpoint"
              value={settings.aiEndpoint}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-dark-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
            />
          </div>
          
          <div>
            <label htmlFor="aiModel" className="block text-sm font-medium mb-2">
              AI Modeli
            </label>
            <select
              id="aiModel"
              name="aiModel"
              value={settings.aiModel}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-dark-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
            >
              {models.length === 0 ? (
                <option value="">Yükleniyor...</option>
              ) : (
                models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="systemPrompt" className="block text-sm font-medium mb-2">
            Sistem Prompt
          </label>
          <textarea
            id="systemPrompt"
            name="systemPrompt"
            value={settings.systemPrompt}
            onChange={handleChange}
            rows="10"
            className="w-full border border-gray-300 dark:border-dark-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800 font-mono text-sm"
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;