/**
 * Terminal Module - Gelişmiş Terminal Modülü
 * 
 * Bu modül, terminal emülasyonunu ve komut çalıştırma işlevlerini yönetir.
 * - Terminal başlatma ve yapılandırma
 * - Komut çalıştırma
 * - Çıktı işleme
 * - Proje çalıştırma
 */

// Terminal durumu
let terminal = null;
let fitAddon = null;
let webLinksAddon = null;
let searchAddon = null;
let commandHistory = [];
let historyIndex = -1;
let currentProcess = null;

/**
 * Terminal modülünü başlat
 */
export function initializeTerminal() {
  // XTerm.js kütüphanesini kontrol et
  if (!window.Terminal) {
    console.error('XTerm.js kütüphanesi yüklenemedi');
    return;
  }
  
  // Terminal konteynerini al
  const terminalContainer = document.getElementById('terminal-container');
  if (!terminalContainer) return;
  
  // Terminal eklentilerini oluştur
  fitAddon = new window.FitAddon.FitAddon();
  webLinksAddon = new window.WebLinksAddon.WebLinksAddon();
  
  // Terminal'i oluştur
  terminal = new window.Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
    theme: {
      background: '#1e1e1e',
      foreground: '#f0f0f0',
      cursor: '#f0f0f0',
      selection: 'rgba(255, 255, 255, 0.3)',
      black: '#000000',
      red: '#e06c75',
      green: '#98c379',
      yellow: '#e5c07b',
      blue: '#61afef',
      magenta: '#c678dd',
      cyan: '#56b6c2',
      white: '#dcdfe4'
    }
  });
  
  // Eklentileri yükle
  terminal.loadAddon(fitAddon);
  terminal.loadAddon(webLinksAddon);
  
  // Terminal'i aç
  terminal.open(terminalContainer);
  fitAddon.fit();
  
  // Terminal hazır mesajı
  terminal.writeln('\x1b[1;32mTerminal hazır.\x1b[0m');
  terminal.writeln('Komut çalıştırmak için yazın ve Enter tuşuna basın.');
  terminal.writeln('');
  terminal.write('$ ');
  
  // Terminal olaylarını bağla
  bindTerminalEvents();
  
  // Pencere boyutu değiştiğinde terminal boyutunu ayarla
  window.addEventListener('resize', () => {
    if (fitAddon) fitAddon.fit();
  });
  
  console.log('Terminal modülü başlatıldı');
}

/**
 * Terminal olaylarını bağla
 */
function bindTerminalEvents() {
  if (!terminal) return;
  
  // Klavye girişi
  terminal.onKey(({ key, domEvent }) => {
    const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
    
    // Enter tuşu
    if (domEvent.keyCode === 13) {
      // Mevcut satırı al
      const currentLine = terminal.buffer.active.getLine(terminal.buffer.active.cursorY);
      let lineText = '';
      
      for (let i = 2; i < currentLine.length; i++) {
        lineText += currentLine.getCell(i).getChars();
      }
      
      // Komutu çalıştır
      terminal.writeln('');
      executeCommand(lineText);
      
      // Komut geçmişine ekle
      if (lineText.trim()) {
        commandHistory.push(lineText);
        historyIndex = commandHistory.length;
      }
      
      // Yeni prompt
      terminal.write('$ ');
    }
    // Yukarı ok tuşu (komut geçmişi)
    else if (domEvent.keyCode === 38) {
      if (historyIndex > 0) {
        historyIndex--;
        clearCurrentLine();
        terminal.write(commandHistory[historyIndex]);
      }
    }
    // Aşağı ok tuşu (komut geçmişi)
    else if (domEvent.keyCode === 40) {
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        clearCurrentLine();
        terminal.write(commandHistory[historyIndex]);
      } else {
        historyIndex = commandHistory.length;
        clearCurrentLine();
      }
    }
    // Backspace tuşu
    else if (domEvent.keyCode === 8) {
      // Prompt'tan sonraki karakterleri sil
      if (terminal.buffer.active.cursorX > 2) {
        terminal.write('\b \b');
      }
    }
    // Tab tuşu (otomatik tamamlama)
    else if (domEvent.keyCode === 9) {
      domEvent.preventDefault();
      // Basit otomatik tamamlama
      const currentLine = terminal.buffer.active.getLine(terminal.buffer.active.cursorY);
      let lineText = '';
      
      for (let i = 2; i < currentLine.length; i++) {
        lineText += currentLine.getCell(i).getChars();
      }
      
      // Yaygın komutlar
      const commands = ['npm', 'node', 'git', 'python', 'pip', 'ls', 'cd', 'mkdir', 'touch', 'rm', 'cp', 'mv'];
      
      // Eşleşen komutları bul
      const matchingCommands = commands.filter(cmd => cmd.startsWith(lineText));
      
      if (matchingCommands.length === 1) {
        clearCurrentLine();
        terminal.write(matchingCommands[0]);
      } else if (matchingCommands.length > 1) {
        terminal.writeln('');
        terminal.writeln(matchingCommands.join('  '));
        terminal.write('$ ' + lineText);
      }
    }
    // Yazdırılabilir karakterler
    else if (printable) {
      terminal.write(key);
    }
  });
}

