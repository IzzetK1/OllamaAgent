import React, { useState, useEffect, useRef } from 'react';
import { VscRefresh, VscDebugStart, VscChromeClose, VscChevronUp, VscChevronDown } from 'react-icons/vsc';
import './WebPreview.css';

const WebPreview = ({ projectId, url, isMaximized, onMaximize, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    if (url) {
      setIsLoading(true);
      setError(null);
      setCurrentUrl(url);
    }
  }, [url]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleRun = () => {
    // Run the project
    fetch(`/api/projects/${projectId}/run`, {
      method: 'POST'
    })
      .then(response => response.json())
      .then(data => {
        if (data.openInBrowser && data.url) {
          setCurrentUrl(data.url);
          setIsLoading(true);
        } else {
          setError('No preview available for this project');
        }
      })
      .catch(err => {
        setError(`Error running project: ${err.message}`);
      });
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load preview');
  };

  return (
    <div className={`web-preview-container ${isMaximized ? 'maximized' : ''}`}>
      <div className="preview-header">
        <div className="preview-title-area">
          <span className="preview-title">WEB PREVIEW</span>
          {currentUrl && (
            <span className="preview-url">{currentUrl}</span>
          )}
        </div>

        <div className="preview-actions">
          <button className="preview-action-btn" title="Yenile" onClick={handleRefresh}>
            <VscRefresh />
          </button>
          <button className="preview-action-btn" title="Çalıştır" onClick={handleRun}>
            <VscDebugStart />
          </button>
          <button 
            className="preview-action-btn" 
            title={isMaximized ? "Küçült" : "Büyüt"} 
            onClick={onMaximize}
          >
            {isMaximized ? <VscChevronDown /> : <VscChevronUp />}
          </button>
          <button className="preview-action-btn" title="Kapat" onClick={onClose}>
            <VscChromeClose />
          </button>
        </div>
      </div>

      <div className="preview-content">
        {isLoading && (
          <div className="preview-loading">
            <div className="spinner"></div>
            <span>Loading preview...</span>
          </div>
        )}

        {error && (
          <div className="preview-error">
            <span>{error}</span>
            <button className="run-btn" onClick={handleRun}>Run Project</button>
          </div>
        )}

        {currentUrl ? (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="preview-iframe"
            title="Web Preview"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : (
          <div className="preview-placeholder">
            <span>No preview available</span>
            <button className="run-btn" onClick={handleRun}>Run Project</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebPreview;
