import React, { useEffect, useRef, useState } from 'react';
import 'xterm/css/xterm.css';
import './SimpleTerminal.css';

const SimpleTerminal = ({ projectId }) => {
  const containerRef = useRef(null);
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [output, setOutput] = useState([
    { type: 'system', content: 'Terminal başlatılıyor...' }
  ]);

  // Terminal başlatma işlemi
  useEffect(() => {
    let terminal = null;
    let fitAddon = null;

    // Terminal modüllerini dinamik olarak yükle
    const initTerminal = async () => {
      try {
        // Modülleri dinamik olarak import et
        const xtermModule = await import('xterm');
        const fitAddonModule = await import('xterm-addon-fit');
        
        const Terminal = xtermModule.Terminal;
        const FitAddon = fitAddonModule.FitAddon;
        
        // Terminal DOM elementinin hazır olduğundan emin ol
        if (!containerRef.current) return;
        
        // Terminal oluştur
        terminal = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'monospace',
          theme: {
            background: '#1e1e1e',
            foreground: '#cccccc'
          },
          rows: 10,
          cols: 80,
          scrollback: 1000
        });
        
        // FitAddon oluştur
        fitAddon = new FitAddon();
        
        // Addon'u yükle
        terminal.loadAddon(fitAddon);
        
        // Terminal'i DOM'a ekle
        terminal.open(containerRef.current);
        
        // Biraz bekleyip boyutlandır
        setTimeout(() => {
          try {
            if (fitAddon) {
              fitAddon.fit();
            }
            
            // Hoş geldin mesajı
            terminal.writeln('\r\n\x1b[1;34mTerminal hazır\x1b[0m');
            terminal.writeln(`\x1b[90mProje: ${projectId || 'default'}\x1b[0m`);
            terminal.writeln('');
            terminal.write('$ ');
            
            setIsTerminalReady(true);
            setOutput(prev => [...prev, { type: 'system', content: 'Terminal hazır' }]);
          } catch (error) {
            console.error('Terminal boyutlandırma hatası:', error);
            setOutput(prev => [...prev, { type: 'error', content: `Hata: ${error.message}` }]);
          }
        }, 500);
        
      } catch (error) {
        console.error('Terminal başlatma hatası:', error);
        setOutput(prev => [...prev, { type: 'error', content: `Terminal başlatılamadı: ${error.message}` }]);
      }
    };

    // Terminal başlat
    initTerminal();

    // Temizleme
    return () => {
      if (terminal) {
        try {
          terminal.dispose();
        } catch (error) {
          console.error('Terminal kapatma hatası:', error);
        }
      }
    };
  }, [projectId]);

  // Basit terminal görünümü
  return (
    <div className="simple-terminal">
      <div className="terminal-header">
        <span>Terminal</span>
        <span className="terminal-project">{projectId || 'default'}</span>
      </div>
      
      {/* xterm.js için konteyner */}
      <div className="terminal-container" ref={containerRef}></div>
      
      {/* Yedek terminal görünümü (xterm.js çalışmazsa) */}
      {!isTerminalReady && (
        <div className="fallback-terminal">
          {output.map((item, index) => (
            <div key={index} className={`terminal-line ${item.type}`}>
              {item.type === 'system' && <span className="system-prefix">SYSTEM: </span>}
              {item.type === 'error' && <span className="error-prefix">ERROR: </span>}
              {item.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleTerminal;
