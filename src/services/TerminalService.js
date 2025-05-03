/**
 * TerminalService - Terminal işlemlerini yöneten servis
 * 
 * Bu servis, terminal komutlarını yönetir:
 * - Komut çalıştırma
 * - Komut çıktılarını işleme
 * - Proje çalıştırma
 */

class TerminalService {
  /**
   * Komutu çalıştır
   * @param {string} projectId - Proje ID'si
   * @param {string} command - Çalıştırılacak komut
   * @returns {Promise<Object>} - Komut çıktısı
   */
  async executeCommand(projectId, command) {
    try {
      const response = await fetch(`/api/projects/${projectId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      
      if (!response.ok) {
        throw new Error(`Komut çalıştırılamadı: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error executing command "${command}":`, error);
      throw error;
    }
  }

  /**
   * Birden fazla komutu sırayla çalıştır
   * @param {string} projectId - Proje ID'si
   * @param {Array<string>} commands - Çalıştırılacak komutlar
   * @param {Function} onOutput - Her komut çıktısı için çağrılacak fonksiyon
   * @returns {Promise<Array<Object>>} - Komut çıktıları
   */
  async executeCommands(projectId, commands, onOutput) {
    const results = [];
    
    for (const command of commands) {
      try {
        const result = await this.executeCommand(projectId, command);
        
        if (onOutput) {
          onOutput(command, result.stdout, result.stderr);
        }
        
        results.push(result);
        
        // Eğer komut başarısız olduysa, diğer komutları çalıştırmayı durdur
        if (result.exitCode !== 0) {
          break;
        }
      } catch (error) {
        if (onOutput) {
          onOutput(command, '', error.message);
        }
        
        results.push({
          command,
          stdout: '',
          stderr: error.message,
          exitCode: 1
        });
        
        break;
      }
    }
    
    return results;
  }

  /**
   * Projeyi çalıştır
   * @param {string} projectId - Proje ID'si
   * @returns {Promise<Object>} - Çalıştırma sonucu
   */
  async runProject(projectId) {
    try {
      const response = await fetch(`/api/projects/${projectId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Boş komut, otomatik olarak projeyi çalıştırır
      });
      
      if (!response.ok) {
        throw new Error(`Proje çalıştırılamadı: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error running project:', error);
      throw error;
    }
  }

  /**
   * Komut çıktısını işle
   * @param {string} output - Komut çıktısı
   * @returns {string} - İşlenmiş çıktı
   */
  processOutput(output) {
    if (!output) return '';
    
    // ANSI renk kodlarını HTML'e dönüştür
    // Bu basit bir örnek, gerçek uygulamada daha karmaşık olabilir
    return output
      .replace(/\n/g, '<br>')
      .replace(/\r/g, '')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  }

  /**
   * Komut geçmişini yerel depolamadan al
   * @param {string} projectId - Proje ID'si
   * @returns {Array<string>} - Komut geçmişi
   */
  getCommandHistory(projectId) {
    try {
      const historyKey = `terminal_history_${projectId}`;
      const historyJson = localStorage.getItem(historyKey);
      
      if (historyJson) {
        return JSON.parse(historyJson);
      }
    } catch (error) {
      console.error('Error getting command history:', error);
    }
    
    return [];
  }

  /**
   * Komut geçmişini yerel depolamaya kaydet
   * @param {string} projectId - Proje ID'si
   * @param {Array<string>} history - Komut geçmişi
   */
  saveCommandHistory(projectId, history) {
    try {
      const historyKey = `terminal_history_${projectId}`;
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving command history:', error);
    }
  }

  /**
   * Komut geçmişine komut ekle
   * @param {string} projectId - Proje ID'si
   * @param {string} command - Eklenecek komut
   */
  addToCommandHistory(projectId, command) {
    try {
      const history = this.getCommandHistory(projectId);
      
      // Aynı komut zaten varsa, onu kaldır
      const index = history.indexOf(command);
      if (index !== -1) {
        history.splice(index, 1);
      }
      
      // Komutu geçmişin sonuna ekle
      history.push(command);
      
      // Geçmiş çok uzunsa, en eski komutları kaldır
      const maxHistoryLength = 100;
      if (history.length > maxHistoryLength) {
        history.splice(0, history.length - maxHistoryLength);
      }
      
      // Geçmişi kaydet
      this.saveCommandHistory(projectId, history);
    } catch (error) {
      console.error('Error adding to command history:', error);
    }
  }
}

// Singleton instance
const terminalService = new TerminalService();
export default terminalService;
