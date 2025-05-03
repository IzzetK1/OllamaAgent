/**
 * Chat Module - Gelişmiş Sohbet Modülü
 * 
 * Bu modül, AI ile sohbet arayüzünü ve işlevlerini yönetir.
 * - Mesaj gönderme ve alma
 * - Markdown işleme
 * - Kod bloğu işlemleri
 * - Dosya oluşturma
 * - Sohbet geçmişi yönetimi
 */

import { createFile, createFolder, getFileIcon, formatFileSize } from './fileManager';
import { openInEditor, getCurrentLanguage } from './editor';
import { runCommand } from './terminal';

// Sohbet durumu
let conversations = [];
let currentConversationId = null;
let isProcessing = false;
let messageQueue = [];

// Ollama API ayarları
let ollamaEndpoint = 'http://localhost:11434';
let ollamaModel = 'llama3';
let systemPrompt = '';

/**
 * Sohbet modülünü başlat
 */
export function initializeChat() {
  // DOM elementlerini al
  const chatForm = document.getElementById('chat-form');
  const promptInput = document.getElementById('prompt');
  const messagesContainer = document.getElementById('messages');
  
  // Sohbet formunu dinle
  if (chatForm) {
    chatForm.addEventListener('submit', handleChatSubmit);
  }
  
  // Enter tuşu ile gönderme
  if (promptInput) {
    promptInput.addEventListener('keydown', handlePromptKeydown);
  }
  
  // Ayarları yükle
  loadChatSettings();
  
  // Ollama durumunu kontrol et
  checkOllamaStatus();
  
  // Sohbet geçmişini yükle
  loadConversations();
  
  console.log('Sohbet modülü başlatıldı');
}

/**
 * Sohbet formunu işle
 * @param {Event} e - Form submit olayı
 */
function handleChatSubmit(e) {
  e.preventDefault();
  
  const promptInput = document.getElementById('prompt');
  const prompt = promptInput.value.trim();
  
  if (!prompt || isProcessing) return;
  
  // Sohbet panelini göster
  document.getElementById('chat-panel').classList.remove('hidden');
  
  // Kullanıcı mesajını ekle
  addUserMessage(prompt);
  
  // Ollama ile sohbet et
  chatWithOllama(prompt);
  
  // Input'u temizle
  promptInput.value = '';
}

/**
 * Prompt alanı tuş olaylarını işle
 * @param {KeyboardEvent} e - Klavye olayı
 */
function handlePromptKeydown(e) {
  // Enter tuşu ile gönder (Shift+Enter hariç)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    document.getElementById('chat-form').dispatchEvent(new Event('submit'));
  }
}

/**
 * Kullanıcı mesajını ekle
 * @param {string} message - Kullanıcı mesajı
 */
function addUserMessage(message) {
  const messagesContainer = document.getElementById('messages');
  
  const messageElement = document.createElement('div');
  messageElement.className = 'message user';
  
  // Mesaj başlığı
  const messageHeader = document.createElement('div');
  messageHeader.className = 'message-header';
  
  // Avatar
  const avatarElement = document.createElement('div');
  avatarElement.className = 'avatar';
  avatarElement.innerHTML = '<i class="fa fa-user"></i>';
  
  // Rol adı
  const roleElement = document.createElement('div');
  roleElement.className = 'role-name';
  roleElement.textContent = 'Siz';
  
  // Mesaj içeriği
  const contentElement = document.createElement('div');
  contentElement.className = 'message-content';
  contentElement.innerHTML = message
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Mesaj aksiyonları
  const actionsElement = document.createElement('div');
  actionsElement.className = 'message-actions';
  actionsElement.innerHTML = `
    <button class="copy-message" title="Mesajı Kopyala" onclick="copyToClipboard('${encodeURIComponent(message)}')">
      <i class="fa fa-copy"></i>
    </button>
  `;
  
  // Mesaj bileşenlerini birleştir
  messageHeader.appendChild(avatarElement);
  messageHeader.appendChild(roleElement);
  messageElement.appendChild(messageHeader);
  messageElement.appendChild(contentElement);
  messageElement.appendChild(actionsElement);
  
  messagesContainer.appendChild(messageElement);
  
  // Sohbet alanını aşağı kaydır
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Sohbet geçmişine ekle
  addMessageToConversation('user', message);
}

/**
 * AI mesajını ekle
 * @param {string} message - AI mesajı
 */
