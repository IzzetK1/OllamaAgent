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

      // Terminal komutlarını çalıştır
      const commandResults = [];

      if (terminalCommands.length > 0) {
        console.log('Terminal komutları çalıştırılıyor:', terminalCommands);

        // Komutları sırayla çalıştır
        for (let command of terminalCommands) {
          try {
            // Komuttaki yeni satır karakterlerini temizle
            command = command.replace(/\r?\n/g, ' ');

            // CD komutları için özel işlem
            if (command.startsWith('cd ')) {
              const dirPath = command.substring(3).trim();
              // Klasör yolunu oluştur
              const fullDirPath = path.join(projectDir, dirPath);

              // Klasör yoksa oluştur
              if (!fs.existsSync(fullDirPath)) {
                try {
                  fs.ensureDirSync(fullDirPath);
                  console.log(`Klasör oluşturuldu: ${dirPath}`);

                  commandResults.push({
                    command,
                    stdout: `Klasör oluşturuldu: ${dirPath}`,
                    stderr: '',
                    exitCode: 0
                  });
                } catch (mkdirError) {
                  console.error(`Klasör oluşturma hatası: ${mkdirError.message}`);

                  commandResults.push({
                    command,
                    stdout: '',
                    stderr: `Klasör oluşturma hatası: ${mkdirError.message}`,
                    exitCode: 1
                  });
                }
              } else {
                commandResults.push({
                  command,
                  stdout: `Dizin değiştirildi (simülasyon): ${dirPath}`,
                  stderr: '',
                  exitCode: 0
                });
              }
            } else {
              // Diğer komutları normal çalıştır
              console.log(`Komut çalıştırılıyor: ${command}`);

              try {
                const { stdout, stderr } = exec(command, { cwd: projectDir, timeout: 30000 });

                commandResults.push({
                  command,
                  stdout: stdout || '',
                  stderr: stderr || '',
                  exitCode: 0
                });
              } catch (execError) {
                console.error(`Komut çalıştırma hatası (${command}): ${execError.message}`);

                commandResults.push({
                  command,
                  stdout: '',
                  stderr: execError.message,
                  exitCode: 1
                });
              }
            }
          } catch (error) {
            console.error(`Komut çalıştırma hatası (${command}):`, error);

            commandResults.push({
              command,
              stdout: '',
              stderr: error.message,
              exitCode: 1
            });
          }
        }
      }

      // Sonuçları döndür
      res.json({
        files,
        commands: commandResults,
        shouldRunProject
      });
    } catch (error) {
      console.error('Error extracting files:', error);
      res.status(500).json({ error: 'Failed to extract files' });
    }
  });
}
