// Main.js - Ana uygulama giriş noktası
import '../css/main.css';
import { initializeChat } from './chat';
import { initializeEditor } from './editor';
import { initializeTerminal } from './terminal';
import { initializeFileManager } from './fileManager';

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', () => {
    console.log('Uygulama başlatılıyor...');
    
    // Bileşenleri başlat
    initializeChat();
    initializeEditor();
    initializeTerminal();
    initializeFileManager();
    
    // UI bileşenlerini bağla
    setupUIComponents();
    
    // Tema ayarlarını yükle
    loadThemeSettings();
    
    console.log('Uygulama başlatıldı!');
});

// UI bileşenlerini ayarla
function setupUIComponents() {
    // Panel geçişleri
    const tabButtons = document.querySelectorAll('.tab-button');
    const panels = document.querySelectorAll('.panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPanel = button.getAttribute('data-panel');
            
            // Aktif sekme butonunu güncelle
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Panelleri güncelle
            panels.forEach(panel => {
                if (panel.id === targetPanel) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
        });
    });
    
    // Ayarlar paneli
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsButton = document.getElementById('close-settings');
    
    if (settingsButton && settingsPanel && closeSettingsButton) {
        settingsButton.addEventListener('click', () => {
            settingsPanel.classList.toggle('hidden');
        });
        
        closeSettingsButton.addEventListener('click', () => {
            settingsPanel.classList.add('hidden');
        });
    }
    
    // Responsive tasarım için menü
    const menuButton = document.getElementById('menu-button');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuButton && sidebar) {
        menuButton.addEventListener('click', () => {
            sidebar.classList.toggle('show-mobile');
        });
    }
}

// Tema ayarlarını yükle
function loadThemeSettings() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'light';
        
        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}