function addAIMessage(message) {
  const messagesContainer = document.getElementById('messages');
  
  const messageElement = document.createElement('div');
  messageElement.className = 'message assistant';
  
  // Mesaj başlığı
  const messageHeader = document.createElement('div');
  messageHeader.className = 'message-header';
  
  // Avatar
  const avatarElement = document.createElement('div');
  avatarElement.className = 'avatar';
  avatarElement.innerHTML = '<i class="fa fa-robot"></i>';
  
  // Rol adı
  const roleElement = document.createElement('div');
  roleElement.className = 'role-name';
  roleElement.textContent = 'AI Asistanı';
  
  // Mesaj içeriği
  const contentElement = document.createElement('div');
  contentElement.className = 'message-content';
  
  // Markdown işleme
  contentElement.innerHTML = processMarkdown(message);
  
  // Kod bloklarını işle
  contentElement.querySelectorAll('pre code').forEach(codeBlock => {
    const language = codeBlock.className.replace('language-', '');
    const codeContent = codeBlock.textContent;
    
    // Kod bloğu aksiyonlarını ekle
    const actionBar = createCodeBlockActions(codeBlock, language, codeContent);
    codeBlock.parentNode.insertBefore(actionBar, codeBlock);
    
    // Syntax highlighting
    if (window.hljs) {
      window.hljs.highlightElement(codeBlock);
    }
  });
  
  // Mesaj aksiyonları
  const actionsElement = document.createElement('div');
  actionsElement.className = 'message-actions';
  actionsElement.innerHTML = `
    <button class="copy-message" title="Mesajı Kopyala" onclick="copyToClipboard('${encodeURIComponent(message)}')">
      <i class="fa fa-copy"></i>
    </button>
  `;
  
  // Mesaj bileşenlerini birleştir
  messageHeader.appendChild(avatarElement);
  messageHeader.appendChild(roleElement);
  messageElement.appendChild(messageHeader);
  messageElement.appendChild(contentElement);
  messageElement.appendChild(actionsElement);
  
  messagesContainer.appendChild(messageElement);
  
  // Sohbet alanını aşağı kaydır
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Sohbet geçmişine ekle
  addMessageToConversation('assistant', message);
  
  // Kod bloklarını dosya olarak kaydet
  const createdFiles = extractAndSaveFiles(message);
  
  // Dosya oluşturulduysa bildirim göster
  if (createdFiles.length > 0) {
    showFileCreationNotification(createdFiles);
  }
}

/**
 * Sistem mesajı ekle
 * @param {string} message - Sistem mesajı
 * @param {string} type - Mesaj tipi (default, success, warning, error, file-notification)
 */
function addSystemMessage(message, type = 'default') {
  const messagesContainer = document.getElementById('messages');
  
  const messageElement = document.createElement('div');
  messageElement.className = `message system ${type}`;
  
  // Mesaj içeriği
  const contentElement = document.createElement('div');
  contentElement.className = 'message-content';
  contentElement.innerHTML = message;
  
  messageElement.appendChild(contentElement);
  messagesContainer.appendChild(messageElement);
  
  // Sohbet alanını aşağı kaydır
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Ollama API ile sohbet et
 * @param {string} prompt - Kullanıcı mesajı
 */
async function chatWithOllama(prompt) {
  if (isProcessing) {
    // Mesajı kuyruğa ekle
    messageQueue.push(prompt);
    return;
  }
  
  isProcessing = true;
  
  try {
    // Sohbet geçmişini al
    const history = getCurrentConversationHistory();
    
    // Sistem promptunu al
    const systemPromptText = document.getElementById('ai-system-prompt')?.value || systemPrompt;
    
    // Ollama API isteği
    const response = await fetch(`${ollamaEndpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          {
            role: 'system',
            content: systemPromptText
          },
          ...history,
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API hatası: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // AI yanıtını ekle
    if (data.message && data.message.content) {
      addAIMessage(data.message.content);
    } else {
      addSystemMessage('AI yanıt vermedi veya yanıt boş.', 'error');
    }
  } catch (error) {
    console.error('Ollama API hatası:', error);
    addSystemMessage(`Ollama API hatası: ${error.message}`, 'error');
  } finally {
    isProcessing = false;
    
    // Kuyrukta mesaj varsa işle
    if (messageQueue.length > 0) {
      const nextPrompt = messageQueue.shift();
      chatWithOllama(nextPrompt);
    }
  }
}
