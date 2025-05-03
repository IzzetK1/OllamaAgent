/**
 * Editor Module - Gelişmiş Kod Editörü Modülü
 * 
 * Bu modül, Monaco editörünü ve kod düzenleme işlevlerini yönetir.
 * - Editör başlatma ve yapılandırma
 * - Dosya yükleme ve kaydetme
 * - Kod önerileri ve analizi
 * - Tema ve dil ayarları
 */

import { saveFile, getFileContent } from './fileManager';

// Editör durumu
let editor = null;
let currentLanguage = 'javascript';
let currentTheme = 'vs-dark';
let currentFile = null;

/**
 * Editör modülünü başlat
 */
export function initializeEditor() {
  // Monaco editörünü yükle
  require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.33.0/min/vs' } });
  require(['vs/editor/editor.main'], function() {
    // Editörü oluştur
    createEditor();
    
    // Editör ayarlarını yükle
    loadEditorSettings();
    
    // Editör olaylarını bağla
    bindEditorEvents();
    
    // AI kod önerilerini etkinleştir
    enableAICodeSuggestions();
    
    console.log('Editör modülü başlatıldı');
  });
}

/**
 * Monaco editörünü oluştur
 */
function createEditor() {
  const editorContainer = document.getElementById('editor');
  if (!editorContainer) return;
  
  editor = monaco.editor.create(editorContainer, {
    value: '// Kod yazmaya başlayın veya bir dosya açın',
    language: currentLanguage,
    theme: currentTheme,
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    wrappingIndent: 'same',
    autoIndent: 'full',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: true,
    smoothScrolling: true,
    contextmenu: true,
    multiCursorModifier: 'alt',
    accessibilitySupport: 'auto',
    colorDecorators: true,
    folding: true,
    foldingStrategy: 'auto',
    showFoldingControls: 'mouseover',
    matchBrackets: 'always',
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'multiline',
      seedSearchStringFromSelection: true
    }
  });
  
  // Editör hazır
  window.editor = editor;
}

/**
 * Editör ayarlarını yükle
 */
function loadEditorSettings() {
  // Tema ayarı
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = localStorage.getItem('editor-theme') || currentTheme;
    currentTheme = themeSelect.value;
    monaco.editor.setTheme(currentTheme);
    
    themeSelect.addEventListener('change', () => {
      currentTheme = themeSelect.value;
      monaco.editor.setTheme(currentTheme);
      localStorage.setItem('editor-theme', currentTheme);
    });
  }
  
  // Dil ayarı
  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.value = localStorage.getItem('editor-language') || currentLanguage;
    currentLanguage = languageSelect.value;
    
    languageSelect.addEventListener('change', () => {
      currentLanguage = languageSelect.value;
      if (editor && !currentFile) {
        monaco.editor.setModelLanguage(editor.getModel(), currentLanguage);
      }
      localStorage.setItem('editor-language', currentLanguage);
    });
  }
}

/**
 * Editör olaylarını bağla
 */
function bindEditorEvents() {
  if (!editor) return;
  
  // Değişiklik olayı
  editor.onDidChangeModelContent(() => {
    // Dosya değişti olarak işaretle
    if (currentFile) {
      document.querySelector(`.file[data-path="${currentFile}"]`)?.classList.add('modified');
      
      // Otomatik kaydet
      if (localStorage.getItem('auto-save') === 'true') {
        saveCurrentFile();
      }
    }
    
    // Kod analizi
    analyzeCode();
  });
  
  // Dosya kaydetme kısayolu (Ctrl+S)
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
    saveCurrentFile();
  });
  
  // Yeni dosya kısayolu (Ctrl+N)
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_N, () => {
    createNewFile();
  });
  
  // Dosya aç kısayolu (Ctrl+O)
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_O, () => {
    // Dosya açma diyaloğu
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '*.*';
    fileInput.click();
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          createFile(file.name, content);
          openFile(file.name);
        };
        reader.readAsText(file);
      }
    });
  });
}

/**
 * AI kod önerilerini etkinleştir
 */
function enableAICodeSuggestions() {
  if (!monaco || !editor) return;
  
  // JavaScript için özel öneri sağlayıcı
  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: function(model, position) {
      // Mevcut satırı ve önceki metni al
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });
      
      // Basit öneri mantığı (gerçek uygulamada AI API'si kullanılabilir)
      const suggestions = [];
      
      // Fonksiyon önerileri
      if (textUntilPosition.endsWith('function')) {
        suggestions.push({
          label: 'function',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Fonksiyon tanımla'
        });
      }
      
      // Arrow fonksiyon önerileri
      if (textUntilPosition.endsWith('=>')) {
        suggestions.push({
          label: 'arrow function',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '(${1:params}) => {\n\t${2}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Arrow fonksiyon tanımla'
        });
      }
      
      // console.log önerisi
      if (textUntilPosition.endsWith('console.')) {
        suggestions.push({
          label: 'log',
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: 'log(${1:message})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Konsola mesaj yazdır'
        });
      }
      
      return {
        suggestions: suggestions
      };
    }
  });
}

