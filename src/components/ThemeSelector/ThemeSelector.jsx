import React, { useState, useEffect } from 'react';
import { Button, Menu, MenuItem, Popover, Position } from '@blueprintjs/core';
import ThemeManager from '../../themes/ThemeManager';
import './ThemeSelector.css';

const ThemeSelector = () => {
  const [themes, setThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);

  // Temaları yükle
  useEffect(() => {
    const loadThemes = () => {
      const allThemes = ThemeManager.getAllThemes();
      setThemes(allThemes);
      
      const active = ThemeManager.getActiveTheme();
      setActiveTheme(active);
    };

    // İlk yükleme
    loadThemes();

    // Tema değişikliklerini dinle
    const handleThemeChange = (theme) => {
      setActiveTheme(theme);
    };

    ThemeManager.addChangeListener(handleThemeChange);

    return () => {
      ThemeManager.removeChangeListener(handleThemeChange);
    };
  }, []);

  // Tema değiştir
  const handleThemeChange = (themeId) => {
    ThemeManager.setActiveTheme(themeId);
  };

  // Tema menüsü
  const themeMenu = (
    <Menu>
      {themes.map(theme => (
        <MenuItem
          key={theme.id}
          text={theme.name}
          icon={theme.styles.isDark ? 'moon' : 'flash'}
          active={activeTheme && activeTheme.id === theme.id}
          onClick={() => handleThemeChange(theme.id)}
        />
      ))}
    </Menu>
  );

  return (
    <div className="theme-selector">
      <Popover content={themeMenu} position={Position.BOTTOM}>
        <Button
          icon={activeTheme?.styles.isDark ? 'moon' : 'flash'}
          minimal={true}
          text={activeTheme?.name || 'Tema'}
        />
      </Popover>
    </div>
  );
};

export default ThemeSelector;