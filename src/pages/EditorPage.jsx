import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FiFile, FiFolder, FiChevronRight, FiChevronDown, FiPlus, FiTrash, FiSave, FiPlay, FiRefreshCw } from 'react-icons/fi';
import { io } from 'socket.io-client';

// Özel bileşenler
import ResizablePanel from '../components/ResizablePanel';
import FileTree from '../components/FileTree';
import EnhancedTerminal from '../components/EnhancedTerminal';
import EnhancedMonacoEditor from '../components/EnhancedMonacoEditor';
import VSCodeWorkspace from '../components/VSCodeWorkspace';

// Monaco Editor için dil desteği
// These imports will be handled by the Monaco Editor Webpack plugin

const EditorPage = () => {
  const { projectId } = useParams();
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileFolder, setNewFileFolder] = useState('');
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  const [editorOptions, setEditorOptions] = useState({
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: 'Fira Code, monospace',
  });

  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    // Socket.io bağlantısı
    socketRef.current = io();

    // Terminal olaylarını dinle
    socketRef.current.on('terminal:output', (data) => {
      if (data.output) {
        setTerminalOutput(prev => [...prev, { type: 'output', content: data.output }]);
      } else if (data.error) {
        setTerminalOutput(prev => [...prev, { type: 'error', content: data.error }]);
      }
    });

    socketRef.current.on('terminal:exit', (data) => {
      setTerminalOutput(prev => [...prev, {
        type: 'exit',
        code: data.code
      }]);
    });

    // Dosya değişikliklerini izle
    socketRef.current.emit('watch:project', projectId);

    socketRef.current.on('watch:change', (data) => {
      // Dosya değişikliğinde dosya listesini güncelle
      fetchFiles();

      // Eğer açık olan dosya değiştiyse, içeriğini güncelle
      if (currentFile && currentFile.path === data.path) {
        fetchFileContent(data.path);
      }
    });

    // Dosyaları yükle
    fetchFiles();

    return () => {
      // Socket.io bağlantısını kapat
      if (socketRef.current) {
        socketRef.current.emit('watch:stop', projectId);
        socketRef.current.disconnect();
      }
    };
  }, [projectId]);

  // Dosya listesini getir
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/files`);

      if (!response.ok) {
        throw new Error('Dosyalar yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      setFiles(data.files || []);
      setError(null);

      // İlk dosyayı otomatik olarak aç (eğer varsa)
      if (data.files && data.files.length > 0 && !currentFile) {
        const firstFile = findFirstFile(data.files);
        if (firstFile) {
          fetchFileContent(firstFile.path);
        }
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Dosyalar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // İlk dosyayı bul (recursive)
  const findFirstFile = (items) => {
    for (const item of items) {
      if (item.type === 'file') {
        return item;
      } else if (item.children && item.children.length > 0) {
        const found = findFirstFile(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Dosya içeriğini getir
  const fetchFileContent = async (filePath) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files/${filePath}`);

      if (!response.ok) {
        throw new Error('Dosya içeriği yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      setCurrentFile(data);
      setFileContent(data.content);
    } catch (err) {
      console.error('Error fetching file content:', err);
      setError('Dosya içeriği yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  // Dosya içeriğini kaydet
  const saveFile = async () => {
    if (!currentFile) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/files/${currentFile.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fileContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Dosya kaydedilirken bir hata oluştu');
      }

      // Başarılı bildirim göster
      alert('Dosya başarıyla kaydedildi');
    } catch (err) {
      console.error('Error saving file:', err);
      setError('Dosya kaydedilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  // Yeni dosya oluştur
  const createNewFile = async (e) => {
    e.preventDefault();

    if (!newFileName.trim()) {
      return;
    }

    try {
      const filePath = newFileFolder ? `${newFileFolder}/${newFileName}` : newFileName;

      const response = await fetch(`/api/projects/${projectId}/files/${filePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Dosya oluşturulurken bir hata oluştu');
      }

      // Dosya listesini güncelle
      fetchFiles();

      // Yeni dosyayı aç
      fetchFileContent(filePath);

      // Modal'ı kapat
      setShowNewFileModal(false);
      setNewFileName('');
      setNewFileFolder('');
    } catch (err) {
      console.error('Error creating file:', err);
      setError('Dosya oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  // Dosya sil
  const deleteFile = async (filePath) => {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/files/${filePath}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Dosya silinirken bir hata oluştu');
      }

      // Dosya listesini güncelle
      fetchFiles();

      // Eğer silinen dosya açıksa, editörü temizle
      if (currentFile && currentFile.path === filePath) {
        setCurrentFile(null);
        setFileContent('');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Dosya silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  // Klasör aç/kapat
  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Terminal komutu çalıştır
  const runCommand = (command) => {
    if (!socketRef.current) return;

    // Komutu terminale ekle
    setTerminalOutput(prev => [...prev, { type: 'command', content: `$ ${command}` }]);

    // Komutu socket.io ile gönder
    socketRef.current.emit('terminal:command', {
      command,
      projectId
    });
  };

  // Terminali temizle
  const clearTerminal = () => {
    setTerminalOutput([]);
  };

  // Monaco Editor ayarları
  const editorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Ctrl+S ile kaydetme
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, saveFile);
  };

  // Dosya değişikliği
  const handleEditorChange = (value) => {
    setFileContent(value);
  };

  // Dosya uzantısına göre dil belirle
  const getLanguageFromFilename = (filename) => {
    if (!filename) return 'plaintext';

    const ext = filename.split('.').pop().toLowerCase();

    switch (ext) {
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'py': return 'python';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  // Dosya ağacını render et (recursive)
  const renderFileTree = (items, basePath = '') => {
    return (
      <ul className="pl-4">
        {items.map((item) => {
          const itemPath = basePath ? `${basePath}/${item.name}` : item.name;

          if (item.type === 'directory') {
            const isExpanded = expandedFolders[itemPath] !== false; // Default olarak açık

            return (
              <li key={itemPath} className="my-1">
                <div
                  className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600 rounded px-2 py-1"
                  onClick={() => toggleFolder(itemPath)}
                >
                  {isExpanded ? <FiChevronDown className="mr-1" /> : <FiChevronRight className="mr-1" />}
                  <FiFolder className="mr-2 text-yellow-500" />
                  <span>{item.name}</span>
                </div>

                {isExpanded && item.children && item.children.length > 0 && (
                  renderFileTree(item.children, itemPath)
                )}
              </li>
            );
          } else {
            return (
              <li key={itemPath} className="my-1">
                <div
                  className={`flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600 rounded px-2 py-1 ${
                    currentFile && currentFile.path === itemPath ? 'bg-primary-100 dark:bg-primary-900/30' : ''
                  }`}
                  onClick={() => fetchFileContent(itemPath)}
                >
                  <FiFile className="mr-2 text-gray-500" />
                  <span>{item.name}</span>
                </div>
              </li>
            );
          }
        })}
      </ul>
    );
  };

  // Dosya ağacı için veri dönüştürme
  const transformFilesToTreeFormat = (files) => {
    return files.map(item => ({
      name: item.name,
      type: item.type === 'directory' ? 'folder' : 'file',
      children: item.children ? transformFilesToTreeFormat(item.children) : undefined
    }));
  };

  // Yeni dosya oluşturma işleyicisi
  const handleCreateFile = () => {
    setShowNewFileModal(true);
  };

  // Yeni klasör oluşturma işleyicisi
  const handleCreateFolder = () => {
    // Burada klasör oluşturma modalı gösterilebilir
    alert('Klasör oluşturma özelliği yakında eklenecek');
  };

  // Dosya ağacını yenileme işleyicisi
  const handleRefreshFiles = () => {
    fetchFiles();
  };

  // Dosya seçme işleyicisi
  const handleFileSelect = (filePath) => {
    fetchFileContent(filePath);
  };

  // Panel boyutlarını kaydet
  const handlePanelResizeEnd = (sizes) => {
    localStorage.setItem('editor-panel-sizes', JSON.stringify(sizes));
  };

  // Editör-Terminal panel boyutlarını kaydet
  const handleEditorTerminalResizeEnd = (sizes) => {
    localStorage.setItem('editor-terminal-sizes', JSON.stringify(sizes));
  };

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <ResizablePanel
          sizes={[20, 80]}
          direction="horizontal"
          onDragEnd={handlePanelResizeEnd}
          className="h-full"
        >
          {/* Dosya Gezgini */}
          <div className="h-full bg-white dark:bg-dark-700 flex flex-col">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <FileTree
                files={transformFilesToTreeFormat(files)}
                onFileSelect={handleFileSelect}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onRefresh={handleRefreshFiles}
                activeFile={currentFile ? currentFile.path : ''}
              />
            )}
          </div>

          {/* Editör ve Terminal */}
          <div className="h-full flex flex-col overflow-hidden">
            <ResizablePanel
              sizes={[70, 30]}
              direction="vertical"
              onDragEnd={handleEditorTerminalResizeEnd}
              className="h-full"
            >
              {/* Editör Bölümü */}
              <div className="flex flex-col overflow-hidden">
                {/* Editör Başlık */}
                <div className="bg-white dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600 p-2 flex justify-between items-center">
                  <div className="flex items-center">
                    {currentFile ? (
                      <>
                        <FiFile className="mr-2 text-gray-500" />
                        <span>{currentFile.name}</span>
                      </>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Dosya seçilmedi</span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {currentFile && (
                      <>
                        <button
                          onClick={saveFile}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded flex items-center"
                          title="Kaydet (Ctrl+S)"
                        >
                          <FiSave className="mr-1" />
                          <span>Kaydet</span>
                        </button>
                        <button
                          onClick={() => runCommand(`node ${currentFile.path}`)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded flex items-center"
                          title="Çalıştır"
                        >
                          <FiPlay className="mr-1" />
                          <span>Çalıştır</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Editör İçeriği */}
                <div className="flex-1 overflow-hidden">
                  {currentFile ? (
                    <EnhancedMonacoEditor
                      value={fileContent}
                      onChange={handleEditorChange}
                      language={getLanguageFromFilename(currentFile.name)}
                      theme="replit-dark"
                      options={editorOptions}
                      onSave={handleSaveFile}
                      fileName={currentFile.name}
                      filePath={currentFile.path}
                      isMaximized={isEditorMaximized}
                      onMaximize={() => setIsEditorMaximized(!isEditorMaximized)}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-replit-bg">
                      <div className="text-center p-8 bg-replit-bg-secondary rounded-lg border border-replit-bg-tertiary max-w-md">
                        <FiFile className="mx-auto h-16 w-16 text-replit-accent mb-6" />
                        <h3 className="text-xl font-medium mb-3 text-replit-text">Dosya seçilmedi</h3>
                        <p className="text-replit-text-secondary mb-6">
                          Düzenlemek için bir dosya seçin veya yeni bir dosya oluşturun
                        </p>
                        <button
                          onClick={() => setShowNewFileModal(true)}
                          className="px-4 py-2 bg-replit-accent hover:bg-replit-accent-hover text-white rounded-md transition-colors flex items-center justify-center mx-auto"
                        >
                          <FiPlus className="mr-2" />
                          Yeni Dosya Oluştur
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terminal Bölümü */}
              <EnhancedTerminal
                onCommand={runCommand}
                output={terminalOutput}
                onClear={clearTerminal}
                isMaximized={isTerminalMaximized}
                onMaximize={() => setIsTerminalMaximized(!isTerminalMaximized)}
                projectId={projectId}
              />
            </ResizablePanel>
          </div>
        </ResizablePanel>
      </div>

      {/* Yeni Dosya Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-replit-bg-secondary rounded-lg shadow-xl w-full max-w-md mx-4 border border-replit-bg-tertiary">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-replit-text flex items-center">
                <FiFilePlus className="mr-3 text-replit-accent" />
                Yeni Dosya Oluştur
              </h2>
              <form onSubmit={createNewFile}>
                <div className="mb-4">
                  <label htmlFor="newFileFolder" className="block text-sm font-medium mb-2 text-replit-text-secondary">
                    Klasör Yolu (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    id="newFileFolder"
                    className="w-full px-4 py-3 border border-replit-bg-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-replit-accent bg-replit-bg text-replit-text"
                    value={newFileFolder}
                    onChange={(e) => setNewFileFolder(e.target.value)}
                    placeholder="Örn: src/components"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="newFileName" className="block text-sm font-medium mb-2 text-replit-text-secondary">
                    Dosya Adı
                  </label>
                  <input
                    type="text"
                    id="newFileName"
                    className="w-full px-4 py-3 border border-replit-bg-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-replit-accent bg-replit-bg text-replit-text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Örn: App.js"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-replit-bg-tertiary text-replit-text-secondary rounded-md hover:bg-replit-bg-tertiary transition-colors"
                    onClick={() => setShowNewFileModal(false)}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-replit-accent hover:bg-replit-accent-hover text-white rounded-md transition-colors"
                  >
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

export default EditorPage;