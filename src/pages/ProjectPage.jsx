import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VSCodeLayout from '../components/VSCodeLayout/VSCodeLayout';
import './ProjectPage.css';

const ProjectPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        
        // Proje bilgilerini al
        const response = await fetch(`/api/projects/${projectId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Proje bulunamadı');
          }
          throw new Error(`Proje yüklenirken hata oluştu: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setProject(data);
        setError(null);
        
        // Sayfa başlığını güncelle
        document.title = `${data.name} - Ollama Web UI`;
      } catch (err) {
        console.error('Error fetching project:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);
  
  if (loading) {
    return (
      <div className="project-loading">
        <div className="loading-spinner"></div>
        <p>Proje yükleniyor...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="project-error">
        <h2>Hata</h2>
        <p>{error}</p>
        <button onClick={() => window.history.back()}>Geri Dön</button>
      </div>
    );
  }
  
  return (
    <div className="project-page">
      <VSCodeLayout projectId={projectId} />
    </div>
  );
};

export default ProjectPage;
