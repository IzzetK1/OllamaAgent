/**
 * Markdown Processor - Markdown İşleme Modülü
 * 
 * Bu modül, AI yanıtlarındaki markdown içeriğini işler ve HTML'e dönüştürür.
 * - Kod bloklarını işleme
 * - Başlıkları işleme
 * - Listeleri işleme
 * - Bağlantıları işleme
 * - Terminal komutlarını işleme
 * - Dosya bildirimlerini işleme
 */

import { createCodeBlockActions } from './codeBlockActions';

/**
 * Markdown içeriğini işle ve HTML'e dönüştür
 * @param {string} text - Markdown içeriği
 * @returns {string} - HTML içeriği
 */
export function processMarkdown(text) {
  // Kod bloklarını işle - dosya adı ile
  text = text.replace(/```([a-z]+):([^\n]+)\n([\s\S]*?)```/g, (match, language, filename, code) => {
    return `<div class="code-block">
      <div class="code-header">
        <div class="code-filename">${filename}</div>
        <div class="code-actions">
          <button class="code-action-btn" onclick="copyCode(this)" title="Kodu Kopyala">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 4V16C8 16.5304 8.21071 17.0391 8.58579 17.4142C8.96086 17.7893 9.46957 18 10 18H18C18.5304 18 19.0391 17.7893 19.4142 17.4142C19.7893 17.0391 20 16.5304 20 16V7.242C20 6.97556 19.9467 6.71181 19.8433 6.46624C19.7399 6.22068 19.5885 5.99824 19.398 5.812L16.188 2.602C16.0018 2.41148 15.7793 2.26012 15.5338 2.15673C15.2882 2.05334 15.0244 2.00003 14.758 2H10C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 18V20C16 20.5304 15.7893 21.0391 15.4142 21.4142C15.0391 21.7893 14.5304 22 14 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V8C4 7.46957 4.21071 6.96086 4.58579 6.58579C4.96086 6.21071 5.46957 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="code-action-btn" onclick="createFileFromCode('${language}', '${encodeURIComponent(code.trim())}')" title="Dosya Oluştur">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 18V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 15H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="code-action-btn" onclick="openInEditor('${encodeURIComponent(code.trim())}', '${language}')" title="Editörde Aç">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 3C17.2626 2.73735 17.5744 2.52901 17.9176 2.38687C18.2608 2.24473 18.6286 2.17157 19 2.17157C19.3714 2.17157 19.7392 2.24473 20.0824 2.38687C20.4256 2.52901 20.7374 2.73735 21 3C21.2626 3.26264 21.471 3.57444 21.6131 3.9176C21.7553 4.26077 21.8284 4.62856 21.8284 5C21.8284 5.37143 21.7553 5.73923 21.6131 6.08239C21.471 6.42555 21.2626 6.73735 21 7L7.5 20.5L2 22L3.5 16.5L17 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <pre><code class="${language}">${escapeHtml(code.trim())}</code></pre>
    </div>`;
  });

  // Normal kod bloklarını işle
  text = text.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, language, code) => {
    return `<div class="code-block">
      <div class="code-header">
        <div class="code-language">${language || 'text'}</div>
        <div class="code-actions">
          <button class="code-action-btn" onclick="copyCode(this)" title="Kodu Kopyala">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 4V16C8 16.5304 8.21071 17.0391 8.58579 17.4142C8.96086 17.7893 9.46957 18 10 18H18C18.5304 18 19.0391 17.7893 19.4142 17.4142C19.7893 17.0391 20 16.5304 20 16V7.242C20 6.97556 19.9467 6.71181 19.8433 6.46624C19.7399 6.22068 19.5885 5.99824 19.398 5.812L16.188 2.602C16.0018 2.41148 15.7793 2.26012 15.5338 2.15673C15.2882 2.05334 15.0244 2.00003 14.758 2H10C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 18V20C16 20.5304 15.7893 21.0391 15.4142 21.4142C15.0391 21.7893 14.5304 22 14 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V8C4 7.46957 4.21071 6.96086 4.58579 6.58579C4.96086 6.21071 5.46957 6 6 6H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="code-action-btn" onclick="createFileFromCode('${language}', '${encodeURIComponent(code.trim())}')" title="Dosya Oluştur">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 18V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 15H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="code-action-btn" onclick="openInEditor('${encodeURIComponent(code.trim())}', '${language}')" title="Editörde Aç">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 3C17.2626 2.73735 17.5744 2.52901 17.9176 2.38687C18.2608 2.24473 18.6286 2.17157 19 2.17157C19.3714 2.17157 19.7392 2.24473 20.0824 2.38687C20.4256 2.52901 20.7374 2.73735 21 3C21.2626 3.26264 21.471 3.57444 21.6131 3.9176C21.7553 4.26077 21.8284 4.62856 21.8284 5C21.8284 5.37143 21.7553 5.73923 21.6131 6.08239C21.471 6.42555 21.2626 6.73735 21 7L7.5 20.5L2 22L3.5 16.5L17 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <pre><code class="${language || 'text'}">${escapeHtml(code.trim())}</code></pre>
    </div>`;
  });

  // Satır içi kod işle
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Başlıkları işle
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Numaralı adımları işle
  text = text.replace(/^(\d+)\. (.*$)/gm, '<div class="step"><div class="step-number">$1</div><div class="step-content">$2</div></div>');

  // Listeler
  text = text.replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>');
  text = text.replace(/^\s*[\*\-]\s+(.*$)/gm, '<li>$1</li>');

  // Kalın ve italik metinler
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Bağlantılar
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="link">$1</a>');

  // Terminal komutlarını işle
  text = text.replace(/\/terminal (.*$)/gm, '<div class="terminal-command"><span class="terminal-prompt">$</span> <span class="terminal-text">$1</span></div>');

  // Dosya düzenleme bildirimleri
  text = text.replace(/Edited file (.*$)/gm, '<div class="edited-file-notification"><div class="edited-file-icon">✏️</div><div class="edited-file-text">Edited file $1</div></div>');

  // Hata mesajları
  text = text.replace(/Error: (.*$)/gm, '<div class="error-message"><div class="error-icon">⚠️</div><div class="error-text">$1</div></div>');

  // "Show more" düğmesi
  text = text.replace(/Show more/g, '<button class="show-more-btn">Show more</button>');

  // Paragraflar
  text = text.replace(/\n\n/g, '</p><p>');

  // Listeleri düzelt
  text = text.replace(/<li>.*?<\/li>/g, (match) => {
    if (!match.includes('<ul>')) {
      return '<ul class="markdown-list">' + match + '</ul>';
    }
    return match;
  });

  return '<p>' + text + '</p>';
}

/**
 * Kod kopyalama fonksiyonu
 * @param {HTMLElement} button - Kopyala butonu
 */
export function copyCode(button) {
  const codeBlock = button.closest('.code-block');
  const codeElement = codeBlock.querySelector('code');
  const code = codeElement.textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    // Kopyalama başarılı olduğunda görsel geri bildirim
    const originalInnerHTML = button.innerHTML;
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    
    setTimeout(() => {
      button.innerHTML = originalInnerHTML;
    }, 2000);
  });
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
