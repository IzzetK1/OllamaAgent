import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VSCodeFileExplorer from './FileExplorer/VSCodeFileExplorer';
import WarningsPanel from './Warnings/WarningsPanel';
import TerminalPanel from './Terminal/TerminalPanel';
import MonacoEditor from 'react-monaco-editor';
import { FaCode, FaExclamationTriangle, FaTerminal, FaPlay, FaSave } from 'react-icons/fa';
import './MainLayout.css';

const MainLayout = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('files'); // 'files', 'warnings', 'terminal'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    if (selectedFile) {
      fetchFileContent(selectedFile.path);
    }
  }, [selectedFile]);
  
  const fetchFileContent = async (filePath) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${filePath}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setFileContent(data.content || '');
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  };
  
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };
  
  const handleSaveFile = async () => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${selectedFile.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: fileContent
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };
  
  const handleRunProject = async () => {
    setIsRunning(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run project: ${response.status} ${response.statusText}`);
      }
      
      // Terminal sekmesine geç
      setActiveTab('terminal');
    } catch (error) {
      console.error('Error running project:', error);
    } finally {
      setIsRunning(false);
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
  
  // Editor ayarları
  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: {
      enabled: true
    },
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all',
    scrollbar: {
      useShadows: true,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  };
  
  return (
    <div className="main-layout">
      <div className="sidebar">
        <div className="sidebar-tabs">
          <div 
            className={`sidebar-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <FaCode />
          </div>
          
          <div 
            className={`sidebar-tab ${activeTab === 'warnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('warnings')}
          >
            <FaExclamationTriangle />
          </div>
          
          <div 
            className={`sidebar-tab ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            <FaTerminal />
          </div>
        </div>
        
        <div className="sidebar-content">
          {activeTab === 'files' && (
            <VSCodeFileExplorer 
              projectId={projectId} 
              onFileSelect={handleFileSelect} 
            />
          )}
          
          {activeTab === 'warnings' && (
            <WarningsPanel projectId={projectId} />
          )}
          
          {activeTab === 'terminal' && (
            <TerminalPanel projectId={projectId} />
          )}
        </div>
      </div>
      
      <div className="content">
        {selectedFile ? (
          <>
            <div className="editor-header">
              <div className="file-path">{selectedFile.path}</div>
              
              <div className="editor-actions">
                <button 
                  className="action-button save"
                  onClick={handleSaveFile}
                >
                  <FaSave />
                  <span>Kaydet</span>
                </button>
                
                <button 
                  className="action-button run"
                  onClick={handleRunProject}
                  disabled={isRunning}
                >
                  <FaPlay />
                  <span>{isRunning ? 'Çalışıyor...' : 'Çalıştır'}</span>
                </button>
              </div>
            </div>
            
            <div className="editor-container">
              <MonacoEditor
                width="100%"
                height="100%"
                language={getLanguage(selectedFile.path)}
                theme="vs-dark"
                value={fileContent}
                options={editorOptions}
                onChange={setFileContent}
              />
            </div>
          </>
        ) : (
          <div className="empty-editor">
            <div className="empty-message">
              <FaCode size={48} />
              <h3>Dosya seçilmedi</h3>
              <p>Düzenlemek için sol taraftan bir dosya seçin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;
