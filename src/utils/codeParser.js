/**
 * Code Parser Utility
 *
 * Bu modül, AI yanıtlarından kod bloklarını çıkarmak ve dosya oluşturmak için kullanılır.
 */

/**
 * Kod bloklarını çıkarır
 * @param {string} content - AI yanıtı
 * @returns {Array} - Çıkarılan kod blokları
 */
export function extractCodeBlocks(content) {
  if (!content) return [];

  // Daha güçlü bir regex kullanarak kod bloklarını çıkar
  // Hem ```language:filename hem de ```language filename formatlarını destekler
  // Ayrıca ```filename.ext formatını da destekler
  const codeBlockRegex = /```(?:([a-zA-Z0-9_+-]+)(?:[:|\s+]([^\n]+))?|([^\s\n]+\.[a-zA-Z0-9]+))\n([\s\S]*?)```/g;

  const codeBlocks = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Eğer 3. grup eşleşmişse, bu doğrudan bir dosya adıdır (```filename.ext formatı)
    if (match[3]) {
      const fileName = match[3].trim();
      const code = match[4] || '';

      // Dosya uzantısından dil tahmin et
      const extension = fileName.split('.').pop().toLowerCase();
      const language = getLanguageFromExtension(extension);

      // Dosya adını temizle
      const cleanedFileName = cleanFileName(fileName, language);

      // Terminal komutlarını dosya adı olarak algılamayı önle
      if (isTerminalCommand(cleanedFileName)) {
        continue;
      }

      codeBlocks.push({
        language,
        fileName: cleanedFileName,
        code
      });
    } else {
      // Normal ```language:filename veya ```language filename formatı
      const language = (match[1] || '').trim().toLowerCase();
      let fileName = (match[2] || '').trim();
      const code = match[4] || '';

      // Dosya adını temizle
      fileName = cleanFileName(fileName, language);

      // Terminal komutlarını dosya adı olarak algılamayı önle
      if (isTerminalCommand(fileName)) {
        continue;
      }

      codeBlocks.push({
        language,
        fileName,
        code
      });
    }
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
export function getDefaultFileName(language) {
  if (!language) return '';

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

  return defaultFileNames[language.toLowerCase()] || `file.${language.toLowerCase()}`;
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
 * @param {string} content - AI yanıtı
 * @returns {Array} - Çıkarılan terminal komutları
 */
export function extractTerminalCommands(content) {
  if (!content) return [];

  const commands = [];

  // Kod bloklarındaki terminal komutları
  const terminalBlockRegex = /```(?:bash|shell|sh|cmd|powershell|terminal)\n([\s\S]*?)```/g;
  let terminalMatch;

  while ((terminalMatch = terminalBlockRegex.exec(content)) !== null) {
    const commandBlock = terminalMatch[1].trim();
    if (commandBlock) {
      // Komut bloğunu satırlara ayır
      const commandLines = commandBlock.split('\n');
      for (const line of commandLines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          commands.push(trimmedLine);
        }
      }
    }
  }

  // /terminal komutları
  const terminalCommandRegex = /\/terminal\s+(.+)$/gm;
  let cmdMatch;
  while ((cmdMatch = terminalCommandRegex.exec(content)) !== null) {
    const command = cmdMatch[1].trim();
    if (command) {
      commands.push(command);
    }
  }

  // CD komutları
  const cdCommandRegex = /^cd\s+(.+)$/gm;
  let cdMatch;
  while ((cdMatch = cdCommandRegex.exec(content)) !== null) {
    const dirPath = cdMatch[1].trim();
    if (dirPath) {
      commands.push(`cd ${dirPath}`);
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
