import React, { useState, useEffect } from 'react';
import VSCodeFileExplorer from './FileExplorer/VSCodeFileExplorer';
import VSCodeEditor from './Editor/VSCodeEditor';
import VSCodeTerminal from './Terminal/VSCodeTerminal';
import VSCodeOutput from './CodeOutput/VSCodeOutput';
import { FiMaximize2, FiMinimize2, FiSave, FiPlay, FiX } from 'react-icons/fi';
import fileSystemService from '../services/FileSystemService';
import terminalService from '../services/TerminalService';
import './VSCodeWorkspace.css';

const VSCodeWorkspace = ({ projectId }) => {
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [runOutput, setRunOutput] = useState('');
  const [errors, setErrors] = useState([]);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [activeBottomTab, setActiveBottomTab] = useState('terminal');
  const [editorOptions, setEditorOptions] = useState({
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    fontFamily: 'Fira Code, monospace',
    fontSize: 14,
    tabSize: 2,
  });

  // Dosya listesini al
  useEffect(() => {
    if (!projectId) return;

    const fetchFiles = async () => {
      try {
        const fileList = await fileSystemService.listFiles(projectId);
        setFiles(fileList);
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();

    // WebSocket ile dosya değişikliklerini dinle
    const socket = new WebSocket(`ws://${window.location.hostname}:3005`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'file_created' || data.type === 'file_updated' || data.type === 'file_deleted') {
          fetchFiles();
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    return () => {
      socket.close();
    };
  }, [projectId]);

  // Dosya seç
  const handleFileSelect = (file) => {
    if (file.type === 'file') {
      setCurrentFile(file);
    }
  };

  // Dosyayı kaydet
  const handleFileSave = (path) => {
    console.log('File saved:', path);
  };

  // Projeyi çalıştır
  const handleRunProject = async () => {
    try {
      setRunOutput('Proje çalıştırılıyor...');
      setErrors([]);
      setIsOutputVisible(true);
      setActiveBottomTab('output');

      const result = await terminalService.runProject(projectId);

      if (result.output) {
        setRunOutput(result.output);
      }

      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors);
        setActiveBottomTab('problems');
      }
    } catch (error) {
      console.error('Error running project:', error);
      setRunOutput(`Hata: ${error.message}`);
      setErrors([{ message: error.message }]);
    }
  };

  // Alt panel yüksekliğini ayarlama
  const handleBottomResize = (e) => {
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;

    const handleMouseMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.max(100, Math.min(500, startHeight + deltaY));
      setBottomPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Kenar çubuğu genişliğini ayarlama
  const handleSidebarResize = (e) => {
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(150, Math.min(500, startWidth + deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Terminal ve çıktı panellerini değiştirme
  const toggleBottomPanel = (panel) => {
    if (panel === 'terminal') {
      if (activeBottomTab === 'terminal') {
        setIsTerminalVisible(!isTerminalVisible);
      } else {
        setIsTerminalVisible(true);
        setActiveBottomTab('terminal');
      }
    } else if (panel === 'output') {
      if (activeBottomTab === 'output' || activeBottomTab === 'problems') {
        setIsOutputVisible(!isOutputVisible);
      } else {
        setIsOutputVisible(true);
        setActiveBottomTab('output');
      }
    }
  };

  // Terminal komutu çalıştır
  const handleTerminalCommand = async (command) => {
    try {
      // Komut geçmişine ekle
      terminalService.addToCommandHistory(projectId, command);

      // Komutu çalıştır
      const result = await terminalService.executeCommand(projectId, command);
      console.log('Command result:', result);

      // Dosya listesini güncelle (komut dosya sistemini değiştirmiş olabilir)
      const fileList = await fileSystemService.listFiles(projectId);
      setFiles(fileList);
    } catch (error) {
      console.error(`Error executing command "${command}":`, error);
    }
  };

  // Dosya uzantısına göre dil belirle
  const getLanguageFromFilename = (filename) => {
    if (!filename) return 'text';

    const ext = filename.split('.').pop().toLowerCase();

    switch (ext) {
      case 'js':
        return 'javascript';
      case 'jsx':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'c':
        return 'c';
      case 'cpp':
        return 'cpp';
      case 'go':
        return 'go';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'rs':
        return 'rust';
      case 'sh':
        return 'shell';
      default:
        return 'text';
    }
  };

  return (
    <div className="vscode-layout">
      {/* Üst Menü */}
      <div className="vscode-menubar">
        <div className="menubar-left">
          <button className="menu-button">Dosya</button>
          <button className="menu-button">Düzenle</button>
          <button className="menu-button">Görünüm</button>
          <button className="menu-button">Git</button>
          <button className="menu-button">Çalıştır</button>
        </div>

        <div className="menubar-center">
          <span className="project-title">{projectId}</span>
        </div>

        <div className="menubar-right">
          <button className="run-button" onClick={handleRunProject}>
            <span className="run-icon">▶</span> Çalıştır
          </button>
        </div>
      </div>

      <div className="vscode-main">
        {/* Kenar Çubuğu */}
        <div className="vscode-sidebar" style={{ width: `${sidebarWidth}px` }}>
          <div className="sidebar-activity-bar">
            <button className="activity-button active">
              <span className="activity-icon">📁</span>
            </button>
            <button className="activity-button">
              <span className="activity-icon">🔍</span>
            </button>
            <button className="activity-button">
              <span className="activity-icon">🔄</span>
            </button>
            <button className="activity-button">
              <span className="activity-icon">🐞</span>
            </button>
            <button className="activity-button">
              <span className="activity-icon">📦</span>
            </button>
          </div>

          <div className="sidebar-content">
            <div className="file-explorer-header">
              <h3>OLUŞTURULAN DOSYALAR</h3>
            </div>
            <VSCodeFileExplorer
              projectId={projectId}
              onFileSelect={handleFileSelect}
            />
          </div>

          <div className="sidebar-resize-handle" onMouseDown={handleSidebarResize}></div>
        </div>

        {/* Ana İçerik */}
        <div className="vscode-content">
          <div className="editor-container">
            {currentFile ? (
              <VSCodeEditor
                file={currentFile}
                projectId={projectId}
                onSave={handleFileSave}
              />
            ) : (
              <div className="welcome-screen">
                <h2>Hoş Geldiniz</h2>
                <p>Düzenlemek için sol taraftaki dosya gezgininden bir dosya seçin.</p>
                <div className="welcome-actions">
                  <button className="welcome-button" onClick={() => setIsTerminalVisible(true)}>Terminal'i Aç</button>
                  <button className="welcome-button" onClick={handleRunProject}>Projeyi Çalıştır</button>
                </div>
              </div>
            )}
          </div>

          {/* Alt Panel */}
          {(isTerminalVisible || isOutputVisible) && (
            <>
              <div className="bottom-resize-handle" onMouseDown={handleBottomResize}></div>

              <div className="bottom-panel" style={{ height: `${bottomPanelHeight}px` }}>
                <div className="bottom-tabs">
                  <button
                    className={`bottom-tab ${activeBottomTab === 'terminal' ? 'active' : ''}`}
                    onClick={() => toggleBottomPanel('terminal')}
                  >
                    ÇALIŞTIRMA SONUÇLARI
                  </button>
                  <button
                    className={`bottom-tab ${activeBottomTab === 'output' || activeBottomTab === 'problems' ? 'active' : ''}`}
                    onClick={() => toggleBottomPanel('output')}
                  >
                    UYARILAR
                  </button>
                  <button className="bottom-tab-close" onClick={() => {
                    if (activeBottomTab === 'terminal') {
                      setIsTerminalVisible(false);
                    } else {
                      setIsOutputVisible(false);
                    }
                  }}>×</button>
                </div>

                <div className="bottom-content">
                  {activeBottomTab === 'terminal' && isTerminalVisible && (
                    <VSCodeTerminal projectId={projectId} />
                  )}

                  {(activeBottomTab === 'output' || activeBottomTab === 'problems') && isOutputVisible && (
                    <VSCodeOutput
                      projectId={projectId}
                      runOutput={runOutput}
                      errors={errors}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Durum Çubuğu */}
      <div className="vscode-statusbar">
        <div className="statusbar-left">
          <span className="status-item">
            <span className="status-icon">🔌</span> Ollama
          </span>
          <span className="status-item">
            <span className="status-icon">🌐</span> localhost:3001
          </span>
        </div>

        <div className="statusbar-right">
          <span className="status-item">UTF-8</span>
          <span className="status-item">LF</span>
          <span className="status-item">JavaScript</span>
        </div>
      </div>
    </div>
  );
};

export default VSCodeWorkspace;
