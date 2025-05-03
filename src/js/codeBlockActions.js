/**
 * Code Block Actions - Kod Bloğu İşlemleri
 * 
 * Bu modül, AI tarafından oluşturulan kod bloklarının işlenmesini sağlar.
 * - Kod bloğu aksiyonları (kopyala, dosya oluştur, editörde aç, çalıştır)
 * - Kod bloğu görselleştirme
 * - Dosya oluşturma ve düzenleme
 */

import { createFile, getFileIcon, formatFileSize } from './fileManager';
import { openInEditor } from './editor';
import { runCommand } from './terminal';

/**
 * Kod bloğu aksiyonlarını oluştur
 * @param {HTMLElement} codeBlock - Kod bloğu elementi
 * @param {string} language - Programlama dili
 * @param {string} content - Kod içeriği
 * @returns {HTMLElement} - Aksiyon çubuğu elementi
 */
export function createCodeBlockActions(codeBlock, language, content) {
  const actionBar = document.createElement('div');
  actionBar.className = 'code-block-actions';
  
  // Dil bilgisi
  const languageInfo = document.createElement('div');
  languageInfo.className = 'code-language-info';
  languageInfo.textContent = language || 'text';
  
  // Kopyala butonu
  const copyButton = document.createElement('button');
  copyButton.className = 'code-action-btn';
  copyButton.title = 'Kodu Kopyala';
  copyButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4V16C8 16.5304 8.21071 17.0391 8.58579 17.4142C8.96086 17.7893 9.46957 18 10 18H18C18.5304 18 19.0391 17.7893 19.4142 17.4142C19.7893 17.0391 20 16.5304 20 16V7.242C20 6.97556 19.9467 6.71181 19.8433 6.46624C19.7399 6.22068 19.5885 5.99824 19.398 5.812L16.188 2.602C16.0018 2.41148 15.7793 2.26012 15.5338 2.15673C15.2882 2.05334 15.0244 2.00003 14.758 2H10C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 18V20C16 20.5304 15.7893 21.0391 15.4142 21.4142C15.0391 21.7893 14.5304 22 14 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V8C4 7.46957 4.21071 6.96086 4.58579 6.58579C4.96086 6.21071 5.46957 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  copyButton.onclick = () => copyToClipboard(content);
  
  // Dosya oluştur butonu
  const createFileButton = document.createElement('button');
  createFileButton.className = 'code-action-btn';
  createFileButton.title = 'Dosya Oluştur';
  createFileButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 18V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 15H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  createFileButton.onclick = () => createFileFromCode(language, content);
  
  // Editörde aç butonu
  const openInEditorButton = document.createElement('button');
  openInEditorButton.className = 'code-action-btn';
  openInEditorButton.title = 'Editörde Aç';
  openInEditorButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3C17.2626 2.73735 17.5744 2.52901 17.9176 2.38687C18.2608 2.24473 18.6286 2.17157 19 2.17157C19.3714 2.17157 19.7392 2.24473 20.0824 2.38687C20.4256 2.52901 20.7374 2.73735 21 3C21.2626 3.26264 21.471 3.57444 21.6131 3.9176C21.7553 4.26077 21.8284 4.62856 21.8284 5C21.8284 5.37143 21.7553 5.73923 21.6131 6.08239C21.471 6.42555 21.2626 6.73735 21 7L7.5 20.5L2 22L3.5 16.5L17 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  openInEditorButton.onclick = () => openInEditor(content, language);
  
  // Çalıştır butonu (uygun diller için)
  if (['javascript', 'python', 'html'].includes(language)) {
    const runButton = document.createElement('button');
    runButton.className = 'code-action-btn';
    runButton.title = 'Çalıştır';
    runButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    runButton.onclick = () => runCode(content, language);
    actionBar.appendChild(runButton);
  }
  
  // Butonları ekle
  actionBar.appendChild(languageInfo);
  actionBar.appendChild(copyButton);
  actionBar.appendChild(createFileButton);
  actionBar.appendChild(openInEditorButton);
  
  return actionBar;
}

/**
 * Kodu panoya kopyala
 * @param {string} code - Kopyalanacak kod
 */
export function copyToClipboard(code) {
  navigator.clipboard.writeText(code).then(() => {
    // Kopyalama başarılı bildirimi
    showNotification('Kod panoya kopyalandı', 'success');
  }).catch(err => {
    console.error('Kopyalama hatası:', err);
    showNotification('Kod kopyalanamadı', 'error');
  });
}

/**
 * Kod bloğundan dosya oluştur
 * @param {string} language - Programlama dili
 * @param {string} content - Dosya içeriği
 */
