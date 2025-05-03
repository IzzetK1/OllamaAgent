/**
 * Kod Analiz Sistemi
 * Kod kalitesini ve hatalarını analiz eder
 */
class CodeAnalyzer {
  constructor() {
    this.monaco = null;
    this.editor = null;
    this.markers = [];
    this.analysisTimeout = null;
    this.analysisDelay = 500; // ms
  }

  /**
   * Analiz sistemini başlatır
   * @param {Object} monaco - Monaco nesnesi
   * @param {Object} editor - Monaco editör nesnesi
   */
  initialize(monaco, editor) {
    this.monaco = monaco;
    this.editor = editor;

    // Editör değişikliklerini dinle
    this.editor.onDidChangeModelContent(() => {
      this.scheduleAnalysis();
    });

    // Dil değişikliklerini dinle
    this.editor.onDidChangeModelLanguage(() => {
      this.scheduleAnalysis();
    });
  }

  /**
   * Analizi zamanlar
   */
  scheduleAnalysis() {
    // Önceki zamanlayıcıyı temizle
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
    }

    // Yeni zamanlayıcı oluştur
    this.analysisTimeout = setTimeout(() => {
      this.analyzeCode();
    }, this.analysisDelay);
  }

  /**
   * Kodu analiz eder
   */
  analyzeCode() {
    const model = this.editor.getModel();
    if (!model) return;

    const language = model.getLanguageId();
    const code = model.getValue();

    // Dile göre analiz yap
    switch (language) {
      case 'javascript':
      case 'typescript':
        this.analyzeJavaScript(code, model);
        break;
      case 'html':
        this.analyzeHTML(code, model);
        break;
      case 'css':
        this.analyzeCSS(code, model);
        break;
      case 'python':
        this.analyzePython(code, model);
        break;
      default:
        // Diğer diller için basit analiz
        this.analyzeGeneric(code, model);
    }
  }

  /**
   * JavaScript/TypeScript kodunu analiz eder
   * @param {string} code - Kod
   * @param {Object} model - Editör modeli
   */
  analyzeJavaScript(code, model) {
    const markers = [];

    // Basit sözdizimi kontrolü
    try {
      // Parantez ve süslü parantez dengesi
      this.checkBracketBalance(code, markers);
      
      // Noktalı virgül kontrolü
      this.checkSemicolons(code, markers);
      
      // Kullanılmayan değişkenler (basit kontrol)
      this.checkUnusedVariables(code, markers);
      
      // Eksik import'lar (basit kontrol)
      this.checkMissingImports(code, markers);
      
    } catch (error) {
      // Hata oluşursa, genel bir hata işaretleyicisi ekle
      markers.push({
        severity: this.monaco.MarkerSeverity.Error,
        message: `Sözdizimi hatası: ${error.message}`,
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1
      });
    }

    // İşaretleyicileri ayarla
    this.setMarkers(model, markers);
  }

  /**
   * HTML kodunu analiz eder
   * @param {string} code - Kod
   * @param {Object} model - Editör modeli
   */
  analyzeHTML(code, model) {
    const markers = [];

    // Basit etiket dengesi kontrolü
    this.checkHTMLTagBalance(code, markers);
    
    // Eksik öznitelik kontrolü
    this.checkMissingAttributes(code, markers);

    // İşaretleyicileri ayarla
    this.setMarkers(model, markers);
  }

  /**
   * CSS kodunu analiz eder
   * @param {string} code - Kod
   * @param {Object} model - Editör modeli
   */
  analyzeCSS(code, model) {
    const markers = [];

    // Süslü parantez dengesi
    this.checkBracketBalance(code, markers);
    
    // Eksik noktalı virgül kontrolü
    this.checkCSSProperties(code, markers);

    // İşaretleyicileri ayarla
    this.setMarkers(model, markers);
  }

  /**
   * Python kodunu analiz eder
   * @param {string} code - Kod
   * @param {Object} model - Editör modeli
   */
  analyzePython(code, model) {
    const markers = [];

    // Girinti kontrolü
    this.checkPythonIndentation(code, markers);
    
    // Eksik iki nokta kontrolü
    this.checkPythonColons(code, markers);

    // İşaretleyicileri ayarla
    this.setMarkers(model, markers);
  }

  /**
   * Genel kod analizi
   * @param {string} code - Kod
   * @param {Object} model - Editör modeli
   */
  analyzeGeneric(code, model) {
    const markers = [];

    // Parantez dengesi
    this.checkBracketBalance(code, markers);

    // İşaretleyicileri ayarla
    this.setMarkers(model, markers);
  }

  /**
   * Parantez dengesini kontrol eder
   * @param {string} code - Kod
   * @param {Array} markers - İşaretleyiciler
   */
  checkBracketBalance(code, markers) {
    const stack = [];
    const pairs = {
      '(': ')',
      '[': ']',
      '{': '}'
    };
    
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (pairs[char]) {
          // Açılış parantezi
          stack.push({
            char: char,
            line: i + 1,
            column: j + 1
          });
        } else if (Object.values(pairs).includes(char)) {
          // Kapanış parantezi
          if (stack.length === 0) {
            // Eşleşen açılış parantezi yok
            markers.push({
              severity: this.monaco.MarkerSeverity.Error,
              message: `Eşleşmeyen kapanış parantezi: ${char}`,
              startLineNumber: i + 1,
              startColumn: j + 1,
              endLineNumber: i + 1,
              endColumn: j + 2
            });
          } else {
            const last = stack.pop();
            if (pairs[last.char] !== char) {
              // Yanlış kapanış parantezi
              markers.push({
                severity: this.monaco.MarkerSeverity.Error,
                message: `Yanlış kapanış parantezi: ${char} (beklenen: ${pairs[last.char]})`,
                startLineNumber: i + 1,
                startColumn: j + 1,
                endLineNumber: i + 1,
                endColumn: j + 2
              });
            }
          }
        }
      }
    }
    
    // Kapanmamış parantezler
    stack.forEach(item => {
      markers.push({
        severity: this.monaco.MarkerSeverity.Error,
        message: `Kapanmamış parantez: ${item.char}`,
        startLineNumber: item.line,
        startColumn: item.column,
        endLineNumber: item.line,
        endColumn: item.column + 1
      });
    });
  }

  /**
   * Noktalı virgülleri kontrol eder (JavaScript)
   * @param {string} code - Kod
   * @param {Array} markers - İşaretleyiciler
   */
  checkSemicolons(code, markers) {
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Boş satırları, yorum satırlarını ve blok açılış/kapanışlarını atla
      if (line === '' || line.startsWith('//') || line.startsWith('/*') || 
          line.endsWith('*/') || line === '{' || line === '}' ||
          line.startsWith('import') || line.startsWith('export')) {
        continue;
      }
      
      // Noktalı virgülle bitmeyen satırlar
      if (!line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && 
          !line.endsWith(':') && !line.match(/^(if|for|while|switch|function|class)/)) {
        markers.push({
          severity: this.monaco.MarkerSeverity.Warning,
          message: 'Satır noktalı virgülle bitmiyor',
          startLineNumber: i + 1,
          startColumn: lines[i].length + 1,
          endLineNumber: i + 1,
          endColumn: lines[i].length + 1
        });
      }
    }
  }

  /**
   * Kullanılmayan değişkenleri kontrol eder (basit)
   * @param {string} code - Kod
   * @param {Array} markers - İşaretleyiciler
   */
  checkUnusedVariables(code, markers) {
    // Değişken tanımlarını bul
    const varRegex = /\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    let match;
    const variables = [];
    
    while ((match = varRegex.exec(code)) !== null) {
      const varName = match[2];
      const position = match.index + match[1].length + 1; // "const" veya "let" veya "var" sonrası konum
      
      // Değişken adını ve konumunu kaydet
      variables.push({
        name: varName,
        position: position,
        used: false
      });
    }
    
    // Değişken kullanımlarını kontrol et
    variables.forEach(variable => {
      // Tanım dışında kullanım sayısı
      const usageRegex = new RegExp(`\\b${variable.name}\\b`, 'g');
      let usageMatch;
      let usageCount = 0;
      
      while ((usageMatch = usageRegex.exec(code)) !== null) {
        // Tanım konumunu atla
        if (usageMatch.index !== variable.position - variable.name.length) {
          usageCount++;
        }
      }
      
      if (usageCount === 0) {
        // Değişken kullanılmıyor
        const lineInfo = this.getLineAndColumn(code, variable.position);
        
        markers.push({
          severity: this.monaco.MarkerSeverity.Warning,
          message: `Kullanılmayan değişken: ${variable.name}`,
          startLineNumber: lineInfo.line,
          startColumn: lineInfo.column,
          endLineNumber: lineInfo.line,
          endColumn: lineInfo.column + variable.name.length
        });
      }
    });
  }

  /**
   * Eksik import'ları kontrol eder (basit)
   * @param {string} code - Kod
   * @param {Array} markers - İşaretleyiciler
   */
  checkMissingImports(code, markers) {
    // İçe aktarılan modülleri bul
    const importRegex = /import\s+{([^}]+)}\s+from/g;
    let match;
    const imports = new Set();
    
    while ((match = importRegex.exec(code)) !== null) {
      const importList = match[1].split(',');
      
      importList.forEach(imp => {
        const trimmed = imp.trim();
        if (trimmed) {
          imports.add(trimmed);
        }
      });
    }
    
    // Kullanılan ancak içe aktarılmayan modülleri bul (basit kontrol)
    const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
    let jsxMatch;
    
    while ((jsxMatch = jsxRegex.exec(code)) !== null) {
      const component = jsxMatch[1];
      
      if (!imports.has(component) && !code.includes(`function ${component}`)) {
        const lineInfo = this.getLineAndColumn(code, jsxMatch.index);
        
        markers.push({
          severity: this.monaco.MarkerSeverity.Warning,
          message: `Olası eksik import: ${component}`,
          startLineNumber: lineInfo.line,
          startColumn: lineInfo.column,
          endLineNumber: lineInfo.line,
          endColumn: lineInfo.column + component.length + 1
        });
      }
    }
  }

  /**
   * HTML etiket dengesini kontrol eder
   * @param {string} code - Kod
   * @param {Array} markers - İşaretleyiciler
   */
  checkHTMLTagBalance(code, markers) {
    const stack = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)/g;
    let match;
    
    while ((match = tagRegex.exec(code)) !== null) {
      const isClosing = match[0].startsWith('</');
      const tagName = match[1];
      
      if (!isClosing) {
        // Açılış etiketi
        stack.push({
          name: tagName,
          position: match.index
        });
      } else {
        // Kapanış etiketi
        if (stack.length === 0) {
          // Eşleşen açılış etiketi yok
          const lineInfo = this.getLineAndColumn(code, match.index);
          
          markers.push({
            severity: this.monaco.MarkerSeverity.Error,
            message: `Eşleşmeyen kapanış etiketi: ${tagName}`,
            startLineNumber: lineInfo.line,
            startColumn: lineInfo.column,
            endLineNumber: lineInfo.line,
            endColumn: lineInfo.column + tagName.length + 3
          });
        } else {
          const last = stack.pop();
          if (last.name !== tagName) {
            // Yanlış kapanış etiketi
            const lineInfo = this.getLineAndColumn(code, match.index);
            
            markers.push({
              severity: this.monaco.MarkerSeverity.Error,
              message: `Yanlış kapanış etiketi: ${tagName} (beklenen: ${last.name})`,
              startLineNumber: lineInfo.line,
              startColumn: lineInfo.column,
              endLineNumber: lineInfo.line,
              endColumn: lineInfo.column + tagName.length + 3
            });
          }
        }
      }
    }
    
    // Kapanmamış etiketler
    stack.forEach(item => {
      const lineInfo = this.getLineAndColumn(code, item.position);
      
      markers.push({
        severity: this.monaco.MarkerSeverity.Error,
        message: `Kapanmamış etiket: ${item.name}`,
        startLineNumber: lineInfo.line,
        startColumn: lineInfo.column,
        endLineNumber: lineInfo.line,
        endColumn: lineInfo.column + item.name.length + 1
      });
    });
  }

  /**
   * Eksik HTML özniteliklerini kontrol eder
   * @param {string} code - Kod
   * @param {Array} markers - İşaretleyiciler
   */
  checkMissingAttributes(code, markers) {
    // img etiketi için src özniteliği
    const imgRegex = /<img(?![^>]*src=)[^>]*>/g;
    let match;
    
    while ((match = imgRegex.exec(code)) !== null) {
      const lineInfo = this.getLineAndColumn(code, match.index);
      
      markers.push({
        severity: this.monaco.MarkerSeverity.Warning,
        message: 'img etiketi src özniteliği olmadan kullanılmış',
        startLineNumber: lineInfo.line,
        startColumn: lineInfo.column,
        endLineNumber: lineInfo.line,
        endColumn: lineInfo.column + match[0].length
      });
    }
    
    // a etiketi için href özniteliği
    const aRegex = /<a(?![^>]*href=)[^>]*>/g;
    
    while ((match = aRegex.exec(code)) !== null) {
      const lineInfo = this.getLineAndColumn(code, match.index);
      
      markers.push({
        severity: this.monaco.MarkerSeverity.Warning,
        message: 'a etiketi href özniteliği olmadan kullanılmış',
        startLineNumber: lineInfo.line,
        startColumn: lineInfo.column,
        endLineNumber: lineInfo.line,
        endColumn: lineInfo.column + match[0].length
      });
    }
  }

  /**
   * CSS özelliklerini kontrol eder
   * @param {string} code - Kod
   * @param {Array} markers - İşaretleyiciler
   */
  checkCSSProperties(code, markers) {
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Özellik satırlarını kontrol et
      if (line.includes(':') && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}')) {
        markers.push({
          severity: this.monaco.MarkerSeverity.Warning,
          message: 'CSS özelliği noktalı virgülle bitmiyor',
          startLineNumber: i + 1,
          startColumn: lines[i].length + 1,
          endLineNumber: i + 1,
          endColumn: lines[i].length + 1
        });
      }
    }
  }

  /**
   * Python girintilerini kontrol eder
   * @param {string} code - Kod
   * @param {Array} markers - İşaretleyiciler
   */
  checkPythonIndentation(code, markers) {
    const lines = code.split('\n');
    let expectedIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Boş satırları atla
      if (line.trim() === '') continue;
      
      // Satırın başındaki boşluk sayısını hesapla
      const indent = line.search(/\S/);
      
      // Girinti seviyesini kontrol et
      if (indent % 4 !== 0) {
        markers.push({
          severity: this.monaco.MarkerSeverity.Warning,
          message: 'Girinti 4 boşluğun katı değil',
          startLineNumber: i + 1,
          startColumn: 1,
          endLineNumber: i + 1,
          endColumn: indent + 1
        });
      }
      
      // Beklenen girintiyi güncelle
      if (line.trim().startsWith('def ') || line.trim().startsWith('class ')) {
        expectedIndent = indent + 4;
      } else if (line.trim().endsWith(':')) {
        expectedIndent = indent + 4;
      } else if (line.trim().startsWith('return') || line.trim().startsWith('break') || line.trim().startsWith('continue')) {
        expectedIndent = indent - 4;
      }
    }
  }

  /**
   * Python iki nokta kullanımını kontrol eder
   * @param {string} code - Kod
   * @param {Array} markers - İşaretleyiciler
   */
  checkPythonColons(code, markers) {
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // if, for, while, def, class gibi ifadeleri kontrol et
      if (line.match(/^(if|elif|else|for|while|def|class|try|except|finally)\b/) && !line.endsWith(':')) {
        markers.push({
          severity: this.monaco.MarkerSeverity.Error,
          message: 'İfade iki nokta ile bitmiyor',
          startLineNumber: i + 1,
          startColumn: lines[i].length + 1,
          endLineNumber: i + 1,
          endColumn: lines[i].length + 1
        });
      }
    }
  }

  /**
   * İşaretleyicileri ayarla
   * @param {Object} model - Editör modeli
   * @param {Array} markers - İşaretleyiciler
   */
  setMarkers(model, markers) {
    // Monaco işaretleyicilerini ayarla
    this.monaco.editor.setModelMarkers(model, 'codeAnalyzer', markers);
    
    // İşaretleyicileri kaydet
    this.markers = markers;
  }

  /**
   * İşaretleyicileri temizle
   */
  clearMarkers() {
    if (this.editor && this.editor.getModel()) {
      this.monaco.editor.setModelMarkers(this.editor.getModel(), 'codeAnalyzer', []);
      this.markers = [];
    }
  }

  /**
   * İşaretleyicileri al
   * @returns {Array} - İşaretleyiciler
   */
  getMarkers() {
    return this.markers;
  }

  /**
   * Pozisyondan satır ve sütun bilgisini hesaplar
   * @param {string} code - Kod
   * @param {number} position - Pozisyon
   * @returns {Object} - Satır ve sütun bilgisi
   */
  getLineAndColumn(code, position) {
    const lines = code.substring(0, position).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    
    return { line, column };
  }
}

export default CodeAnalyzer;

