import React, { useState, useEffect } from 'react';
import { FiFolder, FiFolderPlus, FiFile, FiChevronRight, FiChevronDown, FiTrash, FiPlay, FiFilePlus } from 'react-icons/fi';

const FileExplorer = ({ projectId, onFileSelect, onRunProject }) => {
  const [files, setFiles] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dosyaları yükle
  useEffect(() => {
    if (projectId) {
      fetchFiles();
    }
  }, [projectId]);

  const fetchFiles = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/files`);

      if (!response.ok) {
        throw new Error('Dosyalar yüklenemedi');
      }

      const data = await response.json();
      setFiles(data.files || []);

      // Varsayılan olarak ana klasörleri aç
      const defaultExpanded = {};
      if (data.files) {
        data.files.forEach(file => {
          if (file.type === 'directory') {
            defaultExpanded[file.path] = true;
          }
        });
      }
      setExpandedFolders(defaultExpanded);
      setLoading(false);
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      setError('Dosyalar yüklenirken bir hata oluştu');
      setLoading(false);
    }
  };

  // Klasörü aç/kapat
  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Dosya seç
  const handleFileSelect = (file) => {
    if (file.type === 'file' && onFileSelect) {
      onFileSelect(file);
    }
  };

  // Dosya sil
  const handleDeleteFile = async (file, e) => {
    e.stopPropagation();

    if (!confirm(`${file.name} dosyasını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/files/${file.path}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Dosya silinemedi');
      }

      // Dosyaları yeniden yükle
      fetchFiles();
    } catch (error) {
      console.error('Dosya silme hatası:', error);
      setError('Dosya silinirken bir hata oluştu');
    }
  };

  // Yeni klasör oluştur
  const handleCreateFolder = async (parentPath = '') => {
    const folderName = prompt('Klasör adı:');

    if (!folderName) return;

    const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;

    try {
      const response = await fetch(`/api/projects/${projectId}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: folderPath
        })
      });

      if (!response.ok) {
        throw new Error('Klasör oluşturulamadı');
      }

      // Dosyaları yeniden yükle
      fetchFiles();
    } catch (error) {
      console.error('Klasör oluşturma hatası:', error);
      setError('Klasör oluşturulurken bir hata oluştu');
    }
  };

  // Yeni dosya oluştur
  const handleCreateFile = async (parentPath = '') => {
    const fileName = prompt('Dosya adı:');

    if (!fileName) return;

    const filePath = parentPath ? `${parentPath}/${fileName}` : fileName;

    try {
      const response = await fetch(`/api/projects/${projectId}/files/${filePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: ''
        })
      });

      if (!response.ok) {
        throw new Error('Dosya oluşturulamadı');
      }

      // Dosyaları yeniden yükle
      fetchFiles();
    } catch (error) {
      console.error('Dosya oluşturma hatası:', error);
      setError('Dosya oluşturulurken bir hata oluştu');
    }
  };

  // Dosya ağacını oluştur
  const renderFileTree = (items) => {
    if (!items || items.length === 0) {
      return <p className="text-gray-400 text-sm p-2">Dosya bulunamadı.</p>;
    }

    return (
      <ul className="space-y-1">
        {items.map((item) => {
          const isFolder = item.type === 'directory';
          const isExpanded = expandedFolders[item.path];

          return (
            <li key={item.path} className="text-sm">
              <div
                className="flex items-center py-1 px-2 rounded hover:bg-[#2a2d2e] cursor-pointer group"
                onClick={() => isFolder ? toggleFolder(item.path) : handleFileSelect(item)}
              >
                {isFolder ? (
                  <span className="mr-1">
                    {isExpanded ? <FiChevronDown className="text-[#c5c5c5]" /> : <FiChevronRight className="text-[#c5c5c5]" />}
                  </span>
                ) : (
                  <span className="ml-4"></span>
                )}

                {isFolder ? (
                  <FiFolder className="mr-2 text-[#c5c5c5]" />
                ) : (
                  <FiFile className="mr-2 text-[#c5c5c5]" />
                )}

                <span className="text-[#cccccc] flex-1">{item.name}</span>

                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isFolder && (
                    <button
                      className="text-[#c5c5c5] hover:text-white p-1"
                      onClick={(e) => handleDeleteFile(item, e)}
                      title="Dosyayı Sil"
                    >
                      <FiTrash size={14} />
                    </button>
                  )}

                  {isFolder && (
                    <>
                      <button
                        className="text-[#c5c5c5] hover:text-white p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateFolder(item.path);
                        }}
                        title="Yeni Klasör"
                      >
                        <FiFolderPlus size={14} />
                      </button>
                      <button
                        className="text-[#c5c5c5] hover:text-white p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateFile(item.path);
                        }}
                        title="Yeni Dosya"
                      >
                        <FiFilePlus size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isFolder && isExpanded && item.children && item.children.length > 0 && (
                <div className="pl-4">
                  {renderFileTree(item.children)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // Projeyi çalıştır
  const handleRunProject = () => {
    if (onRunProject) {
      onRunProject();
    }
  };

  return (
    <div className="bg-[#1e1e1e] h-full flex flex-col">
      <div className="bg-[#252526] px-4 py-2 border-b border-gray-800 flex justify-between items-center">
        <h3 className="font-medium flex items-center text-white uppercase text-xs">
          <FiFolder className="mr-2" />
          EXPLORER
        </h3>
        <div className="flex space-x-2">
          <button
            className="text-[#c5c5c5] hover:text-white p-1"
            onClick={() => handleCreateFolder()}
            title="Yeni Klasör"
          >
            <FiFolderPlus size={14} />
          </button>
          <button
            className="text-[#c5c5c5] hover:text-white p-1"
            onClick={() => handleCreateFile()}
            title="Yeni Dosya"
          >
            <FiFilePlus size={14} />
          </button>
          <button
            className="text-[#c5c5c5] hover:text-white p-1"
            onClick={handleRunProject}
            title="Projeyi Çalıştır"
          >
            <FiPlay size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-auto flex-1 p-2">
        {loading ? (
          <p className="text-gray-400 text-sm p-2">Yükleniyor...</p>
        ) : error ? (
          <p className="text-red-400 text-sm p-2">{error}</p>
        ) : (
          renderFileTree(files)
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
