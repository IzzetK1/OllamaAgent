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

    // Create terminal instance
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

    // Create and load addons before opening the terminal
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);

    // Open terminal in DOM
    term.open(terminalRef.current);
    
    // Store references
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    
    // Delay the fit operation to ensure the terminal is fully rendered
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.warn('Terminal fit error:', e);
      }
      
      // Write welcome message after fit
      term.writeln('\x1b[1;34mOllama AI Terminal - v2.0.0\x1b[0m');
      term.writeln('\x1b[90mKomutları çalıştırmak için yazın ve Enter tuşuna basın.\x1b[0m');
      term.writeln('\x1b[90mProje: ' + (projectId || 'default') + '\x1b[0m');
      term.writeln('');
      term.write('$ ');
      
      setIsReady(true);
    }, 100);

    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {
          console.warn('Terminal resize error:', e);
        }
      }
    });
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (xtermRef.current) {
        try {
          xtermRef.current.dispose();
        } catch (e) {
          console.warn('Terminal dispose error:', e);
        }
      }
    };
  }, [projectId]);

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

