import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiFolder, FiClock, FiInfo } from 'react-icons/fi';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');

      if (!response.ok) {
        throw new Error('Projeler yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      setProjects(data.projects || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Projeler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!newProject.name.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) {
        throw new Error('Proje oluşturulurken bir hata oluştu');
      }

      const createdProject = await response.json();
      setProjects([...projects, createdProject]);
      setNewProject({ name: '', description: '' });
      setShowNewProjectModal(false);
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Proje oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projeler</h1>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2" />
          Yeni Proje
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg p-8 text-center">
          <FiFolder className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Henüz proje yok</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Yeni bir proje oluşturarak başlayın
          </p>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="btn btn-primary"
          >
            <FiPlus className="mr-2" />
            Yeni Proje Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="block bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <Link
                to={`/projects/${project.id}`}
                className="block p-6"
              >
                <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <FiClock className="mr-1" />
                  <span>
                    {new Date(project.created).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </Link>
              <div className="flex border-t border-gray-200 dark:border-dark-600">
                <Link
                  to={`/projects/${project.id}`}
                  className="flex-1 py-3 text-center text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-600"
                >
                  Standart Editör
                </Link>
                <Link
                  to={`/projects/${project.id}/vscode`}
                  className="flex-1 py-3 text-center text-sm font-medium border-l border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-600"
                >
                  VSCode Editör
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yeni Proje Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-700 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Yeni Proje Oluştur</h2>
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label htmlFor="projectName" className="block text-sm font-medium mb-1">
                    Proje Adı
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="projectDescription" className="block text-sm font-medium mb-1">
                    Açıklama (İsteğe bağlı)
                  </label>
                  <textarea
                    id="projectDescription"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                    rows="3"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowNewProjectModal(false)}
                  >
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Oluştur
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;