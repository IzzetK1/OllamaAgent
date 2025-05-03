/**
 * Kod Tamamlama Sistemi
 * Monaco editör için gelişmiş kod tamamlama özellikleri
 */
class CodeCompletion {
  constructor() {
    this.monaco = null;
    this.editor = null;
    this.languageProviders = new Map();
  }

  /**
   * Editörü başlatır
   * @param {Object} monaco - Monaco nesnesi
   * @param {Object} editor - Monaco editör nesnesi
   */
  initialize(monaco, editor) {
    this.monaco = monaco;
    this.editor = editor;

    // Dil sağlayıcılarını kaydet
    this.registerLanguageProviders();
  }

  /**
   * Dil sağlayıcılarını kaydeder
   */
  registerLanguageProviders() {
    // JavaScript/TypeScript için kod tamamlama
    this.registerJavaScriptProvider();
    
    // HTML için kod tamamlama
    this.registerHTMLProvider();
    
    // CSS için kod tamamlama
    this.registerCSSProvider();
    
    // Python için kod tamamlama
    this.registerPythonProvider();
  }

  /**
   * JavaScript/TypeScript sağlayıcısını kaydeder
   */
  registerJavaScriptProvider() {
    if (!this.monaco) return;

    // JavaScript/TypeScript için özel tamamlama sağlayıcısı
    const jsProvider = this.monaco.languages.registerCompletionItemProvider(['javascript', 'typescript'], {
      triggerCharacters: ['.', '"', "'", '`', '/', '@', '<'],
      
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        const suggestions = [];

        // React bileşenleri için tamamlama
        if (textUntilPosition.match(/<[A-Za-z]*$/)) {
          const reactComponents = [
            { label: 'div', insertText: 'div' },
            { label: 'span', insertText: 'span' },
            { label: 'button', insertText: 'button' },
            { label: 'input', insertText: 'input' },
            { label: 'form', insertText: 'form' },
            { label: 'React.Fragment', insertText: 'React.Fragment' },
            { label: 'Fragment', insertText: 'Fragment' },
          ];

          reactComponents.forEach(component => {
            suggestions.push({
              label: component.label,
              kind: this.monaco.languages.CompletionItemKind.Class,
              insertText: component.insertText,
              detail: 'React Component',
              documentation: `React ${component.label} bileşeni`
            });
          });
        }

        // ES6 kod parçacıkları
        if (textUntilPosition.endsWith('imp')) {
          suggestions.push({
            label: 'import',
            kind: this.monaco.languages.CompletionItemKind.Snippet,
            insertText: "import { $1 } from '$2';",
            insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'ES6 Import',
            documentation: 'ES6 modül import ifadesi'
          });
        }

        if (textUntilPosition.endsWith('fn')) {
          suggestions.push({
            label: 'function',
            kind: this.monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              "function $1($2) {",
              "\t$0",
              "}"
            ].join('\n'),
            insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Function Declaration',
            documentation: 'Fonksiyon tanımı'
          });
        }

        if (textUntilPosition.endsWith('afn')) {
          suggestions.push({
            label: 'arrow function',
            kind: this.monaco.languages.CompletionItemKind.Snippet,
            insertText: "const $1 = ($2) => {\n\t$0\n}",
            insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Arrow Function',
            documentation: 'ES6 ok fonksiyonu'
          });
        }

        if (textUntilPosition.endsWith('cl')) {
          suggestions.push({
            label: 'class',
            kind: this.monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              "class $1 {",
              "\tconstructor($2) {",
              "\t\t$0",
              "\t}",
              "}"
            ].join('\n'),
            insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Class Declaration',
            documentation: 'ES6 sınıf tanımı'
          });
        }

        return { suggestions };
      }
    });

    this.languageProviders.set('javascript', jsProvider);
  }

  /**
   * HTML sağlayıcısını kaydeder
   */
  registerHTMLProvider() {
    if (!this.monaco) return;

    // HTML için özel tamamlama sağlayıcısı
    const htmlProvider = this.monaco.languages.registerCompletionItemProvider('html', {
      triggerCharacters: ['<', ' ', ':', '"', "'", '.'],
      
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        const suggestions = [];

        // HTML etiketleri için tamamlama
        if (textUntilPosition.endsWith('<')) {
          const htmlTags = [
            { label: 'div', insertText: 'div' },
            { label: 'span', insertText: 'span' },
            { label: 'p', insertText: 'p' },
            { label: 'h1', insertText: 'h1' },
            { label: 'h2', insertText: 'h2' },
            { label: 'h3', insertText: 'h3' },
            { label: 'ul', insertText: 'ul' },
            { label: 'li', insertText: 'li' },
            { label: 'a', insertText: 'a href="$1"' },
            { label: 'img', insertText: 'img src="$1" alt="$2"' },
            { label: 'button', insertText: 'button' },
            { label: 'input', insertText: 'input type="$1"' },
            { label: 'form', insertText: 'form' },
            { label: 'table', insertText: 'table' },
            { label: 'section', insertText: 'section' },
            { label: 'article', insertText: 'article' },
            { label: 'header', insertText: 'header' },
            { label: 'footer', insertText: 'footer' },
            { label: 'nav', insertText: 'nav' },
            { label: 'main', insertText: 'main' },
          ];

          htmlTags.forEach(tag => {
            suggestions.push({
              label: tag.label,
              kind: this.monaco.languages.CompletionItemKind.Property,
              insertText: tag.insertText,
              insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: 'HTML Tag',
              documentation: `HTML ${tag.label} etiketi`
            });
          });
        }

        return { suggestions };
      }
    });

    this.languageProviders.set('html', htmlProvider);
  }

  /**
   * CSS sağlayıcısını kaydeder
   */
  registerCSSProvider() {
    if (!this.monaco) return;

    // CSS için özel tamamlama sağlayıcısı
    const cssProvider = this.monaco.languages.registerCompletionItemProvider('css', {
      triggerCharacters: [':'],
      
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        const suggestions = [];

        // CSS özellikleri için tamamlama
        if (textUntilPosition.endsWith(':')) {
          const cssProperties = [
            { property: 'display', values: ['block', 'inline', 'flex', 'grid', 'none'] },
            { property: 'position', values: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
            { property: 'color', values: ['#000', '#fff', 'red', 'blue', 'green'] },
            { property: 'background-color', values: ['#000', '#fff', 'transparent', 'red', 'blue'] },
            { property: 'margin', values: ['0', '10px', '1rem', 'auto'] },
            { property: 'padding', values: ['0', '10px', '1rem'] },
            { property: 'font-size', values: ['12px', '1rem', '1.5em', '16px'] },
            { property: 'font-weight', values: ['normal', 'bold', '400', '700'] },
            { property: 'text-align', values: ['left', 'center', 'right', 'justify'] },
            { property: 'flex-direction', values: ['row', 'column', 'row-reverse', 'column-reverse'] },
          ];

          // Önceki kelimeyi bul
          const match = textUntilPosition.match(/([a-zA-Z-]+):\s*$/);
          if (match) {
            const property = match[1];
            
            // Özelliğe uygun değerleri bul
            const propertyData = cssProperties.find(p => p.property === property);
            
            if (propertyData) {
              propertyData.values.forEach(value => {
                suggestions.push({
                  label: value,
                  kind: this.monaco.languages.CompletionItemKind.Value,
                  insertText: value,
                  detail: `${property} değeri`,
                  documentation: `CSS ${property} özelliği için ${value} değeri`
                });
              });
            }
          }
        }

        return { suggestions };
      }
    });

    this.languageProviders.set('css', cssProvider);
  }

  /**
   * Python sağlayıcısını kaydeder
   */
  registerPythonProvider() {
    if (!this.monaco) return;

    // Python için özel tamamlama sağlayıcısı
    const pythonProvider = this.monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['.', 'def', 'class', 'import'],
      
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        const suggestions = [];

        // Python kod parçacıkları
        if (textUntilPosition.endsWith('def')) {
          suggestions.push({
            label: 'def',
            kind: this.monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              "def $1($2):",
              "\t$0",
              "\tpass"
            ].join('\n'),
            insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Function Definition',
            documentation: 'Python fonksiyon tanımı'
          });
        }

        if (textUntilPosition.endsWith('class')) {
          suggestions.push({
            label: 'class',
            kind: this.monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              "class $1:",
              "\tdef __init__(self, $2):",
              "\t\t$0",
              "\t\tpass"
            ].join('\n'),
            insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Class Definition',
            documentation: 'Python sınıf tanımı'
          });
        }

        if (textUntilPosition.endsWith('import')) {
          suggestions.push({
            label: 'import',
            kind: this.monaco.languages.CompletionItemKind.Snippet,
            insertText: "import $1",
            insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Import Statement',
            documentation: 'Python import ifadesi'
          });
        }

        return { suggestions };
      }
    });

    this.languageProviders.set('python', pythonProvider);
  }

  /**
   * Tüm sağlayıcıları temizler
   */
  dispose() {
    this.languageProviders.forEach(provider => {
      provider.dispose();
    });
    
    this.languageProviders.clear();
  }
}

export default new CodeCompletion();
