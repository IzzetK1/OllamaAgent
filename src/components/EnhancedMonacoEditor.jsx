import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { FiSave, FiMaximize2, FiMinimize2, FiCode, FiSettings, FiCopy, FiDownload } from 'react-icons/fi';

/**
 * Gelişmiş Monaco Editor bileşeni
 *
 * @param {Object} props - Bileşen özellikleri
 * @param {string} props.value - Editör içeriği
 * @param {Function} props.onChange - İçerik değiştiğinde çağrılacak fonksiyon
 * @param {string} props.language - Programlama dili
 * @param {string} props.theme - Editör teması
 * @param {Object} props.options - Monaco editör seçenekleri
 * @param {Function} props.onSave - Kaydet düğmesine tıklandığında çağrılacak fonksiyon
 * @param {string} props.fileName - Dosya adı
 * @param {string} props.filePath - Dosya yolu
 * @param {boolean} props.isMaximized - Editör tam ekran mı
 * @param {Function} props.onMaximize - Tam ekran düğmesine tıklandığında çağrılacak fonksiyon
 */
const EnhancedMonacoEditor = ({
  value = '',
  onChange,
  language = 'javascript',
  theme = 'vs-dark',
  options = {},
  onSave,
  fileName = '',
  filePath = '',
  isMaximized = false,
  onMaximize
}) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [editorTheme, setEditorTheme] = useState(theme);

  // Editör temasını ayarla
  useEffect(() => {
    setEditorTheme(theme);
  }, [theme]);

  // Editör yükleme işlevi
  const editorWillMount = (monaco) => {
    // Monaco'yu referansta sakla
    monacoRef.current = monaco;

    // Replit benzeri tema tanımla
    monaco.editor.defineTheme('replit-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6c7280' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: 'ff7b72' },
        { token: 'regexp', foreground: 'ffa657' },
        { token: 'type', foreground: '7ee787' },
        { token: 'class', foreground: '7ee787' },
        { token: 'function', foreground: 'd2a8ff' },
        { token: 'variable', foreground: 'ffa657' },
        { token: 'operator', foreground: '79c0ff' },
      ],
      colors: {
        'editor.background': '#0E1525',
        'editor.foreground': '#F5F9FC',
        'editorCursor.foreground': '#3485E4',
        'editor.lineHighlightBackground': '#1C2333',
        'editorLineNumber.foreground': '#C2C8CC',
        'editor.selectionBackground': '#3485E430',
        'editor.inactiveSelectionBackground': '#3485E420',
        'editorSuggestWidget.background': '#1C2333',
        'editorSuggestWidget.border': '#2B3245',
        'editorSuggestWidget.foreground': '#F5F9FC',
        'editorSuggestWidget.selectedBackground': '#2B3245',
        'editorSuggestWidget.highlightForeground': '#3485E4',
        'editorHoverWidget.background': '#1C2333',
        'editorHoverWidget.border': '#2B3245',
        'editorIndentGuide.background': '#2B3245',
        'editorIndentGuide.activeBackground': '#3485E4',
        'editorGutter.background': '#0E1525',
        'editorError.foreground': '#F31260',
        'editorWarning.foreground': '#F5A524',
        'editorInfo.foreground': '#3485E4',
      }
    });

    // Replit temasını kullan
    setEditorTheme('replit-dark');

    // Ek editör seçenekleri
    return {
      automaticLayout: true,
      fontFamily: 'Fira Code, monospace',
      fontSize: 14,
      lineHeight: 1.5,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      wordWrap: 'on',
      wrappingIndent: 'same',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
      tabSize: 2,
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
    };
  };

  // Editör yüklendikten sonra çağrılacak işlev
  const editorDidMount = (editor, monaco) => {
    // Editörü referansta sakla
    editorRef.current = editor;

    // İmleç pozisyonu değişikliğini izle
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });

    // Ctrl+S kısayolu ile kaydetme
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      if (onSave) onSave();
    });

    // Editöre odaklan
    editor.focus();
  };

  // Dosya uzantısına göre simge belirle
  const getFileIcon = () => {
    if (!fileName) return <FiCode />;
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return <span className="text-yellow-400"><FiCode /></span>;
      case 'ts':
      case 'tsx':
        return <span className="text-blue-400"><FiCode /></span>;
      case 'css':
      case 'scss':
        return <span className="text-blue-600"><FiCode /></span>;
      case 'html':
        return <span className="text-orange-500"><FiCode /></span>;
      case 'json':
        return <span className="text-gray-400"><FiCode /></span>;
      case 'md':
        return <span className="text-blue-800"><FiCode /></span>;
      case 'py':
        return <span className="text-blue-700"><FiCode /></span>;
      default:
        return <FiCode />;
    }
  };

  return (
    <div className={`monaco-editor-container ${isMaximized ? 'editor-maximized' : ''}`}>
      <div className="editor-header">
        <div className="editor-title">
          <span className="editor-title-icon">{getFileIcon()}</span>
          <span className="editor-title-text">{fileName || 'Adsız'}</span>
          {filePath && <span className="editor-title-path">{filePath}</span>}
        </div>
        <div className="editor-actions">
          <button
            className="editor-action-btn"
            title="Kaydet (Ctrl+S)"
            onClick={onSave}
          >
            <FiSave />
          </button>
          <button
            className="editor-action-btn"
            title="Kopyala"
            onClick={() => {
              if (editorRef.current) {
                const content = editorRef.current.getValue();
                navigator.clipboard.writeText(content);
              }
            }}
          >
            <FiCopy />
          </button>
          <button
            className="editor-action-btn"
            title="İndir"
            onClick={() => {
              if (editorRef.current) {
                const content = editorRef.current.getValue();
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName || 'code.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }}
          >
            <FiDownload />
          </button>
          <button
            className="editor-action-btn"
            title={isMaximized ? "Küçült" : "Büyüt"}
            onClick={onMaximize}
          >
            {isMaximized ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          width="100%"
          height="100%"
          language={language}
          theme={editorTheme}
          value={value}
          options={{
            ...options,
            ...editorWillMount(monacoRef.current)
          }}
          onChange={onChange}
          editorWillMount={editorWillMount}
          editorDidMount={editorDidMount}
        />
      </div>
      
      <div className="editor-statusbar">
        <div className="editor-statusbar-position">
          Satır {cursorPosition.line}, Sütun {cursorPosition.column}
        </div>
        <div className="editor-statusbar-info">
          <div className="editor-statusbar-item">
            <FiCode />
            <span>{language.toUpperCase()}</span>
          </div>
          <div className="editor-statusbar-item">
            <FiSettings />
            <span>UTF-8</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMonacoEditor;
