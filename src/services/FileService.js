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
   * @param {string} fileName - Dosya adı
   * @param {string} content - Dosya içeriği
   * @returns {Object|null} - Oluşturulan dosya bilgisi veya null
   */
  createFile(projectId, fileName, content) {
    try {
      // Geçersiz dosya adı kontrolü
      if (this.isInvalidFileName(fileName)) {
        console.log(`Geçersiz dosya adı: ${fileName}`);
        return null;
      }
      
      // Dosya adını temizle
      const cleanFileName = this.cleanFileName(fileName);
      
      // Proje klasörünü kontrol et
      const projectDir = this.ensureProjectDir(projectId);
      
      // Dosya yolu
      const filePath = this.path.join(projectDir, cleanFileName);
      
      // Klasörü oluştur
      this.fs.ensureDirSync(this.path.dirname(filePath));
      
      // Dosyayı oluştur
      this.fs.writeFileSync(filePath, content);
      
      console.log(`File created: ${cleanFileName}`);
      
      return {
        path: cleanFileName,
        size: content.length,
        modified: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error creating file (${fileName}):`, error);
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

    // Önce klasörleri oluştur
    codeBlocks.forEach(block => {
      const { fileName } = block;
      if (fileName && fileName.includes('/')) {
        const dirPath = this.path.dirname(fileName);
        this.createFolder(projectId, dirPath);
      }
    });

    // Sonra dosyaları oluştur
    codeBlocks.forEach(block => {
      const { fileName, code, language } = block;

      // Terminal komutu kontrolü
      if (this.isTerminalCommand(fileName) || this.isTerminalCommand(code.trim())) {
        console.log(`Terminal komutu algılandı, dosya oluşturulmayacak: ${fileName || code.trim().substring(0, 50) + '...'}`);
        return;
      }

      // Geçersiz dosya adı kontrolü
      if (this.isInvalidFileName(fileName)) {
        console.log(`Geçersiz dosya adı algılandı, dosya oluşturulmayacak: ${fileName}`);
        return;
      }

      const file = this.createFile(projectId, fileName, code);
      if (file) {
        files.push({
          ...file,
          language
        });
      }
    });

    return files;
  }

  /**
   * Terminal komutu mu kontrol et
   * @param {string} text - Kontrol edilecek metin
   * @returns {boolean} - Terminal komutu ise true
   */
  isTerminalCommand(text) {
    if (!text) return false;
    
    // Başında boşluk olan satırlar genellikle terminal komutudur
    if (text.trim().startsWith('    ') || text.trim().startsWith('\t')) {
      return true;
    }
    
    // Yaygın terminal komutları
    const terminalCommands = [
      'npm ', 'node ', 'python ', 'pip ', 'yarn ', 
      'git ', 'cd ', 'mkdir ', 'touch ', 'rm ', 
      'cp ', 'mv ', 'ls ', 'dir ', 'cat ', 
      'echo ', 'curl ', 'wget ', 'ssh ', 'sudo ',
      '/terminal', '/run', 'npx '
    ];
    
    // Komut kontrolü
    return terminalCommands.some(cmd => text.trim().startsWith(cmd));
  }

  /**
   * Dosya adının geçersiz olup olmadığını kontrol eder
   * @param {string} fileName - Dosya adı
   * @returns {boolean} - Geçersiz ise true
   */
  isInvalidFileName(fileName) {
    if (!fileName) return true;
    
    // Geçersiz dosya adı desenleri
    const invalidPatterns = [
      /^npm\s/, /^node\s/, /^python\s/, /^pip\s/, /^yarn\s/, 
      /^git\s/, /^cd\s/, /^mkdir\s/, /^touch\s/, /^rm\s/, 
      /^cp\s/, /^mv\s/, /^ls\s/, /^dir\s/, /^cat\s/, 
      /^echo\s/, /^curl\s/, /^wget\s/, /^ssh\s/, /^sudo\s/,
      /^\/terminal/, /^\/run/, /^npx\s/, /^import\s/, /^_!DOCTYPE/,
      /^body\s{/, /^function\s/, /^class\s/, /^const\s/, /^let\s/, /^var\s/,
      /^\{/, /^\}/, /^\[/, /^\]/
    ];
    
    return invalidPatterns.some(pattern => pattern.test(fileName.trim()));
  }

  /**
   * Dosya adını temizler
   * @param {string} fileName - Dosya adı
   * @returns {string} - Temizlenmiş dosya adı
   */
  cleanFileName(fileName) {
    // Başındaki ve sonundaki boşlukları temizle
    let cleanName = fileName.trim();
    
    // Başındaki ve sonundaki tırnak işaretlerini temizle
    cleanName = cleanName.replace(/^["'`]|["'`]$/g, '');
    
    // Başındaki ve sonundaki boşlukları tekrar temizle
    cleanName = cleanName.trim();
    
    // Dosya adında _ karakteri varsa ve başında ve sonunda _ varsa temizle
    if (cleanName.startsWith('_') && cleanName.endsWith('_')) {
      cleanName = cleanName.substring(1, cleanName.length - 1).trim();
    }
    
    // Dosya adında { karakteri varsa, temizle
    if (cleanName === '{' || cleanName.includes('{')) {
      cleanName = 'file.txt';
    }
    
    return cleanName;
  }

  /**
   * Proje dosyalarını temizler
   * @param {string} projectId - Proje ID'si
   * @returns {boolean} - Başarılı ise true
   */
  clearProjectFiles(projectId) {
    try {
      console.log(`Clearing files in project: ${projectId}`);
      const projectDir = this.ensureProjectDir(projectId);
      
      // Proje klasöründeki tüm dosyaları ve klasörleri sil
      this.fs.emptyDirSync(projectDir);
      
      // Geçersiz dosyaları temizle
      this.cleanInvalidFiles(projectId);
      
      return true;
    } catch (error) {
      console.error(`Error clearing project files (${projectId}):`, error);
      return false;
    }
  }

  /**
   * Geçersiz dosyaları temizler
   * @param {string} projectId - Proje ID'si
   * @returns {Array} - Silinen dosyalar
   */
  cleanInvalidFiles(projectId) {
    try {
      const projectDir = this.ensureProjectDir(projectId);
      
      // Geçersiz dosya desenleri
      const invalidFilePatterns = [
        /^npm\s/, /^node\s/, /^python\s/, /^pip\s/, /^yarn\s/, 
        /^git\s/, /^cd\s/, /^mkdir\s/, /^touch\s/, /^rm\s/, 
        /^cp\s/, /^mv\s/, /^ls\s/, /^dir\s/, /^cat\s/, 
        /^echo\s/, /^curl\s/, /^wget\s/, /^ssh\s/, /^sudo\s/,
        /^\/terminal/, /^\/run/, /^npx\s/, /^import\s/, /^_!DOCTYPE/,
        /^body\s{/, /^function\s/, /^class\s/, /^const\s/, /^let\s/, /^var\s/
      ];
      
      // Tüm dosyaları al
      const getAllFiles = (dir) => {
        let results = [];
        const list = this.fs.readdirSync(dir);
        
        list.forEach(file => {
          const filePath = this.path.join(dir, file);
          const stat = this.fs.statSync(filePath);
          
          if (stat && stat.isDirectory()) {
            // Recursive olarak alt klasörleri tara
            results = results.concat(getAllFiles(filePath));
          } else {
            // Dosya yolunu proje klasörüne göre göreceli hale getir
            const relativePath = this.path.relative(projectDir, filePath);
            results.push(relativePath);
          }
        });
        
        return results;
      };
      
      // Tüm dosyaları al
      let allFiles = [];
      try {
        allFiles = getAllFiles(projectDir);
        console.log('All files in project:', allFiles);
      } catch (err) {
        console.error('Error reading project files:', err);
        // Hata durumunda boş liste kullan
        allFiles = [];
      }
      
      // Silinen dosyaları takip et
      const deletedFiles = [];
      
      // Geçersiz dosyaları sil
      for (const file of allFiles) {
        const fullPath = this.path.join(projectDir, file);
        
        // Dosya adı kontrolü
        const isInvalidFileName = invalidFilePatterns.some(pattern => 
          pattern.test(file) || pattern.test(this.path.basename(file))
        );
        
        // Dosya içeriği kontrolü
        let isInvalidContent = false;
        try {
          const content = this.fs.readFileSync(fullPath, 'utf8').trim();
          const firstLine = content.split('\n')[0].trim();
          isInvalidContent = invalidFilePatterns.some(pattern => pattern.test(firstLine));
        } catch (err) {
          console.error(`Error reading file content: ${file}`, err);
        }
        
        if (isInvalidFileName || isInvalidContent) {
          console.log(`Removing invalid file: ${file}`);
          try {
            this.fs.unlinkSync(fullPath);
            deletedFiles.push(file);
          } catch (err) {
            console.error(`Error removing file: ${file}`, err);
          }
        }
      }
      
      return deletedFiles;
    } catch (error) {
      console.error('Error cleaning invalid files:', error);
      return [];
    }
  }
}

export default FileService;



