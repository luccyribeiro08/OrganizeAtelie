import React, { useRef } from 'react';
import { Sparkles, Layers, Image as ImageIcon, Check, UploadCloud } from 'lucide-react';
import { MockupBackgroundType } from '../../types/mockupTypes';
import { loadImageFromFile } from '../../utils/mockupRenderer';

interface MockupBackgroundSelectorProps {
  selectedBg: MockupBackgroundType;
  onSelectBg: (bgType: MockupBackgroundType) => void;
  customBgFile: File | null;
  onCustomBgSelected: (file: File, img: HTMLImageElement) => void;
}

export const MockupBackgroundSelector: React.FC<MockupBackgroundSelectorProps> = ({
  selectedBg,
  onSelectBg,
  customBgFile,
  onCustomBgSelected
}) => {
  const customBgInputRef = useRef<HTMLInputElement | null>(null);

  const handleCustomBgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const img = await loadImageFromFile(file);
        onCustomBgSelected(file, img);
        onSelectBg('custom');
      } catch (err) {
        console.error('Erro ao ler fundo personalizado', err);
      }
    }
  };

  const options: {
    id: MockupBackgroundType;
    title: string;
    description: string;
    badge?: string;
    previewNode: React.ReactNode;
  }[] = [
    {
      id: 'atelie',
      title: 'Fundo Organize Ateliê',
      description: 'Estúdio profissional com iluminação suave e identidade do ateliê.',
      badge: 'Recomendado',
      previewNode: (
        <div className="w-full h-24 rounded-2xl bg-gradient-to-br from-[#fdfbfb] via-[#fbf5f7] to-[#f6e7ee] border border-pink-200/60 p-2 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#ac2471]" />
            <span className="text-[10px] font-bold text-[#ac2471]">Estúdio Afetivo</span>
          </div>
          <div className="text-right text-[9px] font-bold text-[#ac2471]/50">
            Organize Ateliê
          </div>
        </div>
      )
    },
    {
      id: 'white',
      title: 'Fundo Branco',
      description: 'Fundo 100% branco limpo, ideal para catálogos, e-commerce e PDFs.',
      previewNode: (
        <div className="w-full h-24 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-2xs">
          <span className="text-xs font-bold text-slate-400">Branco Puro</span>
        </div>
      )
    },
    {
      id: 'transparent',
      title: 'Fundo Transparente',
      description: 'Recorte PNG sem fundo para sobrepor em banners, artes e stories.',
      badge: 'PNG',
      previewNode: (
        <div
          className="w-full h-24 rounded-2xl border border-slate-200 p-2 flex items-center justify-center shadow-2xs"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
          }}
        >
          <span className="text-xs font-bold text-slate-500 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-md">
            Canal Alfa (PNG)
          </span>
        </div>
      )
    },
    {
      id: 'custom',
      title: 'Escolher uma Foto',
      description: 'Use qualquer cenário ou foto da sua galeria (processada no dispositivo).',
      previewNode: (
        <div
          onClick={() => customBgInputRef.current?.click()}
          className="w-full h-24 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/40 p-2 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-pink-100/50 transition-colors"
        >
          {customBgFile ? (
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <img
                src={URL.createObjectURL(customBgFile)}
                alt="Fundo customizado"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-[11px] font-bold text-white">
                Trocar Foto
              </div>
            </div>
          ) : (
            <>
              <UploadCloud className="w-5 h-5 text-[#ac2471]" />
              <span className="text-[11px] font-bold text-[#ac2471]">
                Carregar foto da galeria
              </span>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <input
        ref={customBgInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        onChange={handleCustomBgChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {options.map((opt) => {
          const isSelected = selectedBg === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => {
                if (opt.id === 'custom' && !customBgFile) {
                  customBgInputRef.current?.click();
                } else {
                  onSelectBg(opt.id);
                }
              }}
              className={`relative bg-white rounded-3xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-atelie ${
                isSelected
                  ? 'border-[#ac2471] ring-2 ring-[#ac2471]/20 bg-pink-50/10'
                  : 'border-pink-100/80 hover:border-pink-300'
              }`}
            >
              {/* Radio check badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-[#ac2471] bg-[#ac2471] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <h4 className="font-heading font-bold text-slate-800 text-xs sm:text-sm">
                    {opt.title}
                  </h4>
                </div>

                {opt.badge && (
                  <span className="text-[10px] font-bold text-[#ac2471] bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200/60">
                    {opt.badge}
                  </span>
                )}
              </div>

              {/* Visual Preview */}
              <div>{opt.previewNode}</div>

              {/* Description */}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {opt.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
