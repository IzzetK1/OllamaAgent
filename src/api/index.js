// API modülleri
import setupRenameEndpoint from './renameEndpoint.js';
import setupTerminalEndpoint from './terminalEndpoint.js';

// API'leri kur
export default function setupAPI(app, PROJECTS_DIR, path, fs, exec) {
  // Dosya yeniden adlandırma API'si
  setupRenameEndpoint(app, PROJECTS_DIR, path, fs);
  
  // Terminal API'si
  setupTerminalEndpoint(app, PROJECTS_DIR, path, fs, exec);
  
  // Diğer API'ler buraya eklenebilir
}
