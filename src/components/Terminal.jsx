import React, { useRef } from 'react';

/**
 * Gelişmiş terminal bileşeni
 *
 * @param {Object} props - Bileşen özellikleri
 * @param {Function} props.onCommand - Komut girildiğinde çağrılacak fonksiyon
 * @param {Array} props.output - Terminal çıktısı
 * @param {Function} props.onClear - Terminal temizlendiğinde çağrılacak fonksiyon
 */
const Terminal = ({ onCommand, output = [], onClear }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const commandHistoryRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const currentLineRef = useRef('');

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
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);

    // Terminal'i DOM'a ekle
    term.open(terminalRef.current);
    fitAddon.fit();

    // Hoş geldiniz mesajı
    term.writeln('Ollama AI Terminal - v1.0.0');
    term.writeln('Komutları çalıştırmak için yazın ve Enter tuşuna basın.');
    term.writeln('');
    term.write('$ ');

    // Referansları sakla
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

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
            if (onCommand) onCommand(command);
          }
        }

        // Yeni satır
        currentLineRef.current = '';
        term.write('$ ');
      }
      // Backspace tuşu - karakteri sil
      else if (domEvent.keyCode === 8) {
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
          term.write('\b \b');
        }
      }
      // Yukarı ok tuşu - komut geçmişinde geriye git
      else if (domEvent.keyCode === 38) {
        if (commandHistoryRef.current.length > 0 && historyIndexRef.current > 0) {
          historyIndexRef.current--;

          // Mevcut satırı temizle
          const currentLength = currentLineRef.current.length;
          for (let i = 0; i < currentLength; i++) {
            term.write('\b \b');
          }

          // Geçmiş komutu yaz
          const historyCommand = commandHistoryRef.current[historyIndexRef.current];
          term.write(historyCommand);
          currentLineRef.current = historyCommand;
        }
      }
      // Aşağı ok tuşu - komut geçmişinde ileriye git
      else if (domEvent.keyCode === 40) {
        // Mevcut satırı temizle
        const currentLength = currentLineRef.current.length;
        for (let i = 0; i < currentLength; i++) {
          term.write('\b \b');
        }

        if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
          historyIndexRef.current++;
          const historyCommand = commandHistoryRef.current[historyIndexRef.current];
          term.write(historyCommand);
          currentLineRef.current = historyCommand;
        } else {
          historyIndexRef.current = commandHistoryRef.current.length;
          currentLineRef.current = '';
        }
      }
      // Tab tuşu - otomatik tamamlama
      else if (domEvent.keyCode === 9) {
        domEvent.preventDefault();

        // Basit otomatik tamamlama örneği
        // Gerçek uygulamada daha gelişmiş bir otomatik tamamlama mantığı kullanılabilir
        const commonCommands = ['npm', 'node', 'git', 'python', 'pip', 'ls', 'cd', 'mkdir', 'touch', 'rm', 'cp', 'mv'];
        const currentWord = currentLineRef.current.split(' ').pop();

        const matchingCommands = commonCommands.filter(cmd => cmd.startsWith(currentWord));

        if (matchingCommands.length === 1) {
          // Mevcut kelimeyi sil
          for (let i = 0; i < currentWord.length; i++) {
            term.write('\b \b');
          }

          // Tamamlanan komutu yaz
          term.write(matchingCommands[0]);

          // Referansı güncelle
          currentLineRef.current = currentLineRef.current.slice(0, -currentWord.length) + matchingCommands[0];
        }
      }
      // Yazdırılabilir karakterler
      else if (printable) {
        term.write(key);
        currentLineRef.current += key;
      }
    });

    // Pencere boyutu değiştiğinde terminal boyutunu ayarla
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
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
  }, [onCommand, onClear]);

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
      }
    }

    // Yeni satır
    if (lastOutput.type === 'command') {
      xtermRef.current.write('$ ');
    }
  }, [output]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">Terminal</div>
        <div className="terminal-actions">
          <button
            className="terminal-action-btn"
            title="Temizle"
            onClick={() => {
              if (xtermRef.current) {
                xtermRef.current.clear();
                xtermRef.current.write('$ ');
              }
              if (onClear) onClear();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="terminal-content" />
    </div>
  );
};

export default Terminal;
