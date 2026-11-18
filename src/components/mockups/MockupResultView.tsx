import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Share2,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  Smartphone,
  Square,
  RectangleVertical,
  RefreshCw,
  FolderHeart
} from 'lucide-react';
import {
  MockupTemplate,
  MockupBackgroundType,
  MockupOutputRatio
} from '../../types/mockupTypes';
import {
  exportMockupBlob
} from '../../utils/mockupRenderer';
import {
  saveMockupToDevice,
  shareMockupFile,
  isFileSystemAccessSupported
} from '../../utils/fileSystemHelper';

interface MockupResultViewProps {
  template: MockupTemplate;
  userArtImage: HTMLImageElement;
  backgroundType: MockupBackgroundType;
  customBgImage?: HTMLImageElement | null;
  onReset: () => void;
  onRequestFolderPermission: () => void;
}

export const MockupResultView: React.FC<MockupResultViewProps> = ({
  template,
  userArtImage,
  backgroundType,
  customBgImage,
  onReset,
  onRequestFolderPermission
}) => {
  const [outputRatio, setOutputRatio] = useState<MockupOutputRatio>('square');
  const [format, setFormat] = useState<'png' | 'jpg'>('png');
  const [quality, setQuality] = useState<'standard' | 'high'>('high');

  // Estados reais do preview: idle | rendering | ready | error
  const [previewState, setPreviewState] = useState<'idle' | 'rendering' | 'ready' | 'error'>('rendering');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Ref para controlar e revogar Object URLs anteriores e evitar vazamentos de memória
  const activeBlobUrlRef = useRef<string | null>(null);

  // Geração unificada do preview e resultado
  useEffect(() => {
    let isCancelled = false;

    const generatePreview = async () => {
      setPreviewState('rendering');
      setRenderError(null);
      setSaveSuccessMsg(null);

      try {
        const blob = await exportMockupBlob(
          {
            template,
            userArtImage,
            backgroundType,
            customBgImage,
            outputRatio,
            quality
          },
          'png',
          quality === 'high' ? 0.98 : 0.92
        );

        if (isCancelled) return;

        const newUrl = URL.createObjectURL(blob);

        // Revoga URL anterior para liberar memória no navegador
        if (activeBlobUrlRef.current) {
          URL.revokeObjectURL(activeBlobUrlRef.current);
        }
        activeBlobUrlRef.current = newUrl;

        setPreviewUrl(newUrl);
        setPreviewBlob(blob);
        setPreviewState('ready');
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Erro ao renderizar preview do mockup:', err);
        setPreviewState('error');
        setRenderError('Não conseguimos gerar a visualização do seu mockup.');
      }
    };

    generatePreview();

    return () => {
      isCancelled = true;
    };
  }, [template, userArtImage, backgroundType, customBgImage, outputRatio, quality, retryCounter]);

  // Limpeza final ao desmontar componente
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  // Executa o salvamento no dispositivo
  const handleSave = async () => {
    if (previewState !== 'ready') return;
    try {
      setIsSaving(true);
      setSaveSuccessMsg(null);

      let blobToSave = previewBlob;

      // Se a usuária solicitou JPG ou formato diferente do preview PNG padrão:
      if (format === 'jpg' && backgroundType !== 'transparent') {
        blobToSave = await exportMockupBlob(
          {
            template,
            userArtImage,
            backgroundType,
            customBgImage,
            outputRatio,
            quality
          },
          'jpeg',
          quality === 'high' ? 0.98 : 0.92
        );
      } else if (!blobToSave) {
        blobToSave = await exportMockupBlob(
          {
            template,
            userArtImage,
            backgroundType,
            customBgImage,
            outputRatio,
            quality
          },
          'png',
          quality === 'high' ? 0.98 : 0.92
        );
      }

      const result = await saveMockupToDevice(blobToSave, template.slug, format);
      if (result.success) {
        if (result.method === 'folder') {
          setSaveSuccessMsg(`Salvo com sucesso na pasta Organize Ateliê - Mockups como "${result.fileName}"!`);
        } else {
          setSaveSuccessMsg(`Mockup salvo com sucesso como "${result.fileName}"!`);
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar mockup:', err);
      setRenderError('Não conseguimos gerar a visualização do seu mockup.');
    } finally {
      setIsSaving(false);
    }
  };

  // Executa o compartilhamento via Web Share API
  const handleShare = async () => {
    if (previewState !== 'ready') return;
    try {
      setIsSaving(true);
      const blob = previewBlob || (await exportMockupBlob(
        {
          template,
          userArtImage,
          backgroundType,
          customBgImage,
          outputRatio,
          quality
        },
        format === 'png' || backgroundType === 'transparent' ? 'png' : 'jpeg'
      ));

      await shareMockupFile(blob, `organize-atelie-${template.slug}.png`);
    } catch (err: any) {
      console.error('Erro ao compartilhar mockup:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const ratioOptions: { id: MockupOutputRatio; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'square', label: 'Quadrado', icon: <Square className="w-4 h-4" />, desc: '1080x1080 (1:1)' },
    { id: 'feed', label: 'Feed / Retrato', icon: <RectangleVertical className="w-4 h-4" />, desc: '1080x1350 (4:5)' },
    { id: 'stories', label: 'Stories / Reels', icon: <Smartphone className="w-4 h-4" />, desc: '1080x1920 (9:16)' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Visual Preview Area (Left / Center) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="relative bg-white rounded-3xl border border-pink-100/90 p-4 sm:p-6 shadow-atelie overflow-hidden flex items-center justify-center min-h-[420px] sm:min-h-[500px]">
            {backgroundType === 'transparent' && (
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                }}
              />
            )}

            {/* ESTADO 1: RENDERING */}
            {previewState === 'rendering' && (
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-5 z-20">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-pink-100 border-t-[#ac2471] animate-spin" />
                  <Sparkles className="w-6 h-6 text-[#ac2471] animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading font-bold text-slate-800 text-base sm:text-lg">
                    Criando seu mockup...
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Aplicando perspectiva, iluminação e sombras diretamente no seu dispositivo
                  </p>
                </div>
              </div>
            )}

            {/* ESTADO 2: ERROR */}
            {previewState === 'error' && (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md z-20">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-slate-800 text-base">
                    Não conseguimos gerar a visualização do seu mockup.
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ocorreu um erro temporário durante o processamento da imagem. Clique abaixo para tentar novamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRetryCounter((c) => c + 1)}
                  className="px-5 py-2.5 bg-pink-50 hover:bg-pink-100 text-[#ac2471] font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar novamente</span>
                </button>
              </div>
            )}

            {/* ESTADO 3: READY (Exibe o mockup real renderizado) */}
            {previewState === 'ready' && previewUrl && (
              <img
                src={previewUrl}
                alt={`Mockup final de ${template.name}`}
                className="max-w-full max-h-[600px] w-auto h-auto object-contain rounded-2xl shadow-sm z-10 animate-in fade-in duration-200"
              />
            )}

            {/* Product Badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#ac2471] bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full border border-pink-200 shadow-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ac2471]" />
                <span>{template.name}</span>
              </span>
            </div>
          </div>

          {/* Success message banner */}
          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span className="flex-1">{saveSuccessMsg}</span>
            </div>
          )}

          {/* Error message banner */}
          {renderError && previewState !== 'error' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <span className="flex-1">{renderError}</span>
            </div>
          )}
        </div>

        {/* Controls & Export Options (Right Column) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Format & Dimensions Card */}
          <div className="bg-white rounded-3xl border border-pink-100 p-5 space-y-4 shadow-2xs">
            <h4 className="font-heading font-bold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ac2471]" />
              <span>Formato de Exportação</span>
            </h4>

            {/* Aspect Ratio Options */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Proporção & Resolução
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ratioOptions.map((opt) => {
                  const isSelected = outputRatio === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOutputRatio(opt.id)}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 text-center transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-[#ac2471] bg-pink-50/80 text-[#ac2471] font-bold shadow-2xs ring-2 ring-[#ac2471]/20'
                          : 'border-slate-200 hover:border-pink-200 text-slate-600 bg-white'
                      }`}
                    >
                      <span className={isSelected ? 'text-[#ac2471]' : 'text-slate-400'}>
                        {opt.icon}
                      </span>
                      <span className="text-[11px] leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File Format & Quality */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Formato
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                      format === 'png' || backgroundType === 'transparent'
                        ? 'border-[#ac2471] bg-pink-50 text-[#ac2471] font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    disabled={backgroundType === 'transparent'}
                    onClick={() => setFormat('jpg')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                      format === 'jpg' && backgroundType !== 'transparent'
                        ? 'border-[#ac2471] bg-pink-50 text-[#ac2471] font-bold'
                        : 'border-slate-200 text-slate-600 disabled:opacity-40'
                    }`}
                  >
                    JPG
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Qualidade
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as any)}
                  className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471]"
                >
                  <option value="high">Alta Qualidade (HD)</option>
                  <option value="standard">Redes Sociais (Padrão)</option>
                </select>
              </div>
            </div>

            {/* Directory config shortcut */}
            {isFileSystemAccessSupported() && (
              <div className="pt-2 border-t border-pink-50">
                <button
                  type="button"
                  onClick={onRequestFolderPermission}
                  className="w-full text-left flex items-center justify-between text-[11px] text-[#ac2471] hover:underline font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <FolderHeart className="w-3.5 h-3.5" />
                    Definir pasta automática
                  </span>
                  <span className="text-[10px] text-slate-400">Organize Ateliê - Mockups</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || previewState !== 'ready'}
              className={`w-full py-3.5 px-6 font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                previewState !== 'ready'
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#ac2471] hover:bg-[#8e1d5d] text-white hover:shadow-md active:scale-98 cursor-pointer'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>{isSaving ? 'Salvando...' : 'Salvar no dispositivo'}</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleShare}
                disabled={isSaving || previewState !== 'ready'}
                className={`w-full py-3 px-6 border font-bold text-xs sm:text-sm rounded-2xl shadow-2xs transition-all flex items-center justify-center gap-2 ${
                  previewState !== 'ready'
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white hover:bg-pink-50 text-[#ac2471] border-pink-200 active:scale-98 cursor-pointer'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>Compartilhar / Salvar em Fotos</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Fazer outro Mockup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