/**
 * Mevcut satırı temizle
 */
function clearCurrentLine() {
  terminal.write('\x1b[2K\r$ ');
}

/**
 * Komutu çalıştır
 * @param {string} command - Çalıştırılacak komut
 */
export function executeCommand(command) {
  if (!terminal) return;
  
  // Boş komut
  if (!command.trim()) return;
  
  // Özel komutlar
  if (command === 'clear' || command === 'cls') {
    terminal.clear();
    return;
  }
  
  // Yardım komutu
  if (command === 'help') {
    showHelpMessage();
    return;
  }
  
  // Proje çalıştırma komutu
  if (command === 'run' || command === 'start') {
    runProject();
    return;
  }
  
  // Paket yükleme komutu
  if (command.startsWith('npm install') || command.startsWith('npm i')) {
    installPackages(command.replace(/^npm (install|i)/, '').trim());
    return;
  }
  
  // Diğer komutlar için simülasyon
  simulateCommand(command);
}

/**
 * Yardım mesajını göster
 */
function showHelpMessage() {
  terminal.writeln('\x1b[1;33mKullanılabilir Komutlar:\x1b[0m');
  terminal.writeln('  clear, cls       Terminal ekranını temizle');
  terminal.writeln('  help             Bu yardım mesajını göster');
  terminal.writeln('  run, start       Projeyi çalıştır');
  terminal.writeln('  npm install      Paket yükle');
  terminal.writeln('  npm start        Projeyi başlat');
  terminal.writeln('  npm test         Testleri çalıştır');
  terminal.writeln('  npm run build    Projeyi derle');
  terminal.writeln('  node <dosya>     Node.js ile dosya çalıştır');
  terminal.writeln('  python <dosya>   Python ile dosya çalıştır');
  terminal.writeln('');
}

/**
 * Komutu simüle et
 * @param {string} command - Simüle edilecek komut
 */
function simulateCommand(command) {
  // Node.js komutu
  if (command.startsWith('node ')) {
    const fileName = command.replace('node ', '').trim();
    simulateNodeCommand(fileName);
    return;
  }
  
  // Python komutu
  if (command.startsWith('python ') || command.startsWith('py ')) {
    const fileName = command.replace(/^(python|py) /, '').trim();
    simulatePythonCommand(fileName);
    return;
  }
  
  // npm komutu
  if (command.startsWith('npm ')) {
    simulateNpmCommand(command);
    return;
  }
  
  // Bilinmeyen komut
  terminal.writeln(`\x1b[1;31mHata: '${command}' komutu bulunamadı veya desteklenmiyor.\x1b[0m`);
  terminal.writeln('Kullanılabilir komutları görmek için "help" yazın.');
}