/**
 * Kodu analiz et ve sorunları göster
 */
function analyzeCode() {
  if (!editor) return;
  
  const model = editor.getModel();
  if (!model) return;
  
  const code = model.getValue();
  const language = model.getLanguageId();
  
  // Basit kod analizi (gerçek uygulamada daha gelişmiş analiz yapılabilir)
  const markers = [];
  
  // JavaScript için basit analiz
  if (language === 'javascript') {
    // Parantez kontrolü
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: 'Parantez sayıları eşleşmiyor',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: model.getLineCount(),
        endColumn: model.getLineMaxColumn(model.getLineCount())
      });
    }
    
    // Noktalı virgül kontrolü
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine && 
          !trimmedLine.endsWith(';') && 
          !trimmedLine.endsWith('{') && 
          !trimmedLine.endsWith('}') && 
          !trimmedLine.endsWith('(') && 
          !trimmedLine.startsWith('//') && 
          !trimmedLine.startsWith('/*') && 
          !trimmedLine.endsWith('*/') && 
          !trimmedLine.startsWith('import') && 
          !trimmedLine.startsWith('export')) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Noktalı virgül eksik olabilir',
          startLineNumber: index + 1,
          startColumn: line.length,
          endLineNumber: index + 1,
          endColumn: line.length + 1
        });
      }
    });
  }
  
  // HTML için basit analiz
  if (language === 'html') {
    // Tag kontrolü
    const openTags = code.match(/<[a-z][^>]*>/gi) || [];
    const closeTags = code.match(/<\/[a-z][^>]*>/gi) || [];
    
    if (openTags.length !== closeTags.length) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: 'HTML tag sayıları eşleşmiyor',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: model.getLineCount(),
        endColumn: model.getLineMaxColumn(model.getLineCount())
      });
    }
  }
  
  // Sorunları göster
  monaco.editor.setModelMarkers(model, 'owner', markers);
}

/**
 * Mevcut dosyayı kaydet
 */
function saveCurrentFile() {
  if (!editor || !currentFile) return;
  
  const content = editor.getValue();
  saveFile(currentFile, content);
  
  // Dosya değişti işaretini kaldır
  document.querySelector(`.file[data-path="${currentFile}"]`)?.classList.remove('modified');
  
  // Bildirim göster
  showNotification(`Dosya kaydedildi: ${currentFile}`, 'success');
}

/**
 * Dosya aç
 * @param {string} filePath - Dosya yolu
 */
export function openFile(filePath) {
  if (!editor) return;
  
  const content = getFileContent(filePath);
  if (content === null) return;
  
  // Dosya uzantısına göre dil belirle
  const fileExt = filePath.split('.').pop();
  let language = 'text';
  
  switch (fileExt) {
    case 'js':
      language = 'javascript';
      break;
    case 'html':
      language = 'html';
      break;
    case 'css':
      language = 'css';
      break;
    case 'json':
      language = 'json';
      break;
    case 'md':
      language = 'markdown';
      break;
    case 'py':
      language = 'python';
      break;
    case 'java':
      language = 'java';
      break;
    case 'c':
      language = 'c';
      break;
    case 'cpp':
      language = 'cpp';
      break;
    case 'cs':
      language = 'csharp';
      break;
    case 'go':
      language = 'go';
      break;
    case 'php':
      language = 'php';
      break;
    case 'rb':
      language = 'ruby';
      break;
    case 'ts':
      language = 'typescript';
      break;
    case 'sql':
      language = 'sql';
      break;
    case 'xml':
      language = 'xml';
      break;
    case 'yaml':
    case 'yml':
      language = 'yaml';
      break;
    default:
      language = 'text';
  }
  
  // Editör modelini güncelle
  const model = monaco.editor.createModel(content, language);
  editor.setModel(model);
  
  // Mevcut dosyayı güncelle
  currentFile = filePath;
  currentLanguage = language;
  
  // Dosyayı aktif olarak işaretle
  document.querySelectorAll('.file').forEach(el => el.classList.remove('active'));
  document.querySelector(`.file[data-path="${filePath}"]`)?.classList.add('active');
  
  // Editör sekmesine geç
  showEditorTab('editor');
}

/**
 * Editör sekmesini göster
 * @param {string} tabId - Sekme ID'si
 */
export function showEditorTab(tabId) {
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

/**
 * Bildirim göster
 * @param {string} message - Bildirim mesajı
 * @param {string} type - Bildirim tipi (success, warning, error)
 */
function showNotification(message, type = 'default') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Mevcut dili al
 * @returns {string} - Mevcut dil
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Editörde aç
 * @param {string} content - Dosya içeriği
 * @param {string} language - Programlama dili
 */
export function openInEditor(content, language) {
  if (!editor) return;
  
  // Editör modelini güncelle
  const model = monaco.editor.createModel(content, language);
  editor.setModel(model);
  
  // Mevcut dosyayı sıfırla
  currentFile = null;
  currentLanguage = language;
  
  // Editör sekmesine geç
  showEditorTab('editor');
}
