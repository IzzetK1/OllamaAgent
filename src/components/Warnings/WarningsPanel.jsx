import React, { useState, useEffect } from 'react';
import { VscWarning, VscError, VscInfo } from 'react-icons/vsc';
import './WarningsPanel.css';

const WarningsPanel = ({ projectId }) => {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!projectId) return;
    
    const fetchWarnings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/diagnostics`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch warnings: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setWarnings(data.diagnostics || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching warnings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWarnings();
    
    // WebSocket ile uyarı değişikliklerini dinle
    const socket = new WebSocket(`ws://${window.location.hostname}:3005`);
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'diagnostic') {
          setWarnings(prev => [...prev, data.diagnostic]);
        } else if (data.type === 'diagnostics_clear') {
          setWarnings([]);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };
    
    return () => {
      socket.close();
    };
  }, [projectId]);
  
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <VscError className="severity-icon error" />;
      case 'warning':
        return <VscWarning className="severity-icon warning" />;
      default:
        return <VscInfo className="severity-icon info" />;
    }
  };
  
  const handleWarningClick = (warning) => {
    // Dosyayı açma ve ilgili satıra gitme işlevi
    if (warning.file && warning.line) {
      // Bu işlev, ana bileşenden prop olarak geçirilebilir
      console.log(`Open file: ${warning.file}, line: ${warning.line}`);
    }
  };
  
  if (loading) {
    return <div className="warnings-loading">Uyarılar yükleniyor...</div>;
  }
  
  if (error) {
    return <div className="warnings-error">Hata: {error}</div>;
  }
  
  return (
    <div className="warnings-panel">
      <div className="warnings-header">
        <span className="warnings-title">UYARILAR</span>
        {warnings.length > 0 && (
          <span className="warnings-count">{warnings.length}</span>
        )}
      </div>
      
      <div className="warnings-list">
        {warnings.length === 0 ? (
          <div className="empty-warnings">
            <VscInfo className="empty-icon" />
            <span className="empty-message">Herhangi bir uyarı veya hata yok.</span>
          </div>
        ) : (
          warnings.map((warning, index) => (
            <div 
              key={index} 
              className={`warning-item ${warning.severity}`}
              onClick={() => handleWarningClick(warning)}
            >
              <div className="warning-icon">
                {getSeverityIcon(warning.severity)}
              </div>
              
              <div className="warning-content">
                <div className="warning-message">{warning.message}</div>
                
                {warning.file && (
                  <div className="warning-location">
                    {warning.file}:{warning.line}:{warning.column || 1}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WarningsPanel;
