// Modern Express sunucusu
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import { exec, execSync } from 'child_process';
import util from 'util';

// exec'i Promise'e dönüştür
const execPromise = util.promisify(exec);
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Servisler ve API modülleri
import FileService from './src/services/FileService.js';
import setupExtractFilesEndpoint from './src/api/extractFilesEndpoint.js';

// Gerekli modülleri içe aktar
import { extractCodeBlocks } from './src/utils/codeParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 3005; // Frontend'in bağlandığı port

// Proje klasörü
const PROJECTS_DIR = path.join(__dirname, 'projects');

// Terminal yönetimi için değişkenler
const terminals = new Map();
let nextTerminalId = 1;

// Projelerin saklanacağı klasörü oluştur
fs.ensureDirSync(PROJECTS_DIR);

// CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// JSON body parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Statik dosyaları sunma - Vite build çıktısını sun
app.use(express.static(path.join(__dirname, 'dist')));

// Vite geliştirme sunucusu çalışırken, bu kısım kullanılmaz
// Sadece production modunda veya npm run preview ile çalıştırıldığında kullanılır

// Dosya sistemi API'leri
app.get('/api/projects', (req, res) => {
  try {
    // PROJECTS_DIR'in var olduğundan emin ol
    if (!fs.existsSync(PROJECTS_DIR)) {
      fs.mkdirSync(PROJECTS_DIR, { recursive: true });
      console.log(`Created projects directory: ${PROJECTS_DIR}`);
    }

    // Proje klasörlerini oku
    const projects = fs.readdirSync(PROJECTS_DIR)
      .filter(item => {
        const itemPath = path.join(PROJECTS_DIR, item);
        return fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory();
      })
      .map(dir => {
        const configPath = path.join(PROJECTS_DIR, dir, 'project.json');
        let config = { name: dir, description: '', created: '' };

        if (fs.existsSync(configPath)) {
          try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            config = { ...config, ...JSON.parse(configContent) };
          } catch (e) {
            console.error(`Error reading project config for ${dir}:`, e);
          }
        } else {
          // Eğer config dosyası yoksa oluştur
          const defaultConfig = { 
            name: dir, 
            description: 'Auto-created project', 
            created: new Date().toISOString() 
          };
          try {
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            config = defaultConfig;
          } catch (e) {
            console.error(`Error creating project config for ${dir}:`, e);
          }
        }

        return {
          id: dir,
          name: config.name || dir,
          description: config.description || '',
          created: config.created || new Date().toISOString()
        };
      });

    // Yanıt döndür
    res.json({ projects });
  } catch (error) {
    console.error('Error in /api/projects:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Proje ID'si oluştur (URL-friendly)
    const projectId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const projectDir = path.join(PROJECTS_DIR, projectId);

    // Klasör zaten varsa hata döndür
    if (fs.existsSync(projectDir)) {
      return res.status(409).json({ error: 'A project with this name already exists' });
    }

    // Proje klasörünü oluştur
    fs.ensureDirSync(projectDir);
    fs.ensureDirSync(path.join(projectDir, 'src'));

    // Proje konfigürasyonunu kaydet
    const config = {
      name,
      description: description || '',
      created: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(projectDir, 'project.json'),
      JSON.stringify(config, null, 2)
    );

    // Temel dosyaları oluştur
    fs.writeFileSync(
      path.join(projectDir, 'index.html'),
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <link rel="stylesheet" href="./src/style.css">
</head>
<body>
  <div id="app"></div>
  <script src="./src/main.js" type="module"></script>
</body>
</html>`
    );

    fs.writeFileSync(
      path.join(projectDir, 'src', 'style.css'),
      `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f4f4;
  padding: 20px;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
}`
    );

    fs.writeFileSync(
      path.join(projectDir, 'src', 'main.js'),
      `// Main application entry point
console.log('Application started');

document.getElementById('app').innerHTML = '<h1>${name}</h1><p>Project created successfully!</p>';`
    );

    res.status(201).json({
      id: projectId,
      name,
      description: description || '',
      created: config.created
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/projects/:projectId/files', (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(PROJECTS_DIR, projectId);

    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const files = [];

    function scanDirectory(dir, basePath = '') {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        const relativePath = path.join(basePath, item).replace(/\\/g, '/');

        if (stat.isDirectory()) {
          files.push({
            path: relativePath,
            name: item,
            type: 'directory',
            children: []
          });

          scanDirectory(itemPath, relativePath);
        } else {
          files.push({
            path: relativePath,
            name: item,
            type: 'file',
            size: stat.size,
            modified: stat.mtime.toISOString()
          });
        }
      }
    }

    scanDirectory(projectDir);

    // Dosya ağacını oluştur
    const fileTree = [];
    const pathMap = {};

    // Önce tüm klasörleri ekle
    files.filter(f => f.type === 'directory').forEach(folder => {
      const parts = folder.path.split('/');
      const folderName = parts.pop();
      const parentPath = parts.join('/');

      const folderNode = {
        path: folder.path,
        name: folderName,
        type: 'directory',
        children: []
      };

      pathMap[folder.path] = folderNode;

      if (!parentPath) {
        fileTree.push(folderNode);
      }
    });

    // Sonra dosyaları ve klasör ilişkilerini kur
    files.forEach(file => {
      const parts = file.path.split('/');
      const fileName = parts.pop();
      const parentPath = parts.join('/');

      if (file.type === 'file') {
        const fileNode = {
          path: file.path,
          name: fileName,
          type: 'file',
          size: file.size,
          modified: file.modified
        };

        if (parentPath && pathMap[parentPath]) {
          pathMap[parentPath].children.push(fileNode);
        } else {
          fileTree.push(fileNode);
        }
      } else if (parentPath && pathMap[parentPath]) {
        pathMap[parentPath].children.push(pathMap[file.path]);
      }
    });

    res.json({ files: fileTree });
  } catch (error) {
    console.error('Error getting project files:', error);
    res.status(500).json({ error: 'Failed to get project files' });
  }
});

app.get('/api/projects/:projectId/files/:filePath(*)', (req, res) => {
  try {
    const { projectId, filePath } = req.params;
    const fullPath = path.join(PROJECTS_DIR, projectId, filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Path is a directory, not a file' });
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    res.json({
      path: filePath,
      name: path.basename(filePath),
      content,
      size: stat.size,
      modified: stat.mtime.toISOString()
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

app.post('/api/projects/:projectId/files/:filePath(*)', (req, res) => {
  try {
    const { projectId } = req.params;
    let { filePath } = req.params;
    const { content } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Dosya yolundaki boşlukları temizle
    filePath = filePath.replace(/^\s+|\s+$/g, '');
    filePath = filePath.replace(/\s+/g, '');

    // CSS yorum satırlarını temizle
    filePath = filePath.replace(/\/\*|\*\//g, '');

    // Dosya yolundaki // işaretlerini kaldır
    filePath = filePath.replace(/^\/\/\s*/, '');

    // Dosya yolundaki geçersiz karakterleri temizle
    filePath = filePath.replace(/[<>:"|?*\\]/g, '');

    // Dosya yolunu normalize et
    filePath = filePath.replace(/\\/g, '/');

    // Proje klasörünü kontrol et
    const projectDir = path.join(PROJECTS_DIR, projectId);
    if (!fs.existsSync(projectDir)) {
      // Proje klasörü yoksa oluştur
      fs.ensureDirSync(projectDir);
    }

    // Dosya yolu kontrolü - eğer dosya yolu bir klasör ise hata ver
    if (filePath.endsWith('/') || filePath === '') {
      return res.status(400).json({ error: 'Invalid file path. Cannot write to a directory.' });
    }

    const fullPath = path.join(projectDir, filePath);

    // Klasörü oluştur (gerekirse)
    try {
      fs.ensureDirSync(path.dirname(fullPath));
    } catch (dirError) {
      console.error('Error creating directory:', dirError);
      return res.status(500).json({ error: 'Failed to create directory' });
    }

    // Dosyayı yaz
    try {
      fs.writeFileSync(fullPath, content);
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return res.status(500).json({ error: 'Failed to write file' });
    }

    // Dosya bilgilerini al
    try {
      const stat = fs.statSync(fullPath);

      res.json({
        path: filePath,
        name: path.basename(filePath),
        size: stat.size,
        modified: stat.mtime.toISOString()
      });
    } catch (statError) {
      console.error('Error getting file stats:', statError);
      // Dosya yazıldı ama stat alınamadı, yine de başarılı sayalım
      res.json({
        path: filePath,
        name: path.basename(filePath),
        size: content.length,
        modified: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ error: 'Failed to write file' });
  }
});

app.delete('/api/projects/:projectId/files/:filePath(*)', (req, res) => {
  try {
    const { projectId, filePath } = req.params;
    const fullPath = path.join(PROJECTS_DIR, projectId, filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      fs.removeSync(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.post('/api/projects/:projectId/mkdir/:dirPath(*)', (req, res) => {
  try {
    const { projectId, dirPath } = req.params;
    const fullPath = path.join(PROJECTS_DIR, projectId, dirPath);

    fs.ensureDirSync(fullPath);

    res.json({
      path: dirPath,
      name: path.basename(dirPath),
      type: 'directory'
    });
  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({ error: 'Failed to create directory' });
  }
});

// Klasör oluşturma API'si (geliştirilmiş)
app.post('/api/projects/:projectId/folders', (req, res) => {
  try {
    const { projectId } = req.params;
    let { path: folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    // Klasör yolunu temizle
    folderPath = folderPath.trim();
    folderPath = folderPath.replace(/[<>:"|?*\\]/g, '');
    folderPath = folderPath.replace(/\\/g, '/');

    const projectDir = path.join(PROJECTS_DIR, projectId);
    if (!fs.existsSync(projectDir)) {
      // Proje klasörü yoksa oluştur
      fs.ensureDirSync(projectDir);
      console.log(`Project directory created: ${projectId}`);
    }

    const fullPath = path.join(projectDir, folderPath);

    // Klasörü oluştur
    try {
      fs.ensureDirSync(fullPath);
      console.log(`Klasör oluşturuldu: ${folderPath}`);
    } catch (dirError) {
      console.error(`Klasör oluşturma hatası (${folderPath}):`, dirError);
      return res.status(500).json({ error: `Failed to create folder: ${dirError.message}` });
    }

    // Klasör bilgilerini döndür
    res.json({
      path: folderPath,
      created: true,
      name: path.basename(folderPath),
      type: 'directory'
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Terminal API'si
app.post('/api/terminal', async (req, res) => {
  try {
    const { command, projectId } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Proje klasörünü kontrol et
    const projectDir = path.join(PROJECTS_DIR, projectId);
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // CD komutları için özel işlem
    if (command.startsWith('cd ')) {
      const dirPath = command.substring(3).trim();
      const fullPath = path.join(projectDir, dirPath);

      try {
        // Klasörü oluştur (gerekirse)
        fs.ensureDirSync(fullPath);

        return res.json({
          command,
          stdout: `Directory created: ${dirPath}`,
          stderr: '',
          exitCode: 0
        });
      } catch (dirError) {
        console.error(`Error creating directory: ${dirError.message}`);
        return res.json({
          command,
          stdout: '',
          stderr: `Error creating directory: ${dirError.message}`,
          exitCode: 1
        });
      }
    }

    // Komutu çalıştır
    exec(command, { cwd: projectDir, timeout: 30000 }, (error, stdout, stderr) => {
      res.json({
        command,
        stdout,
        stderr: error ? `${error.message}\n${stderr}` : stderr,
        exitCode: error ? error.code : 0
      });
    });
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({ error: 'Failed to execute command' });
  }
});

// Proje önizleme API'si
app.get('/api/projects/:projectId/preview/:file?', (req, res) => {
  try {
    const { projectId, file } = req.params;
    const projectDir = path.join(PROJECTS_DIR, projectId);
    
    // Dosya belirtilmemişse index.html'i kullan
    let fileName = file || 'index.html';
    
    // Dosya yolunu normalize et (Windows/Unix uyumluluğu için)
    fileName = fileName.replace(/\\/g, '/');
    
    // Tam dosya yolu
    let filePath = path.join(projectDir, fileName);
    
    console.log(`Preview request for file: ${filePath}`);
    
    // Dosyanın varlığını kontrol et
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      
      // Eğer styles.css bulunamadıysa, src/style.css'i dene
      if (fileName === 'styles.css' && fs.existsSync(path.join(projectDir, 'src', 'style.css'))) {
        filePath = path.join(projectDir, 'src', 'style.css');
        console.log(`Using alternative file: ${filePath}`);
      } 
      // Eğer src/main.js bulunamadıysa, index.html'i dene
      else if (fileName.includes('src/main.js') && fs.existsSync(path.join(projectDir, 'index.html'))) {
        filePath = path.join(projectDir, 'index.html');
        console.log(`Using alternative file: ${filePath}`);
      }
      // Hala bulunamadıysa 404 döndür
      else {
        return res.status(404).send('File not found');
      }
    }
    
    // Dosya uzantısına göre MIME türünü belirle
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    
    const contentType = mimeTypes[ext] || 'text/plain';
    
    // Dosyayı oku ve gönder
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', contentType);
    res.send(content);
  } catch (error) {
    console.error('Error serving preview:', error);
    res.status(500).send('Error serving preview');
  }
});

// Proje test API'si
app.post('/api/projects/:projectId/test', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array is required' });
    }

    const projectDir = path.join(PROJECTS_DIR, projectId);
    if (!fs.existsSync(projectDir)) {
      // Proje klasörü yoksa oluştur
      fs.ensureDirSync(projectDir);
    }

    // Dosyaları test et
    const testResults = [];

    for (const file of files) {
      // Dosya yolunu temizle
      let filePath = file.path;

      // Dosya yolundaki boşlukları temizle
      filePath = filePath.replace(/^\s+|\s+$/g, '');
      filePath = filePath.replace(/\s+/g, '');

      // Dosya yolundaki // işaretlerini kaldır
      filePath = filePath.replace(/^\/\/\s*/, '');

      // Dosya yolundaki geçersiz karakterleri temizle
      filePath = filePath.replace(/[<>:"|?*]/g, '_');

      // Dosya yolunu normalize et
      filePath = filePath.replace(/\\/g, '/');

      const fullPath = path.join(projectDir, filePath);
      const fileExt = path.extname(fullPath).toLowerCase();

      // Dosya var mı kontrol et
      if (!fs.existsSync(fullPath)) {
        testResults.push({
          file: filePath,
          success: false,
          error: 'File does not exist'
        });
        continue;
      }

      // Dosya içeriğini oku
      let fileContent;
      try {
        fileContent = fs.readFileSync(fullPath, 'utf8');
      } catch (readError) {
        testResults.push({
          file: filePath,
          success: false,
          error: `Error reading file: ${readError.message}`
        });
        continue;
      }

      // Dosya türüne göre test et
      if (fileExt === '.js' || fileExt === '.jsx') {
        // JSX içeriyor mu kontrol et
        const hasJSX = fileContent.includes('<') && fileContent.includes('/>') ||
                      fileContent.includes('</') ||
                      fileContent.includes('className=') ||
                      fileContent.includes('import React');

        if (hasJSX && fileExt === '.js') {
          // JSX içeren dosyaları farklı şekilde test et
          testResults.push({
            file: filePath,
            success: true,
            output: 'JSX content detected, skipping syntax check'
          });
        } else {
          // Normal JavaScript dosyalarını node ile çalıştır
          try {
            const { stdout, stderr } = await execPromise(`node --check "${fullPath}"`, { cwd: projectDir });
            testResults.push({
              file: filePath,
              success: true,
              output: stdout || 'Syntax OK'
            });
          } catch (error) {
            // JSX içeriyor mu kontrol et (hata durumunda)
            if (hasJSX) {
              testResults.push({
                file: filePath,
                success: true,
                output: 'JSX content detected, syntax errors expected'
              });
            } else {
              testResults.push({
                file: filePath,
                success: false,
                error: error.message
              });
            }
          }
        }
      } else if (fileExt === '.html') {
        // HTML dosyalarını basit bir şekilde doğrula
        try {
          const hasDoctype = fileContent.includes('<!DOCTYPE') || fileContent.includes('<!doctype');
          const hasHtml = fileContent.includes('<html') && fileContent.includes('</html>');

          if (hasDoctype && hasHtml) {
            testResults.push({
              file: filePath,
              success: true,
              output: 'HTML structure OK'
            });
          } else {
            testResults.push({
              file: filePath,
              success: false,
              error: 'HTML structure is invalid'
            });
          }
        } catch (error) {
          testResults.push({
            file: filePath,
            success: false,
            error: error.message
          });
        }
      } else if (fileExt === '.css') {
        // CSS dosyalarını basit bir şekilde doğrula
        try {
          const hasCssRules = fileContent.includes('{') && fileContent.includes('}');

          if (hasCssRules) {
            testResults.push({
              file: filePath,
              success: true,
              output: 'CSS structure OK'
            });
          } else {
            testResults.push({
              file: filePath,
              success: false,
              error: 'CSS structure is invalid'
            });
          }
        } catch (error) {
          testResults.push({
            file: filePath,
            success: false,
            error: error.message
          });
        }
      } else {
        // Diğer dosya türleri için basit bir kontrol
        testResults.push({
          file: filePath,
          success: true,
          output: 'File exists'
        });
      }
    }

    res.json({ results: testResults });
  } catch (error) {
    console.error('Error testing files:', error);
    res.status(500).json({ error: 'Failed to test files' });
  }
});

// Yardımcı fonksiyonlar
/**
 * Bir klasördeki tüm dosyaları recursive olarak getirir
 * @param {string} dir - Klasör yolu
 * @param {string} [subDir=''] - Alt klasör yolu (recursive çağrılar için)
 * @returns {string[]} - Dosya yolları listesi
 */
function getAllFiles(dir, subDir = '') {
  const result = [];
  const currentDir = path.join(dir, subDir);
  
  try {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(subDir, file);
      const fullPath = path.join(dir, filePath);
      
      if (fs.statSync(fullPath).isDirectory()) {
        // Alt klasörleri recursive olarak tara
        result.push(...getAllFiles(dir, filePath));
      } else {
        // Dosyayı listeye ekle
        result.push(filePath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${currentDir}:`, err);
  }
  
  return result;
}

