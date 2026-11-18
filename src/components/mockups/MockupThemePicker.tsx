import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { loadImageFromFile } from '../../utils/mockupRenderer';

interface MockupThemePickerProps {
  onThemeSelected: (file: File, img: HTMLImageElement) => void;
  selectedFile: File | null;
  selectedImage: HTMLImageElement | null;
}

export const MockupThemePicker: React.FC<MockupThemePickerProps> = ({
  onThemeSelected,
  selectedFile,
  selectedImage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
      setErrorMsg('Não conseguimos abrir essa imagem. Escolha um arquivo PNG, JPG ou WEBP.');
      return;
    }

    try {
      setIsLoading(true);
      const img = await loadImageFromFile(file);
      onThemeSelected(file, img);
    } catch (err: any) {
      setErrorMsg('Não foi possível ler a imagem selecionada. Tente outro arquivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const isLowRes = selectedImage ? Math.min(selectedImage.width, selectedImage.height) < 400 : false;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Upload Zone */}
      {!selectedFile || !selectedImage ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center space-y-4 ${
            isDragging
              ? 'border-[#ac2471] bg-pink-50/80 scale-[1.01]'
              : 'border-pink-200 bg-white hover:border-pink-300 hover:bg-pink-50/30 shadow-2xs'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div className="w-16 h-16 rounded-3xl bg-pink-50 text-[#ac2471] flex items-center justify-center shadow-xs">
            {isLoading ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-heading font-bold text-slate-800 text-base sm:text-lg">
              {isLoading ? 'Carregando sua arte...' : 'Escolha seu tema ou arte'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Arraste e solte o arquivo aqui ou clique para selecionar do seu dispositivo.
            </p>
          </div>

          <button
            type="button"
            className="px-6 py-3 bg-[#ac2471] hover:bg-[#8e1d5d] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Selecionar da galeria / arquivos</span>
          </button>

          <p className="text-[11px] text-slate-400">
            Formatos aceitos: PNG, JPG, JPEG, WEBP (Sem limite de tamanho)
          </p>
        </div>
      ) : (
        /* Selected Image Preview Card */
        <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-pink-100 bg-slate-50 flex-shrink-0 shadow-xs">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Arte selecionada"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Arte Carregada com Sucesso
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {selectedImage.width} x {selectedImage.height} px
                </span>
              </div>

              <h4 className="font-heading font-bold text-slate-800 text-base truncate max-w-md">
                {selectedFile.name}
              </h4>
              <p className="text-xs text-slate-500">
                Tamanho: {(selectedFile.size / 1024).toFixed(0)} KB • Processada 100% no seu dispositivo
              </p>

              {isLowRes && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200/70 mt-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>Sua imagem tem resolução baixa e o resultado pode perder nitidez. Recomendamos imagens com pelo menos 800px.</span>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-[#ac2471] font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Trocar por outra arte</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
