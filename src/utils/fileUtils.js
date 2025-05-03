/**
 * Dosya işlemleri için yardımcı fonksiyonlar
 */

// Kod bloklarını çıkar ve dosya oluştur
export const extractAndProcessCodeBlocks = async (content, shouldClearFiles = false) => {
  if (!content) return { files: [] };

  try {
    // API'ye istek gönder
    const response = await fetch('/api/extract-files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        projectId: 'default', // Aktif proje ID'si
        clearFiles: shouldClearFiles
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Kod bloklarını çıkarma hatası:', error);
    throw error;
  }
};

// Dosya oluştur
export const createFile = async (fileName, content, projectId = 'default') => {
  if (!fileName || !content) return null;

  try {
    const response = await fetch(`/api/projects/${projectId}/files/${fileName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Dosya oluşturma hatası:', error);
    throw error;
  }
};

// Kod çalıştır
export const executeCode = async (code, language, projectId = 'default') => {
  if (!code || !language) return null;

  try {
    // Geçici bir dosya oluştur
    const fileName = `temp.${language}`;
    await createFile(fileName, code, projectId);

    // Kodu çalıştır
    const response = await fetch(`/api/projects/${projectId}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: fileName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Kod çalıştırma hatası:', error);
    throw error;
  }
};

// Dosya listesini yükle
export const fetchProjectFiles = async (projectId, setCreatedFiles, setWarnings) => {
  if (!projectId) return;

  try {
    const response = await fetch(`/api/projects/${projectId}/files`);

    if (!response.ok) {
      throw new Error('Dosya listesi alınamadı');
    }

    const data = await response.json();
    console.log('Proje dosyaları:', data);

    // Dosya listesini güncelle
    if (data.files) {
      setCreatedFiles(data.files.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        path: file.path,
        size: file.size || 0
      })));
    }
  } catch (error) {
    console.error('Dosya listesi alınamadı:', error);
    setWarnings(prev => [...prev, {
      id: Date.now(),
      message: `Dosya listesi alınamadı: ${error.message}`
    }]);
  }
};

// Proje dosyalarını yükle - FileExplorer için
export const fetchFiles = async (projectId) => {
  if (!projectId) return;

  try {
    const response = await fetch(`/api/projects/${projectId}/files`);

    if (!response.ok) {
      throw new Error('Dosya listesi alınamadı');
    }

    return response.json();
  } catch (error) {
    console.error('Dosya listesi alınamadı:', error);
    return { files: [] };
  }
};
