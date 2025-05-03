/**
 * File Manager - Gelişmiş Dosya Yönetim Sistemi
 * 
 * Bu modül, AI tarafından oluşturulan dosyaların yönetimini sağlar.
 * - Dosya oluşturma
 * - Dosya düzenleme
 * - Dosya silme
 * - Klasör oluşturma
 * - Dosya ağacı görselleştirme
 */

// Dosya sistemi durumu
let files = {};
let fileTree = {};
let currentFile = null;
let fileHistory = {};

// Dosya ikonları
const fileIcons = {
  '.html': '<i class="fa fa-html5" style="color: #e34c26;"></i>',
  '.css': '<i class="fa fa-css3" style="color: #264de4;"></i>',
  '.js': '<i class="fa fa-js" style="color: #f0db4f;"></i>',
  '.json': '<i class="fa fa-code" style="color: #f0db4f;"></i>',
  '.py': '<i class="fa fa-python" style="color: #3572A5;"></i>',
  '.java': '<i class="fa fa-java" style="color: #b07219;"></i>',
  '.php': '<i class="fa fa-php" style="color: #777bb3;"></i>',
  '.md': '<i class="fa fa-markdown" style="color: #083fa1;"></i>',
  '.txt': '<i class="fa fa-file-alt" style="color: #89e051;"></i>',
  '.png': '<i class="fa fa-file-image" style="color: #a074c4;"></i>',
  '.jpg': '<i class="fa fa-file-image" style="color: #a074c4;"></i>',
  '.gif': '<i class="fa fa-file-image" style="color: #a074c4;"></i>',
  '.svg': '<i class="fa fa-file-image" style="color: #a074c4;"></i>',
  '.pdf': '<i class="fa fa-file-pdf" style="color: #f40f02;"></i>',
  '.zip': '<i class="fa fa-file-archive" style="color: #ececec;"></i>',
  '.rar': '<i class="fa fa-file-archive" style="color: #ececec;"></i>',
  '.exe': '<i class="fa fa-file-code" style="color: #4d5a96;"></i>',
  '.c': '<i class="fa fa-file-code" style="color: #555555;"></i>',
  '.cpp': '<i class="fa fa-file-code" style="color: #f34b7d;"></i>',
  '.cs': '<i class="fa fa-file-code" style="color: #178600;"></i>',
  '.go': '<i class="fa fa-file-code" style="color: #00ADD8;"></i>',
  '.rb': '<i class="fa fa-gem" style="color: #CC342D;"></i>',
  '.ts': '<i class="fa fa-file-code" style="color: #007acc;"></i>',
  '.jsx': '<i class="fa fa-react" style="color: #61dafb;"></i>',
  '.tsx': '<i class="fa fa-react" style="color: #007acc;"></i>',
  '.vue': '<i class="fa fa-vuejs" style="color: #41b883;"></i>',
  '.dart': '<i class="fa fa-file-code" style="color: #00B4AB;"></i>',
  '.swift': '<i class="fa fa-swift" style="color: #ffac45;"></i>',
  '.kt': '<i class="fa fa-file-code" style="color: #F18E33;"></i>',
  '.rs': '<i class="fa fa-file-code" style="color: #dea584;"></i>',
  '.sql': '<i class="fa fa-database" style="color: #e38c00;"></i>',
  '.xml': '<i class="fa fa-file-code" style="color: #0060ac;"></i>',
  '.yml': '<i class="fa fa-file-code" style="color: #cb171e;"></i>',
  '.yaml': '<i class="fa fa-file-code" style="color: #cb171e;"></i>',
  '.toml': '<i class="fa fa-file-code" style="color: #9c4221;"></i>',
  '.ini': '<i class="fa fa-file-code" style="color: #d1dbe0;"></i>',
  '.env': '<i class="fa fa-file-code" style="color: #e6ffed;"></i>',
  '.gitignore': '<i class="fa fa-git" style="color: #f05032;"></i>',
  '.dockerignore': '<i class="fa fa-docker" style="color: #0db7ed;"></i>',
  '.dockerfile': '<i class="fa fa-docker" style="color: #0db7ed;"></i>',
  '.sh': '<i class="fa fa-terminal" style="color: #89e051;"></i>',
  '.bat': '<i class="fa fa-terminal" style="color: #89e051;"></i>',
  '.ps1': '<i class="fa fa-terminal" style="color: #012456;"></i>',
};

