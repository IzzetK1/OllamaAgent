import React, { useState, useEffect } from 'react';
import {
  FiFolder,
  FiFile,
  FiFolderPlus,
  FiFilePlus,
  FiRefreshCw,
  FiChevronRight,
  FiChevronDown,
  FiCode,
  FiTrash2,
  FiEdit,
  FiCopy,
  FiDownload
} from 'react-icons/fi';

/**
 * Gelişmiş dosya ağacı bileşeni
 *
 * @param {Object} props - Bileşen özellikleri
 * @param {Array} props.files - Dosya ve klasör listesi
 * @param {Function} props.onFileSelect - Dosya seçildiğinde çağrılacak fonksiyon
 * @param {Function} props.onCreateFile - Yeni dosya oluşturulduğunda çağrılacak fonksiyon
 * @param {Function} props.onCreateFolder - Yeni klasör oluşturulduğunda çağrılacak fonksiyon
 * @param {Function} props.onRefresh - Yenileme butonuna tıklandığında çağrılacak fonksiyon
 * @param {string} props.activeFile - Aktif dosya yolu
 */
const FileTree = ({
  files = [],
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onRefresh,
  activeFile = ''
}) => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFiles, setFilteredFiles] = useState(files);

  // Dosya listesi değiştiğinde filtrelenmiş listeyi güncelle
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFiles(files);
    } else {
      const filtered = filterFiles(files, searchTerm.toLowerCase());
      setFilteredFiles(filtered);
    }
  }, [files, searchTerm]);

  // Dosyaları filtrele
  const filterFiles = (fileList, term) => {
    return fileList.filter(file => {
      if (file.name.toLowerCase().includes(term)) {
        return true;
      }

      if (file.type === 'folder' && file.children) {
        const filteredChildren = filterFiles(file.children, term);
        if (filteredChildren.length > 0) {
          return { ...file, children: filteredChildren };
        }
      }

      return false;
    });
  };

  // Klasörü aç/kapat
  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Dosya simgesini belirle
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();

    switch (extension) {
      case 'js':
        return <FiFile className={`file-icon js-icon`} />;
      case 'jsx':
        return <FiFile className={`file-icon jsx-icon`} />;
      case 'ts':
        return <FiFile className={`file-icon ts-icon`} />;
      case 'tsx':
        return <FiFile className={`file-icon tsx-icon`} />;
      case 'css':
        return <FiFile className={`file-icon css-icon`} />;
      case 'scss':
      case 'sass':
        return <FiFile className={`file-icon scss-icon`} />;
      case 'html':
        return <FiFile className={`file-icon html-icon`} />;
      case 'json':
        return <FiFile className={`file-icon json-icon`} />;
      case 'md':
        return <FiFile className={`file-icon md-icon`} />;
      case 'py':
        return <FiFile className={`file-icon py-icon`} />;
      case 'java':
        return <FiFile className={`file-icon java-icon`} />;
      case 'c':
        return <FiFile className={`file-icon c-icon`} />;
      case 'cpp':
      case 'cc':
      case 'cxx':
        return <FiFile className={`file-icon cpp-icon`} />;
      case 'go':
        return <FiFile className={`file-icon go-icon`} />;
      case 'php':
        return <FiFile className={`file-icon php-icon`} />;
      case 'rb':
        return <FiFile className={`file-icon rb-icon`} />;
      case 'rs':
        return <FiFile className={`file-icon rs-icon`} />;
      case 'sh':
      case 'bash':
        return <FiFile className={`file-icon sh-icon`} />;
      case 'svg':
        return <FiFile className={`file-icon svg-icon`} />;
      case 'vue':
        return <FiFile className={`file-icon vue-icon`} />;
      case 'yml':
      case 'yaml':
        return <FiFile className={`file-icon yaml-icon`} />;
      default:
        return <FiFile className="file-icon" />;
    }
  };

  // Dosya ağacı öğelerini oluştur
  const renderFileTree = (fileList, basePath = '') => {
    return fileList.map(file => {
      const filePath = basePath ? `${basePath}/${file.name}` : file.name;

      if (file.type === 'folder') {
        const isExpanded = expandedFolders[filePath] || false;

        return (
          <li key={filePath} className="file-tree-item folder">
            <div
              className="file-tree-item-header"
              onClick={() => toggleFolder(filePath)}
            >
              <span className="file-tree-icon">
                {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
              </span>
              <FiFolder className="folder-icon" />
              <span className="file-name">{file.name}</span>
            </div>

            {isExpanded && file.children && (
              <ul className="file-tree-children">
                {renderFileTree(file.children, filePath)}
              </ul>
            )}
          </li>
        );
      } else {
        const isActive = activeFile === filePath;

        return (
          <li
            key={filePath}
            className={`file-tree-item file ${isActive ? 'active' : ''}`}
            onClick={() => onFileSelect(filePath)}
          >
            <div className="file-tree-item-header">
              <span className="file-tree-icon"></span>
              {getFileIcon(file.name)}
              <span className="file-name">{file.name}</span>
            </div>
          </li>
        );
      }
    });
  };

  return (
    <div className="file-tree-container">
      <div className="file-tree-header">
        <div className="file-tree-title">
          <FiCode />
          <span>Proje Dosyaları</span>
        </div>

        <div className="file-tree-search">
          <input
            type="text"
            placeholder="Dosya ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="file-tree-search-input"
          />
        </div>

        <div className="file-tree-actions">
          <button
            className="file-tree-action-btn"
            title="Yeni Dosya"
            onClick={onCreateFile}
          >
            <FiFilePlus />
            <span>Yeni Dosya</span>
          </button>
          <button
            className="file-tree-action-btn"
            title="Yeni Klasör"
            onClick={onCreateFolder}
          >
            <FiFolderPlus />
            <span>Yeni Klasör</span>
          </button>
        </div>

        <button
          className="file-tree-action-btn"
          title="Yenile"
          onClick={onRefresh}
          style={{ marginTop: '8px' }}
        >
          <FiRefreshCw />
          <span>Dosyaları Yenile</span>
        </button>
      </div>

      <div className="file-tree-content">
        <ul className="file-tree">
          {filteredFiles.length > 0 ? (
            renderFileTree(filteredFiles)
          ) : (
            <li className="file-tree-empty">
              <div className="file-tree-empty-message">
                <FiFile className="file-tree-empty-icon" />
                <p>Dosya bulunamadı</p>
                <button
                  className="file-tree-action-btn"
                  onClick={onCreateFile}
                >
                  <FiFilePlus />
                  <span>Yeni Dosya Oluştur</span>
                </button>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FileTree;