/**
 * Node.js komutunu simüle et
 * @param {string} fileName - Çalıştırılacak dosya
 */
function simulateNodeCommand(fileName) {
  terminal.writeln(`\x1b[1;34mNode.js ile ${fileName} çalıştırılıyor...\x1b[0m`);
  
  // Dosya var mı kontrol et
  if (!window.files || !window.files[fileName]) {
    terminal.writeln(`\x1b[1;31mHata: ${fileName} dosyası bulunamadı.\x1b[0m`);
    return;
  }
  
  // JavaScript dosyası mı kontrol et
  if (!fileName.endsWith('.js')) {
    terminal.writeln(`\x1b[1;31mHata: ${fileName} bir JavaScript dosyası değil.\x1b[0m`);
    return;
  }
  
  // Dosya içeriğini al
  const fileContent = window.files[fileName];
  
  // Basit JavaScript çalıştırma simülasyonu
  try {
    // console.log çıktılarını yakalamak için geçici olarak console.log'u değiştir
    const originalConsoleLog = console.log;
    console.log = function() {
      const args = Array.from(arguments);
      terminal.writeln(args.join(' '));
    };
    
    // Dosyayı çalıştır (güvenli bir şekilde eval kullanımı)
    const scriptFunction = new Function(fileContent);
    scriptFunction();
    
    // console.log'u geri yükle
    console.log = originalConsoleLog;
    
    terminal.writeln('\x1b[1;32mProgram başarıyla çalıştırıldı.\x1b[0m');
  } catch (error) {
    terminal.writeln(`\x1b[1;31mHata: ${error.message}\x1b[0m`);
  }
}

/**
 * Python komutunu simüle et
 * @param {string} fileName - Çalıştırılacak dosya
 */
function simulatePythonCommand(fileName) {
  terminal.writeln(`\x1b[1;34mPython ile ${fileName} çalıştırılıyor...\x1b[0m`);
  
  // Dosya var mı kontrol et
  if (!window.files || !window.files[fileName]) {
    terminal.writeln(`\x1b[1;31mHata: ${fileName} dosyası bulunamadı.\x1b[0m`);
    return;
  }
  
  // Python dosyası mı kontrol et
  if (!fileName.endsWith('.py')) {
    terminal.writeln(`\x1b[1;31mHata: ${fileName} bir Python dosyası değil.\x1b[0m`);
    return;
  }
  
  // Python çalıştırma simülasyonu
  terminal.writeln('\x1b[1;33mUyarı: Python çalıştırma simüle edildi. Gerçek bir Python ortamı yok.\x1b[0m');
  terminal.writeln('\x1b[1;32mProgram başarıyla çalıştırıldı (simülasyon).\x1b[0m');
}

/**
 * npm komutunu simüle et
 * @param {string} command - npm komutu
 */
