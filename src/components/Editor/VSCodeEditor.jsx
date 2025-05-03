import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import './VSCodeEditor.css';

// Dil uzantılarına göre Monaco dil tanımlamaları
const getLanguageForFile = (fileName) => {
  if (!fileName) return 'plaintext';
  
  const extension = fileName.split('.').pop().toLowerCase();
  
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
    'cs': 'csharp',
    'go': 'go',
    'php': 'php',
    'rb': 'ruby',
    'rs': 'rust',
    'sh': 'shell',
    'sql': 'sql',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml'
  };
  
  return languageMap[extension] || 'plaintext';
};

const VSCodeEditor = ({ file, projectId, onSave }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Editör oluşturma
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Monaco editör oluştur
    monacoRef.current = monaco.editor.create(containerRef.current, {
      value: '',
      language: 'plaintext',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {
        enabled: true
      },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: 'on',
      tabSize: 2,
      wordWrap: 'on'
    });
    
    // Ctrl+S ile kaydetme
    monacoRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (file && onSave) {
        handleSave();
      }
    });
    
    // Temizlik
    return () => {
      if (monacoRef.current) {
        monacoRef.current.dispose();
      }
    };
  }, []);
  
  // Dosya değiştiğinde içeriği yükle
  useEffect(() => {
    const loadFileContent = async () => {
      if (!file || !file.path || !projectId || !monacoRef.current) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/projects/${projectId}/files/${file.path}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Dil belirleme
        const language = getLanguageForFile(file.name);
        
        // Editör modelini güncelle
        const uri = monaco.Uri.parse(`file:///${file.path}`);
        let model = monaco.editor.getModel(uri);
        
        if (!model) {
          model = monaco.editor.createModel(data.content, language, uri);
        } else {
          model.setValue(data.content);
          monaco.editor.setModelLanguage(model, language);
        }
        
        monacoRef.current.setModel(model);
        
        // Editör referansını güncelle
        editorRef.current = {
          path: file.path,
          model
        };
        
      } catch (err) {
        console.error('Error loading file:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFileContent();
  }, [file, projectId]);
  
  // Dosya kaydetme
  const handleSave = async () => {
    if (!editorRef.current || !projectId) return;
    
    try {
      const content = editorRef.current.model.getValue();
      
      const response = await fetch(`/api/projects/${projectId}/files/${editorRef.current.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.status} ${response.statusText}`);
      }
      
      if (onSave) {
        onSave(editorRef.current.path);
      }
      
      // Başarı mesajı
      const statusBarItem = document.createElement('div');
      statusBarItem.className = 'editor-status-message success';
      statusBarItem.textContent = 'Dosya kaydedildi';
      document.body.appendChild(statusBarItem);
      
      setTimeout(() => {
        statusBarItem.remove();
      }, 2000);
      
    } catch (err) {
      console.error('Error saving file:', err);
      
      // Hata mesajı
      const statusBarItem = document.createElement('div');
      statusBarItem.className = 'editor-status-message error';
      statusBarItem.textContent = `Hata: ${err.message}`;
      document.body.appendChild(statusBarItem);
      
      setTimeout(() => {
        statusBarItem.remove();
      }, 3000);
    }
  };
  
  return (
    <div className="vscode-editor-container">
      {isLoading && (
        <div className="editor-loading">
          <div className="spinner"></div>
          <span>Dosya yükleniyor...</span>
        </div>
      )}
      
      {error && (
        <div className="editor-error">
          <span>Hata: {error}</span>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="monaco-editor-container"
        style={{ visibility: isLoading ? 'hidden' : 'visible' }}
      />
      
      <div className="editor-statusbar">
        <div className="statusbar-left">
          {file && (
            <>
              <span className="statusbar-language">{getLanguageForFile(file.name).toUpperCase()}</span>
              <span className="statusbar-encoding">UTF-8</span>
            </>
          )}
        </div>
        
        <div className="statusbar-right">
          <button className="statusbar-save-button" onClick={handleSave} disabled={!file}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default VSCodeEditor;