/**
 * Dosya yöneticisini başlat
 */
export function initializeFileManager() {
  // Dosya ağacını oluştur
  renderFileTree();
  
  // Dosya ağacı context menüsünü oluştur
  createFileContextMenu();
  
  // Dosya işlem butonlarını bağla
  bindFileActionButtons();
  
  // Dosya sürükle-bırak işlemlerini etkinleştir
  enableFileDragAndDrop();
  
  console.log('Dosya yöneticisi başlatıldı');
}

/**
 * Dosya ağacını oluştur ve görselleştir
 */
function renderFileTree() {
  const fileTreeElement = document.getElementById('project-tree');
  if (!fileTreeElement) return;
  
  fileTreeElement.innerHTML = '';
  
  // Kök klasör
  const rootFolder = document.createElement('div');
  rootFolder.className = 'folder root-folder';
  rootFolder.innerHTML = `
    <div class="folder-header">
      <span class="folder-icon">📁</span>
      <span class="folder-name">Proje</span>
      <div class="folder-actions">
        <button class="folder-action-btn" title="Yeni Dosya" onclick="createNewFile('/')">
          <i class="fa fa-file-plus"></i>
        </button>
        <button class="folder-action-btn" title="Yeni Klasör" onclick="createNewFolder('/')">
          <i class="fa fa-folder-plus"></i>
        </button>
      </div>
    </div>
    <div class="folder-content" id="root-folder-content"></div>
  `;
  
  fileTreeElement.appendChild(rootFolder);
  
  // Dosya ağacını oluştur
  const rootFolderContent = document.getElementById('root-folder-content');
  
  // Dosyaları sırala
  const sortedFiles = Object.keys(files).sort((a, b) => {
    // Klasörler önce
    const aIsFolder = a.endsWith('/');
    const bIsFolder = b.endsWith('/');
    
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    
    // Alfabetik sıralama
    return a.localeCompare(b);
  });
  
  // Dosyaları ağaca ekle
  sortedFiles.forEach(filePath => {
    const fileElement = createFileElement(filePath, files[filePath]);
    rootFolderContent.appendChild(fileElement);
  });
}

/**
 * Dosya elementi oluştur
 * @param {string} filePath - Dosya yolu
 * @param {string} content - Dosya içeriği
 * @returns {HTMLElement} - Dosya elementi
 */
function createFileElement(filePath, content) {
  const fileElement = document.createElement('div');
  
  // Klasör mü dosya mı?
  const isFolder = filePath.endsWith('/');
  
  if (isFolder) {
    // Klasör elementi
    const folderName = filePath.split('/').filter(Boolean).pop() || 'Klasör';
    
    fileElement.className = 'folder';
    fileElement.innerHTML = `
      <div class="folder-header">
        <span class="folder-icon">📁</span>
        <span class="folder-name">${folderName}</span>
        <div class="folder-actions">
          <button class="folder-action-btn" title="Yeni Dosya" onclick="createNewFile('${filePath}')">
            <i class="fa fa-file-plus"></i>
          </button>
          <button class="folder-action-btn" title="Yeni Klasör" onclick="createNewFolder('${filePath}')">
            <i class="fa fa-folder-plus"></i>
          </button>
          <button class="folder-action-btn" title="Sil" onclick="deleteFolder('${filePath}')">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="folder-content" id="folder-${folderName}"></div>
    `;
  } else {
    // Dosya elementi
    const fileName = filePath.split('/').pop();
    const fileExt = '.' + fileName.split('.').pop();
    const fileIcon = fileIcons[fileExt] || '📄';
    
    fileElement.className = 'file';
    fileElement.setAttribute('data-path', filePath);
    fileElement.innerHTML = `
      <div class="file-header" onclick="loadFile('${filePath}')">
        <span class="file-icon">${fileIcon}</span>
        <span class="file-name">${fileName}</span>
        <div class="file-actions">
          <button class="file-action-btn" title="Düzenle" onclick="loadFile('${filePath}')">
            <i class="fa fa-edit"></i>
          </button>
          <button class="file-action-btn" title="Sil" onclick="deleteFile('${filePath}')">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    
    // Aktif dosyayı işaretle
    if (currentFile === filePath) {
      fileElement.classList.add('active');
    }
  }
  
  return fileElement;
}
