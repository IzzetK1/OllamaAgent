import React, { useState, useEffect } from 'react';
import VSCodeFileExplorer from '../FileExplorer/VSCodeFileExplorer';
import VSCodeEditor from '../Editor/VSCodeEditor';
import VSCodeTerminal from '../Terminal/VSCodeTerminal';
import VSCodeOutput from '../CodeOutput/VSCodeOutput';
import './VSCodeLayout.css';

const VSCodeLayout = ({ projectId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [runOutput, setRunOutput] = useState('');
  const [errors, setErrors] = useState([]);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showOutput, setShowOutput] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [activeBottomTab, setActiveBottomTab] = useState('terminal');
  
  // Dosya seçme
  const handleFileSelect = (file) => {
    if (file.type === 'file') {
      setSelectedFile(file);
    }
  };
  
  // Dosya kaydetme
  const handleFileSave = (path) => {
    console.log('File saved:', path);
  };
  
  // Projeyi çalıştırma
  const handleRunProject = async () => {
    try {
      setRunOutput('Proje çalıştırılıyor...');
      setErrors([]);
      setShowOutput(true);
      setActiveBottomTab('output');
      
      const response = await fetch(`/api/projects/${projectId}/run`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run project: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
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
        setShowTerminal(!showTerminal);
      } else {
        setShowTerminal(true);
        setActiveBottomTab('terminal');
      }
    } else if (panel === 'output') {
      if (activeBottomTab === 'output' || activeBottomTab === 'problems') {
        setShowOutput(!showOutput);
      } else {
        setShowOutput(true);
        setActiveBottomTab('output');
      }
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
            {selectedFile ? (
              <VSCodeEditor 
                file={selectedFile} 
                projectId={projectId} 
                onSave={handleFileSave} 
              />
            ) : (
              <div className="welcome-screen">
                <h2>Hoş Geldiniz</h2>
                <p>Düzenlemek için sol taraftaki dosya gezgininden bir dosya seçin.</p>
                <div className="welcome-actions">
                  <button className="welcome-button" onClick={() => setShowTerminal(true)}>Terminal'i Aç</button>
                  <button className="welcome-button" onClick={handleRunProject}>Projeyi Çalıştır</button>
                </div>
              </div>
            )}
          </div>
          
          {/* Alt Panel */}
          {(showTerminal || showOutput) && (
            <>
              <div className="bottom-resize-handle" onMouseDown={handleBottomResize}></div>
              
              <div className="bottom-panel" style={{ height: `${bottomPanelHeight}px` }}>
                <div className="bottom-tabs">
                  <button 
                    className={`bottom-tab ${activeBottomTab === 'terminal' ? 'active' : ''}`}
                    onClick={() => toggleBottomPanel('terminal')}
                  >
                    TERMİNAL
                  </button>
                  <button 
                    className={`bottom-tab ${activeBottomTab === 'output' || activeBottomTab === 'problems' ? 'active' : ''}`}
                    onClick={() => toggleBottomPanel('output')}
                  >
                    ÇIKTI
                  </button>
                  <button className="bottom-tab-close" onClick={() => {
                    if (activeBottomTab === 'terminal') {
                      setShowTerminal(false);
                    } else {
                      setShowOutput(false);
                    }
                  }}>×</button>
                </div>
                
                <div className="bottom-content">
                  {activeBottomTab === 'terminal' && showTerminal && (
                    <VSCodeTerminal projectId={projectId} />
                  )}
                  
                  {(activeBottomTab === 'output' || activeBottomTab === 'problems') && showOutput && (
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

export default VSCodeLayout;
