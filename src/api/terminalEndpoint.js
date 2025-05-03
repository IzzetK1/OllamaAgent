// Gelişmiş Terminal API'si
export default function setupTerminalEndpoint(app, PROJECTS_DIR, path, fs, exec) {
  // Terminal komutu çalıştırma API'si
  app.post('/api/projects/:projectId/run', (req, res) => {
    try {
      const { projectId } = req.params;
      const { command } = req.body;

      const projectDir = path.join(PROJECTS_DIR, projectId);
      
      // Proje klasörü yoksa oluştur
      if (!fs.existsSync(projectDir)) {
        fs.ensureDirSync(projectDir);
        console.log(`Project directory created: ${projectId}`);
      }

      // Komut belirtilmemişse, projeyi otomatik çalıştır
      if (!command) {
        // Proje türünü belirle ve çalıştır
        return runProject(projectDir, res);
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
            stdout: `Directory created/changed: ${dirPath}`,
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

      // Mkdir komutu için özel işlem
      if (command.startsWith('mkdir ')) {
        const dirPath = command.substring(6).trim();
        const fullPath = path.join(projectDir, dirPath);

        try {
          // Klasörü oluştur
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

      // Touch komutu için özel işlem
      if (command.startsWith('touch ')) {
        const filePath = command.substring(6).trim();
        const fullPath = path.join(projectDir, filePath);

        try {
          // Klasörü oluştur (gerekirse)
          fs.ensureDirSync(path.dirname(fullPath));
          
          // Dosyayı oluştur (varsa dokunma)
          if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, '');
          } else {
            // Dosya zaten varsa, son değişiklik zamanını güncelle
            const now = new Date();
            fs.utimesSync(fullPath, now, now);
          }

          return res.json({
            command,
            stdout: `File created/touched: ${filePath}`,
            stderr: '',
            exitCode: 0
          });
        } catch (fileError) {
          console.error(`Error creating file: ${fileError.message}`);
          return res.json({
            command,
            stdout: '',
            stderr: `Error creating file: ${fileError.message}`,
            exitCode: 1
          });
        }
      }

      // Rm komutu için özel işlem
      if (command.startsWith('rm ')) {
        const args = command.substring(3).trim();
        const isRecursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
        
        // Dosya/klasör yolunu al
        let filePath = args;
        if (isRecursive) {
          filePath = args.replace(/-[rf]+\s+/g, '').trim();
        }
        
        const fullPath = path.join(projectDir, filePath);

        try {
          if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
              if (isRecursive) {
                // Klasörü içeriğiyle birlikte sil
                fs.removeSync(fullPath);
              } else {
                // Klasör boş değilse hata ver
                const files = fs.readdirSync(fullPath);
                if (files.length > 0) {
                  return res.json({
                    command,
                    stdout: '',
                    stderr: `Error: ${filePath} is a directory (use -r to remove recursively)`,
                    exitCode: 1
                  });
                }
                
                // Boş klasörü sil
                fs.rmdirSync(fullPath);
              }
            } else {
              // Dosyayı sil
              fs.unlinkSync(fullPath);
            }

            return res.json({
              command,
              stdout: `Removed: ${filePath}`,
              stderr: '',
              exitCode: 0
            });
          } else {
            return res.json({
              command,
              stdout: '',
              stderr: `Error: ${filePath} does not exist`,
              exitCode: 1
            });
          }
        } catch (rmError) {
          console.error(`Error removing file/directory: ${rmError.message}`);
          return res.json({
            command,
            stdout: '',
            stderr: `Error removing file/directory: ${rmError.message}`,
            exitCode: 1
          });
        }
      }

      // Ls komutu için özel işlem
      if (command === 'ls' || command.startsWith('ls ')) {
        let dirPath = '.';
        
        // Dizin yolunu al
        if (command.length > 2) {
          dirPath = command.substring(3).trim();
        }
        
        const fullPath = path.join(projectDir, dirPath);

        try {
          if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
              // Klasör içeriğini listele
              const files = fs.readdirSync(fullPath);
              
              // Dosya/klasör bilgilerini al
              const fileDetails = files.map(file => {
                const fileStat = fs.statSync(path.join(fullPath, file));
                const isDir = fileStat.isDirectory();
                
                return {
                  name: file,
                  isDirectory: isDir,
                  size: fileStat.size,
                  modified: fileStat.mtime.toISOString()
                };
              });
              
              // Klasörleri önce, dosyaları sonra sırala
              fileDetails.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
              });
              
              // Çıktıyı oluştur
              let output = '';
              
              fileDetails.forEach(file => {
                const color = file.isDirectory ? '\x1b[1;34m' : '\x1b[0m';
                const suffix = file.isDirectory ? '/' : '';
                output += `${color}${file.name}${suffix}\x1b[0m  `;
              });
              
              return res.json({
                command,
                stdout: output,
                stderr: '',
                exitCode: 0
              });
            } else {
              // Tek dosya bilgisi
              return res.json({
                command,
                stdout: path.basename(fullPath),
                stderr: '',
                exitCode: 0
              });
            }
          } else {
            return res.json({
              command,
              stdout: '',
              stderr: `ls: cannot access '${dirPath}': No such file or directory`,
              exitCode: 1
            });
          }
        } catch (lsError) {
          console.error(`Error listing directory: ${lsError.message}`);
          return res.json({
            command,
            stdout: '',
            stderr: `Error listing directory: ${lsError.message}`,
            exitCode: 1
          });
        }
      }

      // Cat komutu için özel işlem
      if (command.startsWith('cat ')) {
        const filePath = command.substring(4).trim();
        const fullPath = path.join(projectDir, filePath);

        try {
          if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
              return res.json({
                command,
                stdout: '',
                stderr: `cat: ${filePath}: Is a directory`,
                exitCode: 1
              });
            } else {
              // Dosya içeriğini oku
              const content = fs.readFileSync(fullPath, 'utf8');
              
              return res.json({
                command,
                stdout: content,
                stderr: '',
                exitCode: 0
              });
            }
          } else {
            return res.json({
              command,
              stdout: '',
              stderr: `cat: ${filePath}: No such file or directory`,
              exitCode: 1
            });
          }
        } catch (catError) {
          console.error(`Error reading file: ${catError.message}`);
          return res.json({
            command,
            stdout: '',
            stderr: `Error reading file: ${catError.message}`,
            exitCode: 1
          });
        }
      }

      // Echo komutu için özel işlem
      if (command.startsWith('echo ')) {
        const parts = command.substring(5).trim().split('>');
        const text = parts[0].trim();
        
        // Çıktıyı dosyaya yönlendirme
        if (parts.length > 1) {
          const filePath = parts[1].trim();
          const fullPath = path.join(projectDir, filePath);
          const append = command.includes('>>');
          
          try {
            // Klasörü oluştur (gerekirse)
            fs.ensureDirSync(path.dirname(fullPath));
            
            // Dosyaya yaz
            if (append) {
              fs.appendFileSync(fullPath, text + '\n');
            } else {
              fs.writeFileSync(fullPath, text + '\n');
            }
            
            return res.json({
              command,
              stdout: '',
              stderr: '',
              exitCode: 0
            });
          } catch (echoError) {
            console.error(`Error writing to file: ${echoError.message}`);
            return res.json({
              command,
              stdout: '',
              stderr: `Error writing to file: ${echoError.message}`,
              exitCode: 1
            });
          }
        } else {
          // Sadece ekrana yazdır
          return res.json({
            command,
            stdout: text,
            stderr: '',
            exitCode: 0
          });
        }
      }

      // Diğer komutları çalıştır
      exec(command, { cwd: projectDir, timeout: 30000 }, (error, stdout, stderr) => {
        res.json({
          command,
          stdout: stdout || '',
          stderr: error ? `${error.message}\n${stderr}` : stderr || '',
          exitCode: error ? error.code : 0
        });
      });
    } catch (error) {
      console.error('Error executing command:', error);
      res.status(500).json({ error: 'Failed to execute command' });
    }
  });

  // Projeyi çalıştır
  function runProject(projectDir, res) {
    try {
      // Proje türünü belirle
      const hasPackageJson = fs.existsSync(path.join(projectDir, 'package.json'));
      const hasPythonFile = fs.existsSync(path.join(projectDir, 'main.py')) || 
                            fs.existsSync(path.join(projectDir, 'app.py'));
      const hasIndexHtml = fs.existsSync(path.join(projectDir, 'index.html'));
      
      let runCommand = '';
      
      if (hasPackageJson) {
        // Node.js projesi
        const packageJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'));
        
        if (packageJson.scripts && packageJson.scripts.start) {
          runCommand = 'npm start';
        } else if (packageJson.main) {
          runCommand = `node ${packageJson.main}`;
        } else {
          runCommand = 'node index.js';
        }
      } else if (hasPythonFile) {
        // Python projesi
        if (fs.existsSync(path.join(projectDir, 'main.py'))) {
          runCommand = 'python main.py';
        } else {
          runCommand = 'python app.py';
        }
      } else if (hasIndexHtml) {
        // HTML projesi - tarayıcıda açılacak
        return res.json({
          command: 'open index.html',
          stdout: 'Opening index.html in browser...',
          stderr: '',
          success: true,
          exitCode: 0,
          openInBrowser: true,
          url: `/projects/${path.basename(projectDir)}/index.html`
        });
      } else {
        // Proje türü belirlenemedi
        return res.json({
          command: '',
          stdout: '',
          stderr: 'Could not determine project type. No package.json, main.py, or index.html found.',
          success: false,
          exitCode: 1
        });
      }
      
      // Komutu çalıştır
      exec(runCommand, { cwd: projectDir, timeout: 30000 }, (error, stdout, stderr) => {
        res.json({
          command: runCommand,
          stdout: stdout || '',
          stderr: error ? `${error.message}\n${stderr}` : stderr || '',
          success: !error,
          exitCode: error ? error.code : 0
        });
      });
    } catch (error) {
      console.error('Error running project:', error);
      res.status(500).json({ error: 'Failed to run project' });
    }
  }
}
