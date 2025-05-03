/**
 * Kod Parçacıkları Eklentisi
 * Sık kullanılan kod parçacıklarını kaydetme ve kullanma imkanı sağlar
 */
const CodeSnippetsPlugin = {
  id: 'code-snippets',
  name: 'Kod Parçacıkları',
  version: '1.0.0',
  description: 'Sık kullanılan kod parçacıklarını kaydetme ve kullanma imkanı sağlar',
  author: 'Uygulama Geliştirici',
  
  // Eklenti verileri
  snippets: [],
  
  // Eklenti başlatma
  async onEnable() {
    // Kaydedilmiş kod parçacıklarını yükle
    try {
      const savedSnippets = localStorage.getItem('code-snippets-data');
      if (savedSnippets) {
        this.snippets = JSON.parse(savedSnippets);
      }
    } catch (error) {
      console.error('Kod parçacıkları yüklenirken hata oluştu:', error);
    }
    
    // Editör menüsüne kod parçacıkları menüsü ekle
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
  },
  
  // Eklenti durdurma
  onDisable() {
    // Event listener'ları temizle
    document.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
  },
  
  // Sağ tık menüsü işleme
  handleContextMenu(event) {
    // Editör içinde olup olmadığını kontrol et
    const isInEditor = event.target.closest('.monaco-editor');
    if (!isInEditor) return;
    
    // Seçili metni al
    const selection = window.getSelection().toString();
    
    // Kod parçacıkları menüsünü ekle
    setTimeout(() => {
      const contextMenu = document.querySelector('.context-menu');
      if (!contextMenu) return;
      
      // Menü öğesi oluştur
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';
      
      if (selection) {
        // Seçili metin varsa, kaydet seçeneği göster
        menuItem.textContent = 'Kod Parçacığı Olarak Kaydet';
        menuItem.onclick = () => this.saveSnippet(selection);
      } else {
        // Seçili metin yoksa, parçacıkları göster
        menuItem.textContent = 'Kod Parçacığı Ekle';
        menuItem.onclick = () => this.showSnippetsDialog();
      }
      
      contextMenu.appendChild(menuItem);
    }, 0);
  },
  
  // Kod parçacığı kaydetme
  saveSnippet(code) {
    // Parçacık adını sor
    const name = prompt('Kod parçacığı için bir isim girin:');
    if (!name) return;
    
    // Parçacığı kaydet
    this.snippets.push({
      id: Date.now().toString(),
      name,
      code,
      language: window.editor?.getModel()?.getLanguageId() || 'javascript',
      createdAt: new Date().toISOString()
    });
    
    // Yerel depolamaya kaydet
    localStorage.setItem('code-snippets-data', JSON.stringify(this.snippets));
    
    // Bildirim göster
    this.showNotification(`"${name}" kod parçacığı kaydedildi`);
  },
  
  // Kod parçacıkları dialogu gösterme
  showSnippetsDialog() {
    // Dialog oluştur
    const dialog = document.createElement('div');
    dialog.className = 'snippets-dialog';
    dialog.innerHTML = `
      <div class="snippets-dialog-header">
        <h3>Kod Parçacıkları</h3>
        <button class="close-button">×</button>
      </div>
      <div class="snippets-dialog-body">
        ${this.snippets.length === 0 ? 
          '<p>Henüz kaydedilmiş kod parçacığı yok.</p>' : 
          this.snippets.map(snippet => `
            <div class="snippet-item" data-id="${snippet.id}">
              <div class="snippet-header">
                <span class="snippet-name">${snippet.name}</span>
                <span class="snippet-language">${snippet.language}</span>
              </div>
              <pre class="snippet-code">${snippet.code}</pre>
              <div class="snippet-actions">
                <button class="insert-button">Ekle</button>
                <button class="delete-button">Sil</button>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;
    
    // Dialog'u sayfaya ekle
    document.body.appendChild(dialog);
    
    // Kapatma düğmesi
    dialog.querySelector('.close-button').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    // Parçacık ekleme düğmeleri
    dialog.querySelectorAll('.insert-button').forEach(button => {
      button.addEventListener('click', (event) => {
        const snippetId = event.target.closest('.snippet-item').dataset.id;
        const snippet = this.snippets.find(s => s.id === snippetId);
        
        if (snippet && window.editor) {
          const position = window.editor.getPosition();
          window.editor.executeEdits('snippet-insert', [{
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            },
            text: snippet.code
          }]);
          
          document.body.removeChild(dialog);
        }
      });
    });
    
    // Parçacık silme düğmeleri
    dialog.querySelectorAll('.delete-button').forEach(button => {
      button.addEventListener('click', (event) => {
        const snippetId = event.target.closest('.snippet-item').dataset.id;
        
        if (confirm('Bu kod parçacığını silmek istediğinize emin misiniz?')) {
          this.snippets = this.snippets.filter(s => s.id !== snippetId);
          localStorage.setItem('code-snippets-data', JSON.stringify(this.snippets));
          event.target.closest('.snippet-item').remove();
          
          if (this.snippets.length === 0) {
            dialog.querySelector('.snippets-dialog-body').innerHTML = 
              '<p>Henüz kaydedilmiş kod parçacığı yok.</p>';
          }
        }
      });
    });
  },
  
  // Bildirim gösterme
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'plugin-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }, 0);
  },
  
  // Hook'lar
  hooks: {
    'editor:afterInit': (context) => {
      console.log('Kod Parçacıkları eklentisi editör ile entegre oldu');
    }
  }
};

export default CodeSnippetsPlugin;