export function createFileFromCode(language, content) {
  // Dile göre varsayılan dosya adı oluştur
  let fileName = '';
  
  switch (language) {
    case 'html':
      fileName = 'index.html';
      break;
    case 'css':
      fileName = 'style.css';
      break;
    case 'javascript':
    case 'js':
      fileName = 'app.js';
      break;
    case 'python':
    case 'py':
      fileName = 'main.py';
      break;
    case 'java':
      fileName = 'Main.java';
      break;
    case 'c':
    case 'cpp':
      fileName = `main.${language}`;
      break;
    default:
      fileName = `file.${language || 'txt'}`;
  }
  
  // Dosya adı diyaloğu göster
  showFileDialog(fileName, language, content);
}

/**
 * Dosya oluşturma diyaloğu göster
 * @param {string} suggestedName - Önerilen dosya adı
 * @param {string} language - Programlama dili
 * @param {string} content - Dosya içeriği
 */
function showFileDialog(suggestedName, language, content) {
  // Mevcut diyaloğu kaldır
  const existingDialog = document.querySelector('.file-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }
  
  // Diyalog oluştur
  const dialog = document.createElement('div');
  dialog.className = 'file-dialog';
  dialog.innerHTML = `
    <h3>Yeni Dosya Oluştur</h3>
    <div class="form-group">
      <label for="file-name">Dosya Adı:</label>
      <input type="text" id="file-name" value="${suggestedName || ''}">
    </div>
    <div class="form-group">
      <label for="file-path">Konum:</label>
      <select id="file-path">
        <option value="/">/</option>
        <option value="/src">/src</option>
        <option value="/public">/public</option>
      </select>
    </div>
    <div class="preview">
      <h4>Önizleme:</h4>
      <pre><code class="${language}">${escapeHtml(content)}</code></pre>
    </div>
    <div class="actions">
      <button class="btn" onclick="document.querySelector('.file-dialog').remove()">İptal</button>
      <button class="btn btn-primary" id="create-file-btn">Oluştur</button>
    </div>
  `;
  
  // Diyaloğu ekle
  document.body.appendChild(dialog);
  
  // Oluştur butonunu dinle
  document.getElementById('create-file-btn').addEventListener('click', () => {
    const fileName = document.getElementById('file-name').value;
    const filePath = document.getElementById('file-path').value;
    
    if (!fileName) {
      showNotification('Dosya adı boş olamaz', 'error');
      return;
    }
    
    // Dosya yolu oluştur
    const fullPath = filePath === '/' ? fileName : `${filePath}/${fileName}`;
    
    // Dosyayı oluştur
    createFile(fullPath, content);
    
    // Diyaloğu kapat
    dialog.remove();
    
    // Bildirim göster
    showNotification(`Dosya oluşturuldu: ${fullPath}`, 'success');
  });
}

/**
 * Kodu çalıştır
 * @param {string} code - Çalıştırılacak kod
 * @param {string} language - Programlama dili
 */
export function runCode(code, language) {
  // Dile göre çalıştırma
  switch (language) {
    case 'javascript':
    case 'js':
      runJavaScript(code);
      break;
    case 'html':
      runHtml(code);
      break;
    case 'python':
    case 'py':
      runPython(code);
      break;
    default:
      showNotification(`${language} dili için çalıştırma desteklenmiyor`, 'warning');
  }
}

/**
 * JavaScript kodunu çalıştır
 * @param {string} code - JavaScript kodu
 */
function runJavaScript(code) {
  // Geçici dosya oluştur
  const fileName = `temp-${Date.now()}.js`;
  createFile(fileName, code);
  
  // Terminal komutu çalıştır
  runCommand(`node ${fileName}`);
}

/**
 * HTML kodunu çalıştır
 * @param {string} code - HTML kodu
 */
function runHtml(code) {
  // Geçici dosya oluştur
  const fileName = `temp-${Date.now()}.html`;
  createFile(fileName, code);
  
  // Önizleme sekmesinde göster
  const previewContainer = document.getElementById('preview-container');
  if (previewContainer) {
    previewContainer.innerHTML = code;
    
    // Editör sekmesine geç
    showEditorTab('preview');
  }
}

/**
 * Python kodunu çalıştır
 * @param {string} code - Python kodu
 */
function runPython(code) {
  // Geçici dosya oluştur
  const fileName = `temp-${Date.now()}.py`;
  createFile(fileName, code);
  
  // Terminal komutu çalıştır
  runCommand(`python ${fileName}`);
}

/**
 * HTML karakterlerini escape et
 * @param {string} text - Escape edilecek metin
 * @returns {string} - Escape edilmiş metin
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Bildirim göster
 * @param {string} message - Bildirim mesajı
 * @param {string} type - Bildirim tipi (success, warning, error)
 */
function showNotification(message, type = 'default') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Editör sekmesini göster
 * @param {string} tabId - Sekme ID'si
 */
function showEditorTab(tabId) {
  // Sekme butonlarını güncelle
  document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.getAttribute('onclick').includes(tabId)) {
      tab.classList.add('active');
    }
  });
  
  // Sekme içeriklerini güncelle
  document.querySelectorAll('.editor-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  document.getElementById(`${tabId}-tab`).classList.add('active');
}