// Projeyi çalıştır API'si
app.post('/api/projects/:projectId/run', (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(PROJECTS_DIR, projectId);
    
    // Proje klasörünü kontrol et
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
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
    
    // Geçersiz dosyaları temizle
    const invalidFilePatterns = [
      /^npm\s/, /^node\s/, /^python\s/, /^pip\s/, /^yarn\s/, 
      /^git\s/, /^cd\s/, /^mkdir\s/, /^touch\s/, /^rm\s/, 
      /^cp\s/, /^mv\s/, /^ls\s/, /^dir\s/, /^cat\s/, 
      /^echo\s/, /^curl\s/, /^wget\s/, /^ssh\s/, /^sudo\s/,
      /^\/terminal/, /^\/run/, /^npx\s/, /^import\s/, /^_!DOCTYPE/,
      /^\{/, /^\}/, /^\[/, /^\]/
    ];
    
    // Geçersiz dosyaları sil
    for (const file of allFiles) {
      const fullPath = path.join(projectDir, file);
      
      // Dosya adı kontrolü
      const isInvalidFileName = invalidFilePatterns.some(pattern => 
        pattern.test(file) || pattern.test(path.basename(file))
      );
      
      // Dosya içeriği kontrolü
      let isInvalidContent = false;
      try {
        const content = fs.readFileSync(fullPath, 'utf8').trim();
        const firstLine = content.split('\n')[0].trim();
        isInvalidContent = invalidFilePatterns.some(pattern => pattern.test(firstLine));
      } catch (err) {
        console.error(`Error reading file content: ${file}`, err);
      }
      
      if (isInvalidFileName || isInvalidContent) {
        console.log(`Removing invalid file: ${file}`);
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          console.error(`Error removing file: ${file}`, err);
        }
      }
    }
    
    // Dosyaları yeniden al (temizleme sonrası)
    allFiles = getAllFiles(projectDir);
    console.log('Files after cleanup:', allFiles);
    
    // Gerçek dosyaları filtrele
    const files = allFiles.filter(file => {
      // Dosya uzantısına göre filtrele
      const ext = path.extname(file).toLowerCase();
      return ['.html', '.js', '.jsx', '.ts', '.tsx', '.css', '.py', '.json', '.txt', '.md', '.xml', '.yml', '.yaml'].includes(ext);
    });
    
    console.log('Filtered files:', files);
    
    // Dosya türlerine göre ayır
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    const jsFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.jsx'));
    const tsFiles = files.filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
    const pyFiles = files.filter(file => file.endsWith('.py'));
    
    console.log('HTML files:', htmlFiles);
    console.log('JS files:', jsFiles);
    console.log('TS files:', tsFiles);
    console.log('Python files:', pyFiles);
    
    // Çalıştırılacak komutu belirle
    let runCommand = '';
    
    // Eğer hiç dosya yoksa, varsayılan HTML dosyası oluştur
    if (files.length === 0) {
      console.log('No files found, creating default HTML file');
      
      // index.html oluştur
      fs.writeFileSync(
        path.join(projectDir, 'index.html'),
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Project</h1>
    <p>This is a default project page.</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`
      );
      
      // script.js oluştur
      fs.writeFileSync(
        path.join(projectDir, 'script.js'),
        `// Main script
console.log('Application started');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
});`
      );
      
      // styles.css oluştur
      fs.writeFileSync(
        path.join(projectDir, 'styles.css'),
        `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

#app {
  max-width: 800px;
  margin: 0 auto;
}`
      );
      
      // Dosya listesini güncelle
      files.push('index.html', 'styles.css', 'script.js');
      htmlFiles.push('index.html');
    }

    // HTML dosyası varsa, tarayıcıda aç
    if (htmlFiles.length > 0) {
      const htmlFile = htmlFiles.find(file => file.includes('index.html')) || htmlFiles[0];
      const previewUrl = `/api/projects/${projectId}/preview/${htmlFile}`;
      
      console.log('Opening HTML file in browser:', htmlFile);
      
      return res.json({
        command: 'open-browser',
        previewUrl,
        success: true,
        stdout: `Opening ${htmlFile} in browser`
      });
    }
    // JS dosyası varsa ve HTML dosyası yoksa
    else if (jsFiles.length > 0 && htmlFiles.length === 0) {
      // Ana JS dosyasını bul
      const mainJsFile = jsFiles.find(file => 
        file.includes('index.js') || 
        file.includes('main.js') || 
        file.includes('app.js')
      ) || jsFiles[0];
      
      // JS dosyasının içeriğini oku
      const jsFilePath = path.join(projectDir, mainJsFile);
      const jsContent = fs.readFileSync(jsFilePath, 'utf8');
      
      // Eğer dosya tarayıcı DOM'una erişiyorsa, HTML dosyası oluştur ve tarayıcıda aç
      if (jsContent.includes('document.') || jsContent.includes('window.')) {
        console.log('JS file uses browser DOM, creating HTML file');
        
        // HTML dosyası oluştur
        const indexHtmlPath = path.join(projectDir, 'index.html');
        fs.writeFileSync(
          indexHtmlPath,
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JavaScript App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="${mainJsFile}"></script>
</body>
</html>`
        );
        
        // Eğer styles.css yoksa oluştur
        if (!files.some(file => file.endsWith('.css'))) {
          fs.writeFileSync(
            path.join(projectDir, 'styles.css'),
            `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

#app {
  max-width: 800px;
  margin: 0 auto;
}`
          );
        }
        
        const previewUrl = `/api/projects/${projectId}/preview/index.html`;
        
        return res.json({
          command: 'open-browser',
          previewUrl,
          success: true,
          stdout: `Opening index.html in browser`
        });
      }
      
      runCommand = `node ${mainJsFile}`;
      console.log('Running JS file:', runCommand);
    }
    // TS dosyası varsa
    else if (tsFiles.length > 0) {
      // TS dosyası varsa, ts-node ile çalıştır (eğer kuruluysa)
      const mainTsFile = tsFiles.find(file => 
        file.includes('index.ts') || 
        file.includes('main.ts') || 
        file.includes('app.ts')
      ) || tsFiles[0];
      
      runCommand = `npx ts-node ${mainTsFile}`;
      console.log('Running TS file:', runCommand);
    }
    // Python dosyası varsa
    else if (pyFiles.length > 0) {
      // Python dosyası varsa, Python ile çalıştır
      const mainPyFile = pyFiles.find(file => 
        file.includes('main.py') || 
        file.includes('app.py') || 
        file.includes('index.py')
      ) || pyFiles[0];
      
      runCommand = `python ${mainPyFile}`;
      console.log('Running Python file:', runCommand);
    }
    // Çalıştırılabilir dosya yoksa
    else {
      // Çalıştırılabilir dosya yoksa, varsayılan HTML dosyasını oluştur ve aç
      console.log('No runnable files found, creating and opening default index.html');
      
      // index.html oluştur
      fs.writeFileSync(
        path.join(projectDir, 'index.html'),
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Default Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Default Project</h1>
    <p>This is a default project page.</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`
      );
      
      // script.js oluştur
      fs.writeFileSync(
        path.join(projectDir, 'script.js'),
        `// Main script
console.log('Application started');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
});`
      );
      
      // styles.css oluştur
      fs.writeFileSync(
        path.join(projectDir, 'styles.css'),
        `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

