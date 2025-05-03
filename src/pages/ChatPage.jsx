import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiTrash, FiCopy, FiAlertCircle, FiFolder, FiTerminal, FiMonitor } from 'react-icons/fi';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ResizablePanel from '../components/ResizablePanel';
import VSCodeFileExplorer from '../components/FileExplorer/VSCodeFileExplorer';
import SimpleTerminal from '../components/SimpleTerminal';
import WebPreview from '../components/VisualOutput/WebPreview';
import { fetchProjectFiles } from '../utils/fileUtils';



const ChatPage = () => {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');

  // Project state
  const [activeProject, setActiveProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // File explorer state
  const [createdFiles, setCreatedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Terminal state
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  // Web preview state
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // UI state
  const [warnings, setWarnings] = useState([]);
  const [executionResults, setExecutionResults] = useState([]);
  const [activeTab, setActiveTab] = useState('files'); // 'files', 'terminal', 'preview'

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Modelleri yükle
    fetchModels();

    // Projeleri yükle
    fetchProjects();

    // Önceki sohbeti yükle
    const savedMessages = localStorage.getItem('chat-messages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Error loading saved messages:', e);
      }
    }

    // Önceki modeli yükle
    const savedModel = localStorage.getItem('selected-model');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  useEffect(() => {
    // Mesajları kaydet
    localStorage.setItem('chat-messages', JSON.stringify(messages));

    // Mesajların sonuna kaydır
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Seçili modeli kaydet
    if (selectedModel) {
      localStorage.setItem('selected-model', selectedModel);
    }
  }, [selectedModel]);

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');

      if (!response.ok) {
        throw new Error('Modeller yüklenirken bir hata oluştu');
      }

      const data = await response.json();

      if (data.models && Array.isArray(data.models)) {
        setModels(data.models);

        // Eğer model seçilmemişse ve modeller varsa, ilk modeli seç
        if (!selectedModel && data.models.length > 0) {
          setSelectedModel(data.models[0].name);
        }
      }
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  // Projeleri yükle
  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...');
      const response = await fetch('/api/projects', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Projects API response status:', response.status);
      
      let errorText = '';
      if (!response.ok) {
        try {
          errorText = await response.text();
          console.error(`Projects API error (${response.status}):`, errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            console.error('Detailed error:', errorData);
          } catch (e) {
            // JSON parse hatası, önemli değil
          }
        } catch (e) {
          console.error('Error reading response:', e);
        }
        
        // Eğer 500 hatası alıyorsak, varsayılan proje oluşturmayı deneyelim
        if (response.status === 500) {
          console.log('Trying to create default project...');
          return await createDefaultProject();
        }
        
        throw new Error('Projeler yüklenemedi');
      }

      const data = await response.json();
      console.log('Projects loaded:', data);
      setProjects(data.projects || []);

      // Eğer aktif proje yoksa ve projeler varsa, ilk projeyi seç
      if (!activeProject && data.projects && data.projects.length > 0) {
        setActiveProject(data.projects[0].id);
      } else if (!data.projects || data.projects.length === 0) {
        // Hiç proje yoksa, varsayılan proje oluştur
        await createDefaultProject();
      }
    } catch (error) {
      console.error('Projeler yüklenirken hata oluştu:', error);
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: `Projeler yüklenirken hata oluştu: ${error.message}`
      }]);
      
      // Hata durumunda varsayılan proje oluşturmayı dene
      try {
        await createDefaultProject();
      } catch (createError) {
        console.error('Varsayılan proje oluşturma hatası:', createError);
      }
    }
  };

  // Varsayılan proje oluştur
  const createDefaultProject = async () => {
    try {
      console.log('Creating default project...');
      const response = await fetch('/api/projects/default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Default project creation error:', errorText);
        throw new Error('Varsayılan proje oluşturulamadı');
      }

      const data = await response.json();
      console.log('Default project created:', data);
      setActiveProject(data.id);
      
      // Projeleri yeniden yükle
      await fetchProjects();
      return true;
    } catch (error) {
      console.error('Varsayılan proje oluşturma hatası:', error);
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: `Varsayılan proje oluşturulamadı: ${error.message}`
      }]);
      return false;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Dosya oluşturma fonksiyonu
  const createFile = async (fileName, content) => {
    try {
      // Aktif proje yoksa, default projeyi kullan
      if (!activeProject) {
        try {
          const projectsResponse = await fetch('/api/projects');
          const projectsData = await projectsResponse.json();

          if (projectsData.projects && projectsData.projects.length > 0) {
            setActiveProject(projectsData.projects[0].id);
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
              setActiveProject(newProject.id);
            } else {
              throw new Error('Proje oluşturulamadı');
            }
          }
        } catch (projectError) {
          setWarnings(prev => [...prev, {
            id: Date.now(),
            message: 'Dosya oluşturmak için önce bir proje seçmelisiniz.'
          }]);
          return false;
        }
      }

      // Dosya adı ve içerik kontrolü
      // Eğer ilk parametre dosya adı değil de kod ise ve ikinci parametre dil ise
      if (typeof fileName === 'string' && typeof content === 'string' && !fileName.includes('.') && content) {
        // Bu durumda fileName aslında kod, content ise dil
        const code = fileName;
        const language = content;

        // Dile göre varsayılan dosya adı belirle
        const defaultFileNames = {
          'js': 'index.js',
          'jsx': 'App.jsx',
          'ts': 'index.ts',
          'tsx': 'App.tsx',
          'html': 'index.html',
          'css': 'styles.css',
          'json': 'data.json',
          'py': 'main.py',
          'java': 'Main.java',
          'c': 'main.c',
          'cpp': 'main.cpp',
          'go': 'main.go',
          'rb': 'main.rb',
          'php': 'index.php',
          'sh': 'script.sh',
          'bash': 'script.sh',
          'md': 'README.md',
          'sql': 'query.sql',
          'yaml': 'config.yaml',
          'yml': 'config.yml',
          'xml': 'data.xml',
          'dockerfile': 'Dockerfile',
          'docker': 'Dockerfile',
          'javascript': 'index.js',
          'typescript': 'index.ts',
          'python': 'main.py',
          'ruby': 'main.rb',
          'golang': 'main.go',
          'csharp': 'Program.cs',
          'cs': 'Program.cs',
          'rust': 'main.rs',
          'rs': 'main.rs'
        };

        // Dile göre dosya adı belirle
        fileName = defaultFileNames[language.toLowerCase()] || `file.${language.toLowerCase()}`;
        content = code;

        console.log(`Otomatik dosya adı oluşturuldu: ${fileName} (${language})`);
      }

      // Dosya adını temizle (boşluklar, tırnak işaretleri vb.)
      if (fileName) {
        fileName = fileName.trim().replace(/^['"](.*)['"]$/, '$1');
      }

      // Dosya uzantısını kontrol et
      if (!fileName.includes('.')) {
        // Uzantı yoksa, içeriğe göre tahmin et
        if (content.includes('<html') || content.includes('<!DOCTYPE html')) {
          fileName += '.html';
        } else if (content.includes('import React') || content.includes('from "react"')) {
          fileName += '.jsx';
        } else if (content.includes('function') || content.includes('const') || content.includes('let')) {
          fileName += '.js';
        } else if (content.includes('class') && content.includes('{')) {
          fileName += '.js';
        } else if (content.includes('@import') || content.includes('@media')) {
          fileName += '.css';
        } else if (content.includes('def ') && content.includes(':')) {
          fileName += '.py';
        } else if (content.includes('package main') || content.includes('import (')) {
          fileName += '.go';
        } else if (content.includes('public class') || content.includes('private class')) {
          fileName += '.java';
        } else {
          fileName += '.txt';
        }
      }

      // Dosya adını normalize et (Game.js -> game.js)
      // Ancak klasör yapısını koru (components/Game.js -> components/Game.js)
      if (fileName.includes('/')) {
        const parts = fileName.split('/');
        const lastPart = parts.pop();
        // Dosya adını olduğu gibi koru, klasör yapısını normalize etme
        fileName = [...parts, lastPart].join('/');
      }

      // Klasör yapısını kontrol et ve oluştur
      if (fileName.includes('/')) {
        const folderPath = fileName.substring(0, fileName.lastIndexOf('/'));

        // Klasör yapısını oluştur
        try {
          await fetch(`/api/projects/${activeProject}/folders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              path: folderPath
            })
          });
          console.log(`Klasör oluşturuldu: ${folderPath}`);
        } catch (error) {
          console.error(`Klasör oluşturma hatası: ${error.message}`);
        }
      }

      // Dosya yolunu oluştur ve temizle - geçersiz karakterleri kaldır
      let filePath = fileName.startsWith('/') ? fileName.substring(1) : fileName;

      // Dosya yolunu temizle - geçersiz karakterleri kaldır
      filePath = filePath.replace(/[<>:"|?*]/g, '_');

      // Dosya yolu kontrolü - eğer dosya yolu bir klasör ise hata ver
      if (filePath.endsWith('/') || filePath === '') {
        throw new Error('Geçersiz dosya yolu. Bir klasöre yazılamaz.');
      }

      // API isteği gönder
      try {
        const response = await fetch(`/api/projects/${activeProject}/files/${filePath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Dosya oluşturulamadı');
        }
      } catch (apiError) {
        console.error('API hatası:', apiError);
        throw new Error(`Dosya oluşturulamadı: ${apiError.message}`);
      }

      // Dosya bilgilerini al
      let fileData;
      try {
        const dataResponse = await fetch(`/api/projects/${activeProject}/files/${filePath}`, {
          method: 'GET'
        });

        if (dataResponse.ok) {
          fileData = await dataResponse.json();
        } else {
          // Dosya bilgisi alınamazsa, basit bir nesne oluştur
          const fileName = filePath.split('/').pop();
          fileData = {
            name: fileName,
            path: filePath,
            size: content.length
          };
        }
      } catch (dataError) {
        console.error('Dosya bilgisi alınamadı:', dataError);
        // Dosya bilgisi alınamazsa, basit bir nesne oluştur
        fileData = {
          name: filePath.split('/').pop(),
          path: filePath,
          size: content.length
        };
      }

      // Oluşturulan dosyaları listesine ekle
      setCreatedFiles(prev => [...prev, {
        id: Date.now(),
        name: fileData.name,
        path: fileData.path,
        size: fileData.size
      }]);

      // Başarı mesajı göster
      setExecutionResults(prev => [...prev, {
        id: Date.now(),
        command: 'Dosya Oluşturma',
        output: `Dosya başarıyla oluşturuldu: ${filePath}`,
        success: true
      }]);

      return true;
    } catch (error) {
      console.error('Dosya oluşturma hatası:', error);
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: `Dosya oluşturma hatası: ${error.message}`
      }]);
      return false;
    }
  };

  // Terminal komutu çalıştırma fonksiyonu
  const executeTerminalCommand = async (command) => {
    try {
      // Aktif proje yoksa uyarı göster
      if (!activeProject) {
        // Aktif proje yoksa, default projeyi kullan
        try {
          const projectsResponse = await fetch('/api/projects');
          const projectsData = await projectsResponse.json();

          if (projectsData.projects && projectsData.projects.length > 0) {
            setActiveProject(projectsData.projects[0].id);
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
              setActiveProject(newProject.id);
            } else {
              throw new Error('Proje oluşturulamadı');
            }
          }
        } catch (error) {
          setWarnings(prev => [...prev, {
            id: Date.now(),
            message: 'Komut çalıştırmak için önce bir proje seçmelisiniz.'
          }]);
          return;
        }
      }

      console.log('Terminal komutu çalıştırılıyor:', command);

      // CD komutları için özel işlem
      if (command.startsWith('cd ')) {
        const dirPath = command.substring(3).trim();

        // Klasör oluştur
        try {
          const response = await fetch(`/api/projects/${activeProject}/folders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              path: dirPath
            })
          });

          if (!response.ok) {
            throw new Error('Klasör oluşturulamadı');
          }

          await response.json(); // Yanıtı oku ama kullanma

          // Başarı mesajı göster
          setExecutionResults(prev => [...prev, {
            id: Date.now(),
            command,
            output: `Klasör oluşturuldu: ${dirPath}`,
            success: true
          }]);

          // Terminal çıktısını güncelle
          setTerminalOutput(prev => [...prev, {
            id: Date.now(),
            command,
            output: `Klasör oluşturuldu: ${dirPath}`,
            success: true
          }]);

          return;
        } catch (error) {
          console.error(`Klasör oluşturma hatası: ${error.message}`);
          setWarnings(prev => [...prev, {
            id: Date.now(),
            message: `Klasör oluşturma hatası: ${error.message}`
          }]);

          // Terminal çıktısını güncelle
          setTerminalOutput(prev => [...prev, {
            id: Date.now(),
            command,
            output: `Klasör oluşturma hatası: ${error.message}`,
            success: false
          }]);

          return;
        }
      }

      // Terminal API'sine istek gönder
      const response = await fetch('/api/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command,
          projectId: activeProject
        })
      });

      if (!response.ok) {
        throw new Error('Komut çalıştırılamadı');
      }

      const result = await response.json();

      // Terminal çıktısını güncelle
      setTerminalOutput(prev => [...prev, {
        id: Date.now(),
        command,
        output: result.stdout || result.stderr,
        success: result.exitCode === 0
      }]);

      // Çalıştırma sonuçlarını göster
      setExecutionResults(prev => [...prev, {
        id: Date.now(),
        command,
        output: result.stdout || result.stderr,
        success: result.exitCode === 0
      }]);

      // Eğer HTML dosyası çalıştırıldıysa veya web sunucusu başlatıldıysa önizleme göster
      if (command.includes('index.html') ||
          command.includes('npm start') ||
          command.includes('npm run dev') ||
          command.includes('python -m http.server') ||
          command.includes('serve') ||
          command.includes('live-server')) {

        // Önizleme URL'sini ayarla
        if (result.openInBrowser && result.url) {
          setPreviewUrl(result.url);
          setShowPreview(true);
          setActiveTab('preview');
        } else {
          // Varsayılan URL
          setPreviewUrl(`http://localhost:3000`);
          setShowPreview(true);
          setActiveTab('preview');
        }
      }
    } catch (error) {
      console.error('Komut çalıştırma hatası:', error);
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: `Komut çalıştırma hatası: ${error.message}`
      }]);

      // Terminal çıktısını güncelle
      setTerminalOutput(prev => [...prev, {
        id: Date.now(),
        command,
        output: `Hata: ${error.message}`,
        success: false
      }]);
    }
  };

  // Terminal temizleme
  const clearTerminal = () => {
    setTerminalOutput([]);
  };

  // Kod çalıştırma fonksiyonu
  const executeCode = async (code, language) => {
    try {
      // Aktif proje yoksa uyarı göster
      if (!activeProject) {
        // Aktif proje yoksa, default projeyi kullan
        try {
          const projectsResponse = await fetch('/api/projects');
          const projectsData = await projectsResponse.json();

          if (projectsData.projects && projectsData.projects.length > 0) {
            setActiveProject(projectsData.projects[0].id);
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
              setActiveProject(newProject.id);
            } else {
              throw new Error('Proje oluşturulamadı');
            }
          }
        } catch (error) {
          setWarnings(prev => [...prev, {
            id: Date.now(),
            message: 'Kod çalıştırmak için önce bir proje seçmelisiniz.'
          }]);
          return;
        }
      }

      // Eğer bu bir terminal komutu ise, doğrudan çalıştır
      if (language === 'bash' || language === 'sh' ||
          code.trim().startsWith('cd ') ||
          code.trim().startsWith('npm ') ||
          code.trim().startsWith('node ') ||
          code.trim().startsWith('python ') ||
          code.trim().startsWith('git ')) {
        executeTerminalCommand(code.trim());
        return;
      }

      // Geçici dosya oluştur
      let fileName;
      switch (language) {
        case 'javascript':
        case 'js':
          fileName = 'temp.js';
          break;
        case 'python':
        case 'py':
          fileName = 'temp.py';
          break;
        case 'html':
          fileName = 'temp.html';
          break;
        default:
          fileName = 'temp.txt';
      }

      // Dosyayı oluştur
      const fileCreated = await createFile(fileName, code);

      if (!fileCreated) {
        throw new Error('Dosya oluşturulamadı');
      }

      // Komutu belirle
      let command;
      switch (language) {
        case 'javascript':
        case 'js':
          command = `node ${fileName}`;
          break;
        case 'python':
        case 'py':
          command = `python ${fileName}`;
          break;
        case 'html':
          // HTML için dosyayı aç
          setExecutionResults(prev => [...prev, {
            id: Date.now(),
            command: `HTML dosyası açıldı: ${fileName}`,
            output: 'HTML dosyası tarayıcıda açıldı.',
            success: true
          }]);
          return;
        default:
          setWarnings(prev => [...prev, {
            id: Date.now(),
            message: `${language} dili için çalıştırma desteği bulunmuyor.`
          }]);
          return;
      }

      // Projeyi çalıştır API'sine istek gönder
      try {
        const runResponse = await fetch(`/api/projects/${activeProject}/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            command
          })
        });

        if (!runResponse.ok) {
          throw new Error('Proje çalıştırılamadı');
        }

        const result = await runResponse.json();

        // Sonucu göster
        setExecutionResults(prev => [...prev, {
          id: Date.now(),
          command,
          output: result.stdout || result.stderr,
          success: result.success
        }]);
      } catch (runError) {
        console.error('Proje çalıştırma hatası:', runError);

        // Alternatif olarak terminal API'sini dene
        try {
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
        } catch (terminalError) {
          throw new Error(`Komut çalıştırılamadı: ${terminalError.message}`);
        }
      }
    } catch (error) {
      console.error('Kod çalıştırma hatası:', error);
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: `Kod çalıştırma hatası: ${error.message}`
      }]);
    }
  };

  // Bu fonksiyon kaldırıldı

  // Dosyaları test et
  const testFiles = async (files) => {
    if (!activeProject || files.length === 0) return;

    try {
      const response = await fetch(`/api/projects/${activeProject}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: files.map(file => ({ path: file.fileName }))
        })
      });

      if (!response.ok) {
        throw new Error('Dosyalar test edilemedi');
      }

      const { results } = await response.json();

      // Test sonuçlarını göster
      results.forEach(result => {
        if (result.success) {
          console.log(`Test başarılı: ${result.file}`);
        } else {
          console.error(`Test başarısız: ${result.file}`, result.error);
          setWarnings(prev => [...prev, {
            id: Date.now(),
            message: `Test hatası (${result.file}): ${result.error}`
          }]);
        }
      });

      // Başarısız testler varsa, hataları düzelt
      const failedTests = results.filter(result => !result.success);
      if (failedTests.length > 0) {
        fixErrors(failedTests, files);
      }
    } catch (error) {
      console.error('Test hatası:', error);
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: `Test hatası: ${error.message}`
      }]);
    }
  };

  // Hataları düzelt
  const fixErrors = async (failedTests, files) => {
    // Her başarısız test için
    for (const test of failedTests) {
      // Dosyayı bul
      const file = files.find(f => f.fileName === test.file);
      if (!file) continue;

      // Hata mesajını analiz et
      const errorMessage = test.error;
      let fixedCode = file.code;

      // Basit hata düzeltmeleri
      if (file.language === 'javascript' || file.language === 'jsx') {
        // Eksik parantez hatası
        if (errorMessage.includes('missing') && errorMessage.includes('}')) {
          fixedCode += '\n}';
        }

        // Eksik noktalı virgül hatası
        if (errorMessage.includes('missing') && errorMessage.includes(';')) {
          fixedCode += ';';
        }

        // Tanımlanmamış değişken hatası
        const undefinedMatch = errorMessage.match(/([a-zA-Z0-9_]+) is not defined/);
        if (undefinedMatch) {
          const varName = undefinedMatch[1];
          fixedCode = `const ${varName} = {};\n${fixedCode}`;
        }
      } else if (file.language === 'html') {
        // Eksik HTML tag'i
        if (errorMessage.includes('HTML structure is invalid')) {
          if (!fixedCode.includes('<!DOCTYPE html>')) {
            fixedCode = `<!DOCTYPE html>\n${fixedCode}`;
          }
          if (!fixedCode.includes('<html>')) {
            fixedCode = `${fixedCode}\n<html>\n<body>\n</body>\n</html>`;
          }
        }
      }

      // Düzeltilmiş kodu kaydet
      if (fixedCode !== file.code) {
        await createFile(file.fileName, fixedCode);
        console.log(`Hata düzeltildi: ${file.fileName}`);
      }
    }
  };

  // Projeyi çalıştır
  const runProject = async () => {
    if (!activeProject) {
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: 'Projeyi çalıştırmak için önce bir proje seçmelisiniz.'
      }]);
      return;
    }

    try {
      console.log('Proje çalıştırılıyor:', activeProject);
      
      // Önce proje dosyalarını kontrol et
      const filesResponse = await fetch(`/api/projects/${activeProject}/files`);
      const filesData = await filesResponse.json();
      
      // Eğer dosya yoksa, kullanıcıya bilgi ver
      if (!filesData.files || filesData.files.length === 0) {
        console.log('Projede çalıştırılabilir dosya bulunamadı. Varsayılan dosya oluşturulacak.');
        
        // Varsayılan HTML dosyası oluştur
        await createFile('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to My Project</h1>
    <p>This is a starter template. Edit this file to get started!</p>
  </div>
</body>
</html>`);
      }

      // Projeyi çalıştır
      const response = await fetch(`/api/projects/${activeProject}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Proje çalıştırılamadı');
      }

      const result = await response.json();
      console.log('Proje çalıştırma sonucu:', result);

      if (result.command === 'open-browser' && result.previewUrl) {
        // Önizleme URL'sini ayarla
        setPreviewUrl(result.previewUrl);
        setShowPreview(true);
        setActiveTab('preview');
        
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
          command: result.command || 'Proje Çalıştırma',
          output: result.stdout || result.stderr || 'Proje başarıyla çalıştırıldı.',
          success: result.success
        }]);
      }

      // Terminal çıktısını güncelle
      setTerminalOutput(prev => [...prev, {
        id: Date.now(),
        command: result.command || 'Proje Çalıştırma',
        output: result.stdout || result.stderr || 'Proje başarıyla çalıştırıldı.',
        success: result.success
      }]);
    } catch (error) {
      console.error('Proje çalıştırma hatası:', error);
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: `Proje çalıştırma hatası: ${error.message}`
      }]);
      
      // Terminal çıktısını güncelle
      setTerminalOutput(prev => [...prev, {
        id: Date.now(),
        command: 'Proje Çalıştırma',
        output: `Hata: ${error.message}`,
        success: false
      }]);
    }
  };

  // AI yanıtını işleme fonksiyonu
  const processAIResponse = async (response) => {
    try {
      // Dosya oluşturma komutlarını bul
      // Örnek format: `pages/index.js` dosyasını açın ve aşağıdaki kodu ekleyin:
      const fileCommandRegex = /`([^`]+)`\s+dosyasını\s+(?:açın|oluşturun)\s+ve\s+(?:aşağıdaki|şu)\s+kodu\s+ekleyin/g;
      let fileMatch;
      let fileCommands = [];
      
      while ((fileMatch = fileCommandRegex.exec(response)) !== null) {
        const filePath = fileMatch[1].trim();
        
        // Dosya yolunun geçerli olup olmadığını kontrol et
        if (filePath && !filePath.includes('..') && !filePath.startsWith('/')) {
          fileCommands.push({
            filePath,
            index: fileMatch.index
          });
        }
      }
      
      // Kod bloklarını bul
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let codeMatch;
      let codeBlocks = [];
      
      while ((codeMatch = codeBlockRegex.exec(response)) !== null) {
        const language = codeMatch[1] || 'text';
        const code = codeMatch[2].trim();
        
        // Terminal komutu kontrolü
        const isTerminalCommand = isCommandLanguage(language) || isCommandContent(code);
        
        codeBlocks.push({
          language,
          code,
          index: codeMatch.index,
          isTerminalCommand
        });
      }
      
      // Dosya komutları ve kod bloklarını eşleştir
      for (let i = 0; i < fileCommands.length; i++) {
        const fileCommand = fileCommands[i];
        
        // Bu dosya komutu için en yakın kod bloğunu bul
        let closestCodeBlock = null;
        let minDistance = Infinity;
        
        for (const codeBlock of codeBlocks) {
          // Terminal komutlarını atla
          if (codeBlock.isTerminalCommand) continue;
          
          const distance = Math.abs(codeBlock.index - fileCommand.index);
          if (distance < minDistance) {
            minDistance = distance;
            closestCodeBlock = codeBlock;
          }
        }
        
        // Eğer bir kod bloğu bulunduysa ve makul bir mesafedeyse
        if (closestCodeBlock && minDistance < 1000) {
          // Dosyayı oluştur
          console.log(`Dosya oluşturuluyor: ${fileCommand.filePath}`);
          await createFile(fileCommand.filePath, closestCodeBlock.code);
          
          // Başarı mesajı göster
          setExecutionResults(prev => [...prev, {
            id: Date.now(),
            command: `Dosya Oluşturma: ${fileCommand.filePath}`,
            output: `Dosya başarıyla oluşturuldu: ${fileCommand.filePath}`,
            success: true
          }]);
        }
      }
      
      // Terminal komutlarını çalıştır
      const terminalCommands = [];
      
      // Terminal komutlarını topla
      for (const codeBlock of codeBlocks) {
        if (codeBlock.isTerminalCommand) {
          const commandLines = codeBlock.code.split('\n');
          for (const line of commandLines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
              terminalCommands.push(trimmedLine);
            }
          }
        }
      }
      
      // Satır başındaki terminal komutlarını bul
      const lineCommandRegex = /^(?:\/terminal\s+|\/run\s+|\$\s*|>\s*)(.+)$/gm;
      let lineMatch;
      
      while ((lineMatch = lineCommandRegex.exec(response)) !== null) {
        const command = lineMatch[1].trim();
        if (command) {
          terminalCommands.push(command);
        }
      }
      
      // Terminal komutlarını çalıştır
      for (const command of terminalCommands) {
        await executeTerminalCommand(command);
      }
      
      // Eşleştirilmemiş kod bloklarını işle
      for (let i = 0; i < codeBlocks.length; i++) {
        const codeBlock = codeBlocks[i];
        
        // Terminal komutlarını atla
        if (codeBlock.isTerminalCommand) continue;
        
        // Bu kod bloğu zaten bir dosya ile eşleştirilmiş mi?
        let isMatched = false;
        
        for (const fileCommand of fileCommands) {
          for (const matchedCodeBlock of codeBlocks) {
            if (Math.abs(matchedCodeBlock.index - fileCommand.index) < 1000 && 
                matchedCodeBlock.index === codeBlock.index) {
              isMatched = true;
              break;
            }
          }
          
          if (isMatched) break;
        }
        
        // Eğer eşleştirilmemişse, varsayılan dosya adıyla kaydet
        if (!isMatched) {
          const fileName = getDefaultFileName(codeBlock.language);
          await createFile(fileName, codeBlock.code);
        }
      }
      
      // Dosya oluşturma işlemi tamamlandıktan sonra projeyi çalıştır
      setTimeout(() => {
        runProject();
      }, 1000);
      
    } catch (error) {
      console.error('AI yanıtını işleme hatası:', error);
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: `AI yanıtını işleme hatası: ${error.message}`
      }]);
    }
  };

  /**
   * Dilin komut dili olup olmadığını kontrol eder
   * @param {string} language - Dil
   * @returns {boolean} - Komut dili ise true
   */
  function isCommandLanguage(language) {
    if (!language) return false;
    
    const commandLanguages = [
      'bash', 'shell', 'sh', 'cmd', 'powershell', 'ps1', 
      'terminal', 'console', 'command'
    ];
    
    return commandLanguages.includes(language.toLowerCase());
  }

  /**
   * İçeriğin komut içerip içermediğini kontrol eder
   * @param {string} content - İçerik
   * @returns {boolean} - Komut içeriyorsa true
   */
  function isCommandContent(content) {
    if (!content) return false;
    
    // Yaygın terminal komutları
    const terminalCommands = [
      'npm ', 'node ', 'python ', 'pip ', 'yarn ', 
      'git ', 'cd ', 'mkdir ', 'touch ', 'rm ', 
      'cp ', 'mv ', 'ls ', 'dir ', 'cat ', 
      'echo ', 'curl ', 'wget ', 'ssh ', 'sudo ',
      '/terminal', '/run'
    ];
    
    const contentLines = content.trim().split('\n');
    
    // İlk satır komut mu kontrol et
    const firstLine = contentLines[0].trim();
    return terminalCommands.some(cmd => firstLine.startsWith(cmd));
  }

  /**
   * Dile göre varsayılan dosya adı döndürür
   * @param {string} language - Dil
   * @returns {string} - Varsayılan dosya adı
   */
  function getDefaultFileName(language) {
    const defaultFileNames = {
      'js': 'index.js',
      'jsx': 'App.jsx',
      'ts': 'index.ts',
      'tsx': 'App.tsx',
      'html': 'index.html',
      'css': 'styles.css',
      'json': 'data.json',
      'py': 'main.py',
      'java': 'Main.java',
      'c': 'main.c',
      'cpp': 'main.cpp',
      'go': 'main.go',
      'rb': 'main.rb',
      'php': 'index.php',
      'sh': 'script.sh',
      'bash': 'script.sh',
      'md': 'README.md',
      'sql': 'query.sql',
      'yaml': 'config.yaml',
      'yml': 'config.yml',
      'xml': 'data.xml',
      'dockerfile': 'Dockerfile',
      'docker': 'Dockerfile',
      'javascript': 'index.js',
      'typescript': 'index.ts',
      'python': 'main.py',
      'ruby': 'main.rb',
      'golang': 'main.go',
      'csharp': 'Program.cs',
      'cs': 'Program.cs',
      'rust': 'main.rs',
      'rs': 'main.rs'
    };

    return defaultFileNames[language.toLowerCase()] || `file.${language}`;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim() || loading || !selectedModel) return;

    // Uyarıları ve çalıştırma sonuçlarını temizle
    setWarnings([]);
    setExecutionResults([]);

    const userMessage = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Sistem mesajını oluştur - AI agent modu
      const systemMessage = {
        role: 'system',
        content: `You are IK, an AI agent trained by Izzettin. You are a professional developer with expertise in creating applications, websites, and software solutions.

