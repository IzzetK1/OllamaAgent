// Proje dosyalarını temizle
app.post('/api/projects/:projectId/clean', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    const projectDir = path.join(PROJECTS_DIR, projectId);
    
    // Proje klasörünü kontrol et
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Geçersiz dosyaları temizle
    const invalidFilePatterns = [
      /^npm\s/, /^node\s/, /^python\s/, /^pip\s/, /^yarn\s/, 
      /^git\s/, /^cd\s/, /^mkdir\s/, /^touch\s/, /^rm\s/, 
      /^cp\s/, /^mv\s/, /^ls\s/, /^dir\s/, /^cat\s/, 
      /^echo\s/, /^curl\s/, /^wget\s/, /^ssh\s/, /^sudo\s/,
      /^\/terminal/, /^\/run/, /^npx\s/, /^import\s/, /^_!DOCTYPE/
    ];
    
    // Tüm dosyaları al
    const getAllFiles = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      
      list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
          // Recursive olarak alt klasörleri tara
          results = results.concat(getAllFiles(filePath));
        } else {
          // Dosya yolunu proje klasörüne göre göreceli hale getir
          const relativePath = path.relative(projectDir, filePath);
          results.push(relativePath);
        }
      });
      
      return results;
    };
    
    // Tüm dosyaları al
    let allFiles = [];
    try {
      allFiles = getAllFiles(projectDir);
      console.log('All files in project:', allFiles);
    } catch (err) {
      console.error('Error reading project files:', err);
      // Hata durumunda boş liste kullan
      allFiles = [];
    }
    
    // Silinen dosyaları takip et
    const deletedFiles = [];
    
    // Geçersiz dosyaları sil
    for (const file of allFiles) {
      const fullPath = path.join(projectDir, file);
      
      // Dosya adı kontrolü
      const isInvalidFileName = invalidFilePatterns.some(pattern => 
        pattern.test(file) || pattern.test(path.basename(file))
      );
      
      // Dosya içeriği kontrolü
      let isInvalidContent = false;
      try {
        const content = fs.readFileSync(fullPath, 'utf8').trim();
        const firstLine = content.split('\n')[0].trim();
        isInvalidContent = invalidFilePatterns.some(pattern => pattern.test(firstLine));
      } catch (err) {
        console.error(`Error reading file content: ${file}`, err);
      }
      
      if (isInvalidFileName || isInvalidContent) {
        console.log(`Removing invalid file: ${file}`);
        try {
          fs.unlinkSync(fullPath);
          deletedFiles.push(file);
        } catch (err) {
          console.error(`Error removing file: ${file}`, err);
        }
      }
    }
    
    res.json({
      success: true,
      deletedFiles,
      message: `${deletedFiles.length} invalid files removed`
    });
  } catch (error) {
    console.error('Error cleaning project files:', error);
    res.status(500).json({ error: 'Failed to clean project files', message: error.message });
  }
});
