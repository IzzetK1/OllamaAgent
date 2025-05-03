import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import './VSCodeTerminal.css';
import 'xterm/css/xterm.css';

const VSCodeTerminal = ({ projectId, onCommand, onClear }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const currentLineRef = useRef('');
  const commandHistoryRef = useRef([]);
  const historyIndexRef = useRef(-1);
  
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Terminal başlatma
  useEffect(() => {
    if (!terminalRef.current) return;

    // XTerm.js başlat
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: 'Fira Code, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      scrollback: 5000,
      theme: {
        background: '#1e1e1e',
        foreground: '#f0f0f0',
        cursor: '#f0f0f0',
        cursorAccent: '#1e1e1e',
        selection: 'rgba(255, 255, 255, 0.3)',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#dcdfe4',
        brightBlack: '#5c6370',
        brightRed: '#e06c75',
        brightGreen: '#98c379',
        brightYellow: '#e5c07b',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#dcdfe4'
      }
    });

    // Eklentileri yükle
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon((event, uri) => {
      window.open(uri, '_blank');
    });
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);

    // Terminal'i DOM'a ekle
    term.open(terminalRef.current);
    fitAddon.fit();

    // Hoş geldiniz mesajı
    term.writeln('\x1b[1;34mOllama AI Terminal - v2.0.0\x1b[0m');
    term.writeln('\x1b[90mKomutları çalıştırmak için yazın ve Enter tuşuna basın.\x1b[0m');
    term.writeln('\x1b[90mProje: ' + (projectId || 'default') + '\x1b[0m');
    term.writeln('');
    term.write('$ ');

    // Referansları sakla
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    setIsReady(true);

    // Klavye olaylarını dinle
    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      // Enter tuşu - komutu çalıştır
      if (domEvent.keyCode === 13) {
        const command = currentLineRef.current.trim();

        term.writeln('');

        if (command) {
          // Komut geçmişine ekle
          commandHistoryRef.current.push(command);
          historyIndexRef.current = commandHistoryRef.current.length;

          // Komutu işle
          if (command === 'clear') {
            term.clear();
            if (onClear) onClear();
          } else {
            // Komutu gönder
            setIsRunning(true);
            if (onCommand) onCommand(command);
          }
        }

        // Yeni satır
        currentLineRef.current = '';
        term.write('$ ');
      }
      // Backspace tuşu
      else if (domEvent.keyCode === 8) {
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
          term.write('\b \b');
        }
      }
      // Yukarı ok tuşu - komut geçmişi
      else if (domEvent.keyCode === 38) {
        if (commandHistoryRef.current.length > 0 && historyIndexRef.current > 0) {
          historyIndexRef.current--;
          
          // Mevcut satırı temizle
          term.write('\x1b[2K\r$ ');
          
          // Geçmiş komutu yaz
          const historyCommand = commandHistoryRef.current[historyIndexRef.current];
          term.write(historyCommand);
          currentLineRef.current = historyCommand;
        }
      }
      // Aşağı ok tuşu - komut geçmişi
      else if (domEvent.keyCode === 40) {
        // Mevcut satırı temizle
        term.write('\x1b[2K\r$ ');
        
        if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
          historyIndexRef.current++;
          // Geçmiş komutu yaz
          const historyCommand = commandHistoryRef.current[historyIndexRef.current];
          term.write(historyCommand);
          currentLineRef.current = historyCommand;
        } else {
          // Geçmişin sonuna gelindi, boş satır
          historyIndexRef.current = commandHistoryRef.current.length;
          currentLineRef.current = '';
        }
      }
      // Tab tuşu - otomatik tamamlama
      else if (domEvent.keyCode === 9) {
        domEvent.preventDefault();
        
        // Basit otomatik tamamlama
        const commonCommands = [
          'npm', 'node', 'python', 'git', 'ls', 'cd', 'mkdir', 'touch', 'cat', 'echo'
        ];
        
        const currentCommand = currentLineRef.current.split(' ')[0];
        const matchingCommands = commonCommands.filter(cmd => 
          cmd.startsWith(currentCommand) && cmd !== currentCommand
        );
        
        if (matchingCommands.length === 1) {
          // Tek eşleşme varsa tamamla
          const completion = matchingCommands[0].substring(currentCommand.length);
          term.write(completion);
          currentLineRef.current += completion;
        } else if (matchingCommands.length > 1) {
          // Birden fazla eşleşme varsa listele
          term.writeln('');
          term.writeln(matchingCommands.join('  '));
          term.write('$ ' + currentLineRef.current);
        }
      }
      // Yazdırılabilir karakterler
      else if (printable) {
        term.write(key);
        currentLineRef.current += key;
      }
    });

    // Pencere boyutu değiştiğinde terminal boyutunu ayarla
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    });
    
    resizeObserver.observe(terminalRef.current);

    // Temizleme
    return () => {
      resizeObserver.disconnect();
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [projectId, onCommand, onClear]);

  // Komut çıktısını göster
  const writeOutput = (output, isError = false) => {
    if (!xtermRef.current || !isReady) return;
    
    if (isError) {
      xtermRef.current.writeln('\x1b[1;31m' + output + '\x1b[0m');
    } else {
      xtermRef.current.writeln(output);
    }
  };

  // Komut çalıştırma sonucunu işle
  useEffect(() => {
    if (!isReady) return;

    // Komut çalıştırma API'si
    const executeCommand = async (command) => {
      try {
        const response = await fetch('/api/projects/' + projectId + '/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command }),
        });

        const result = await response.json();
        
        if (result.stdout) {
          writeOutput(result.stdout);
        }
        
        if (result.stderr) {
          writeOutput(result.stderr, true);
        }
        
        setIsRunning(false);
      } catch (error) {
        writeOutput('Komut çalıştırma hatası: ' + error.message, true);
        setIsRunning(false);
      }
    };

    // onCommand prop'u değiştiğinde komutu çalıştır
    if (onCommand && typeof onCommand === 'function') {
      const originalOnCommand = onCommand;
      onCommand = (command) => {
        originalOnCommand(command);
        executeCommand(command);
      };
    }
  }, [isReady, projectId]);

  return (
    <div className="vscode-terminal">
      <div className="terminal-header">
        <span>Terminal</span>
        {isRunning && <span className="terminal-status">Çalışıyor...</span>}
      </div>
      <div className="terminal-container" ref={terminalRef}></div>
    </div>
  );
};

export default VSCodeTerminal;
