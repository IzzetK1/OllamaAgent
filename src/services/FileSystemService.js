/**
 * FileSystemService - Dosya sistemi işlemlerini yöneten servis
 * 
 * Bu servis, dosya ve klasör işlemlerini yönetir:
 * - Dosya listeleme
 * - Dosya oluşturma
 * - Dosya okuma
 * - Dosya yazma
 * - Dosya silme
 * - Klasör oluşturma
 * - Klasör silme
 */

class FileSystemService {
  /**
   * Proje dosyalarını listele
   * @param {string} projectId - Proje ID'si
   * @returns {Promise<Array>} - Dosya listesi
   */
  async listFiles(projectId) {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`);
      
      if (!response.ok) {
        throw new Error(`Dosya listesi alınamadı: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Dosya içeriğini oku
   * @param {string} projectId - Proje ID'si
   * @param {string} filePath - Dosya yolu
   * @returns {Promise<string>} - Dosya içeriği
   */
  async readFile(projectId, filePath) {
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${filePath}`);
      
      if (!response.ok) {
        throw new Error(`Dosya okunamadı: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Dosya oluştur veya güncelle
   * @param {string} projectId - Proje ID'si
   * @param {string} filePath - Dosya yolu
   * @param {string} content - Dosya içeriği
   * @returns {Promise<Object>} - Dosya bilgileri
   */
  async writeFile(projectId, filePath, content) {
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${filePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error(`Dosya yazılamadı: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Dosya sil
   * @param {string} projectId - Proje ID'si
   * @param {string} filePath - Dosya yolu
   * @returns {Promise<boolean>} - Başarılı mı?
   */
  async deleteFile(projectId, filePath) {
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${filePath}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Dosya silinemedi: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Klasör oluştur
   * @param {string} projectId - Proje ID'si
   * @param {string} folderPath - Klasör yolu
   * @returns {Promise<Object>} - Klasör bilgileri
   */
  async createFolder(projectId, folderPath) {
    try {
      const response = await fetch(`/api/projects/${projectId}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: folderPath }),
      });
      
      if (!response.ok) {
        throw new Error(`Klasör oluşturulamadı: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error creating folder ${folderPath}:`, error);
      throw error;
    }
  }

  /**
   * Klasör sil
   * @param {string} projectId - Proje ID'si
   * @param {string} folderPath - Klasör yolu
   * @returns {Promise<boolean>} - Başarılı mı?
   */
  async deleteFolder(projectId, folderPath) {
    try {
      const response = await fetch(`/api/projects/${projectId}/folders/${folderPath}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Klasör silinemedi: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting folder ${folderPath}:`, error);
      throw error;
    }
  }

  /**
   * Dosya veya klasör yeniden adlandır
   * @param {string} projectId - Proje ID'si
   * @param {string} oldPath - Eski yol
   * @param {string} newPath - Yeni yol
   * @returns {Promise<Object>} - Dosya veya klasör bilgileri
   */
  async rename(projectId, oldPath, newPath) {
    try {
      const response = await fetch(`/api/projects/${projectId}/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPath, newPath }),
      });
      
      if (!response.ok) {
        throw new Error(`Yeniden adlandırma başarısız: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error renaming ${oldPath} to ${newPath}:`, error);
      throw error;
    }
  }
}

// Singleton instance
const fileSystemService = new FileSystemService();
export default fileSystemService;
