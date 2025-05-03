import React, { useState, useEffect, useRef } from 'react';
import { FaFolder, FaFolderOpen, FaFile, FaCode, FaTerminal, FaPlay } from 'react-icons/fa';
import { VscWarning, VscError, VscInfo } from 'react-icons/vsc';
import MonacoEditor from 'react-monaco-editor';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './CustomVSCode.css';

const CustomVSCode = ({ projectId }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [diagnostics, setDiagnostics] = useState([]);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('files'); // 'files', 'warnings', 'terminal'
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const terminalSocketRef = useRef(null);
  const terminalIdRef = useRef(null);
  const editorRef = useRef(null);

  // Dosyaları yükle
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/files`);
        if (response.ok) {
          const data = await response.json();
          setFiles(data);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();

    // WebSocket bağlantısı
    const socket = new WebSocket(`ws://${window.location.hostname}:3005`);

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'file_created' || data.type === 'file_updated' || data.type === 'file_deleted') {
          // Dosya değişikliği olduğunda dosya listesini güncelle
          fetchFiles();

          // Eğer açık dosya güncellendiyse, içeriğini güncelle
          if (selectedFile && data.file && data.file.path === selectedFile.path) {
            fetchFileContent(selectedFile.path);
          }
        } else if (data.type === 'diagnostic') {
          // Tanılama bilgilerini güncelle
          setDiagnostics(prev => [...prev, data.diagnostic]);
        } else if (data.type === 'terminal_output') {
          // Terminal çıktısını güncelle
          if (terminalInstanceRef.current && data.terminalId === terminalIdRef.current) {
            terminalInstanceRef.current.write(data.output);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    terminalSocketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [projectId, selectedFile]);

  // Terminal oluştur
  useEffect(() => {
    if (terminalRef.current && !terminalInstanceRef.current) {
      const terminal = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4'
        }
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      terminal.open(terminalRef.current);
      fitAddon.fit();

      terminal.onData(data => {
        if (terminalSocketRef.current && terminalIdRef.current) {
          terminalSocketRef.current.send(JSON.stringify({
            type: 'terminal_input',
            terminalId: terminalIdRef.current,
            input: data
          }));
        }
      });

      terminalInstanceRef.current = terminal;

      // Terminal oluştur
      if (terminalSocketRef.current) {
        terminalSocketRef.current.send(JSON.stringify({
          type: 'create_terminal',
          projectId
        }));

        // Terminal ID'sini al
        const originalOnMessage = terminalSocketRef.current.onmessage;

        terminalSocketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'terminal_created') {
              terminalIdRef.current = data.terminalId;

              // Orijinal onmessage fonksiyonunu geri yükle
              terminalSocketRef.current.onmessage = originalOnMessage;
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }

          // Orijinal onmessage fonksiyonunu çağır
          if (originalOnMessage) {
            originalOnMessage(event);
          }
        };
      }

      // Terminal boyutunu pencere boyutuna göre ayarla
      const handleResize = () => {
        if (fitAddon) {
          fitAddon.fit();
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        terminal.dispose();
        terminalInstanceRef.current = null;
      };
    }
  }, [projectId, terminalRef.current]);

  // Dosya içeriğini yükle
  const fetchFileContent = async (filePath) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${filePath}`);
      if (response.ok) {
        const data = await response.json();
        setFileContent(data.content);
      }
    } catch (error) {
      console.error(`Error fetching file content for ${filePath}:`, error);
    }
  };

  // Dosya seç
  const handleFileSelect = async (file) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      await fetchFileContent(file.path);
    }
  };

  // Klasör aç/kapat
  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Dosya içeriğini kaydet
  const handleSaveFile = async () => {
    if (!selectedFile) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/files/${selectedFile.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: fileContent })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error saving file ${selectedFile.path}:`, error);
    }
  };

  // Projeyi çalıştır
  const handleRunProject = async () => {
    setIsRunning(true);
    setTerminalOutput([]);

    try {
      const response = await fetch(`/api/projects/${projectId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      setTerminalOutput(prev => [
        ...prev,
        {
          type: 'command',
          content: result.command
        },
        {
          type: result.exitCode === 0 ? 'stdout' : 'stderr',
          content: result.exitCode === 0 ? result.stdout : result.stderr
        }
      ]);

      // Tarayıcıda açılacak bir URL varsa, aç
      if (result.openInBrowser && result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      console.error('Error running project:', error);

      setTerminalOutput(prev => [
        ...prev,
        {
          type: 'stderr',
          content: `Error: ${error.message}`
        }
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // Dosya ağacını render et
  const renderFileTree = (items, level = 0) => {
    // Eğer dosya listesi boşsa, örnek dosyalar göster
    if (!items || items.length === 0) {
      const sampleFiles = [
        {
          path: 'index.html',
          name: 'index.html',
          type: 'file',
          size: 804
        },
        {
          path: 'script.js',
          name: 'script.js',
          type: 'file',
          size: 512
        },
        {
          path: 'App.js',
          name: 'App.js',
          type: 'file',
          size: 207
        }
      ];

      return sampleFiles.map((item) => (
        <div
          key={item.path}
          className={`file-item file ${selectedFile && selectedFile.path === item.path ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 16}px` }}
          onClick={() => handleFileSelect(item)}
        >
          <div className="file-icon">
            <FaFile />
          </div>
          <div className="file-name">{item.name}</div>
          {item.size && <div className="file-size">{formatFileSize(item.size)}</div>}
        </div>
      ));
    }

    return items.map((item) => {
      const isFolder = item.type === 'directory';
      const isExpanded = expandedFolders[item.path];

      return (
        <React.Fragment key={item.path}>
          <div
            className={`file-item ${isFolder ? 'folder' : 'file'} ${selectedFile && selectedFile.path === item.path ? 'selected' : ''}`}
            style={{ paddingLeft: `${level * 16}px` }}
            onClick={() => isFolder ? toggleFolder(item.path) : handleFileSelect(item)}
          >
            <div className="file-icon">
              {isFolder ? (isExpanded ? <FaFolderOpen /> : <FaFolder />) : <FaFile />}
            </div>
            <div className="file-name">{item.name}</div>
            {item.size && <div className="file-size">{formatFileSize(item.size)}</div>}
          </div>

          {isFolder && isExpanded && item.children && renderFileTree(item.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  // Dosya boyutunu formatla
  const formatFileSize = (size) => {
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Tanılama bilgilerini render et
  const renderDiagnostics = () => {
    // Örnek uyarılar
    const sampleDiagnostics = [
      {
        severity: 'warning',
        message: 'Dosya oluşturma hatası: Geçersiz dosya yolu. Bir klasöre yazılamaz.',
        file: 'index.html',
        line: 10,
        column: 5
      },
      {
        severity: 'error',
        message: 'Command failed: python -m http.server 3000',
        file: 'script.js',
        line: 15,
        column: 10
      },
      {
        severity: 'warning',
        message: 'Dosya oluşturma hatası: Geçersiz dosya yolu. Bir klasöre yazılamaz.',
        file: 'App.js',
        line: 20,
        column: 15
      }
    ];

    const diagsToShow = diagnostics.length > 0 ? diagnostics : sampleDiagnostics;

    return diagsToShow.map((diagnostic, index) => (
      <div
        key={index}
        className={`diagnostic-item ${diagnostic.severity}`}
        onClick={() => {
          // Dosyayı aç ve ilgili satıra git
          if (diagnostic.file) {
            const file = files.find(f => f.path === diagnostic.file);
            if (file) {
              handleFileSelect(file);

              // Editor hazır olduğunda ilgili satıra git
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.revealLineInCenter(diagnostic.line);
                  editorRef.current.setPosition({
                    lineNumber: diagnostic.line,
                    column: diagnostic.column || 1
                  });
                  editorRef.current.focus();
                }
              }, 100);
            }
          }
        }}
      >
        <div className="diagnostic-icon">
          {diagnostic.severity === 'error' ? <VscError /> : <VscWarning />}
        </div>
        <div className="diagnostic-content">
          <div className="diagnostic-message">{diagnostic.message}</div>
          {diagnostic.file && (
            <div className="diagnostic-location">
              {diagnostic.file}:{diagnostic.line}:{diagnostic.column || 1}
            </div>
          )}
        </div>
      </div>
    ));
  };

  // Terminal çıktısını render et
  const renderTerminalOutput = () => {
    // Terminal referansı yoksa örnek çıktılar göster
    if (!terminalInstanceRef.current) {
      return (
        <div className="terminal-container">
          <div className="sample-terminal">
            <div className="terminal-line command">$ cd calculator-app</div>
            <div className="terminal-line">Klasör değiştirildi: calculator-app</div>
            <div className="terminal-line command">$ npm install</div>
            <div className="terminal-line">Paketler yükleniyor...</div>
            <div className="terminal-line success">Paketler başarıyla yüklendi</div>
            <div className="terminal-line command">$ npm start</div>
            <div className="terminal-line">Uygulama başlatılıyor...</div>
            <div className="terminal-line error">Command failed: python -m http.server 3000</div>
            <div className="terminal-line error">python: No module named http.server</div>
          </div>
        </div>
      );
    }

    return (
      <div className="terminal-container">
        <div ref={terminalRef} className="terminal"></div>
      </div>
    );
  };

  // Editor ayarları
  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: {
      enabled: true
    }
  };

  // Dosya türüne göre dil belirle
  const getLanguage = (filePath) => {
    if (!filePath) return 'plaintext';

    const ext = filePath.split('.').pop().toLowerCase();

    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'php': 'php',
      'rb': 'ruby',
      'rs': 'rust',
      'sh': 'shell',
      'bash': 'shell',
      'sql': 'sql',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'txt': 'plaintext'
    };

    return languageMap[ext] || 'plaintext';
  };

  return (
    <div className="vscode-workspace">
      <div className="workspace-sidebar">
        <div className="sidebar-tabs">
          <div
            className={`sidebar-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <FaCode />
            <span>OLUŞTURULAN DOSYALAR</span>
          </div>

          <div
            className={`sidebar-tab ${activeTab === 'warnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('warnings')}
          >
            <VscWarning />
            <span>UYARILAR</span>
            {diagnostics.length > 0 && (
              <span className="badge">{diagnostics.length}</span>
            )}
          </div>

          <div
            className={`sidebar-tab ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            <FaTerminal />
            <span>ÇALIŞTIRMA SONUÇLARI</span>
          </div>
        </div>

        <div className="sidebar-content">
          {activeTab === 'files' && (
            <div className="file-tree">
              <div className="file-explorer-header">
                <h3>OLUŞTURULAN DOSYALAR</h3>
              </div>
              {renderFileTree(files)}
            </div>
          )}

          {activeTab === 'warnings' && (
            <div className="diagnostics-container">
              <div className="file-explorer-header">
                <h3>UYARILAR</h3>
              </div>
              <div className="diagnostics-list">
                {renderDiagnostics()}
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="terminal-container-wrapper">
              <div className="file-explorer-header">
                <h3>ÇALIŞTIRMA SONUÇLARI</h3>
              </div>
              <div className="terminal-output">
                {renderTerminalOutput()}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="workspace-content">
        {selectedFile ? (
          <div className="editor-container">
            <div className="editor-header">
              <div className="file-path">{selectedFile.path}</div>

              <div className="editor-actions">
                <button
                  className="save-button"
                  onClick={handleSaveFile}
                >
                  Kaydet
                </button>

                <button
                  className="run-button"
                  onClick={handleRunProject}
                  disabled={isRunning}
                >
                  <FaPlay />
                  {isRunning ? 'Çalışıyor...' : 'Çalıştır'}
                </button>
              </div>
            </div>

            <MonacoEditor
              width="100%"
              height="calc(100% - 40px)"
              language={getLanguage(selectedFile.path)}
              theme="vs-dark"
              value={fileContent}
              options={editorOptions}
              onChange={setFileContent}
              editorDidMount={(editor) => {
                editorRef.current = editor;
              }}
            />
          </div>
        ) : (
          <div className="empty-editor">
            <div className="empty-editor-message">
              <FaCode size={48} />
              <h3>Dosya seçilmedi</h3>
              <p>Düzenlemek için sol taraftan bir dosya seçin veya yeni bir dosya oluşturun.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomVSCode;