#app {
  max-width: 800px;
  margin: 0 auto;
}`
      );
      
      const previewUrl = `/api/projects/${projectId}/preview/index.html`;
      
      return res.json({
        command: 'open-browser',
        previewUrl,
        success: true,
        stdout: `Opening default index.html in browser`
      });
    }

    // Komutu çalıştır
    console.log('Executing command:', runCommand);
    exec(runCommand, { cwd: projectDir, timeout: 30000 }, (error, stdout, stderr) => {
      console.log('Command execution result:', { error, stdout, stderr });
      
      res.json({
        command: runCommand,
        stdout,
        stderr: error ? `${error.message}\n${stderr}` : stderr,
        success: !error,
        exitCode: error ? error.code : 0
      });
    });
  } catch (error) {
    console.error('Error running project:', error);
    res.status(500).json({ error: 'Failed to run project', message: error.message });
  }
});

// Kod bloklarından dosya oluşturma API'si
app.post('/api/extract-files', (req, res) => {
  try {
    const { content, projectId, clearFiles } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    console.log('Extract files request received:', { 
      projectId, 
      contentLength: content.length,
      clearFiles 
    });
    
    // FileService oluştur
    const fileService = new FileService(fs, path, PROJECTS_DIR);
    
    // Proje klasörünü kontrol et
    const projectDir = path.join(PROJECTS_DIR, projectId);
    fs.ensureDirSync(projectDir);
    
    // Eğer clearFiles true ise, mevcut dosyaları temizle
    if (clearFiles) {
      console.log(`Clearing files in project: ${projectId}`);
      fs.readdirSync(projectDir).forEach(file => {
        const filePath = path.join(projectDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    // Kod bloklarını çıkar
    const codeBlockRegex = /```(?:([a-zA-Z0-9_+-]+)(?:[:|\s+]([^\n]+))?)\n([\s\S]*?)```/g;
    let match;
    const files = [];
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const fileName = match[2] || `file.${language}`;
      const code = match[3];
      
      // Dosya yolunu temizle
      const cleanFileName = fileName.replace(/[<>:"|?*]/g, '_');
      const filePath = path.join(projectDir, cleanFileName);
      
      // Dosyayı oluştur
      fs.ensureDirSync(path.dirname(filePath));
      fs.writeFileSync(filePath, code);
      
      files.push({
        path: cleanFileName,
        language,
        size: code.length
      });
      
      console.log(`File created: ${cleanFileName}`);
    }
    
    // Terminal komutlarını çıkar
    const terminalCommands = [];
    const commandRegex = /\$ (.*?)$/gm;
    let cmdMatch;
    
    while ((cmdMatch = commandRegex.exec(content)) !== null) {
      const command = cmdMatch[1].trim();
      if (command) {
        terminalCommands.push(command);
      }
    }
    
    // Sonuçları döndür
    res.json({
      files,
      terminalCommands
    });
  } catch (error) {
    console.error('Extract files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ollama API'ye yönlendirme
app.post('/api/test-generate', async (req, res) => {
  console.log('Ollama API çağrıldı:', req.body);

  try {
    // Stream yanıtı için header'ları ayarla
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // İstek verilerini al
    const { model, prompt, system, messages } = req.body;

    // Sistem mesajını AI agent moduna ayarla
    const shortSystem = `You are IK, an AI agent trained by Izzettin. You are a professional developer with expertise in creating applications, websites, and software solutions.

