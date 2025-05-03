import React, { useState, useEffect, useRef } from 'react';
import VSCodeWorkspace from './VSCodeWorkspace';
import './OllamaInterface.css';

const OllamaInterface = ({ projectId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('llama3');
  const [availableModels, setAvailableModels] = useState([]);
  const messagesEndRef = useRef(null);
  const fileCreationTimeoutRef = useRef(null);
  const pendingCodeBlocksRef = useRef([]);

  // Modelleri yükle
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/ollama/models');
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models || []);
          
          // Varsayılan model seç
          if (data.models && data.models.length > 0) {
            // llama3 varsa onu seç, yoksa ilk modeli seç
            const llama3 = data.models.find(m => m.name.includes('llama3'));
            setModel(llama3 ? llama3.name : data.models[0].name);
          }
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    
    fetchModels();
  }, []);

  // Mesajları kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket bağlantısı
  useEffect(() => {
    const socket = new WebSocket(`ws://${window.location.hostname}:3005`);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'file_created') {
          // Dosya oluşturulduğunda bildirim göster
          const notification = {
            type: 'notification',
            content: `Dosya oluşturuldu: ${data.file.path}`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, notification]);
        } else if (data.type === 'command_output') {
          // Komut çıktısı geldiğinde göster
          const commandOutput = {
            type: 'command_output',
            command: data.command,
            output: data.output,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, commandOutput]);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return () => {
      socket.close();
    };
  }, []);

  // Mesaj gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage = {
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Kod bloklarını temizle
      pendingCodeBlocksRef.current = [];
      
      // Mesajı gönder
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [...messages, userMessage].filter(m => m.role === 'user' || m.role === 'assistant'),
          projectId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';
      
      // Yanıtı parça parça al
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        aiResponse += chunk;
        
        // Yanıtı güncelle
        setMessages(prev => {
          const newMessages = [...prev];
          
          // Son mesaj AI yanıtı ise güncelle, değilse ekle
          const lastMessage = newMessages[newMessages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = aiResponse;
            return [...newMessages];
          } else {
            return [...newMessages, { role: 'assistant', content: aiResponse }];
          }
        });
        
        // Kod bloklarını kontrol et ve dosya oluştur
        checkForCodeBlocks(aiResponse);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Hata mesajı göster
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
      
      // Son kod bloklarını işle
      if (fileCreationTimeoutRef.current) {
        clearTimeout(fileCreationTimeoutRef.current);
      }
      
      if (pendingCodeBlocksRef.current.length > 0) {
        createFilesFromCodeBlocks(pendingCodeBlocksRef.current);
        pendingCodeBlocksRef.current = [];
      }
    }
  };

  // Kod bloklarını kontrol et
  const checkForCodeBlocks = (content) => {
    // Kod bloklarını bul
    const codeBlockRegex = /```(?:([a-zA-Z0-9_+-]+)(?:[:|\s+]([^\n]+))?|([^\s\n]+\.[a-zA-Z0-9]+))\n([\s\S]*?)```/g;
    
    const codeBlocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Eğer 3. grup eşleşmişse, bu doğrudan bir dosya adıdır (```filename.ext formatı)
      if (match[3]) {
        const fileName = match[3].trim();
        const code = match[4] || '';
        
        codeBlocks.push({
          fileName,
          code
        });
      } else {
        // Normal ```language:filename veya ```language filename formatı
        const language = (match[1] || '').trim().toLowerCase();
        let fileName = (match[2] || '').trim();
        const code = match[4] || '';
        
        // Dosya adı yoksa, dil adından oluştur
        if (!fileName && language) {
          fileName = `file.${language}`;
        }
        
        if (fileName) {
          codeBlocks.push({
            fileName,
            code
          });
        }
      }
    }
    
    // Yeni kod blokları varsa, bekleyen bloklara ekle
    if (codeBlocks.length > 0) {
      pendingCodeBlocksRef.current = codeBlocks;
      
      // Önceki zamanlayıcıyı temizle
      if (fileCreationTimeoutRef.current) {
        clearTimeout(fileCreationTimeoutRef.current);
      }
      
      // 1 saniye bekle ve dosyaları oluştur
      fileCreationTimeoutRef.current = setTimeout(() => {
        createFilesFromCodeBlocks(pendingCodeBlocksRef.current);
        pendingCodeBlocksRef.current = [];
      }, 1000);
    }
  };

  // Kod bloklarından dosya oluştur
  const createFilesFromCodeBlocks = async (codeBlocks) => {
    if (codeBlocks.length === 0) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/extract-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: codeBlocks.map(block => 
            `\`\`\`${block.fileName}\n${block.code}\n\`\`\``
          ).join('\n\n')
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Dosya oluşturma bilgisini göster
      if (result.files && result.files.length > 0) {
        const fileNames = result.files.map(file => file.path).join(', ');
        
        setMessages(prev => [...prev, {
          type: 'notification',
          content: `Dosyalar oluşturuldu: ${fileNames}`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error creating files:', error);
      
      setMessages(prev => [...prev, {
        type: 'error',
        content: `Dosya oluşturma hatası: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  // Terminal komutlarını çalıştır
  const executeTerminalCommand = async (command) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Komut çıktısını göster
      setMessages(prev => [...prev, {
        type: 'command_result',
        command: result.command,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        timestamp: new Date().toISOString()
      }]);
      
      return result;
    } catch (error) {
      console.error('Error executing command:', error);
      
      setMessages(prev => [...prev, {
        type: 'error',
        content: `Komut çalıştırma hatası: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
      
      throw error;
    }
  };

  // Mesaj içeriğini render et
  const renderMessageContent = (message) => {
    if (message.type === 'notification') {
      return (
        <div className="notification-message">
          <div className="notification-icon">ℹ️</div>
          <div className="notification-content">{message.content}</div>
        </div>
      );
    }
    
    if (message.type === 'error') {
      return (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-content">{message.content}</div>
        </div>
      );
    }
    
    if (message.type === 'command_result') {
      return (
        <div className="command-result">
          <div className="command-header">
            <span className="command-prompt">$</span>
            <span className="command-text">{message.command}</span>
            <span className={`exit-code ${message.exitCode === 0 ? 'success' : 'error'}`}>
              {message.exitCode === 0 ? '✓' : '✗'}
            </span>
          </div>
          
          {message.stdout && (
            <pre className="command-stdout">{message.stdout}</pre>
          )}
          
          {message.stderr && (
            <pre className="command-stderr">{message.stderr}</pre>
          )}
        </div>
      );
    }
    
    if (message.type === 'command_output') {
      return (
        <div className="command-output">
          <pre>{message.output}</pre>
        </div>
      );
    }
    
    // Normal mesaj içeriği
    const content = message.content || '';
    
    // Kod bloklarını işle
    const parts = [];
    let lastIndex = 0;
    const codeBlockRegex = /```([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Kod bloğundan önceki metin
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      
      // Kod bloğu
      const codeBlock = match[1];
      const firstLineEnd = codeBlock.indexOf('\n');
      
      if (firstLineEnd !== -1) {
        // İlk satırı (dil/dosya adı) ayır
        const firstLine = codeBlock.substring(0, firstLineEnd).trim();
        const code = codeBlock.substring(firstLineEnd + 1);
        
        parts.push({
          type: 'code',
          language: firstLine,
          content: code
        });
      } else {
        // Tek satırlık kod bloğu
        parts.push({
          type: 'code',
          language: '',
          content: codeBlock
        });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Son metin parçası
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }
    
    // Parçaları render et
    return (
      <div className="message-content">
        {parts.length > 0 ? (
          parts.map((part, index) => {
            if (part.type === 'text') {
              return (
                <div key={index} className="text-content">
                  {part.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < part.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              );
            } else if (part.type === 'code') {
              // Dosya adı ve dil bilgisini ayır
              let language = '';
              let fileName = '';
              
              const firstLine = part.language;
              
              if (firstLine.includes(':')) {
                // language:filename formatı
                [language, fileName] = firstLine.split(':');
              } else if (firstLine.includes(' ')) {
                // language filename formatı
                [language, fileName] = firstLine.split(' ');
              } else if (firstLine.includes('.')) {
                // filename.ext formatı
                fileName = firstLine;
              } else {
                // Sadece dil adı
                language = firstLine;
              }
              
              return (
                <div key={index} className="code-block">
                  <div className="code-header">
                    {fileName && <span className="code-filename">{fileName}</span>}
                    {language && <span className="code-language">{language}</span>}
                    
                    {fileName && (
                      <button 
                        className="create-file-button"
                        onClick={() => createFilesFromCodeBlocks([{
                          fileName: fileName.trim(),
                          code: part.content
                        }])}
                      >
                        Dosya Oluştur
                      </button>
                    )}
                    
                    {part.content.includes('npm') || part.content.includes('python') ? (
                      <button 
                        className="run-command-button"
                        onClick={() => executeTerminalCommand(part.content.trim())}
                      >
                        Komutu Çalıştır
                      </button>
                    ) : null}
                  </div>
                  
                  <pre className="code-content">{part.content}</pre>
                </div>
              );
            }
            
            return null;
          })
        ) : (
          content
        )}
      </div>
    );
  };

  return (
    <div className="ollama-interface">
      <div className="workspace-container">
        <VSCodeWorkspace projectId={projectId} />
      </div>
      
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role || message.type || 'system'}`}
            >
              {message.role && (
                <div className="message-header">
                  <div className="message-avatar">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-role">
                    {message.role === 'user' ? 'You' : 'AI'}
                  </div>
                </div>
              )}
              
              <div className="message-body">
                {renderMessageContent(message)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <form className="chat-input" onSubmit={handleSubmit}>
          <div className="model-selector">
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              disabled={isLoading}
            >
              {availableModels.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bir mesaj yazın..."
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          <button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? '...' : 'Gönder'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OllamaInterface;
