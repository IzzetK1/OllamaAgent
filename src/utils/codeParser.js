/**
 * Code Parser Utility
 *
 * Bu modül, AI yanıtlarından kod bloklarını çıkarmak ve dosya oluşturmak için kullanılır.
 */

/**
 * Kod bloklarını çıkarır
 * @param {string} content - İçerik
 * @returns {Array} - Kod blokları
 */
export function extractCodeBlocks(content) {
  const codeBlocks = [];
  const codeBlockRegex = /```(?:([a-zA-Z0-9_+-]+)(?:[:|\s+]([^\n]+))?)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text';
    let fileName = match[2] || '';
    const code = match[3];

    // Terminal komutu kontrolü
    if (isCommandLanguage(language) || isCommandContent(code)) {
      console.log('Terminal komutu algılandı, kod bloğu işlenmeyecek:', code.trim().substring(0, 50) + '...');
      continue;
    }

    // Dosya adı belirtilmemişse, dile göre varsayılan dosya adı belirle
    if (!fileName || fileName.trim() === '') {
      fileName = getDefaultFileName(language);
    }

    // Geçersiz dosya adı kontrolü
    if (isInvalidFileName(fileName)) {
      console.log('Geçersiz dosya adı algılandı, kod bloğu işlenmeyecek:', fileName);
      continue;
    }

    // Dosya adında { karakteri varsa, geçersiz kabul et
    if (fileName === '{' || fileName.includes('{')) {
      console.log('Geçersiz dosya adı algılandı (süslü parantez içeriyor):', fileName);
      continue;
    }

    // Dosya içeriği kontrolü
    if (isInvalidContent(code)) {
      console.log('Geçersiz içerik algılandı, kod bloğu işlenmeyecek:', code.trim().substring(0, 50) + '...');
      continue;
    }

    codeBlocks.push({
      language,
      fileName,
      code
    });
  }

  return codeBlocks;
}

/**
 * Dosya adını temizler
 * @param {string} fileName - Dosya adı
 * @param {string} language - Programlama dili
 * @returns {string} - Temizlenmiş dosya adı
 */
export function cleanFileName(fileName, language) {
  if (!fileName) {
    // Dosya adı yoksa, dil uzantısına göre otomatik bir dosya adı oluştur
    return getDefaultFileName(language);
  }

  // Başta ve sondaki boşlukları temizle
  fileName = fileName.trim();

  // Tırnak işaretlerini temizle
  fileName = fileName.replace(/^['"](.*)['"]$/, '$1');

  // CSS yorum satırlarını temizle
  fileName = fileName.replace(/\/\*|\*\//g, '');

  // Dosya adındaki // işaretlerini kaldır
  fileName = fileName.replace(/^\/\/\s*/, '');

  // Dosya adındaki geçersiz karakterleri temizle
  fileName = fileName.replace(/[<>:"|?*\\]/g, '');

  // Dosya adındaki tüm boşlukları kaldır
  fileName = fileName.replace(/\s+/g, '');

  // Başta ve sondaki boşlukları tekrar kontrol et (diğer temizlemelerden sonra)
  fileName = fileName.trim();

  // Dosya adında nokta varsa, sadece son noktaya kadar olan kısmı al ve uzantıyı koru
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex > 0) {
    const extension = fileName.substring(lastDotIndex);
    const baseName = fileName.substring(0, lastDotIndex);

    // Dosya adındaki nokta dışındaki özel karakterleri temizle
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '');

    fileName = cleanBaseName + extension;
  } else {
    // Uzantı yoksa ve dil belirtilmişse, dile göre uzantı ekle
    if (language) {
      const ext = getFileExtension(language);
      if (ext) {
        // Dosya adındaki özel karakterleri temizle
        const cleanName = fileName.replace(/[^a-zA-Z0-9_-]/g, '');
        fileName = cleanName + ext;
      }
    } else {
      // Dil belirtilmemişse, sadece özel karakterleri temizle
      fileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '');
    }
  }

  return fileName;
}

/**
 * Terminal komutu olup olmadığını kontrol eder
 * @param {string} text - Kontrol edilecek metin
 * @returns {boolean} - Terminal komutu ise true, değilse false
 */
export function isTerminalCommand(text) {
  if (!text) return false;

  const trimmedText = text.trim();
  return trimmedText.startsWith('cd ') ||
         trimmedText.startsWith('npm ') ||
         trimmedText.startsWith('node ') ||
         trimmedText.startsWith('python ') ||
         trimmedText.startsWith('git ');
}

/**
 * Dil adına göre varsayılan dosya adı döndürür
 * @param {string} language - Programlama dili
 * @returns {string} - Varsayılan dosya adı
 */
function getDefaultFileName(language) {
  const defaultFileNames = {
    'js': 'index.js',
    'jsx': 'App.jsx',
    'ts': 'index.ts',
    'tsx': 'App.tsx',
    'html': 'index.html',
    'css': 'styles.css',
    'json': 'data.json',
    'py': 'main.py',
    'java': 'Main.java',
    'c': 'main.c',
    'cpp': 'main.cpp',
    'go': 'main.go',
    'rb': 'main.rb',
    'php': 'index.php',
    'sh': 'script.sh',
    'bash': 'script.sh',
    'md': 'README.md',
    'sql': 'query.sql',
    'yaml': 'config.yaml',
    'yml': 'config.yml',
    'xml': 'data.xml',
    'dockerfile': 'Dockerfile',
    'docker': 'Dockerfile',
    'javascript': 'index.js',
    'typescript': 'index.ts',
    'python': 'main.py',
    'ruby': 'main.rb',
    'golang': 'main.go',
    'csharp': 'Program.cs',
    'cs': 'Program.cs',
    'rust': 'main.rs',
    'rs': 'main.rs'
  };

  return defaultFileNames[language.toLowerCase()] || `file.${language}`;
}

/**
 * Dil adına göre dosya uzantısı döndürür
 * @param {string} language - Programlama dili
 * @returns {string} - Dosya uzantısı
 */
export function getFileExtension(language) {
  if (!language) return '';

  const extensions = {
    'js': '.js',
    'jsx': '.jsx',
    'ts': '.ts',
    'tsx': '.tsx',
    'html': '.html',
    'css': '.css',
    'json': '.json',
    'py': '.py',
    'java': '.java',
    'c': '.c',
    'cpp': '.cpp',
    'go': '.go',
    'rb': '.rb',
    'php': '.php',
    'sh': '.sh',
    'bash': '.sh',
    'md': '.md',
    'sql': '.sql',
    'yaml': '.yaml',
    'yml': '.yml',
    'xml': '.xml',
    'javascript': '.js',
    'typescript': '.ts',
    'python': '.py',
    'ruby': '.rb',
    'golang': '.go',
    'csharp': '.cs',
    'cs': '.cs',
    'rust': '.rs',
    'rs': '.rs'
  };

  return extensions[language.toLowerCase()] || '';
}

/**
 * Dosya uzantısından dil adı döndürür
 * @param {string} extension - Dosya uzantısı
 * @returns {string} - Programlama dili
 */
export function getLanguageFromExtension(extension) {
  if (!extension) return '';

  // Uzantıdaki noktayı kaldır
  const ext = extension.startsWith('.') ? extension.substring(1) : extension;

  const languages = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'go': 'go',
    'rb': 'ruby',
    'php': 'php',
    'sh': 'bash',
    'md': 'markdown',
    'sql': 'sql',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'cs': 'csharp',
    'rs': 'rust'
  };

  return languages[ext.toLowerCase()] || ext.toLowerCase();
}

/**
 * Terminal komutlarını çıkarır
 * @param {string} content - İçerik
 * @returns {Array} - Terminal komutları
 */
export function extractTerminalCommands(content) {
  const commands = [];
  
  // Kod bloğu içindeki terminal komutları
  const terminalBlockRegex = /```(?:bash|shell|sh|cmd|powershell|ps1|terminal|console|command)(?:[:|\s+]([^\n]+))?\n([\s\S]*?)```/g;
  let blockMatch;
  
  while ((blockMatch = terminalBlockRegex.exec(content)) !== null) {
    const commandBlock = blockMatch[2].trim();
    const commandLines = commandBlock.split('\n');
    
    commandLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        commands.push(trimmedLine);
      }
    });
  }
  
  // Satır başındaki terminal komutları
  const lineCommandRegex = /^(?:\/terminal\s+|\/run\s+|\$\s*|>\s*)(.+)$/gm;
  let lineMatch;
  
  while ((lineMatch = lineCommandRegex.exec(content)) !== null) {
    const command = lineMatch[1].trim();
    if (command) {
      commands.push(command);
    }
  }
  
  return commands;
}

export default {
  extractCodeBlocks,
  cleanFileName,
  isTerminalCommand,
  getDefaultFileName,
  getFileExtension,
  getLanguageFromExtension,
  extractTerminalCommands
};

/**
 * Dilin komut dili olup olmadığını kontrol eder
 * @param {string} language - Dil
 * @returns {boolean} - Komut dili ise true
 */
function isCommandLanguage(language) {
  if (!language) return false;
  
  const commandLanguages = [
    'bash', 'shell', 'sh', 'cmd', 'powershell', 'ps1', 
    'terminal', 'console', 'command'
  ];
  
  return commandLanguages.includes(language.toLowerCase());
}

/**
 * İçeriğin komut içerip içermediğini kontrol eder
 * @param {string} content - İçerik
 * @returns {boolean} - Komut içeriyorsa true
 */
function isCommandContent(content) {
  if (!content) return false;
  
  // Yaygın terminal komutları
  const terminalCommands = [
    'npm ', 'node ', 'python ', 'pip ', 'yarn ', 
    'git ', 'cd ', 'mkdir ', 'touch ', 'rm ', 
    'cp ', 'mv ', 'ls ', 'dir ', 'cat ', 
    'echo ', 'curl ', 'wget ', 'ssh ', 'sudo ',
    '/terminal', '/run', 'npx '
  ];
  
  const contentLines = content.trim().split('\n');
  
  // İlk satır komut mu kontrol et
  const firstLine = contentLines[0].trim();
  return terminalCommands.some(cmd => firstLine.startsWith(cmd));
}

/**
 * Dosya adının geçersiz olup olmadığını kontrol eder
 * @param {string} fileName - Dosya adı
 * @returns {boolean} - Geçersiz ise true
 */
function isInvalidFileName(fileName) {
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
 * İçeriğin geçersiz olup olmadığını kontrol eder
 * @param {string} content - İçerik
 * @returns {boolean} - Geçersiz ise true
 */
function isInvalidContent(content) {
  if (!content) return true;
  
  // Geçersiz içerik desenleri
  const invalidPatterns = [
    /^import\s+React\s+from\s+'react';$/,
    /^body\s+{$/,
    /^calculator-app\/$/,
    /^{$/,
    /^}$/,
    /^import\s+{.*}\s+from\s+/
  ];
  
  const firstLine = content.trim().split('\n')[0].trim();
  return invalidPatterns.some(pattern => pattern.test(firstLine));
}



