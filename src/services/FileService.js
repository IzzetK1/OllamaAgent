/**
 * File Service
 *
 * Bu servis, dosya işlemlerini yönetir:
 * - Dosya oluşturma
 * - Dosya okuma
 * - Dosya yazma
 * - Dosya silme
 * - Klasör oluşturma
 */

import { isTerminalCommand } from '../utils/codeParser.js';

class FileService {
  constructor(fs, path, projectsDir) {
    this.fs = fs;
    this.path = path;
    this.projectsDir = projectsDir;
  }

  /**
   * Proje klasörünü oluşturur
   * @param {string} projectId - Proje ID'si
   * @returns {string} - Proje klasörü yolu
   */
  ensureProjectDir(projectId) {
    const projectDir = this.path.join(this.projectsDir, projectId);

    if (!this.fs.existsSync(projectDir)) {
      this.fs.ensureDirSync(projectDir);
      console.log(`Project directory created: ${projectId}`);
    }

    return projectDir;
  }

  /**
   * Dosya oluşturur
   * @param {string} projectId - Proje ID'si
   * @param {string} filePath - Dosya yolu
   * @param {string} content - Dosya içeriği
   * @returns {Object} - Dosya bilgileri
   */
  createFile(projectId, filePath, content) {
    try {
      // Proje klasörünü kontrol et
      const projectDir = this.ensureProjectDir(projectId);

      // Dosya yolunu temizle
      const cleanPath = this.cleanFilePath(filePath);

      console.log(`Dosya oluşturma girişimi: ${cleanPath}`);

      // Terminal komutu kontrolü
      if (isTerminalCommand(cleanPath) || isTerminalCommand(content.trim())) {
        console.log(`Terminal komutu algılandı, dosya oluşturulmayacak: ${content.trim()}`);
        return null;
      }

      // Dosya yolu kontrolü
      if (!cleanPath || cleanPath === '' || cleanPath.endsWith('/')) {
        console.error(`Geçersiz dosya yolu: ${cleanPath}`);
        return null;
      }

      // Dosya adında geçersiz karakterler varsa temizle
      const sanitizedPath = cleanPath.replace(/[^\w\-./]/g, '_');

      const fullPath = this.path.join(projectDir, sanitizedPath);
      console.log(`Tam dosya yolu: ${fullPath}`);

      // Klasörü oluştur (gerekirse)
      try {
        const dirPath = this.path.dirname(fullPath);
        console.log(`Klasör oluşturuluyor: ${dirPath}`);
        this.fs.ensureDirSync(dirPath);
      } catch (dirError) {
        console.error(`Klasör oluşturma hatası (${this.path.dirname(fullPath)}):`, dirError);
        return null;
      }

      // Dosya zaten var mı kontrol et
      const fileExists = this.fs.existsSync(fullPath);

      // Dosyayı yaz
      try {
        console.log(`Dosya yazılıyor: ${fullPath}`);
        this.fs.writeFileSync(fullPath, content);
        console.log(`Dosya yazma başarılı: ${fullPath}`);
      } catch (writeError) {
        console.error(`Dosya yazma hatası (${sanitizedPath}):`, writeError);
        return null;
      }

      // Dosya bilgilerini al
      try {
        const stat = this.fs.statSync(fullPath);

        const fileInfo = {
          path: sanitizedPath,
          name: this.path.basename(sanitizedPath),
          size: stat.size,
          modified: stat.mtime.toISOString()
        };

        console.log(`Dosya ${fileExists ? 'güncellendi' : 'oluşturuldu'}: ${sanitizedPath}`);

        return fileInfo;
      } catch (statError) {
        console.error(`Dosya bilgisi alma hatası (${sanitizedPath}):`, statError);

        // Dosya bilgisi alınamasa bile dosya bilgilerini döndür
        return {
          path: sanitizedPath,
          name: this.path.basename(sanitizedPath),
          size: content.length,
          modified: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`Dosya oluşturma hatası (${filePath}):`, error);
      return null;
    }
  }

  /**
   * Klasör oluşturur
   * @param {string} projectId - Proje ID'si
   * @param {string} folderPath - Klasör yolu
   * @returns {Object} - Klasör bilgileri
   */
  createFolder(projectId, folderPath) {
    try {
      // Proje klasörünü kontrol et
      const projectDir = this.ensureProjectDir(projectId);

      // Klasör yolunu temizle
      const cleanPath = this.cleanFilePath(folderPath);

      // Klasör yolu kontrolü
      if (!cleanPath || cleanPath === '') {
        console.error(`Geçersiz klasör yolu: ${cleanPath}`);
        return null;
      }

      const fullPath = this.path.join(projectDir, cleanPath);

      // Klasörü oluştur
      try {
        this.fs.ensureDirSync(fullPath);
        console.log(`Klasör oluşturuldu: ${cleanPath}`);
      } catch (dirError) {
        console.error(`Klasör oluşturma hatası (${cleanPath}):`, dirError);
        return null;
      }

      // Klasör bilgilerini döndür
      return {
        path: cleanPath,
        name: this.path.basename(cleanPath),
        type: 'directory'
      };
    } catch (error) {
      console.error(`Klasör oluşturma hatası (${folderPath}):`, error);
      return null;
    }
  }

  /**
   * Dosya yolunu temizler
   * @param {string} filePath - Dosya yolu
   * @returns {string} - Temizlenmiş dosya yolu
   */
  cleanFilePath(filePath) {
    if (!filePath) return '';

    console.log(`Temizlenmeden önce dosya yolu: "${filePath}"`);

    // Başta ve sondaki boşlukları temizle
    let cleanPath = filePath.trim();

    // Tırnak işaretlerini temizle
    cleanPath = cleanPath.replace(/^['"](.*)['"]$/, '$1');

    // CSS yorum satırlarını temizle
    cleanPath = cleanPath.replace(/\/\*|\*\//g, '');

    // Dosya yolundaki // işaretlerini kaldır
    cleanPath = cleanPath.replace(/^\/\/\s*/, '');

    // Dosya yolundaki geçersiz karakterleri temizle
    cleanPath = cleanPath.replace(/[<>:"|?*\\]/g, '');

    // Dosya yolunu normalize et
    cleanPath = cleanPath.replace(/\\/g, '/');

    // Dosya adındaki boşlukları alt çizgi ile değiştir
    cleanPath = cleanPath.replace(/\s+/g, '_');

    // Dosya adındaki Türkçe karakterleri değiştir
    cleanPath = cleanPath.replace(/ğ/g, 'g')
                         .replace(/Ğ/g, 'G')
                         .replace(/ü/g, 'u')
                         .replace(/Ü/g, 'U')
                         .replace(/ş/g, 's')
                         .replace(/Ş/g, 'S')
                         .replace(/ı/g, 'i')
                         .replace(/İ/g, 'I')
                         .replace(/ö/g, 'o')
                         .replace(/Ö/g, 'O')
                         .replace(/ç/g, 'c')
                         .replace(/Ç/g, 'C');

    // Dosya adında nokta varsa, sadece ilk noktaya kadar olan kısmı al ve uzantıyı koru
    const lastDotIndex = cleanPath.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const extension = cleanPath.substring(lastDotIndex);
      const baseName = cleanPath.substring(0, lastDotIndex);

      // Dosya adındaki nokta dışındaki özel karakterleri temizle
      const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '');

      cleanPath = cleanBaseName + extension;
    } else {
      // Uzantı yoksa, tüm özel karakterleri temizle
      cleanPath = cleanPath.replace(/[^a-zA-Z0-9_-]/g, '');
    }

    console.log(`Temizlendikten sonra dosya yolu: "${cleanPath}"`);

    return cleanPath;
  }

  /**
   * Proje dosyalarını temizler
   * @param {string} projectId - Proje ID'si
   * @returns {boolean} - Başarılı mı?
   */
  clearProjectFiles(projectId) {
    try {
      // Proje klasörünü kontrol et
      const projectDir = this.ensureProjectDir(projectId);

      // Proje klasöründeki tüm dosyaları sil (project.json hariç)
      const files = this.fs.readdirSync(projectDir);

      for (const file of files) {
        if (file !== 'project.json') {
          const filePath = this.path.join(projectDir, file);

          if (this.fs.statSync(filePath).isDirectory()) {
            this.fs.removeSync(filePath);
          } else {
            this.fs.unlinkSync(filePath);
          }
        }
      }

      console.log(`Proje dosyaları temizlendi: ${projectId}`);
      return true;
    } catch (error) {
      console.error(`Proje dosyaları temizlenirken hata oluştu (${projectId}):`, error);
      return false;
    }
  }

  /**
   * Kod bloklarından dosya oluşturur
   * @param {string} projectId - Proje ID'si
   * @param {Array} codeBlocks - Kod blokları
   * @returns {Array} - Oluşturulan dosyalar
   */
  createFilesFromCodeBlocks(projectId, codeBlocks) {
    const files = [];

    console.log(`Kod bloklarından dosya oluşturuluyor. Blok sayısı: ${codeBlocks.length}`);

    for (const block of codeBlocks) {
      const { fileName, code, language } = block;

      console.log(`İşlenen blok: Dil=${language}, Dosya=${fileName}`);

      if (fileName) {
        // Dosya adını temizle ve geçerli bir dosya adı oluştur
        const cleanedFileName = this.cleanFilePath(fileName);

        console.log(`Temizlenmiş dosya adı: ${cleanedFileName}`);

        // Dosya içeriğini kontrol et
        if (!code || code.trim() === '') {
          console.log(`Boş kod bloğu, dosya oluşturulmayacak: ${cleanedFileName}`);
          continue;
        }

        // Dosyayı oluştur
        const fileInfo = this.createFile(projectId, cleanedFileName, code);

        if (fileInfo) {
          console.log(`Dosya başarıyla oluşturuldu: ${fileInfo.path}`);
          files.push(fileInfo);
        } else {
          console.error(`Dosya oluşturulamadı: ${cleanedFileName}`);
        }
      } else {
        console.log(`Dosya adı yok, blok atlanıyor: ${language}`);
      }
    }

    console.log(`Toplam ${files.length} dosya oluşturuldu.`);
    return files;
  }
}

export default FileService;
