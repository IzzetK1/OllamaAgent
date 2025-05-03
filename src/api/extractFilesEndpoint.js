/**
 * Extract Files Endpoint
 *
 * Bu modül, AI yanıtlarından kod bloklarını çıkarmak ve dosya oluşturmak için kullanılır.
 */

import { extractCodeBlocks, extractTerminalCommands } from '../utils/codeParser.js';

export default function setupExtractFilesEndpoint(app, PROJECTS_DIR, path, fs, exec, FileService) {
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
      const projectDir = fileService.ensureProjectDir(projectId);

      // Eğer clearFiles true ise, mevcut dosyaları temizle
      if (clearFiles) {
        console.log(`Clearing files in project: ${projectId}`);
        fileService.clearProjectFiles(projectId);
      }

      // Kod bloklarını çıkar
      const codeBlocks = extractCodeBlocks(content);

      // Terminal komutlarını çıkar
      const terminalCommands = extractTerminalCommands(content);

      // Özel komutları işle
      const shouldRunProject = /\/run\b/g.test(content);

      // WebSocket bağlantısı
      const io = req.app.get('io');

      // Önce klasörleri oluştur
      if (clearFiles) {
        // Temel klasörleri oluştur
        fileService.createFolder(projectId, 'src');
        fileService.createFolder(projectId, 'public');
        fileService.createFolder(projectId, 'components');
        fileService.createFolder(projectId, 'styles');
      }

      // Dosyaları oluştur
      const files = fileService.createFilesFromCodeBlocks(projectId, codeBlocks);

      // Geçersiz dosyaları temizle
      fileService.cleanInvalidFiles(projectId);

      // WebSocket ile dosya oluşturma bilgisini gönder
      if (io) {
        files.forEach(file => {
          io.emit('file_created', {
            type: 'file_created',
            projectId,
            file
          });
        });
      }

      // Sonuçları döndür
      res.json({
        files,
        commands: [],
        shouldRunProject
      });
    } catch (error) {
      console.error('Extract files error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

