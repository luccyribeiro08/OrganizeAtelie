import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Box,
  Image as ImageIcon,
  Palette,
  CheckCircle2,
  Download
} from 'lucide-react';
import {
  MockupTemplate,
  MockupBackgroundType,
  UserMockupModel
} from '../types/mockupTypes';
import { MockupProductSelector } from './mockups/MockupProductSelector';
import { MockupThemePicker } from './mockups/MockupThemePicker';
import { MockupBackgroundSelector } from './mockups/MockupBackgroundSelector';
import { MockupResultView } from './mockups/MockupResultView';
import { MockupFolderPermissionModal } from './mockups/MockupFolderPermissionModal';
import { AddCustomModelModal } from './mockups/AddCustomModelModal';
import { supabaseService } from '../services/supabaseService';

interface MockupsViewProps {
  userId?: string;
}

export const MockupsView: React.FC<MockupsViewProps> = ({ userId = 'user-sluccy45-master' }) => {
  // Step 1: Produto | Step 2: Tema | Step 3: Fundo | Step 4: Resultado
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // States
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null);
  const [userArtFile, setUserArtFile] = useState<File | null>(null);
  const [userArtImage, setUserArtImage] = useState<HTMLImageElement | null>(null);
  const [selectedBg, setSelectedBg] = useState<MockupBackgroundType>('atelie');
  const [customBgFile, setCustomBgFile] = useState<File | null>(null);
  const [customBgImage, setCustomBgImage] = useState<HTMLImageElement | null>(null);

  // Custom models state
  const [customModels, setCustomModels] = useState<UserMockupModel[]>([]);
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);

  // Folder modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  // Carrega os modelos particulares da usuária
  useEffect(() => {
    loadCustomModels();
  }, [userId]);

  const loadCustomModels = async () => {
    try {
      const models = await supabaseService.getUserMockupModels(userId);
      setCustomModels(models);
    } catch (e) {
      console.warn('Erro ao carregar modelos da usuária:', e);
    }
  };

  const handleModelCreated = async (newModel: UserMockupModel) => {
    await supabaseService.saveUserMockupModel(userId, newModel);
    setCustomModels((prev) => [newModel, ...prev.filter((m) => m.id !== newModel.id)]);
  };

  const handleRenameCustomModel = async (modelId: string, newName: string) => {
    await supabaseService.updateUserMockupModelName(userId, modelId, newName);
    setCustomModels((prev) =>
      prev.map((m) =>
        m.id === modelId
          ? {
              ...m,
              name: newName,
              template: { ...m.template, name: newName }
            }
          : m
      )
    );
  };

  const handleDeleteCustomModel = async (modelId: string) => {
    await supabaseService.deleteUserMockupModel(userId, modelId);
    setCustomModels((prev) => prev.filter((m) => m.id !== modelId));
  };

  // Handlers do fluxo
  const handleSelectTemplate = (template: MockupTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep(2);
  };

  const handleSelectTheme = (file: File, img: HTMLImageElement) => {
    setUserArtFile(file);
    setUserArtImage(img);
    setCurrentStep(3);
  };

  const handleSelectCustomBg = (file: File, img: HTMLImageElement) => {
    setCustomBgFile(file);
    setCustomBgImage(img);
    setSelectedBg('custom');
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedTemplate(null);
    setUserArtFile(null);
    setUserArtImage(null);
    setSelectedBg('atelie');
    setCustomBgFile(null);
    setCustomBgImage(null);
  };

  const steps = [
    { num: 1, label: 'Produto', icon: Box },
    { num: 2, label: 'Tema', icon: ImageIcon },
    { num: 3, label: 'Fundo', icon: Palette },
    { num: 4, label: 'Resultado', icon: Download },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-pink-50 text-[#ac2471]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="font-heading font-extrabold text-slate-800 text-xl sm:text-2xl tracking-tight">
              Crie seu Mockup
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Escolha um produto e transforme sua arte automaticamente em um mockup pronto para usar.
          </p>
        </div>

        {/* Discreet Privacy Banner */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-800 text-xs font-semibold shadow-2xs self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>🔒 Seu tema é processado no dispositivo e não fica salvo. Os modelos que você adiciona ficam disponíveis somente na sua conta.</span>
        </div>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-pink-100 shadow-2xs">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <button
                key={s.num}
                type="button"
                disabled={currentStep < s.num && (!selectedTemplate || (s.num >= 3 && !userArtImage))}
                onClick={() => {
                  if (s.num === 1) setCurrentStep(1);
                  else if (s.num === 2 && selectedTemplate) setCurrentStep(2);
                  else if (s.num === 3 && selectedTemplate && userArtImage) setCurrentStep(3);
                  else if (s.num === 4 && selectedTemplate && userArtImage) setCurrentStep(4);
                }}
                className={`flex items-center justify-center sm:justify-start gap-2 p-2 sm:px-4 sm:py-2.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#ac2471] text-white font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-pink-50 text-[#ac2471] font-semibold hover:bg-pink-100'
                    : 'bg-slate-50 text-slate-400 font-medium opacity-60 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-[#ac2471]'
                      : isCompleted
                      ? 'bg-[#ac2471] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className="text-xs hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Views */}
      <div className="pt-2">
        {/* Step 1: Escolha o Produto */}
        {currentStep === 1 && (
          <MockupProductSelector
            onSelectTemplate={handleSelectTemplate}
            customModels={customModels}
            onOpenAddModelModal={() => setIsAddModelModalOpen(true)}
            onRenameCustomModel={handleRenameCustomModel}
            onDeleteCustomModel={handleDeleteCustomModel}
          />
        )}

        {/* Step 2: Escolha o Tema */}
        {currentStep === 2 && selectedTemplate && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#ac2471] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Trocar produto ({selectedTemplate.name})</span>
              </button>

              {userArtImage && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#ac2471] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#8e1d5d] transition-all"
                >
                  <span>Avançar para o Fundo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <MockupThemePicker
              onThemeSelected={handleSelectTheme}
              selectedFile={userArtFile}
              selectedImage={userArtImage}
            />
          </div>
        )}

        {/* Step 3: Escolha o Fundo */}
        {currentStep === 3 && selectedTemplate && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#ac2471] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para escolha do tema</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-[#ac2471] text-white text-xs font-bold rounded-2xl shadow-xs hover:bg-[#8e1d5d] transition-all active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gerar Mockup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <MockupBackgroundSelector
              selectedBg={selectedBg}
              onSelectBg={setSelectedBg}
              customBgFile={customBgFile}
              onCustomBgSelected={handleSelectCustomBg}
            />
          </div>
        )}

        {/* Step 4: Resultado & Salvamento */}
        {currentStep === 4 && selectedTemplate && userArtImage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#ac2471] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Alterar fundo</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-500 hover:text-[#ac2471] transition-colors"
              >
                Fazer outro Mockup
              </button>
            </div>

            <MockupResultView
              template={selectedTemplate}
              userArtImage={userArtImage}
              backgroundType={selectedBg}
              customBgImage={customBgImage}
              onReset={handleReset}
              onRequestFolderPermission={() => setIsFolderModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Permission Modal */}
      <MockupFolderPermissionModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onPermissionGranted={() => {}}
      />

      {/* Add Custom User Model Modal */}
      <AddCustomModelModal
        isOpen={isAddModelModalOpen}
        onClose={() => setIsAddModelModalOpen(false)}
        onModelCreated={handleModelCreated}
        userId={userId}
      />
    </div>
  );
};
