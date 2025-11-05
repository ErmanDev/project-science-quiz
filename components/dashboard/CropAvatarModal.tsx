
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

interface CropAvatarModalProps {
  imageSrc: string;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
}

const CropAvatarModal: React.FC<CropAvatarModalProps> = ({ imageSrc, onClose, onCrop }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const { t } = useTranslations();

  // Initial crop is set to 80% width/height, centered.
  const [pixelCrop, setPixelCrop] = useState<{x: number, y: number, width: number, height: number} | null>(null);

  const [dragState, setDragState] = useState<{ action: string; startX: number; startY: number; startCrop: typeof pixelCrop } | null>(null);

  const getCursor = (action: string) => {
    if (action.includes('n') && action.includes('w')) return 'nwse-resize';
    if (action.includes('n') && action.includes('e')) return 'nesw-resize';
    if (action.includes('s') && action.includes('e')) return 'nwse-resize';
    if (action.includes('s') && action.includes('w')) return 'nesw-resize';
    if (action.includes('n')) return 'ns-resize';
    if (action.includes('s')) return 'ns-resize';
    if (action.includes('w')) return 'ew-resize';
    if (action.includes('e')) return 'ew-resize';
    return 'move';
  };
  
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!pixelCrop) return;
    document.body.style.cursor = getCursor(action);
    setDragState({
      action,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...pixelCrop },
    });
  };

  const calculateNewCrop = useCallback((e: PointerEvent) => {
    if (!dragState || !dragState.startCrop || !imgRef.current) return;

    const { action, startX, startY, startCrop } = dragState;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let { x, y, width, height } = startCrop;

    const imgWidth = imgRef.current.clientWidth;
    const imgHeight = imgRef.current.clientHeight;
    const minSize = 20;

    if (action === 'move') {
      x = Math.min(Math.max(0, startCrop.x + dx), imgWidth - width);
      y = Math.min(Math.max(0, startCrop.y + dy), imgHeight - height);
    } else {
        if (action.includes('n')) {
            const newHeight = height - dy;
            if (newHeight > minSize) {
                const newY = y + dy;
                if (newY >= 0) {
                    height = newHeight;
                    y = newY;
                }
            }
        }
        if (action.includes('s')) {
            height = Math.min(imgHeight - y, Math.max(minSize, height + dy));
        }
        if (action.includes('w')) {
            const newWidth = width - dx;
            if (newWidth > minSize) {
                const newX = x + dx;
                if(newX >= 0) {
                    width = newWidth;
                    x = newX;
                }
            }
        }
        if (action.includes('e')) {
            width = Math.min(imgWidth - x, Math.max(minSize, width + dx));
        }
    }
    
    setPixelCrop({ x, y, width, height });
  }, [dragState]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      if (dragState) {
        calculateNewCrop(e);
      }
    };

    const handlePointerUp = () => {
      setDragState(null);
      document.body.style.cursor = 'default';
    };
    
    if (dragState) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, calculateNewCrop]);


  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { clientWidth, clientHeight } = e.currentTarget;
    const size = Math.min(clientWidth, clientHeight) * 0.8;
    setPixelCrop({
      x: (clientWidth - size) / 2,
      y: (clientHeight - size) / 2,
      width: size,
      height: size,
    });
  };

  const handleDoCrop = () => {
    if (!pixelCrop || !imgRef.current) {
        return;
    }
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );
    
    onCrop(canvas.toDataURL('image/jpeg'));
  };

  const resizeHandles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

  return (
    <div className="fixed inset-0 bg-brand-deep-purple/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="relative w-full max-w-sm rounded-2xl p-6 bg-brand-mid-purple/90 border border-brand-light-purple/50 flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <h2 className="text-2xl font-bold font-orbitron mb-4 self-start">{t('cropImageTitle')}</h2>
        
        <div className="relative w-full aspect-square bg-black/50 select-none touch-none flex items-center justify-center">
          <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} className="block max-w-full max-h-full" alt="Preview"/>
          {pixelCrop && (
            <>
              <div 
                className="absolute border-2 border-white/70 box-border cursor-move"
                style={{
                  top: pixelCrop.y,
                  left: pixelCrop.x,
                  width: pixelCrop.width,
                  height: pixelCrop.height,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                }}
                onPointerDown={(e) => handlePointerDown(e, 'move')}
              >
                {/* Grid lines */}
                <div className="absolute top-0 left-1/3 bottom-0 w-px bg-white/50"></div>
                <div className="absolute top-0 left-2/3 bottom-0 w-px bg-white/50"></div>
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50"></div>
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50"></div>
                
                {/* Resize Handles */}
                {resizeHandles.map(handle => (
                   <div 
                     key={handle}
                     className={`absolute w-3 h-3 bg-blue-500 border border-white/80 rounded-full
                       ${handle.includes('n') ? '-top-1.5' : ''}
                       ${handle.includes('s') ? '-bottom-1.5' : ''}
                       ${handle.includes('w') ? '-left-1.5' : ''}
                       ${handle.includes('e') ? '-right-1.5' : ''}
                       ${!handle.includes('n') && !handle.includes('s') ? 'top-1/2 -translate-y-1.5' : ''}
                       ${!handle.includes('w') && !handle.includes('e') ? 'left-1/2 -translate-x-1.5' : ''}
                     `}
                     style={{ cursor: getCursor(handle) }}
                     onPointerDown={(e) => handlePointerDown(e, handle)}
                   />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="w-full flex space-x-4 mt-6">
          <button 
            onClick={onClose} 
            className="w-full bg-[#992020] text-white font-semibold py-3 rounded-lg transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">
            {t('cancel')}
          </button>
          <button 
            onClick={handleDoCrop} 
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400">
            {t('cropAndUse')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropAvatarModal;
