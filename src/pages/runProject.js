// Projeyi çalıştır
const runProject = async (activeProject, setExecutionResults, setWarnings) => {
  try {
    // Aktif proje yoksa uyarı göster
    if (!activeProject) {
      // Aktif proje yoksa, default projeyi kullan
      try {
        const projectsResponse = await fetch('/api/projects');
        const projectsData = await projectsResponse.json();
        
        if (projectsData.projects && projectsData.projects.length > 0) {
          activeProject = projectsData.projects[0].id;
        } else {
          // Hiç proje yoksa, yeni bir proje oluştur
          const newProjectResponse = await fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: 'default',
              description: 'Default project'
            })
          });
          
          if (newProjectResponse.ok) {
            const newProject = await newProjectResponse.json();
            activeProject = newProject.id;
          } else {
            throw new Error('Proje oluşturulamadı');
          }
        }
      } catch (error) {
        setWarnings(prev => [...prev, {
          id: Date.now(),
          message: 'Projeyi çalıştırmak için önce bir proje seçmelisiniz.'
        }]);
        return;
      }
    }

    // Projeyi çalıştır
    try {
      const response = await fetch(`/api/projects/${activeProject}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Proje çalıştırılamadı');
      }

      const result = await response.json();

      // Tarayıcıda açma komutu ise
      if (result.command === 'open-browser') {
        // Önizleme URL'sini aç
        window.open(result.previewUrl, '_blank');

        // Başarı mesajı göster
        setExecutionResults(prev => [...prev, {
          id: Date.now(),
          command: 'Tarayıcıda Aç',
          output: 'Proje tarayıcıda açıldı.',
          success: true
        }]);
      } else {
        // Sonucu göster
        setExecutionResults(prev => [...prev, {
          id: Date.now(),
          command: result.command,
          output: result.stdout || result.stderr,
          success: result.success
        }]);
      }
    } catch (runError) {
      console.error('Proje çalıştırma hatası:', runError);
      
      // Alternatif olarak dosyaları tara ve ilk çalıştırılabilir dosyayı bul
      try {
        // Proje dosyalarını al
        const filesResponse = await fetch(`/api/projects/${activeProject}/files`);
        if (!filesResponse.ok) {
          throw new Error('Dosyalar alınamadı');
        }
        
        const filesData = await filesResponse.json();
        const files = filesData.files || [];
        
        // Düz bir dosya listesi oluştur
        const flattenFiles = (items, result = []) => {
          for (const item of items) {
            if (item.type === 'file') {
              result.push(item);
            } else if (item.children && item.children.length > 0) {
              flattenFiles(item.children, result);
            }
          }
          return result;
        };
        
        const allFiles = flattenFiles(files);
        
        // Çalıştırılabilir dosyaları bul
        const jsFile = allFiles.find(file => file.path.endsWith('.js'));
        const pyFile = allFiles.find(file => file.path.endsWith('.py'));
        const htmlFile = allFiles.find(file => file.path.endsWith('.html'));
        
        let command = '';
        let filePath = '';
        
        if (jsFile) {
          command = `node ${jsFile.path}`;
          filePath = jsFile.path;
        } else if (pyFile) {
          command = `python ${pyFile.path}`;
          filePath = pyFile.path;
        } else if (htmlFile) {
          // HTML dosyasını tarayıcıda aç
          const previewUrl = `/api/projects/${activeProject}/preview`;
          window.open(previewUrl, '_blank');
          
          setExecutionResults(prev => [...prev, {
            id: Date.now(),
            command: 'Tarayıcıda Aç',
            output: 'HTML dosyası tarayıcıda açıldı.',
            success: true
          }]);
          
          return;
        } else {
          throw new Error('Çalıştırılabilir dosya bulunamadı');
        }
        
        // Komutu çalıştır
        const terminalResponse = await fetch('/api/terminal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            command,
            projectId: activeProject
          })
        });
        
        if (!terminalResponse.ok) {
          throw new Error('Komut çalıştırılamadı');
        }
        
        const terminalResult = await terminalResponse.json();
        
        // Sonucu göster
        setExecutionResults(prev => [...prev, {
          id: Date.now(),
          command,
          output: terminalResult.stdout || terminalResult.stderr,
          success: terminalResult.exitCode === 0
        }]);
      } catch (error) {
        throw new Error(`Proje çalıştırılamadı: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Proje çalıştırma hatası:', error);
    setWarnings(prev => [...prev, {
      id: Date.now(),
      message: `Çalıştırma hatası: ${error.message}`
    }]);
  }
};

export default runProject;