function simulateNpmCommand(command) {
  if (command === 'npm start') {
    terminal.writeln('\x1b[1;34mnpm start komutu çalıştırılıyor...\x1b[0m');
    terminal.writeln('> ollama-web-ui@1.0.0 start');
    terminal.writeln('> node server.js');
    terminal.writeln('');
    terminal.writeln('Server running at http://localhost:3003');
    terminal.writeln('Ollama API endpoint: http://localhost:11434');
    terminal.writeln('\x1b[1;32mUygulama başlatıldı. Tarayıcıda görüntülemek için önizleme sekmesine geçin.\x1b[0m');
    
    // Önizleme sekmesini güncelle
    updatePreview('http://localhost:3003');
  } else if (command === 'npm test') {
    terminal.writeln('\x1b[1;34mnpm test komutu çalıştırılıyor...\x1b[0m');
    terminal.writeln('> ollama-web-ui@1.0.0 test');
    terminal.writeln('> echo "Error: no test specified" && exit 1');
    terminal.writeln('');
    terminal.writeln('Error: no test specified');
  } else if (command === 'npm run build') {
    terminal.writeln('\x1b[1;34mnpm run build komutu çalıştırılıyor...\x1b[0m');
    terminal.writeln('> ollama-web-ui@1.0.0 build');
    terminal.writeln('> webpack --mode production');
    terminal.writeln('');
    terminal.writeln('asset main.bundle.js 1.2 MiB [emitted] (name: main)');
    terminal.writeln('asset editor.bundle.js 856 KiB [emitted] (name: editor)');
    terminal.writeln('asset terminal.bundle.js 245 KiB [emitted] (name: terminal)');
    terminal.writeln('asset fileManager.bundle.js 156 KiB [emitted] (name: fileManager)');
    terminal.writeln('asset chat.bundle.js 345 KiB [emitted] (name: chat)');
    terminal.writeln('runtime modules 1.25 KiB 6 modules');
    terminal.writeln('modules by path ./src/ 2.5 MiB');
    terminal.writeln('modules by path ./node_modules/ 500 KiB');
    terminal.writeln('\x1b[1;32mDerleme başarıyla tamamlandı.\x1b[0m');
  } else {
    terminal.writeln(`\x1b[1;33mUyarı: '${command}' komutu simüle edildi.\x1b[0m`);
  }
}

/**
 * Paketleri yükle
 * @param {string} packages - Yüklenecek paketler
 */
function installPackages(packages) {
  terminal.writeln(`\x1b[1;34mnpm install ${packages} komutu çalıştırılıyor...\x1b[0m`);
  
  // Paket yükleme simülasyonu
  const packageList = packages.split(' ').filter(Boolean);
  
  if (packageList.length === 0) {
    terminal.writeln('> ollama-web-ui@1.0.0 install');
    terminal.writeln('> npm install');
    terminal.writeln('');
    terminal.writeln('added 120 packages, and audited 121 packages in 3s');
    terminal.writeln('');
    terminal.writeln('15 packages are looking for funding');
    terminal.writeln('  run `npm fund` for details');
    terminal.writeln('');
    terminal.writeln('found 0 vulnerabilities');
  } else {
    terminal.writeln(`> ollama-web-ui@1.0.0 install`);
    terminal.writeln(`> npm install ${packages}`);
    terminal.writeln('');
    
    packageList.forEach(pkg => {
      const version = '1.0.0';
      terminal.writeln(`+ ${pkg}@${version}`);
    });
    
    terminal.writeln('');
    terminal.writeln(`added ${packageList.length} packages, and audited ${packageList.length + 100} packages in 2s`);
    terminal.writeln('');
    terminal.writeln('10 packages are looking for funding');
    terminal.writeln('  run `npm fund` for details');
    terminal.writeln('');
    terminal.writeln('found 0 vulnerabilities');
  }
  
  terminal.writeln('\x1b[1;32mPaketler başarıyla yüklendi (simülasyon).\x1b[0m');
}

/**
 * Projeyi çalıştır
 */
export function runProject() {
  // Proje türünü belirle
  const projectType = detectProjectType();
  
  switch (projectType) {
    case 'web':
      runWebProject();
      break;
    case 'node':
      runNodeProject();
      break;
    case 'python':
      runPythonProject();
      break;
    default:
      terminal.writeln('\x1b[1;31mHata: Proje türü belirlenemedi.\x1b[0m');
      terminal.writeln('Desteklenen proje türleri: web, node, python');
  }
}

/**
 * Proje türünü belirle
 * @returns {string} - Proje türü (web, node, python)
 */
