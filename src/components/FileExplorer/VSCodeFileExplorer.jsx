import React, { useState, useEffect, useRef } from 'react';
import { FaFolder, FaFolderOpen, FaFile, FaJs, FaHtml5, FaCss3, FaReact, FaPython, FaJava, FaMarkdown, FaPlus, FaTrash, FaEdit, FaEllipsisV } from 'react-icons/fa';
import { SiTypescript, SiJson, SiCplusplus, SiDocker, SiYaml, SiRuby } from 'react-icons/si';
import { VscNewFile, VscNewFolder, VscRefresh, VscCollapseAll } from 'react-icons/vsc';
import './VSCodeFileExplorer.css';

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();

  switch (extension) {
    case 'js':
      return <FaJs className="file-icon js-icon" />;
    case 'jsx':
      return <FaReact className="file-icon react-icon" />;
    case 'ts':
    case 'tsx':
      return <SiTypescript className="file-icon ts-icon" />;
    case 'html':
      return <FaHtml5 className="file-icon html-icon" />;
    case 'css':
      return <FaCss3 className="file-icon css-icon" />;
    case 'json':
      return <SiJson className="file-icon json-icon" />;
    case 'py':
      return <FaPython className="file-icon python-icon" />;
    case 'java':
      return <FaJava className="file-icon java-icon" />;
    case 'md':
      return <FaMarkdown className="file-icon md-icon" />;
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
      return <SiCplusplus className="file-icon cpp-icon" />;
    case 'rb':
      return <SiRuby className="file-icon ruby-icon" />;
    case 'yml':
    case 'yaml':
      return <SiYaml className="file-icon yaml-icon" />;
    case 'dockerfile':
    case 'docker':
      return <SiDocker className="file-icon docker-icon" />;
    case 'gitignore':
      return <FaFile className="file-icon gitignore-icon" />;
    case 'package.json':
      return <SiJson className="file-icon npm-icon" />;
    default:
      return <FaFile className="file-icon" />;
  }
};

