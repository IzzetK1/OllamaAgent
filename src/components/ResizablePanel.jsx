import React, { useState } from 'react';
import Split from 'react-split';

/**
 * Yeniden boyutlandırılabilir panel bileşeni
 * 
 * @param {Object} props - Bileşen özellikleri
 * @param {React.ReactNode} props.children - Panel içeriği
 * @param {string[]} props.sizes - Başlangıç boyutları (yüzde olarak)
 * @param {string} props.direction - Bölme yönü ('horizontal' veya 'vertical')
 * @param {string} props.className - Ek CSS sınıfları
 * @param {Function} props.onDragEnd - Sürükleme bittiğinde çağrılacak fonksiyon
 */
const ResizablePanel = ({ 
  children, 
  sizes = [50, 50], 
  direction = 'horizontal',
  className = '',
  onDragEnd = () => {}
}) => {
  const [currentSizes, setCurrentSizes] = useState(sizes);
  
  const handleDragEnd = (newSizes) => {
    setCurrentSizes(newSizes);
    onDragEnd(newSizes);
    
    // Boyutları localStorage'a kaydet
    localStorage.setItem(`split-sizes-${direction}`, JSON.stringify(newSizes));
  };
  
  return (
    <Split
      sizes={currentSizes}
      direction={direction}
      className={`split ${direction === 'vertical' ? 'split-vertical' : 'split-horizontal'} ${className}`}
      minSize={100}
      expandToMin={false}
      gutterSize={6}
      gutterAlign="center"
      snapOffset={30}
      dragInterval={1}
      onDragEnd={handleDragEnd}
    >
      {children}
    </Split>
  );
};

export default ResizablePanel;
