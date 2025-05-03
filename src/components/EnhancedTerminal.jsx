import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiMaximize2, FiMinimize2, FiTerminal, FiTrash2 } from 'react-icons/fi';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import 'xterm/css/xterm.css';

/**
 * Gelişmiş terminal bileşeni
 *
 * @param {Object} props - Bileşen özellikleri
 * @param {Function} props.onCommand - Komut girildiğinde çağrılacak fonksiyon
 * @param {Array} props.output - Terminal çıktısı
 * @param {Function} props.onClear - Terminal temizlendiğinde çağrılacak fonksiyon
 * @param {boolean} props.isMaximized - Terminal tam ekran mı
 * @param {Function} props.onMaximize - Tam ekran düğmesine tıklandığında çağrılacak fonksiyon
 * @param {string} props.projectId - Proje ID'si
 */
const EnhancedTerminal = ({ 
  onCommand, 
  output = [], 
  onClear,
  isMaximized = false,
  onMaximize,
  projectId
}) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const commandHistoryRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const currentLineRef = useRef('');
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Terminal başlatma
  useEffect(() => {
    if (!terminalRef.current) return;
    
    let terminalInstance = null;
    let fitAddon = null;
    
    // Terminal başlatma işlemini geciktir
    setTimeout(() => {
      try {
        // Terminal oluştur
        terminalInstance = new Terminal({
          cursorBlink: true,
          fontFamily: 'monospace',
          fontSize: 14,
          theme: {
            background: '#1e1e1e',
            foreground: '#f0f0f0'
          }
        });
        
        // Fit eklentisi
        fitAddon = new FitAddon();
        terminalInstance.loadAddon(fitAddon);
        
        // Terminal'i DOM'a ekle
        terminalInstance.open(terminalRef.current);
        
        // Referansları sakla
        xtermRef.current = terminalInstance;
        fitAddonRef.current = fitAddon;
        
        // Terminal boyutunu ayarla
        setTimeout(() => {
          if (fitAddon) {
            try {
              fitAddon.fit();
            } catch (e) {
              console.warn('Terminal fit error:', e);
            }
          }
        }, 100);
        
        // Hoş geldin mesajı
        terminalInstance.writeln('\r\n\x1b[1;34mTerminal başlatıldı\x1b[0m');
        terminalInstance.writeln('\x1b[90mKomutları buraya yazabilirsiniz\x1b[0m\r\n');
        terminalInstance.write('$ ');
      } catch (error) {
        console.error('Terminal initialization error:', error);
      }
    }, 100);
    
    // Temizleme
    return () => {
      if (xtermRef.current) {
        try {
          xtermRef.current.dispose();
        } catch (e) {
          console.warn('Terminal dispose error:', e);
        }
      }
    };
  }, []);

  // Terminal boyutunu ayarla
  useEffect(() => {
    if (fitAddonRef.current && isReady) {
      setTimeout(() => {
        fitAddonRef.current.fit();
      }, 100);
    }
  }, [isReady, isMaximized]);

  // Çıktıyı terminale yaz
  useEffect(() => {
    if (!xtermRef.current || !output.length) return;

    // Son çıktıyı al
    const lastOutput = output[output.length - 1];

    if (lastOutput) {
      if (lastOutput.type === 'command') {
        // Komut çıktısı
        xtermRef.current.writeln(`$ ${lastOutput.content}`);
      } else if (lastOutput.type === 'output') {
        // Normal çıktı
        xtermRef.current.writeln(lastOutput.content);
      } else if (lastOutput.type === 'error') {
        // Hata çıktısı
        xtermRef.current.writeln(`\x1b[1;31m${lastOutput.content}\x1b[0m`);
      } else if (lastOutput.type === 'system') {
        // Sistem mesajı
        xtermRef.current.writeln(`\x1b[1;34m${lastOutput.content}\x1b[0m`);
      } else if (lastOutput.type === 'success') {
        // Başarı mesajı
        xtermRef.current.writeln(`\x1b[1;32m${lastOutput.content}\x1b[0m`);
      } else if (lastOutput.type === 'warning') {
        // Uyarı mesajı
        xtermRef.current.writeln(`\x1b[1;33m${lastOutput.content}\x1b[0m`);
      }
    }

    // Komut çalışması bittiyse
    if (lastOutput.type === 'exit') {
      setIsRunning(false);
      
      // Başarılı çıkış
      if (lastOutput.code === 0) {
        xtermRef.current.writeln(`\x1b[1;32mKomut başarıyla tamamlandı (çıkış kodu: ${lastOutput.code})\x1b[0m`);
      } else {
        xtermRef.current.writeln(`\x1b[1;31mKomut hatayla sonlandı (çıkış kodu: ${lastOutput.code})\x1b[0m`);
      }
      
      // Yeni prompt
      xtermRef.current.write('$ ');
    }
  }, [output]);

  return (
    <div className={`terminal-container ${isMaximized ? 'terminal-maximized' : ''}`}>
      <div className="terminal-header bg-dark-800 text-gray-200 flex justify-between items-center p-2 border-b border-gray-700">
        <div className="terminal-title flex items-center">
          <FiTerminal className="mr-2" />
          <span>Terminal {isRunning && <span className="text-yellow-400 ml-2">(Çalışıyor...)</span>}</span>
        </div>
        <div className="terminal-actions flex space-x-2">
          <button
            className="terminal-action-btn text-gray-400 hover:text-white"
            title="Temizle"
            onClick={() => {
              if (xtermRef.current) {
                xtermRef.current.clear();
                xtermRef.current.write('$ ');
                currentLineRef.current = '';
              }
              if (onClear) onClear();
            }}
          >
            <FiTrash2 />
          </button>
          <button
            className="terminal-action-btn text-gray-400 hover:text-white"
            title={isMaximized ? "Küçült" : "Büyüt"}
            onClick={onMaximize}
          >
            {isMaximized ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </div>
      </div>
      <div 
        ref={terminalRef} 
        className="terminal-content h-full"
        style={{ padding: '4px' }}
      />
    </div>
  );
};

export default EnhancedTerminal;



