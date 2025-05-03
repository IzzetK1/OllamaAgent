import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './TerminalPanel.css';

const TerminalPanel = ({ projectId }) => {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const terminalIdRef = useRef(null);
  
  useEffect(() => {
    if (!projectId || !terminalRef.current) return;
    
    // Terminal oluştur
    if (!terminalInstanceRef.current) {
      const terminal = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          selection: 'rgba(255, 255, 255, 0.3)',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5'
        },
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        scrollback: 1000,
        allowTransparency: true
      });
      
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      
      terminal.open(terminalRef.current);
      fitAddon.fit();
      
      terminalInstanceRef.current = terminal;
      fitAddonRef.current = fitAddon;
      
      // WebSocket bağlantısı
      const socket = new WebSocket(`ws://${window.location.hostname}:3005`);
      
      socket.onopen = () => {
        console.log('Terminal WebSocket bağlantısı kuruldu');
        
        // Terminal oluştur
        socket.send(JSON.stringify({
          type: 'create_terminal',
          projectId
        }));
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'terminal_created') {
            terminalIdRef.current = data.terminalId;
            
            // Terminal hazır olduğunda bir karşılama mesajı göster
            terminal.writeln('\x1b[1;34m# Terminal hazır. Komutları buraya yazabilirsiniz.\x1b[0m');
            terminal.writeln('\x1b[1;34m# Çalışma dizini: ~/ollama-projects/' + projectId + '\x1b[0m');
            terminal.writeln('');
          } else if (data.type === 'terminal_output' && data.terminalId === terminalIdRef.current) {
            terminal.write(data.output);
          }
        } catch (error) {
          console.error('WebSocket mesajı işlenirken hata:', error);
        }
      };
      
      socket.onclose = () => {
        console.log('Terminal WebSocket bağlantısı kapandı');
      };
      
      socketRef.current = socket;
      
      // Terminal girdilerini WebSocket üzerinden gönder
      terminal.onData((data) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && terminalIdRef.current) {
          socketRef.current.send(JSON.stringify({
            type: 'terminal_input',
            terminalId: terminalIdRef.current,
            input: data
          }));
        }
      });
      
      // Terminal boyutunu pencere boyutuna göre ayarla
      const handleResize = () => {
        if (fitAddonRef.current && terminalInstanceRef.current) {
          try {
            fitAddonRef.current.fit();
            
            // Terminal boyutunu sunucuya bildir
            if (socketRef.current && 
                socketRef.current.readyState === WebSocket.OPEN && 
                terminalIdRef.current &&
                terminalInstanceRef.current.cols && 
                terminalInstanceRef.current.rows) {
              
              const { cols, rows } = terminalInstanceRef.current;
              
              socketRef.current.send(JSON.stringify({
                type: 'resize_terminal',
                terminalId: terminalIdRef.current,
                cols,
                rows
              }));
            }
          } catch (error) {
            console.error('Terminal resize hatası:', error);
          }
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (socketRef.current) {
          socketRef.current.close();
        }
        
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.dispose();
          terminalInstanceRef.current = null;
        }
      };
    }
  }, [projectId]);
  
  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <span className="terminal-title">ÇALIŞTIRMA SONUÇLARI</span>
      </div>
      
      <div className="terminal-container" ref={terminalRef}></div>
    </div>
  );
};

export default TerminalPanel;

