import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import ProjectsPage from './pages/ProjectsPage';
import EditorPage from './pages/EditorPage';
import VSCodeEditorPage from './pages/VSCodeEditorPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if server is running
    fetch('/api/projects')
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          console.error('Server responded with status:', res.status);
          return res.text().then(text => {
            try {
              const errorData = JSON.parse(text);
              console.error('Server error details:', errorData);
            } catch (e) {
              console.error('Server error (raw):', text);
            }
            throw new Error(`Server responded with status: ${res.status}`);
          });
        }
      })
      .then(data => {
        console.log('Projects loaded successfully:', data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error connecting to server:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-dark-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={theme}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<EditorPage />} />
          <Route path="projects/:projectId/vscode" element={<VSCodeEditorPage />} />
          <Route path="projects/:projectId/ide" element={<VSCodeEditorPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
