import React, { useState, useEffect } from 'react';
import { 
  Button, Card, Elevation, Switch, Tabs, Tab, 
  InputGroup, FormGroup, Dialog, Classes, Spinner 
} from '@blueprintjs/core';
import PluginManager from '../../plugins/PluginManager';
import PluginLoader from '../../plugins/PluginLoader';
import './PluginManagerView.css';

const PluginManagerView = () => {
  const [plugins, setPlugins] = useState([]);
  const [marketplacePlugins, setMarketplacePlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketplaceLoading, setMarketplaceLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('installed');
  const [searchQuery, setSearchQuery] = useState('');
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState(null);

  // Yüklü eklentileri yükle
  useEffect(() => {
    const loadPlugins = async () => {
      setLoading(true);
      try {
        await PluginLoader.loadLocalPlugins();
        await PluginLoader.loadMarketplacePlugins();
        setPlugins(PluginManager.getAllPlugins());
      } catch (error) {
        console.error('Eklentiler yüklenirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlugins();
  }, []);

  // Marketplace eklentilerini yükle
  useEffect(() => {
    const loadMarketplacePlugins = async () => {
      setMarketplaceLoading(true);
      try {
        const response = await fetch('/api/plugins/marketplace');
        const data = await response.json();
        setMarketplacePlugins(data);
      } catch (error) {
        console.error('Marketplace eklentileri yüklenirken hata oluştu:', error);
      } finally {
        setMarketplaceLoading(false);
      }
    };

    if (activeTab === 'marketplace') {
      loadMarketplacePlugins();
    }
  }, [activeTab]);

  // Eklenti durumunu değiştir
  const togglePlugin = (pluginId, enabled) => {
    try {
      if (enabled) {
        PluginManager.enable(pluginId);
      } else {
        PluginManager.disable(pluginId);
      }
      
      // Eklenti listesini güncelle
      setPlugins(PluginManager.getAllPlugins());
    } catch (error) {
      console.error('Eklenti durumu değiştirilirken hata oluştu:', error);
    }
  };

  // Eklenti yükle
  const installPlugin = async (plugin) => {
    try {
      await fetch('/api/plugins/marketplace/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pluginId: plugin.id })
      });
      
      // Eklentiyi yükle
      await PluginLoader.loadPlugin(plugin.url);
      
      // Eklenti listesini güncelle
      setPlugins(PluginManager.getAllPlugins());
      
      // Marketplace eklentisini güncelle
      setMarketplacePlugins(prevPlugins => 
        prevPlugins.map(p => 
          p.id === plugin.id ? { ...p, installed: true } : p
        )
      );
      
      setInstallDialogOpen(false);
    } catch (error) {
      console.error('Eklenti yüklenirken hata oluştu:', error);
    }
  };

  // Eklenti kaldır
  const uninstallPlugin = async (pluginId) => {
    try {
      await fetch(`/api/plugins/uninstall/${pluginId}`, {
        method: 'DELETE'
      });
      
      // Eklenti listesini güncelle
      setPlugins(prevPlugins => prevPlugins.filter(p => p.id !== pluginId));
      
      // Marketplace eklentisini güncelle
      setMarketplacePlugins(prevPlugins => 
        prevPlugins.map(p => 
          p.id === pluginId ? { ...p, installed: false } : p
        )
      );
    } catch (error) {
      console.error('Eklenti kaldırılırken hata oluştu:', error);
    }
  };

  // Arama filtreleme
  const filterPlugins = (plugins) => {
    if (!searchQuery) return plugins;
    
    return plugins.filter(plugin => 
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Yüklü eklentileri render et
  const renderInstalledPlugins = () => {
    const filteredPlugins = filterPlugins(plugins);
    
    if (loading) {
      return <Spinner />;
    }
    
    if (filteredPlugins.length === 0) {
      return <p>Yüklü eklenti bulunamadı.</p>;
    }
    
    return (
      <div className="plugin-list">
        {filteredPlugins.map(plugin => (
          <Card key={plugin.id} elevation={Elevation.ONE} className="plugin-card">
            <div className="plugin-header">
              <h3>{plugin.name}</h3>
              <Switch 
                checked={plugin.enabled} 
                onChange={(e) => togglePlugin(plugin.id, e.target.checked)} 
              />
            </div>
            <p className="plugin-version">v{plugin.version}</p>
            <p className="plugin-description">{plugin.description}</p>
            <div className="plugin-footer">
              <Button 
                icon="trash" 
                intent="danger" 
                minimal={true}
                onClick={() => uninstallPlugin(plugin.id)}
              >
                Kaldır
              </Button>
              {plugin.homepage && (
                <Button 
                  icon="link" 
                  minimal={true}
                  onClick={() => window.open(plugin.homepage, '_blank')}
                >
                  Detaylar
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // Marketplace eklentilerini render et
  const renderMarketplacePlugins = () => {
    const filteredPlugins = filterPlugins(marketplacePlugins);
    
    if (marketplaceLoading) {
      return <Spinner />;
    }
    
    if (filteredPlugins.length === 0) {
      return <p>Marketplace'de eklenti bulunamadı.</p>;
    }
    
    return (
      <div className="plugin-list">
        {filteredPlugins.map(plugin => (
          <Card key={plugin.id} elevation={Elevation.ONE} className="plugin-card">
            <div className="plugin-header">
              <h3>{plugin.name}</h3>
              {plugin.installed ? (
                <Button disabled={true} small={true}>Yüklendi</Button>
              ) : (
                <Button 
                  intent="primary" 
                  small={true}
                  onClick={() => {
                    setSelectedPlugin(plugin);
                    setInstallDialogOpen(true);
                  }}
                >
                  Yükle
                </Button>
              )}
            </div>
            <p className="plugin-version">v{plugin.version}</p>
            <p className="plugin-description">{plugin.description}</p>
            <div className="plugin-footer">
              <div className="plugin-author">
                Yazar: {plugin.author}
              </div>
              {plugin.homepage && (
                <Button 
                  icon="link" 
                  minimal={true}
                  onClick={() => window.open(plugin.homepage, '_blank')}
                >
                  Detaylar
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="plugin-manager-container">
      <h2>Eklenti Yöneticisi</h2>
      
      <div className="plugin-manager-search">
        <InputGroup
          leftIcon="search"
          placeholder="Eklenti ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="plugin-search-input"
        />
      </div>
      
      <Tabs 
        id="plugin-tabs" 
        selectedTabId={activeTab}
        onChange={setActiveTab}
        className="plugin-tabs"
      >
        <Tab id="installed" title="Yüklü Eklentiler" panel={renderInstalledPlugins()} />
        <Tab id="marketplace" title="Marketplace" panel={renderMarketplacePlugins()} />
      </Tabs>
      
      <Dialog
        isOpen={installDialogOpen}
        onClose={() => setInstallDialogOpen(false)}
        title={`${selectedPlugin?.name} Eklentisini Yükle`}
      >
        <div className={Classes.DIALOG_BODY}>
          <p>{selectedPlugin?.description}</p>
          <p><strong>Versiyon:</strong> {selectedPlugin?.version}</p>
          <p><strong>Yazar:</strong> {selectedPlugin?.author}</p>
          {selectedPlugin?.permissions && (
            <div>
              <h4>İzinler:</h4>
              <ul>
                {selectedPlugin.permissions.map((permission, index) => (
                  <li key={index}>{permission}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => setInstallDialogOpen(false)}>İptal</Button>
            <Button 
              intent="primary" 
              onClick={() => installPlugin(selectedPlugin)}
            >
              Yükle
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PluginManagerView;