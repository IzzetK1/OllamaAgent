import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
// Temel diller
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';

/**
 * Gelişmiş Markdown işleme bileşeni
 *
 * @param {Object} props - Bileşen özellikleri
 * @param {string} props.content - Markdown içeriği
 * @param {Function} props.onCreateFile - Dosya oluşturma işlevi
 * @param {Function} props.onRunCode - Kod çalıştırma işlevi
 */
const MarkdownRenderer = ({ content, onCreateFile, onRunCode }) => {
  // Prism.js'yi başlat
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  // Kod bloğu bileşeni
  const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\\n/g, '\n');

    // Dosya adını çıkar (eğer varsa)
    let fileName = '';
    // Farklı dosya adı formatlarını destekle
    // 1. language:filename formatı (örn: js:index.js)
    // 2. language filename formatı (örn: js index.js)
    // 3. Sadece dosya adı formatı (örn: index.js)
    const fileNameColonMatch = props.node?.properties?.metastring?.match(/^([^:]+):(.+)$/);
    const fileNameSpaceMatch = props.node?.properties?.metastring?.match(/^([^\s]+)\s+(.+)$/);
    const fileNameMatch = props.node?.properties?.metastring?.match(/^([^:]+)$/);

    if (fileNameColonMatch) {
      // language:filename formatı
      fileName = fileNameColonMatch[2].trim();
    } else if (fileNameSpaceMatch) {
      // language filename formatı
      fileName = fileNameSpaceMatch[2].trim();
    } else if (fileNameMatch) {
      // Sadece dosya adı formatı
      fileName = fileNameMatch[1].trim();
    }

    // Dosya adını temizle (tırnak işaretleri vb.)
    if (fileName) {
      fileName = fileName.replace(/^['"](.*)['"]$/, '$1');

      // Terminal komutlarını dosya adı olarak algılamayı önle
      if (fileName.startsWith('cd ') ||
          fileName.startsWith('npm ') ||
          fileName.startsWith('node ') ||
          fileName.startsWith('python ') ||
          fileName.startsWith('git ')) {
        // Bu bir terminal komutu, dosya adı olarak kullanma
        fileName = '';
      }
    }

    // Kod içeriğini kontrol et - terminal komutu içeriyorsa uyarı ver
    const isTerminalCommand = code.trim().startsWith('cd ') ||
                             code.trim().startsWith('npm ') ||
                             code.trim().startsWith('node ') ||
                             code.trim().startsWith('python ') ||
                             code.trim().startsWith('git ');

    // Eğer bu bir terminal komutu ise ve dosya adı yoksa, özel bir sınıf ekle
    const isCommand = isTerminalCommand && !fileName;

    if (!inline && language) {
      return (
        <div className={`code-block-container ${isCommand ? 'terminal-command-container' : ''}`}>
          <div className="code-block-header">
            <div className="code-block-info">
              {isCommand ? (
                <span className="code-block-language terminal-command-label">Terminal Komutu</span>
              ) : (
                <span className="code-block-language">{language}</span>
              )}
              {fileName && <span className="code-block-filename">{fileName}</span>}
            </div>
            <div className="code-block-actions">
              {!isCommand && (
                <button
                  className="code-block-action-btn"
                  onClick={() => {
                    // Dosya adı varsa, o adla oluştur, yoksa dil uzantısıyla oluştur
                    if (fileName) {
                      onCreateFile(fileName, code);
                    } else {
                      onCreateFile(code, language);
                    }
                  }}
                  title="Dosya Oluştur"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}

              {isCommand ? (
                <button
                  className="code-block-action-btn"
                  onClick={() => {
                    // Terminal komutu çalıştır
                    onRunCode(code, 'bash');
                  }}
                  title="Komutu Çalıştır"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                ['javascript', 'python', 'html', 'js', 'jsx', 'ts', 'tsx', 'py'].includes(language) && (
                  <button
                    className="code-block-action-btn"
                    onClick={() => onRunCode(code, language)}
                    title="Çalıştır"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )
              )}

              <button
                className="code-block-action-btn"
                onClick={() => navigator.clipboard.writeText(code)}
                title="Kopyala"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <pre className={className} {...props}>
            <code className={`language-${isCommand ? 'bash' : language}`}>
              {code}
            </code>
          </pre>
        </div>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };

  return (
    <div className="markdown-renderer">
      <ReactMarkdown
        components={{
          code: CodeBlock,
          // Diğer bileşenleri özelleştirebilirsiniz
          h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
          h4: ({ node, ...props }) => <h4 className="markdown-h4" {...props} />,
          p: ({ node, ...props }) => <p className="markdown-p" {...props} />,
          ul: ({ node, ...props }) => <ul className="markdown-ul" {...props} />,
          ol: ({ node, ...props }) => <ol className="markdown-ol" {...props} />,
          li: ({ node, ...props }) => <li className="markdown-li" {...props} />,
          a: ({ node, ...props }) => <a className="markdown-a" target="_blank" rel="noopener noreferrer" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="markdown-blockquote" {...props} />,
          table: ({ node, ...props }) => <table className="markdown-table" {...props} />,
          thead: ({ node, ...props }) => <thead className="markdown-thead" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="markdown-tbody" {...props} />,
          tr: ({ node, ...props }) => <tr className="markdown-tr" {...props} />,
          th: ({ node, ...props }) => <th className="markdown-th" {...props} />,
          td: ({ node, ...props }) => <td className="markdown-td" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
