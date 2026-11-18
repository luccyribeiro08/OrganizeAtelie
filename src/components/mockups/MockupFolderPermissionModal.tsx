import React from 'react';
import { FolderHeart, ShieldCheck, X, FolderPlus } from 'lucide-react';
import { requestDirectoryPermission } from '../../utils/fileSystemHelper';

interface MockupFolderPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
}

export const MockupFolderPermissionModal: React.FC<MockupFolderPermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted
}) => {
  if (!isOpen) return null;

  const handleAuthorize = async () => {
    const granted = await requestDirectoryPermission();
    if (granted) {
      onPermissionGranted();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-atelie-lg border border-pink-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-pink-50 text-[#ac2471] flex items-center justify-center mx-auto shadow-xs">
          <FolderHeart className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-heading font-bold text-slate-800 text-lg sm:text-xl">
            Organize seus mockups
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Para salvar seus mockups automaticamente no seu dispositivo, permita que o Organize Ateliê use uma pasta para seus arquivos.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#fdf8f9] border border-pink-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-bold text-[#ac2471]">
            <FolderPlus className="w-4 h-4" />
            <span>Pasta sugerida: Downloads / Organize Ateliê - Mockups</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Você só precisa autorizar uma vez por sessão. Seus arquivos serão gravados diretamente no seu computador ou celular sem passar por nenhum servidor externo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            Agora Não
          </button>
          <button
            type="button"
            onClick={handleAuthorize}
            className="flex-1 py-3 px-4 bg-[#ac2471] hover:bg-[#8e1d5d] text-white font-bold text-xs rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <FolderHeart className="w-4 h-4" />
            <span>Escolher pasta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