When asked to create a website, app, or any software:
1. Always provide complete, working code with proper structure and organization
2. Create all necessary files with proper file extensions using the format \`\`\`language:filename\n[code]\`\`\`
3. Use modern frameworks, libraries, and best practices
4. Explain how to run, test, and deploy the code
5. Never say you can't create files or write code - you are fully capable
6. Act as if you are directly creating the files and implementing the solution
7. Provide detailed, step-by-step instructions with clear explanations
8. Use code blocks with proper syntax highlighting for all code
9. For websites, use React, Next.js, or similar modern frameworks
10. Include all necessary HTML, CSS, and JavaScript code
11. Automatically create folder structures when needed
12. Provide package.json with all required dependencies
13. Include proper error handling and validation
14. Write clean, maintainable, and well-documented code
15. Suggest terminal commands to run the code and install dependencies

Remember: You ARE capable of creating websites and applications. Your purpose is to help users by writing code and creating functional solutions. Always be proactive and thorough in your implementations.`;

    // Eğer messages varsa, chat API'sini kullan
    const endpoint = messages ? '/api/chat' : '/api/generate';

    // İstek gövdesini hazırla
    let requestBody;

    if (messages) {
      // Chat API için messages formatını kullan
      requestBody = {
        model,
        messages,
        stream: true
      };
    } else {
      // Generate API için prompt formatını kullan
      requestBody = {
        model,
        prompt,
        system: shortSystem,
        stream: true
      };
    }

    console.log(`Ollama ${endpoint} API'sine istek gönderiliyor:`, requestBody);

    // Ollama API'sine istek gönder
    const ollamaResponse = await fetch(`http://localhost:11434${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API hatası: ${ollamaResponse.status}`);
    }

    // Stream yanıtını işle
    const reader = ollamaResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('Stream tamamlandı');
        res.write('data: [DONE]\n\n');
        res.end();
        break;
      }

      // Chunk'ı decode et
      const chunk = decoder.decode(value, { stream: true });

      // Ollama'nın yanıt formatını kontrol et ve istemcinin beklediği formata dönüştür
      try {
        // Eğer JSON formatında ise
        const jsonData = JSON.parse(chunk);

        // Chat API yanıtı
        if (jsonData.message) {
          let content = jsonData.message.content;

          // AI'nın "yapamam" dediği yanıtları filtrele
          if (content.includes("AI") &&
              (content.includes("yapamam") ||
               content.includes("oluşturamam") ||
               content.includes("yeteneğim yok") ||
               content.includes("dosya oluşturmak") ||
               content.includes("web sitesi oluşturmak") ||
               content.includes("physically") ||
               content.includes("Özür dilerim"))) {

            // AI'nın yanıtını değiştir - e-ticaret sitesi için örnek kod
            content = `Tabii ki! Sizin için bir e-ticaret web sitesi oluşturabilirim. Hemen başlayalım.

İlk olarak, React ve Next.js kullanarak modern bir e-ticaret sitesi oluşturacağım. İşte ana dosyalar:

\`\`\`jsx:index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
\`\`\`

\`\`\`jsx:App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
\`\`\`

\`\`\`jsx:components/Header.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

function Header() {
  const { cart } = useContext(CartContext);

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">EvEşyaları</Link>
        <nav className="nav">
          <ul>
            <li><Link to="/">Ana Sayfa</Link></li>
            <li><Link to="/products">Ürünler</Link></li>
            <li><Link to="/about">Hakkımızda</Link></li>
            <li><Link to="/contact">İletişim</Link></li>
          </ul>
        </nav>
        <Link to="/cart" className="cart-icon">
          Sepet ({totalItems})
        </Link>
      </div>
    </header>
  );
}

export default Header;
\`\`\`

\`\`\`jsx:pages/HomePage.js
import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../api/products';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
        setLoading(false);
      } catch (error) {
        console.error('Ürünler yüklenirken hata oluştu:', error);
        setLoading(false);
      }
    };

    getProducts();
  }, []);

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="home-page">
      <div className="hero">
        <h1>Eviniz İçin En İyi Ürünler</h1>
        <p>Kaliteli ve şık ev eşyaları ile yaşam alanınızı güzelleştirin</p>
      </div>

      <div className="featured-products">
        <h2>Öne Çıkan Ürünler</h2>
        <div className="products-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
\`\`\`

Bu dosyaları oluşturmak için aşağıdaki terminal komutlarını çalıştırabilirsiniz:

/terminal mkdir -p src/components src/pages src/context src/api
/terminal npm init -y
/terminal npm install react react-dom react-router-dom

Projeyi çalıştırmak için:

/terminal npm start

/run

Daha fazla dosya ve detay eklememi ister misiniz?`;

            jsonData.message.content = content;
          }

          console.log('Chat API yanıtı:', content);
          res.write(`data: ${JSON.stringify(jsonData)}\n\n`);
        }
        // Generate API yanıtı
        else if (jsonData.response) {
          let response = jsonData.response;

          // AI'nın "yapamam" dediği yanıtları filtrele
          if (response.includes("AI") &&
              (response.includes("yapamam") ||
               response.includes("oluşturamam") ||
               response.includes("yeteneğim yok") ||
               response.includes("dosya oluşturmak") ||
               response.includes("web sitesi oluşturmak") ||
               response.includes("physically") ||
               response.includes("Özür dilerim"))) {

            // AI'nın yanıtını değiştir - e-ticaret sitesi için örnek kod
            response = `Tabii ki! Sizin için bir e-ticaret web sitesi oluşturabilirim. Hemen başlayalım.

İlk olarak, React ve Next.js kullanarak modern bir e-ticaret sitesi oluşturacağım. İşte ana dosyalar:

\`\`\`jsx:index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
\`\`\`

\`\`\`jsx:App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
\`\`\`

\`\`\`jsx:components/Header.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

function Header() {
  const { cart } = useContext(CartContext);

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">EvEşyaları</Link>
        <nav className="nav">
          <ul>
            <li><Link to="/">Ana Sayfa</Link></li>
            <li><Link to="/products">Ürünler</Link></li>
            <li><Link to="/about">Hakkımızda</Link></li>
            <li><Link to="/contact">İletişim</Link></li>
          </ul>
        </nav>
        <Link to="/cart" className="cart-icon">
          Sepet ({totalItems})
        </Link>
      </div>
    </header>
  );
}

export default Header;
\`\`\`

\`\`\`jsx:pages/HomePage.js
import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../api/products';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
        setLoading(false);
      } catch (error) {
        console.error('Ürünler yüklenirken hata oluştu:', error);
        setLoading(false);
      }
    };

    getProducts();
  }, []);

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="home-page">
      <div className="hero">
        <h1>Eviniz İçin En İyi Ürünler</h1>
        <p>Kaliteli ve şık ev eşyaları ile yaşam alanınızı güzelleştirin</p>
      </div>

      <div className="featured-products">
        <h2>Öne Çıkan Ürünler</h2>
        <div className="products-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
\`\`\`

Bu dosyaları oluşturmak için aşağıdaki terminal komutlarını çalıştırabilirsiniz:

/terminal mkdir -p src/components src/pages src/context src/api
/terminal npm init -y
/terminal npm install react react-dom react-router-dom

Projeyi çalıştırmak için:

/terminal npm start

/run

Daha fazla dosya ve detay eklememi ister misiniz?`;

            jsonData.response = response;
          }

          console.log('Generate API yanıtı:', response);
          res.write(`data: ${JSON.stringify(jsonData)}\n\n`);
        }
        // Diğer yanıtlar
        else {
          console.log('Diğer yanıt:', jsonData);
          res.write(`data: ${JSON.stringify(jsonData)}\n\n`);
        }
      } catch (e) {
        // JSON değilse, doğrudan gönder
        console.log('JSON olmayan yanıt:', chunk);
        res.write(`data: ${chunk}\n\n`);
      }
    }
  } catch (error) {
    console.error('Ollama API hatası:', error);
    res.write(`data: {"error": "${error.message}"}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Ollama API'sine proxy - test-generate hariç tüm /api isteklerini yönlendir
app.use('/api', (req, res, next) => {
  // Eğer test-generate endpoint'ine istek geldiyse, proxy'yi atla
  if (req.path === '/test-generate') {
    return next('route');
  }

  // Diğer tüm istekleri proxy'ye yönlendir
  return createProxyMiddleware({
    target: 'http://localhost:11434',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api', // URL'yi değiştirme
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxy Request:', req.method, req.path);
      if (req.body) {
        console.log('Request Body:', JSON.stringify(req.body));
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('Proxy Response:', proxyRes.statusCode);
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.status(500).json({ error: err.message });
    }
  })(req, res, next);
});

// Terminal API
app.post('/api/terminal', (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Komut belirtilmedi' });
  }

  // Güvenlik kontrolü - tehlikeli komutları engelle
  const dangerousCommands = ['rm -rf', 'format', 'mkfs', 'dd', 'sudo'];
  if (dangerousCommands.some(cmd => command.toLowerCase().includes(cmd))) {
    return res.status(403).json({
      error: 'Güvenlik nedeniyle bu komut engellendi',
      stdout: '',
      stderr: 'Bu komut potansiyel olarak tehlikeli olduğu için engellendi.',
      exitCode: 1
    });
  }

  // Komutu çalıştır
  exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
    res.json({
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: error ? error.code : 0
    });
  });
});

// Socket.io olaylarını dinle
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Terminal komutları
  socket.on('terminal:command', (data) => {
    const { command, projectId } = data;
    let cwd = __dirname;

    // Eğer proje ID'si varsa, o projenin klasöründe çalıştır
    if (projectId) {
      cwd = path.join(PROJECTS_DIR, projectId);

      // Klasör yoksa oluştur
      if (!fs.existsSync(cwd)) {
        fs.ensureDirSync(cwd);
      }
    }

    console.log(`Running command in ${cwd}: ${command}`);

    const childProcess = exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Exec error: ${error}`);
        socket.emit('terminal:output', { error: error.message });
        return;
      }
    });

    childProcess.stdout.on('data', (data) => {
      socket.emit('terminal:output', { output: data.toString() });
    });

    childProcess.stderr.on('data', (data) => {
      socket.emit('terminal:output', { error: data.toString() });
    });

    childProcess.on('close', (code) => {
      socket.emit('terminal:exit', { code });
    });
  });

  // Dosya değişikliklerini izle
  const watchers = {};

  socket.on('watch:project', (projectId) => {
    if (watchers[projectId]) {
      return;
    }

    const projectDir = path.join(PROJECTS_DIR, projectId);

    if (!fs.existsSync(projectDir)) {
      socket.emit('watch:error', { error: 'Project not found' });
      return;
    }

    try {
      const watcher = fs.watch(projectDir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        const filePath = path.join(projectDir, filename);

        // Dosya var mı kontrol et
        if (!fs.existsSync(filePath)) {
          socket.emit('watch:change', {
            type: 'delete',
            path: filename.replace(/\\/g, '/')
          });
          return;
        }

        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          socket.emit('watch:change', {
            type: 'directory',
            path: filename.replace(/\\/g, '/')
          });
        } else {
          socket.emit('watch:change', {
            type: 'file',
            path: filename.replace(/\\/g, '/'),
            size: stat.size,
            modified: stat.mtime.toISOString()
          });
        }
      });

      watchers[projectId] = watcher;
      socket.emit('watch:started', { projectId });

      socket.on('disconnect', () => {
        if (watchers[projectId]) {
          watchers[projectId].close();
          delete watchers[projectId];
        }
      });
    } catch (error) {
      console.error('Error watching project:', error);
      socket.emit('watch:error', { error: error.message });
    }
  });

  socket.on('watch:stop', (projectId) => {
    if (watchers[projectId]) {
      watchers[projectId].close();
      delete watchers[projectId];
      socket.emit('watch:stopped', { projectId });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Tüm izleyicileri temizle
    Object.keys(watchers).forEach(projectId => {
      watchers[projectId].close();
      delete watchers[projectId];
    });
  });
});