When asked to create a website, app, or any software:
1. Always provide complete, working code with proper structure and organization
2. Create all necessary files with proper file extensions using the format \`\`\`language:filename\n[code]\`\`\`
3. Use modern frameworks, libraries, and best practices
4. Explain how to run, test, and deploy the code
5. Never say you can't create files or write code - you are fully capable
6. Act as if you are directly creating the files and implementing the solution
7. Provide detailed, step-by-step instructions with clear explanations
8. Use code blocks with proper syntax highlighting for all code
9. For websites, use React, Next.js, or similar modern frameworks
10. Include all necessary HTML, CSS, and JavaScript code
11. Automatically create folder structures when needed
12. Provide package.json with all required dependencies
13. Include proper error handling and validation
14. Write clean, maintainable, and well-documented code
15. Suggest terminal commands to run the code and install dependencies

Remember: You ARE capable of creating websites and applications. Your purpose is to help users by writing code and creating functional solutions. Always be proactive and thorough in your implementations.`
      };

      const response = await fetch('/api/test-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            systemMessage,
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            userMessage
          ]
        })
      });

      if (!response.ok) {
        throw new Error('API yanıt vermedi');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith('data: ')) {
            const data = line.substring(6);

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.message && parsed.message.content) {
                aiResponse += parsed.message.content;

                setMessages(prev => {
                  const newMessages = [...prev];

                  // Eğer AI yanıtı zaten varsa güncelle, yoksa ekle
                  const aiMessageIndex = newMessages.findIndex(
                    msg => msg.role === 'assistant' && msg.isPartial
                  );

                  if (aiMessageIndex !== -1) {
                    newMessages[aiMessageIndex] = {
                      role: 'assistant',
                      content: aiResponse,
                      isPartial: true
                    };
                  } else {
                    newMessages.push({
                      role: 'assistant',
                      content: aiResponse,
                      isPartial: true
                    });
                  }

                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing JSON:', e, data);
            }
          }
        }
      }

      // Yanıt tamamlandığında isPartial bayrağını kaldır
      setMessages(prev => {
        const newMessages = [...prev];
        const aiMessageIndex = newMessages.findIndex(
          msg => msg.role === 'assistant' && msg.isPartial
        );

        if (aiMessageIndex !== -1) {
          newMessages[aiMessageIndex] = {
            role: 'assistant',
            content: aiResponse
          };
        }

        return newMessages;
      });

      // Yeni bir proje başlatılıyorsa, dosyaları temizle
      const shouldClearFiles = userMessage.content.toLowerCase().includes('yeni proje') ||
                              userMessage.content.toLowerCase().includes('yeni bir proje') ||
                              userMessage.content.toLowerCase().includes('sıfırdan') ||
                              userMessage.content.toLowerCase().includes('oluştur') ||
                              userMessage.content.toLowerCase().includes('yap');

      // Kod bloklarını işle ve dosya oluştur - async olduğu için await ile çağır
      try {
        // Kod bloklarını çıkar ve dosya oluştur
        const response = await fetch('/api/extract-files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: aiResponse,
            projectId: activeProject,
            clearFiles: shouldClearFiles
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Kod blokları işlendi:', result);

        // Oluşturulan dosyaları göster
        if (result.files && result.files.length > 0) {
          // Dosya listesini güncelle
          fetchProjectFiles(activeProject, setCreatedFiles, setWarnings);

          // Dosya oluşturma bilgisini göster
          const fileNames = result.files.map(file => file.path).join(', ');
          setExecutionResults(prev => [...prev, {
            id: Date.now(),
            command: 'Dosya Oluşturma',
            output: `Dosyalar oluşturuldu: ${fileNames}`,
            success: true
          }]);
        }

        // Terminal komutlarını çalıştır
        if (result.commands && result.commands.length > 0) {
          for (const cmd of result.commands) {
            setExecutionResults(prev => [...prev, {
              id: Date.now(),
              command: cmd.command,
              output: cmd.stdout || cmd.stderr || 'Komut çalıştırıldı',
              success: cmd.exitCode === 0
            }]);
          }
        }

        // Eğer yeni proje başlatılıyorsa ve dosyalar temizlenecekse bildir
        if (shouldClearFiles) {
          setExecutionResults(prev => [...prev, {
            id: Date.now(),
            command: 'Proje Temizleme',
            output: 'Yeni proje için dosyalar temizlendi.',
            success: true
          }]);
        }

        // Otomatik olarak projeyi çalıştır
        if (result.files && result.files.length > 0) {
          setTimeout(() => {
            runProject();
          }, 2000);
        }
      } catch (error) {
        console.error('Kod bloklarını işleme hatası:', error);
        setWarnings(prev => [...prev, {
          id: Date.now(),
          message: `Kod bloklarını işleme hatası: ${error.message}`
        }]);
      }

    } catch (err) {
      console.error('Error sending message:', err);

      // Hata mesajı ekle
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: 'Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Sohbeti temizlemek istediğinizden emin misiniz?')) {
      setMessages([]);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        alert('Metin panoya kopyalandı');
      },
      (err) => {
        console.error('Kopyalama hatası:', err);
      }
    );
  };

  // Yeni proje oluştur
  const createNewProject = async () => {
    if (!newProjectName.trim()) {
      alert('Proje adı boş olamaz');
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription
        })
      });

      if (!response.ok) {
        throw new Error('Proje oluşturulamadı');
      }

      const project = await response.json();

      // Projeleri yeniden yükle
      fetchProjects();

      // Yeni projeyi aktif proje olarak ayarla
      setActiveProject(project.id);

      // Modal'ı kapat ve form alanlarını temizle
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (error) {
      console.error('Proje oluşturma hatası:', error);
      alert(`Proje oluşturma hatası: ${error.message}`);
    }
  };

  // Kod bloğu işleme fonksiyonları
  const handleCreateFile = (code, language) => {
    // Dosya adını tahmin et
    let fileName = `file.${language}`;

    if (language === 'javascript') {
      fileName = 'script.js';
    } else if (language === 'python') {
      fileName = 'script.py';
    } else if (language === 'html') {
      fileName = 'index.html';
    } else if (language === 'css') {
      fileName = 'style.css';
    }

    // Dosya oluştur
    createFile(fileName, code, activeProject).then(result => {
      console.log('Dosya oluşturuldu:', result);
      // Dosya içeriğini göster
      setExecutionResults(prev => [...prev, {
        id: Date.now(),
        command: `Dosya Oluşturuldu: ${fileName}`,
        output: code,
        success: true
      }]);
    }).catch(error => {
      console.error('Dosya oluşturma hatası:', error);
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: `Dosya oluşturma hatası: ${error.message}`
      }]);
    });
  };

  const handleRunCode = (code, language) => {
    // Kodu çalıştır
    executeCode(code, language, activeProject).then(result => {
      console.log('Kod çalıştırıldı:', result);
      // Çalıştırma sonucunu göster
      setExecutionResults(prev => [...prev, {
        id: Date.now(),
        command: `Kod Çalıştırıldı (${language})`,
        output: result.stdout || result.stderr || 'Çıktı yok',
        success: result.success
      }]);
    }).catch(error => {
      console.error('Kod çalıştırma hatası:', error);
      setWarnings(prev => [...prev, {
        id: Date.now(),
        message: `Kod çalıştırma hatası: ${error.message}`
      }]);
    });
  };

  return (
    <div className="container mx-auto h-full flex flex-col">
      {/* Yeni Proje Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Yeni Proje Oluştur</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium mb-1">
                  Proje Adı <span className="text-red-500">*</span>
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-dark-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-700"
                  placeholder="Proje adını girin"
                />
              </div>

              <div>
                <label htmlFor="project-description" className="block text-sm font-medium mb-1">
                  Açıklama
                </label>
                <textarea
                  id="project-description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full border border-gray-300 dark:border-dark-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-700"
                  placeholder="Proje açıklaması (isteğe bağlı)"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => {
                    setShowNewProjectModal(false);
                    setNewProjectName('');
                    setNewProjectDescription('');
                  }}
                  className="btn btn-outline"
                >
                  İptal
                </button>
                <button
                  onClick={createNewProject}
                  className="btn btn-primary"
                  disabled={!newProjectName.trim()}
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">AI Sohbet</h1>

        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="model-select" className="mr-2 text-sm font-medium">
              Model:
            </label>
            <select
              id="model-select"
              className="border border-gray-300 dark:border-dark-500 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.length === 0 ? (
                <option value="">Yükleniyor...</option>
              ) : (
                models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center">
            <label htmlFor="project-select" className="mr-2 text-sm font-medium">
              Proje:
            </label>
            <div className="flex items-center space-x-2">
              <select
                id="project-select"
                className="border border-gray-300 dark:border-dark-500 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                value={activeProject || ''}
                onChange={(e) => setActiveProject(e.target.value)}
              >
                <option value="">Proje Seçin</option>
                {projects.length === 0 ? (
                  <option value="" disabled>Yükleniyor...</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="btn btn-outline btn-sm flex items-center"
                title="Yeni Proje Oluştur"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="btn btn-outline flex items-center"
            title="Sohbeti Temizle"
          >
            <FiTrash className="mr-2" />
            Temizle
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ResizablePanel
          sizes={[70, 30]}
          direction="horizontal"
          className="h-full"
        >
          {/* Ana sohbet alanı */}
          <div className="h-full flex flex-col">
            <div className="flex-1 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg shadow-sm overflow-hidden flex flex-col">
              {/* Mesajlar */}
              <div className="flex-1 overflow-auto p-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">Sohbete Başlayın</h3>
                      <p>AI asistanına bir soru sorun veya bir görev verin</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-3xl rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200'
                              : message.role === 'system'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                              : 'bg-gray-100 dark:bg-dark-600 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium uppercase">
                              {message.role === 'user'
                                ? 'Siz'
                                : message.role === 'system'
                                ? 'Sistem'
                                : 'AI'}
                            </span>

                            {message.role !== 'system' && (
                              <button
                                onClick={() => copyToClipboard(message.content)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                title="Kopyala"
                              >
                                <FiCopy size={14} />
                              </button>
                            )}
                          </div>

                          <div className="prose dark:prose-invert max-w-none">
                            {message.role === 'user' ? (
                              <p>{message.content}</p>
                            ) : (
                              <MarkdownRenderer
                                content={message.content}
                                onCreateFile={handleCreateFile}
                                onRunCode={handleRunCode}
                              />
                            )}
                          </div>

                          {message.isPartial && (
                            <div className="mt-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Giriş alanı */}
              <div className="border-t border-gray-200 dark:border-dark-600 p-4">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Bir mesaj yazın..."
                    className="flex-1 border border-gray-300 dark:border-dark-500 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !selectedModel}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <FiSend className="mr-2" />
                        Gönder
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sağ panel - Dosyalar, Terminal ve Önizleme */}
          <div className="h-full flex flex-col overflow-hidden">
            <div className="bg-[#252526] px-4 py-2 border-b border-gray-800 flex">
              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1 text-sm rounded-t-md flex items-center ${activeTab === 'files' ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#333333]'}`}
                  onClick={() => setActiveTab('files')}
                >
                  <FiFolder className="mr-2" />
                  EXPLORER
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded-t-md flex items-center ${activeTab === 'terminal' ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#333333]'}`}
                  onClick={() => setActiveTab('terminal')}
                >
                  <FiTerminal className="mr-2" />
                  TERMINAL
                </button>
                {showPreview && (
                  <button
                    className={`px-3 py-1 text-sm rounded-t-md flex items-center ${activeTab === 'preview' ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#333333]'}`}
                    onClick={() => setActiveTab('preview')}
                  >
                    <FiMonitor className="mr-2" />
                    PREVIEW
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {/* VSCode File Explorer */}
              {activeTab === 'files' && (
                <div className="h-full">
                  <VSCodeFileExplorer
                    projectId={activeProject}
                    onFileSelect={(file) => {
                      setSelectedFile(file);
                      // Dosya seçildiğinde yapılacak işlemler
                      console.log('Seçilen dosya:', file);
                      // Dosya içeriğini editöre yükle
                      if (file && file.path) {
                        fetch(`/api/projects/${activeProject}/files/${file.path}`)
                          .then(response => response.json())
                          .then(data => {
                            if (data.content) {
                              // Dosya içeriğini göster
                              setExecutionResults(prev => [...prev, {
                                id: Date.now(),
                                command: `Dosya: ${file.path}`,
                                output: data.content,
                                success: true
                              }]);
                            }
                          })
                          .catch(error => {
                            console.error('Dosya içeriği alınamadı:', error);
                            setWarnings(prev => [...prev, {
                              id: Date.now(),
                              message: `Dosya içeriği alınamadı: ${error.message}`
                            }]);
                          });
                      }
                    }}
                  />
                </div>
              )}

              {/* SimpleTerminal */}
              {activeTab === 'terminal' && (
                <div className="h-full">
                  <SimpleTerminal
                    projectId={activeProject}
                    onCommand={executeTerminalCommand}
                    onClear={clearTerminal}
                    isMaximized={isTerminalMaximized}
                    onMaximize={() => setIsTerminalMaximized(!isTerminalMaximized)}
                  />
                </div>
              )}

              {/* Web Preview */}
              {activeTab === 'preview' && showPreview && (
                <div className="h-full">
                  <WebPreview
                    projectId={activeProject}
                    url={previewUrl}
                    isMaximized={isPreviewMaximized}
                    onMaximize={() => setIsPreviewMaximized(!isPreviewMaximized)}
                    onClose={() => {
                      setShowPreview(false);
                      setActiveTab('files');
                    }}
                  />
                </div>
              )}

              {/* Warnings Panel - Always visible at the bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-[#252526] border-t border-gray-800 max-h-32 overflow-auto">
                {warnings.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-2 py-1 mb-1">
                      <h3 className="font-medium flex items-center text-white text-xs">
                        <FiAlertCircle className="mr-2 text-yellow-500" />
                        UYARILAR
                      </h3>
                      <button
                        className="text-gray-400 hover:text-white text-xs"
                        onClick={() => setWarnings([])}
                      >
                        Temizle
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {warnings.map((warning) => (
                        <li key={warning.id} className="text-xs bg-[#332b00] text-[#ffcc00] p-2 rounded">
                          {warning.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>
      </div>
    </div>
  );
};

export default ChatPage;