function detectProjectType() {
  // Dosya listesini kontrol et
  if (!window.files) return 'unknown';
  
  // HTML dosyası varsa web projesi
  if (Object.keys(window.files).some(file => file.endsWith('.html'))) {
    return 'web';
  }
  
  // package.json varsa Node.js projesi
  if (window.files['package.json']) {
    return 'node';
  }
  
  // Python dosyası varsa Python projesi
  if (Object.keys(window.files).some(file => file.endsWith('.py'))) {
    return 'python';
  }
  
  // Varsayılan olarak web projesi
  return 'web';
}

/**
 * Web projesini çalıştır
 */
function runWebProject() {
  terminal.writeln('\x1b[1;34mWeb projesi çalıştırılıyor...\x1b[0m');
  
  // index.html dosyasını kontrol et
  if (!window.files || !window.files['index.html']) {
    terminal.writeln('\x1b[1;31mHata: index.html dosyası bulunamadı.\x1b[0m');
    return;
  }
  
  // Yerel sunucu simülasyonu
  terminal.writeln('Yerel sunucu başlatılıyor...');
  terminal.writeln('Server running at http://localhost:3003');
  terminal.writeln('\x1b[1;32mUygulama başlatıldı. Tarayıcıda görüntülemek için önizleme sekmesine geçin.\x1b[0m');
  
  // Önizleme sekmesini güncelle
  updatePreview('http://localhost:3003');
}

/**
 * Node.js projesini çalıştır
 */
function runNodeProject() {
  terminal.writeln('\x1b[1;34mNode.js projesi çalıştırılıyor...\x1b[0m');
  
  // Ana dosyayı belirle
  let mainFile = 'index.js';
  
  if (window.files['package.json']) {
    try {
      const packageJson = JSON.parse(window.files['package.json']);
      if (packageJson.main) {
        mainFile = packageJson.main;
      }
    } catch (error) {
      terminal.writeln('\x1b[1;33mUyarı: package.json dosyası ayrıştırılamadı.\x1b[0m');
    }
  }
  
  // Ana dosyayı kontrol et
  if (!window.files[mainFile]) {
    terminal.writeln(`\x1b[1;31mHata: ${mainFile} dosyası bulunamadı.\x1b[0m`);
    return;
  }
  
  // Node.js uygulamasını çalıştır
  simulateNodeCommand(mainFile);
}

/**
 * Python projesini çalıştır
 */
function runPythonProject() {
  terminal.writeln('\x1b[1;34mPython projesi çalıştırılıyor...\x1b[0m');
  
  // Ana dosyayı belirle
  let mainFile = 'main.py';
  
  if (!window.files[mainFile]) {
    // Alternatif dosyaları kontrol et
    const pythonFiles = Object.keys(window.files).filter(file => file.endsWith('.py'));
    
    if (pythonFiles.length > 0) {
      mainFile = pythonFiles[0];
    } else {
      terminal.writeln('\x1b[1;31mHata: Python dosyası bulunamadı.\x1b[0m');
      return;
    }
  }
  
  // Python uygulamasını çalıştır
  simulatePythonCommand(mainFile);
}

/**
 * Önizleme sekmesini güncelle
 * @param {string} url - Önizleme URL'si
 */
function updatePreview(url) {
  const previewContainer = document.getElementById('preview-container');
  if (!previewContainer) return;
  
  // iframe oluştur
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  // Mevcut içeriği temizle
  previewContainer.innerHTML = '';
  previewContainer.appendChild(iframe);
  
  // Önizleme sekmesine geç
  showEditorTab('preview');
}

/**
 * Terminal'i temizle
 */
export function clearTerminal() {
  if (terminal) {
    terminal.clear();
    terminal.write('$ ');
  }
}

/**
 * Editör sekmesini göster
 * @param {string} tabId - Sekme ID'si
 */
function showEditorTab(tabId) {
  // Sekme butonlarını güncelle
  document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.getAttribute('onclick').includes(tabId)) {
      tab.classList.add('active');
    }
  });
  
  // Sekme içeriklerini güncelle
  document.querySelectorAll('.editor-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  document.getElementById(`${tabId}-tab`).classList.add('active');
}
