import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { VscClearAll, VscPlay, VscDebugConsole, VscChevronUp, VscChevronDown, VscClose } from 'react-icons/vsc';
import 'xterm/css/xterm.css';
import './VSCodeTerminal.css';

const VSCodeTerminal = ({ projectId, onCommand, onClear, isMaximized, onMaximize }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('/');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Terminal başlatma
  useEffect(() => {
    if (!terminalRef.current) return;
    
    // Xterm.js terminal oluştur
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        // Diğer tema özellikleri...
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      scrollback: 1000,
      convertEol: true
    });
    
    // Referansı sakla
    xtermRef.current = term;
    
    // Fit eklentisi
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    
    // Önce eklentileri yükle
    term.loadAddon(fitAddon);
    
    // Sonra terminal'i DOM'a bağla
    term.open(terminalRef.current);
    
    // Terminal tamamen yüklendikten sonra fit işlemini yap
    setTimeout(() => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (error) {
          console.error('Terminal fit hatası:', error);
        }
      }
      
      // Hoş geldin mesajı
      term.writeln('\x1b[1;32mTerminal başlatıldı. Proje: ' + projectId + '\x1b[0m');
      term.writeln('\x1b[90mKomutları buraya yazabilirsiniz.\x1b[0m');
      term.writeln('');
      
      // Prompt göster
      showPrompt();
    }, 100);
    
    // Terminal boyutu değiştiğinde yeniden boyutlandır
    const handleResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (error) {
          console.error('Terminal resize hatası:', error);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Temizleme
    return () => {
      window.removeEventListener('resize', handleResize);
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [projectId]); // Bağımlılıkları doğru şekilde belirtin

  // Prompt gösterme fonksiyonu
  const showPrompt = () => {
    if (xtermRef.current) {
      const promptText = `\\x1b[1;36m${currentDirectory}$ \\x1b[0m`;
      xtermRef.current.write(promptText);
    }
  };

  // Terminal temizleme
  const clearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      showPrompt();
    }

    if (onClear) {
      onClear();
    }
  };

  // Komut çalıştırma
  const executeCommand = async (command) => {
    if (!command.trim()) {
      showPrompt();
      return;
    }

    // Komut geçmişine ekle
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Özel komutlar
    if (command === 'clear' || command === 'cls') {
      clearTerminal();
      return;
    }

    // CD komutu için özel işlem
    if (command.startsWith('cd ')) {
      const newDir = command.substring(3).trim();

      // Basit yol çözümleme
      let updatedDir = currentDirectory;

      if (newDir.startsWith('/')) {
        // Mutlak yol
        updatedDir = newDir;
      } else if (newDir === '..') {
        // Üst dizin
        const parts = currentDirectory.split('/').filter(Boolean);
        if (parts.length > 0) {
          parts.pop();
        }
        updatedDir = '/' + parts.join('/');
      } else if (newDir === '.') {
        // Mevcut dizin
        // Değişiklik yok
      } else if (newDir === '~') {
        // Ana dizin
        updatedDir = '/';
      } else {
        // Alt dizin
        updatedDir = currentDirectory.endsWith('/')
          ? currentDirectory + newDir
          : currentDirectory + '/' + newDir;
      }

      // Dizin değişikliğini göster
      xtermRef.current.writeln(`\\r\\nChanged directory to ${updatedDir}`);
      setCurrentDirectory(updatedDir);
      showPrompt();

      // Callback'i çağır
      if (onCommand) {
        onCommand(command);
      }

      return;
    }

    setIsLoading(true);

    try {
      // Callback'i çağır
      if (onCommand) {
        onCommand(command);
      }

      // API'ye komut gönder
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command,
          projectId,
          cwd: currentDirectory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Sonucu göster
      if (result.stdout) {
        xtermRef.current.writeln('\\r\\n' + result.stdout);
      }

      if (result.stderr) {
        xtermRef.current.writeln('\\x1b[1;31m' + result.stderr + '\\x1b[0m');
      }

      if (result.exitCode !== 0) {
        xtermRef.current.writeln('\\x1b[1;31mKomut başarısız oldu (Çıkış kodu: ' + result.exitCode + ')\\x1b[0m');
      }

      // Eğer komut bir dosya oluşturma komutu ise ve başarılıysa
      if (command.includes('touch ') || command.includes('mkdir ') ||
          command.includes('echo ') || command.includes('npm init') ||
          command.includes('git init')) {
        // Dosya değişikliklerini bildirmek için bir event gönder
        const event = new CustomEvent('file-system-changed', {
          detail: { projectId }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Terminal error:', error);
      xtermRef.current.writeln('\\r\\n\\x1b[1;31mHata: ' + error.message + '\\x1b[0m');
    } finally {
      setIsLoading(false);
      xtermRef.current.writeln('');
      showPrompt();
    }
  };

  // Arama fonksiyonu
  const handleSearch = () => {
    setIsSearchOpen(!isSearchOpen);

    if (!isSearchOpen) {
      setTimeout(() => {
        const searchTerm = prompt('Aranacak metin:');
        if (searchTerm && xtermRef.current) {
          // Basit bir arama işlevi
          console.log(`Searching for: ${searchTerm}`);
        }
      }, 100);
    }
  };

  // Klavye olayları - artık doğrudan xterm.onData içinde işleniyor
  const handleKeyDown = (e) => {
    if (isLoading) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      const command = input;
      setInput('');
      xtermRef.current.writeln('');
      executeCommand(command);
    }
  };

  return (
    <div className={`vscode-terminal-container ${isMaximized ? 'maximized' : ''}`}>
      <div className="terminal-header">
        <div className="terminal-title-area">
          <VscDebugConsole className="terminal-icon" />
          <span className="terminal-title">TERMINAL</span>
          {isLoading && <span className="terminal-loading">Çalışıyor...</span>}
        </div>

        <div className="terminal-actions">
          <button className="terminal-action-btn" title="Temizle" onClick={clearTerminal}>
            <VscClearAll />
          </button>
          <button className="terminal-action-btn" title="Ara" onClick={handleSearch}>
            <VscPlay />
          </button>
          <button
            className="terminal-action-btn"
            title={isMaximized ? "Küçült" : "Büyüt"}
            onClick={onMaximize}
          >
            {isMaximized ? <VscChevronDown /> : <VscChevronUp />}
          </button>
          <button className="terminal-action-btn" title="Kapat">
            <VscClose />
          </button>
        </div>
      </div>

      <div className="terminal-content">
        <div ref={terminalRef} className="xterm-container" />

        {/* Hidden input for mobile compatibility */}
        <input
          type="text"
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="Terminal input"
        />
      </div>

      {isSearchOpen && (
        <div className="terminal-search">
          <input
            type="text"
            placeholder="Ara..."
            className="search-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                console.log(`Searching for: ${e.target.value}`);
              } else if (e.key === 'Escape') {
                setIsSearchOpen(false);
              }
            }}
          />
        </div>
      )}

      <div className="terminal-status-bar">
        <span className="terminal-cwd">{currentDirectory}</span>
        <span className="terminal-process">{projectId}</span>
      </div>
    </div>
  );
};

export default VSCodeTerminal;

