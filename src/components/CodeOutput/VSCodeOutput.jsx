import React, { useState, useEffect } from 'react';
import './VSCodeOutput.css';

const VSCodeOutput = ({ projectId, runOutput, errors }) => {
  const [activeTab, setActiveTab] = useState('output');
  const [outputContent, setOutputContent] = useState('');
  const [errorContent, setErrorContent] = useState([]);
  
  useEffect(() => {
    if (runOutput) {
      setOutputContent(runOutput);
      setActiveTab('output');
    }
  }, [runOutput]);
  
  useEffect(() => {
    if (errors && errors.length > 0) {
      setErrorContent(errors);
      setActiveTab('problems');
    }
  }, [errors]);
  
  return (
    <div className="vscode-output-container">
      <div className="output-tabs">
        <button 
          className={`output-tab ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          ÇIKTI
        </button>
        <button 
          className={`output-tab ${activeTab === 'problems' ? 'active' : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          SORUNLAR {errorContent.length > 0 && <span className="error-count">{errorContent.length}</span>}
        </button>
        <button 
          className={`output-tab ${activeTab === 'debug' ? 'active' : ''}`}
          onClick={() => setActiveTab('debug')}
        >
          HATA AYIKLAMA
        </button>
      </div>
      
      <div className="output-content">
        {activeTab === 'output' && (
          <div className="output-panel">
            {outputContent ? (
              <pre className="output-text">{outputContent}</pre>
            ) : (
              <div className="empty-output">
                <p>Henüz çıktı yok. Projeyi çalıştırmak için "Çalıştır" düğmesine tıklayın.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'problems' && (
          <div className="problems-panel">
            {errorContent.length > 0 ? (
              <div className="error-list">
                {errorContent.map((error, index) => (
                  <div key={index} className="error-item">
                    <div className="error-icon">⚠️</div>
                    <div className="error-details">
                      <div className="error-message">{error.message}</div>
                      {error.file && (
                        <div className="error-location">
                          {error.file}
                          {error.line && `:${error.line}`}
                          {error.column && `:${error.column}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-problems">
                <p>Sorun bulunamadı.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'debug' && (
          <div className="debug-panel">
            <div className="empty-debug">
              <p>Hata ayıklama oturumu başlatılmadı.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VSCodeOutput;
