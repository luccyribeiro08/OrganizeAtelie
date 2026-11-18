import React, { useEffect, useRef } from 'react';
import { MockupTemplate } from '../../types/mockupTypes';
import { renderMockupToCanvas } from '../../utils/mockupRenderer';

interface MockupWhiteCardProps {
  template: MockupTemplate;
  className?: string;
}

export const MockupWhiteCard: React.FC<MockupWhiteCardProps> = ({ template, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderMockupToCanvas(canvasRef.current, {
      template,
      userArtImage: null,
      backgroundType: 'white',
      outputRatio: 'square',
      quality: 'standard'
    });
  }, [template]);

  return (
    <div className={`relative w-full aspect-square bg-[#ffffff] rounded-2xl overflow-hidden border border-pink-100/60 flex items-center justify-center p-2 shadow-2xs group-hover:border-[#ac2471]/30 transition-all ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
      />
      <div className="absolute top-2 right-2 bg-pink-50/90 backdrop-blur-xs text-[#ac2471] text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-200/60">
        3D Branco
      </div>
    </div>
  );
};
