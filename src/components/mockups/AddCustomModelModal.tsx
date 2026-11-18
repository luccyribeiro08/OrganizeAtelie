import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Camera,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Box,
  Layers,
  HelpCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { MockupCategory, MockupTemplate, UserMockupModel, ModelAnalysisResult } from '../../types/mockupTypes';
import { analyzeCustomProductModel } from '../../utils/modelAnalyzer';
import { supabaseService } from '../../services/supabaseService';

interface AddCustomModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelCreated: (model: UserMockupModel) => void;
  userId?: string;
}

const CATEGORY_OPTIONS: { id: MockupCategory; label: string }[] = [
  { id: 'caixinhas', label: 'Caixinha' },
  { id: 'sacolinhas', label: 'Sacolinha' },
  { id: 'embalagens', label: 'Embalagem' },
  { id: 'centros-de-mesa', label: 'Centro de Mesa' },
  { id: 'tags', label: 'Tag / Adesivo' },
  { id: 'outros', label: 'Outro' },
];

export const AddCustomModelModal: React.FC<AddCustomModelModalProps> = ({
  isOpen,
  onClose,
  onModelCreated,
  userId = 'user-sluccy45-master'
}) => {
  // Steps: 1 = Informações, 2 = Foto da Frente, 3 = Foto da Lateral, 4 = Análise & Confirmação
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MockupCategory>('caixinhas');

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);

  const [hasSide, setHasSide] = useState<boolean>(true);
  const [sideFile, setSideFile] = useState<File | null>(null);
  const [sidePreviewUrl, setSidePreviewUrl] = useState<string | null>(null);

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ModelAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File input refs
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const sideInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setName('');
    setCategory('caixinhas');
    setFrontFile(null);
    setFrontPreviewUrl(null);
    setHasSide(true);
    setSideFile(null);
    setSidePreviewUrl(null);
    setIsAnalyzing(false);
    setIsSaving(false);
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Handlers de Upload
  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontFile(file);
      const url = URL.createObjectURL(file);
      setFrontPreviewUrl(url);
      setErrorMsg(null);
    }
  };

  const handleSideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSideFile(file);
      const url = URL.createObjectURL(file);
      setSidePreviewUrl(url);
      setErrorMsg(null);
    }
  };

  // Executa a análise geométrica automática do modelo
  const handleStartAnalysis = async () => {
    if (!frontFile) {
      setErrorMsg('Adicione a foto da frente do seu produto.');
      return;
    }
    if (hasSide && !sideFile) {
      setErrorMsg('Adicione a foto da lateral ou marque a opção "Este modelo não possui lateral".');
      return;
    }

    try {
      setStep(4);
      setIsAnalyzing(true);
      setErrorMsg(null);

      const result = await analyzeCustomProductModel(
        name.trim() || 'Meu Modelo Personalizado',
        category,
        frontFile,
        sideFile,
        hasSide
      );

      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Erro na análise do modelo:', err);
      setErrorMsg('Não foi possível analisar as fotos do modelo. Verifique as imagens e tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Salvar modelo final no sistema e no Storage
  const handleSaveModel = async () => {
    if (!analysisResult || !frontFile) return;

    try {
      setIsSaving(true);
      const newId = `custom-model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Upload persistente para o Supabase Storage (mockup-models/{user_id}/{model_id}/...)
      const frontUrl = await supabaseService.uploadMockupModelFile(userId, newId, frontFile, 'front.webp');
      const sideUrl = hasSide && sideFile
        ? await supabaseService.uploadMockupModelFile(userId, newId, sideFile, 'side.webp')
        : undefined;
      const thumbnailUrl = frontUrl;

      const modelTemplate: MockupTemplate = {
        ...analysisResult.template,
        id: newId,
        slug: newId,
        userId,
        isCustomModel: true,
        frontImageUrl: frontUrl,
        sideImageUrl: sideUrl,
        baseImageUrl: frontUrl,
        active: true
      };

      const userModel: UserMockupModel = {
        id: newId,
        userId,
        name: analysisResult.name,
        category: analysisResult.category,
        subcategory: analysisResult.category === 'caixinhas' ? 'Caixinha' : undefined,
        description: `Modelo criado por você com ${analysisResult.facesSummary.join(' + ')}.`,
        frontImageUrl: frontUrl,
        sideImageUrl: sideUrl,
        thumbnailUrl: thumbnailUrl,
        hasSide: analysisResult.hasSide,
        facesSummary: analysisResult.facesSummary,
        frontSurfaceConfig: analysisResult.frontSurfaceConfig,
        sideSurfaceConfig: analysisResult.sideSurfaceConfig,
        seamConfig: analysisResult.seamConfig,
        template: modelTemplate,
        confidence: analysisResult.confidence,
        status: 'ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onModelCreated(userModel);
      handleClose();
    } catch (err) {
      console.error('Erro ao salvar modelo:', err);
      setErrorMsg('Erro ao salvar o modelo no sistema. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-pink-50 flex items-center justify-between bg-gradient-to-r from-pink-50/50 via-white to-pink-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100/80 text-[#ac2471] flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-800 text-base sm:text-lg">
                Adicionar meu modelo
              </h3>
              <p className="text-xs text-slate-500">
                Cadastre o formato do seu produto para gerar mockups automáticos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-pink-100 text-slate-500 hover:text-[#ac2471] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-pink-50/40 border-b border-pink-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step >= 1 ? 'bg-[#ac2471] text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              1
            </span>
            <span className={step === 1 ? 'font-bold text-[#ac2471]' : 'text-slate-500'}>
              Informações
            </span>
          </div>

          <div className="w-6 h-[1px] bg-pink-200" />

          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step >= 2 ? 'bg-[#ac2471] text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              2
            </span>
            <span className={step === 2 ? 'font-bold text-[#ac2471]' : 'text-slate-500'}>
              Foto da Frente
            </span>
          </div>

          <div className="w-6 h-[1px] bg-pink-200" />

          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step >= 3 ? 'bg-[#ac2471] text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              3
            </span>
            <span className={step === 3 ? 'font-bold text-[#ac2471]' : 'text-slate-500'}>
              Foto da Lateral
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 1 — INFORMAÇÕES */}
          {/* ========================================================= */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Nome do modelo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Minha Caixa Milk, Sacolinha P, Maleta Alta..."
                  className="w-full px-4 py-3 bg-white border border-pink-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] shadow-2xs placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Categoria <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'border-[#ac2471] bg-pink-50 text-[#ac2471] font-bold ring-2 ring-[#ac2471]/15'
                            : 'border-slate-200 hover:border-pink-200 text-slate-600 bg-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-100 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#ac2471] flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Nas próximas etapas, você enviará as fotos do seu produto em fundo neutro para o Organize Ateliê calibrar as áreas de impressão.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 2 — FOTO DA FRENTE */}
          {/* ========================================================= */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h4 className="font-heading font-bold text-slate-800 text-base">
                  Foto da Frente
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adicione uma foto mostrando a frente do seu produto.
                </p>
              </div>

              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={handleFrontFileChange}
                className="hidden"
              />

              {!frontPreviewUrl ? (
                <div
                  onClick={() => frontInputRef.current?.click()}
                  className="border-2 border-dashed border-pink-200 hover:border-[#ac2471] rounded-3xl p-8 text-center bg-pink-50/30 hover:bg-pink-50/60 transition-all cursor-pointer space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-2xs border border-pink-100 text-[#ac2471] flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-heading font-bold text-slate-800 text-sm">
                      Adicionar foto da frente
                    </p>
                    <p className="text-xs text-slate-500">
                      Clique para escolher uma imagem (PNG ou JPG)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-3xl border border-pink-100 overflow-hidden bg-slate-50 flex items-center justify-center max-h-[280px]">
                    <img
                      src={frontPreviewUrl}
                      alt="Foto da Frente"
                      className="max-h-[280px] w-auto object-contain rounded-2xl p-2"
                    />
                    <span className="absolute top-3 left-3 bg-[#ac2471] text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shadow-xs">
                      Frente (FRONT)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    className="w-full py-2 px-4 rounded-xl border border-pink-200 text-[#ac2471] hover:bg-pink-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Trocar foto da frente</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 3 — FOTO DA LATERAL */}
          {/* ========================================================= */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h4 className="font-heading font-bold text-slate-800 text-base">
                  Foto da Lateral
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agora adicione uma foto mostrando a lateral do mesmo produto.
                </p>
              </div>

              {/* Checkbox para produtos sem lateral */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-pink-50/50 border border-pink-100 cursor-pointer hover:bg-pink-50 transition-colors">
                <input
                  type="checkbox"
                  checked={!hasSide}
                  onChange={(e) => {
                    const noSide = e.target.checked;
                    setHasSide(!noSide);
                    if (noSide) {
                      setSideFile(null);
                      setSidePreviewUrl(null);
                    }
                  }}
                  className="w-4 h-4 text-[#ac2471] rounded-sm focus:ring-[#ac2471]"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Este modelo não possui lateral
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Para tags, adesivos, convites e itens planos.
                  </span>
                </div>
              </label>

              {hasSide && (
                <>
                  <input
                    ref={sideInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSideFileChange}
                    className="hidden"
                  />

                  {!sidePreviewUrl ? (
                    <div
                      onClick={() => sideInputRef.current?.click()}
                      className="border-2 border-dashed border-pink-200 hover:border-[#ac2471] rounded-3xl p-8 text-center bg-pink-50/30 hover:bg-pink-50/60 transition-all cursor-pointer space-y-3"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-2xs border border-pink-100 text-[#ac2471] flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-heading font-bold text-slate-800 text-sm">
                          Adicionar foto da lateral
                        </p>
                        <p className="text-xs text-slate-500">
                          Clique para escolher a imagem da lateral
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-3xl border border-pink-100 overflow-hidden bg-slate-50 flex items-center justify-center max-h-[280px]">
                        <img
                          src={sidePreviewUrl}
                          alt="Foto da Lateral"
                          className="max-h-[280px] w-auto object-contain rounded-2xl p-2"
                        />
                        <span className="absolute top-3 left-3 bg-[#ac2471] text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shadow-xs">
                          Lateral (SIDE)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => sideInputRef.current?.click()}
                        className="w-full py-2 px-4 rounded-xl border border-pink-200 text-[#ac2471] hover:bg-pink-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Trocar foto da lateral</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* ETAPA 4 — ANÁLISE AUTOMÁTICA & CONFIRMAÇÃO */}
          {/* ========================================================= */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200 text-center py-4">
              {isAnalyzing || isSaving ? (
                <div className="space-y-4 py-8">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-pink-100 border-t-[#ac2471] animate-spin" />
                    <Sparkles className="w-6 h-6 text-[#ac2471] animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-slate-800 text-base">
                      {isSaving ? 'Salvando modelo no ateliê...' : 'Preparando seu modelo...'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {isSaving
                        ? 'Gravando fotos no Storage privado e registrando superfícies calibradas.'
                        : 'Analisando superfícies úteis, perspectiva e proporção da costura contínua.'}
                    </p>
                  </div>
                </div>
              ) : analysisResult ? (
                analysisResult.confidence < 0.45 ? (
                  // ALERTA DE BAIXA CONFIANÇA (Requisito 17)
                  <div className="space-y-4 py-4">
                    <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                      <AlertTriangle className="w-8 h-8" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h4 className="font-heading font-bold text-slate-800 text-base sm:text-lg">
                        Não conseguimos calcular corretamente a proporção entre a frente e a lateral deste modelo.
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Tente novas fotos mostrando o produto inteiro e a superfície bem visível, em boa iluminação e com contraste claro em relação ao fundo.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(2);
                          setAnalysisResult(null);
                        }}
                        className="px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Escolher outra foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // SUCESSO: MODELO CALIBRADO COM SEGURANÇA
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-slate-800 text-lg">
                        Seu modelo está pronto ✨
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Superfícies calibradas com sucesso para estampa contínua.
                      </p>
                    </div>

                    {/* Resumo das Faces */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      {analysisResult.facesSummary.map((f, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-100 text-[#ac2471] text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{f}</span>
                        </span>
                      ))}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-1.5 text-slate-600 max-w-sm mx-auto">
                      <p><strong className="text-slate-800">Modelo:</strong> {analysisResult.name}</p>
                      <p>
                        <strong className="text-slate-800">Formato:</strong>{' '}
                        {analysisResult.hasSide
                          ? `Frente (${Math.round((analysisResult.seamConfig?.seamPoint || 0.65) * 100)}%) + Lateral (${Math.round((1 - (analysisResult.seamConfig?.seamPoint || 0.65)) * 100)}%) Contínua`
                          : 'Frente Única'}
                      </p>
                      <p className="text-emerald-700 font-semibold mt-1">✓ Pronto para receber temas em 1 clique</p>
                    </div>
                  </div>
                )
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-pink-50 bg-slate-50/50 flex items-center justify-between gap-3">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-2xl bg-[#ac2471] hover:bg-[#8e1d5d] disabled:opacity-50 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Avançar para Foto da Frente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={!frontFile}
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-2xl bg-[#ac2471] hover:bg-[#8e1d5d] disabled:opacity-50 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Avançar para Foto da Lateral</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={hasSide && !sideFile}
                onClick={handleStartAnalysis}
                className="px-6 py-2.5 rounded-2xl bg-[#ac2471] hover:bg-[#8e1d5d] disabled:opacity-50 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analisar e Criar Modelo</span>
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <button
                type="button"
                disabled={isAnalyzing || isSaving}
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
              >
                Voltar
              </button>
              {analysisResult && analysisResult.confidence >= 0.45 && (
                <button
                  type="button"
                  disabled={isAnalyzing || isSaving || !analysisResult}
                  onClick={handleSaveModel}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Modelo'}</span>
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