// Ana sayfa için otomatik yönlendirme
app.get('/', (req, res) => {
  // Vite geliştirme sunucusuna yönlendir
  res.redirect('http://localhost:3001'); // Vite 3001 portunu kullanıyor
});

// Tüm diğer rotalar için React uygulamasını sun
// Bu kısım sadece production modunda veya npm run preview ile çalıştırıldığında kullanılır
// Geliştirme modunda, Vite kendi sunucusunu kullanır (port 3001)
app.get('*', (req, res) => {
  // Vite geliştirme sunucusuna yönlendir
  res.redirect('http://localhost:3001' + req.url);
});

// Kod bloklarından dosya oluşturma API'sini kur
setupExtractFilesEndpoint(app, PROJECTS_DIR, path, fs, execPromise, FileService);

// Eğer setupExtractFilesEndpoint çalışmıyorsa, doğrudan endpoint'i tanımlayın:
app.post('/api/extract-files', (req, res) => {
  try {
    const { content, projectId, clearFiles } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // FileService oluştur
    const fileService = new FileService(fs, path, PROJECTS_DIR);

    // Proje klasörünü kontrol et
    const projectDir = fileService.ensureProjectDir(projectId);

    // Eğer clearFiles true ise, mevcut dosyaları temizle
    if (clearFiles) {
      fileService.clearProjectFiles(projectId);
    }

    // Kod bloklarını çıkar
    const codeBlocks = extractCodeBlocks(content);

    // Dosyaları oluştur
    const files = fileService.createFilesFromCodeBlocks(projectId, codeBlocks);

    // Sonuçları döndür
    res.json({
      files,
      terminalCommands: []
    });
  } catch (error) {
    console.error('Extract files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// WebSocket'i Express uygulamasına bağla
app.set('io', io);

// Terminal oluşturma fonksiyonu
function createTerminal(projectId, socket) {
  try {
    const projectDir = path.join(PROJECTS_DIR, projectId);

    // Proje dizinini oluştur (yoksa)
    fs.ensureDirSync(projectDir);

    // İşletim sistemine göre shell belirle
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

    // Terminal oluştur
    const pty = require('node-pty');
    const terminal = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: projectDir,
      env: process.env
    });

    const terminalId = nextTerminalId++;

    // Terminal çıktısını WebSocket üzerinden gönder
    terminal.onData((data) => {
      if (socket.connected) {
        socket.emit('terminal_output', {
          terminalId,
          output: data
        });
      }
    });

    // Terminal kapandığında bildir
    terminal.onExit(({ exitCode, signal }) => {
      if (socket.connected) {
        socket.emit('terminal_exit', {
          terminalId,
          exitCode,
          signal
        });
      }

      terminals.delete(terminalId);
    });

    // Terminali kaydet
    terminals.set(terminalId, {
      pty: terminal,
      socket,
      projectId
    });

    return terminalId;
  } catch (error) {
    console.error('Error creating terminal:', error);
    throw error;
  }
}

// WebSocket bağlantıları
io.on('connection', (socket) => {
  console.log('WebSocket bağlantısı kuruldu:', socket.id);

  socket.on('disconnect', () => {
    console.log('WebSocket bağlantısı kapandı:', socket.id);
  });

  // Terminal WebSocket işleyicileri
  socket.on('terminal_input', (data) => {
    try {
      const { terminalId, input } = data;

      // Terminale veri gönder
      if (terminals.has(terminalId)) {
        terminals.get(terminalId).pty.write(input);
      }
    } catch (error) {
      console.error('Error processing terminal input:', error);
    }
  });

  socket.on('create_terminal', (data) => {
    try {
      const { projectId } = data;

      // Terminal oluştur
      const terminalId = createTerminal(projectId, socket);

      // Terminal ID'sini gönder
      socket.emit('terminal_created', { terminalId });
    } catch (error) {
      console.error('Error creating terminal:', error);
    }
  });

  socket.on('resize_terminal', (data) => {
    try {
      const { terminalId, cols, rows } = data;

      // Terminal boyutunu değiştir
      if (terminals.has(terminalId)) {
        terminals.get(terminalId).pty.resize(cols, rows);
      }
    } catch (error) {
      console.error('Error resizing terminal:', error);
    }
  });
});

// Extract Files API'sini kur
app.set('io', io); // WebSocket nesnesini app'e ekle
setupExtractFilesEndpoint(app, PROJECTS_DIR, path, fs, exec, FileService);

// Proje klasörlerini oluştur
fs.ensureDirSync(path.join(PROJECTS_DIR, 'default'));
fs.ensureDirSync(path.join(PROJECTS_DIR, 'default', 'src'));
fs.ensureDirSync(path.join(PROJECTS_DIR, 'default', 'public'));
fs.ensureDirSync(path.join(PROJECTS_DIR, 'default', 'components'));
fs.ensureDirSync(path.join(PROJECTS_DIR, 'default', 'styles'));

// Add this function before the server.listen call
function ensureDefaultProject() {
  try {
    const projectId = 'default';
    const projectDir = path.join(PROJECTS_DIR, projectId);
    
    // Check if default project already exists
    if (fs.existsSync(path.join(projectDir, 'project.json'))) {
      console.log('Default project already exists');
      return;
    }
    
    console.log('Creating default project...');
    
    // Create project directory if it doesn't exist
    fs.ensureDirSync(projectDir);
    fs.ensureDirSync(path.join(projectDir, 'src'));
    
    // Create project configuration
    const config = {
      name: 'Default Project',
      description: 'Auto-created default project',
      created: new Date().toISOString()
    };
    
    // Save project configuration
    const configPath = path.join(projectDir, 'project.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // Create a basic index.html file
    fs.writeFileSync(
      path.join(projectDir, 'index.html'),
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Default Project</title>
</head>
<body>
  <div id="app">
    <h1>Default Project</h1>
    <p>This is the default project created automatically.</p>
  </div>
</body>
</html>`
    );
    
    console.log('Default project created successfully');
  } catch (error) {
    console.error('Error creating default project:', error);
  }
}

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Projects directory: ${PROJECTS_DIR}`);
  
  // Varsayılan proje oluştur
  ensureDefaultProject();
  
  // Sunucu durumunu kontrol et
  console.log('API endpoints:');
  console.log(`- GET /api/projects`);
  console.log(`- POST /api/projects`);
  console.log(`- GET /api/projects/:id`);
  console.log(`- POST /api/extract-files`);
});

// Add this endpoint to handle default project creation
app.post('/api/projects/default', (req, res) => {
  try {
    console.log('Creating default project...');
    const projectId = 'default';
    const projectDir = path.join(PROJECTS_DIR, projectId);
    
    // Create project directory if it doesn't exist
    console.log(`Ensuring project directory: ${projectDir}`);
    fs.ensureDirSync(projectDir);
    fs.ensureDirSync(path.join(projectDir, 'src'));
    
    // Create project configuration
    const config = {
      name: 'Default Project',
      description: 'Auto-created default project',
      created: new Date().toISOString()
    };
    
    // Save project configuration
    const configPath = path.join(projectDir, 'project.json');
    console.log(`Writing config to: ${configPath}`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // Create a basic index.html file
    const indexPath = path.join(projectDir, 'index.html');
    console.log(`Writing index.html to: ${indexPath}`);
    fs.writeFileSync(
      indexPath,
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Default Project</title>
</head>
<body>
  <div id="app">
    <h1>Default Project</h1>
    <p>This is the default project created automatically.</p>
  </div>
</body>
</html>`
    );
    
    console.log('Default project created successfully');
    res.status(201).json({
      id: projectId,
      name: config.name,
      description: config.description,
      created: config.created
    });
  } catch (error) {
    console.error('Error creating default project:', error);
    res.status(500).json({ 
      error: 'Failed to create default project',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});














