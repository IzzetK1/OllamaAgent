// Dosya yeniden adlandırma API'si (geliştirilmiş)
export default function setupRenameEndpoint(app, PROJECTS_DIR, path, fs) {
  app.post('/api/projects/:projectId/rename', (req, res) => {
    try {
      const { projectId } = req.params;
      let { oldPath, newPath } = req.body;
      
      if (!oldPath || !newPath) {
        return res.status(400).json({ error: 'Old path and new path are required' });
      }
      
      // Yolları temizle
      oldPath = oldPath.trim();
      oldPath = oldPath.replace(/[<>:"|?*\\]/g, '');
      oldPath = oldPath.replace(/\\/g, '/');
      
      newPath = newPath.trim();
      newPath = newPath.replace(/[<>:"|?*\\]/g, '');
      newPath = newPath.replace(/\\/g, '/');
      
      const projectDir = path.join(PROJECTS_DIR, projectId);
      if (!fs.existsSync(projectDir)) {
        // Proje klasörü yoksa oluştur
        fs.ensureDirSync(projectDir);
        console.log(`Project directory created: ${projectId}`);
        return res.status(404).json({ error: 'Source file or directory not found' });
      }
      
      const oldFullPath = path.join(projectDir, oldPath);
      const newFullPath = path.join(projectDir, newPath);
      
      // Eski dosya/klasör var mı kontrol et
      if (!fs.existsSync(oldFullPath)) {
        return res.status(404).json({ error: 'Source file or directory not found' });
      }
      
      // Yeni dosya/klasör zaten var mı kontrol et
      if (fs.existsSync(newFullPath)) {
        return res.status(400).json({ error: 'Destination already exists' });
      }
      
      // Hedef klasörü oluştur (gerekirse)
      try {
        fs.ensureDirSync(path.dirname(newFullPath));
      } catch (dirError) {
        console.error(`Hedef klasör oluşturma hatası:`, dirError);
        return res.status(500).json({ error: `Failed to create destination directory: ${dirError.message}` });
      }
      
      // Yeniden adlandır
      try {
        fs.renameSync(oldFullPath, newFullPath);
        console.log(`Dosya/klasör yeniden adlandırıldı: ${oldPath} -> ${newPath}`);
      } catch (renameError) {
        console.error(`Yeniden adlandırma hatası:`, renameError);
        return res.status(500).json({ error: `Failed to rename: ${renameError.message}` });
      }
      
      // Dosya mı klasör mü kontrol et
      try {
        const stats = fs.statSync(newFullPath);
        const isDirectory = stats.isDirectory();
        
        res.json({
          oldPath,
          newPath,
          name: path.basename(newPath),
          type: isDirectory ? 'directory' : 'file',
          size: isDirectory ? null : stats.size,
          modified: stats.mtime.toISOString()
        });
      } catch (statError) {
        console.error(`Dosya bilgisi alma hatası:`, statError);
        // Dosya bilgisi alınamasa bile başarılı sayalım
        res.json({
          oldPath,
          newPath,
          name: path.basename(newPath),
          type: 'unknown',
          modified: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error renaming file/directory:', error);
      res.status(500).json({ error: 'Failed to rename file/directory' });
    }
  });
}