const FileTreeItem = ({
  item,
  level = 0,
  onFileClick,
  onFolderClick,
  onContextMenu,
  selectedFile
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const contextMenuRef = useRef(null);
  const itemRef = useRef(null);

  const isFolder = item.type === 'directory';
  const isSelected = selectedFile === item.path;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFolder = () => {
    setIsOpen(!isOpen);
    if (isFolder && onFolderClick) {
      onFolderClick(item);
    }
  };

  const handleClick = () => {
    if (isFolder) {
      toggleFolder();
    } else if (onFileClick) {
      onFileClick(item);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowContextMenu(true);
    if (onContextMenu) {
      onContextMenu(item, e.clientX, e.clientY);
    }
  };

  const handleRename = (e) => {
    e.stopPropagation();
    setShowContextMenu(false);
    // Implement rename functionality
    const newName = prompt('Yeni isim:', item.name);
    if (newName && newName !== item.name) {
      // Call API to rename file/folder
      fetch(`/api/projects/${item.projectId}/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPath: item.path,
          newPath: item.path.replace(item.name, newName),
          isDirectory: isFolder
        })
      });
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowContextMenu(false);
    // Implement delete functionality
    if (confirm(`${item.name} dosyasını silmek istediğinize emin misiniz?`)) {
      // Call API to delete file/folder
      fetch(`/api/projects/${item.projectId}/files/${item.path}`, {
        method: 'DELETE'
      });
    }
  };

  return (
    <div className="file-tree-item-container" ref={itemRef}>
      <div
        className={`file-tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span className="file-icon-container">
          {isFolder ? (isOpen ? <FaFolderOpen className="folder-icon open" /> : <FaFolder className="folder-icon" />) : getFileIcon(item.name)}
        </span>
        <span className="file-name">{item.name}</span>

        <div className="file-actions">
          {isFolder && (
            <button className="file-action-btn" title="Yeni Dosya" onClick={(e) => {
              e.stopPropagation();
              const fileName = prompt('Dosya adı:');
              if (fileName) {
                // Call API to create file
                fetch(`/api/projects/${item.projectId}/files/${item.path}/${fileName}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    content: ''
                  })
                });
              }
            }}>
              <VscNewFile />
            </button>
          )}
          <button className="file-action-btn" title="Düzenle" onClick={handleRename}>
            <FaEdit />
          </button>
          <button className="file-action-btn" title="Sil" onClick={handleDelete}>
            <FaTrash />
          </button>
        </div>
      </div>

      {showContextMenu && (
        <div
          className="context-menu"
          ref={contextMenuRef}
          style={{
            position: 'absolute',
            left: `${itemRef.current?.getBoundingClientRect().left + 100}px`,
            top: `${itemRef.current?.getBoundingClientRect().top + 20}px`
          }}
        >
          {isFolder && (
            <>
              <div className="context-menu-item" onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
                const fileName = prompt('Dosya adı:');
                if (fileName) {
                  // Call API to create file
                  fetch(`/api/projects/${item.projectId}/files/${item.path}/${fileName}`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      content: ''
                    })
                  });
                }
              }}>
                <VscNewFile className="context-menu-icon" />
                <span>Yeni Dosya</span>
              </div>
              <div className="context-menu-item" onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
                const folderName = prompt('Klasör adı:');
                if (folderName) {
                  // Call API to create folder
                  fetch(`/api/projects/${item.projectId}/folders`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      path: `${item.path}/${folderName}`
                    })
                  });
                }
              }}>
                <VscNewFolder className="context-menu-icon" />
                <span>Yeni Klasör</span>
              </div>
              <div className="context-menu-divider"></div>
            </>
          )}
          <div className="context-menu-item" onClick={handleRename}>
            <FaEdit className="context-menu-icon" />
            <span>Yeniden Adlandır</span>
          </div>
          <div className="context-menu-item" onClick={handleDelete}>
            <FaTrash className="context-menu-icon" />
            <span>Sil</span>
          </div>
        </div>
      )}

      {isFolder && isOpen && item.children && (
        <div className="file-tree-children">
          {item.children.sort((a, b) => {
            // Klasörleri dosyalardan önce göster
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            // Aynı tipteyse alfabetik sırala
            return a.name.localeCompare(b.name);
          }).map(child => (
            <FileTreeItem
              key={child.path}
              item={{...child, projectId: item.projectId}}
              level={level + 1}
              onFileClick={onFileClick}
              onFolderClick={onFolderClick}
              onContextMenu={onContextMenu}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const VSCodeFileExplorer = ({ projectId, onFileSelect }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: null });
  const explorerRef = useRef(null);

  const fetchFiles = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/files`);

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Add projectId to each file for API calls
      const filesWithProjectId = (data.files || []).map(file => ({
        ...file,
        projectId
      }));
      setFiles(filesWithProjectId);
      setError(null);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;

    fetchFiles();

    // WebSocket ile dosya değişikliklerini dinle
    // Doğrudan WebSocket yerine Socket.IO kullanıyoruz
    // Sunucu tarafında Socket.IO kullanıldığı için
    const socketUrl = `http://${window.location.hostname}:3006`;
    console.log(`Connecting to Socket.IO at ${socketUrl}`);

    // Socket.IO bağlantısını simüle edelim
    const socket = {
      onmessage: null,
      close: () => console.log('Socket closed'),
      send: (data) => console.log('Socket send:', data)
    };

    // Dosya değişikliklerini izlemek için bir interval kullanalım
    const fileCheckInterval = setInterval(() => {
      fetchFiles();
    }, 5000); // 5 saniyede bir dosyaları kontrol et

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'file_created' || data.type === 'file_updated' || data.type === 'file_deleted') {
          fetchFiles();
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    // Click outside to close context menu
    const handleClickOutside = (e) => {
      if (explorerRef.current && !explorerRef.current.contains(e.target)) {
        setContextMenu({ show: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket.close();
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(fileCheckInterval);
    };
  }, [projectId]);

  const handleFileClick = (file) => {
    setSelectedFile(file.path);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleFolderClick = (folder) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder.path]: !prev[folder.path]
    }));
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type: 'explorer'
    });
  };

  const handleItemContextMenu = (item, x, y) => {
    setContextMenu({
      show: true,
      x,
      y,
      type: item.type === 'directory' ? 'folder' : 'file',
      item
    });
  };

  const handleCreateFile = () => {
    const fileName = prompt('Dosya adı:');
    if (fileName) {
      fetch(`/api/projects/${projectId}/files/${fileName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: ''
        })
      }).then(() => {
        fetchFiles();
      });
    }
    setContextMenu({ show: false });
  };

  const handleCreateFolder = () => {
    const folderName = prompt('Klasör adı:');
    if (folderName) {
      fetch(`/api/projects/${projectId}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: folderName
        })
      }).then(() => {
        fetchFiles();
      });
    }
    setContextMenu({ show: false });
  };

  const handleRefresh = () => {
    fetchFiles();
    setContextMenu({ show: false });
  };

  if (loading) {
    return <div className="file-explorer-loading">Loading files...</div>;
  }

  if (error) {
    return <div className="file-explorer-error">Error: {error}</div>;
  }

  return (
    <div className="vscode-file-explorer" ref={explorerRef} onContextMenu={handleContextMenu}>
      <div className="explorer-header">
        <span className="explorer-title">EXPLORER</span>
        <div className="explorer-actions">
          <button className="explorer-action-btn" title="Yeni Dosya" onClick={handleCreateFile}>
            <VscNewFile />
          </button>
          <button className="explorer-action-btn" title="Yeni Klasör" onClick={handleCreateFolder}>
            <VscNewFolder />
          </button>
          <button className="explorer-action-btn" title="Yenile" onClick={handleRefresh}>
            <VscRefresh />
          </button>
          <button className="explorer-action-btn" title="Tümünü Daralt" onClick={() => setExpandedFolders({})}>
            <VscCollapseAll />
          </button>
        </div>
      </div>

      <div className="project-header">
        <span className="project-name">{projectId}</span>
      </div>

      <div className="file-tree">
        {files.length === 0 ? (
          <div className="empty-message">
            <p>No files in this project</p>
            <button className="create-file-btn" onClick={handleCreateFile}>
              <VscNewFile className="btn-icon" />
              Create File
            </button>
          </div>
        ) : (
          files.sort((a, b) => {
            // Klasörleri dosyalardan önce göster
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            // Aynı tipteyse alfabetik sırala
            return a.name.localeCompare(b.name);
          }).map(item => (
            <FileTreeItem
              key={item.path}
              item={item}
              onFileClick={handleFileClick}
              onFolderClick={handleFolderClick}
              onContextMenu={handleItemContextMenu}
              selectedFile={selectedFile}
            />
          ))
        )}
      </div>

      {contextMenu.show && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 1000
          }}
        >
          {contextMenu.type === 'explorer' && (
            <>
              <div className="context-menu-item" onClick={handleCreateFile}>
                <VscNewFile className="context-menu-icon" />
                <span>Yeni Dosya</span>
              </div>
              <div className="context-menu-item" onClick={handleCreateFolder}>
                <VscNewFolder className="context-menu-icon" />
                <span>Yeni Klasör</span>
              </div>
              <div className="context-menu-divider"></div>
              <div className="context-menu-item" onClick={handleRefresh}>
                <VscRefresh className="context-menu-icon" />
                <span>Yenile</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VSCodeFileExplorer;
