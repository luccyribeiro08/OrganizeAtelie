import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Box,
  ShoppingBag,
  PartyPopper,
  Tag,
  Package,
  FileText,
  Gift,
  Layers,
  ArrowRight,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  FolderHeart,
  Image as ImageIcon
} from 'lucide-react';
import { MockupCategory, MockupTemplate, UserMockupModel } from '../../types/mockupTypes';
import { MOCKUP_CATEGORIES, MOCKUP_TEMPLATES, filterMockupTemplates } from '../../data/mockupTemplates';
import { MockupWhiteCard } from './MockupWhiteCard';
import { buildCustomTemplateFromConfig } from '../../utils/modelAnalyzer';

interface MockupProductSelectorProps {
  onSelectTemplate: (template: MockupTemplate) => void;
  customModels: UserMockupModel[];
  onOpenAddModelModal: () => void;
  onRenameCustomModel: (modelId: string, newName: string) => void;
  onDeleteCustomModel: (modelId: string) => void;
}

export const MockupProductSelector: React.FC<MockupProductSelectorProps> = ({
  onSelectTemplate,
  customModels,
  onOpenAddModelModal,
  onRenameCustomModel,
  onDeleteCustomModel
}) => {
  const [activeTab, setActiveTab] = useState<'official' | 'custom'>('official');
  const [selectedCategory, setSelectedCategory] = useState<MockupCategory>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenModelId, setMenuOpenModelId] = useState<string | null>(null);

  // Modelos Oficiais Filtrados
  const filteredOfficialTemplates = useMemo(() => {
    return filterMockupTemplates(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  // Modelos Particulares da Usuária Filtrados
  const filteredCustomModels = useMemo(() => {
    return customModels.filter((m) => {
      const matchCat = selectedCategory === 'todas' || m.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [customModels, selectedCategory, searchQuery]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag className="w-4 h-4" />;
      case 'Box': return <Box className="w-4 h-4" />;
      case 'PartyPopper': return <PartyPopper className="w-4 h-4" />;
      case 'Tag': return <Tag className="w-4 h-4" />;
      case 'Package': return <Package className="w-4 h-4" />;
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Gift': return <Gift className="w-4 h-4" />;
      case 'Layers': return <Layers className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const handleRenameClick = (m: UserMockupModel) => {
    setMenuOpenModelId(null);
    const newName = window.prompt('Novo nome do modelo:', m.name);
    if (newName && newName.trim() && newName.trim() !== m.name) {
      onRenameCustomModel(m.id, newName.trim());
    }
  };

  const handleDeleteClick = (m: UserMockupModel) => {
    setMenuOpenModelId(null);
    if (window.confirm(`Tem certeza que deseja excluir o modelo "${m.name}"?`)) {
      onDeleteCustomModel(m.id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header: Main Mode Tabs & + Adicionar meu modelo button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-3xl border border-pink-100 shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-pink-50/70 rounded-2xl border border-pink-100/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('official');
              setMenuOpenModelId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'official'
                ? 'bg-white text-[#ac2471] shadow-xs'
                : 'text-slate-600 hover:text-[#ac2471]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modelos do Organize Ateliê</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-pink-100 text-[#ac2471] rounded-full">
              {MOCKUP_TEMPLATES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('custom');
              setMenuOpenModelId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-white text-[#ac2471] shadow-xs'
                : 'text-slate-600 hover:text-[#ac2471]'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span>Meus Modelos</span>
            {customModels.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-[#ac2471] text-white rounded-full">
                {customModels.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Button: + Adicionar meu modelo */}
        <button
          type="button"
          onClick={onOpenAddModelModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ac2471] hover:bg-[#8e1d5d] text-white text-xs font-bold rounded-2xl shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Adicionar meu modelo</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produto... (ex: Caixa Milk, Tag, Sacolinha, Ziplock)"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-pink-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] shadow-2xs placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 px-3 py-1.5 bg-pink-50/70 rounded-xl self-start sm:self-auto border border-pink-100/50">
          <Sparkles className="w-3.5 h-3.5 text-[#ac2471]" />
          <span>
            {activeTab === 'official'
              ? `${filteredOfficialTemplates.length} modelos oficiais`
              : `${filteredCustomModels.length} modelos particulares`}
          </span>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {MOCKUP_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#ac2471] text-white shadow-xs shadow-[#ac2471]/20 scale-[1.02]'
                  : 'bg-white text-slate-600 border border-pink-100/80 hover:bg-pink-50/80 hover:text-[#ac2471]'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-[#ac2471]'}>
                {getCategoryIcon(cat.icon)}
              </span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* ABA 1: MODELOS DO ORGANIZE ATELIÊ */}
      {/* ========================================================= */}
      {activeTab === 'official' && (
        <>
          {filteredOfficialTemplates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-pink-100 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#ac2471] flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-slate-800 text-base">
                Nenhum produto encontrado
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Não encontramos nenhum modelo para &ldquo;{searchQuery}&rdquo;. Tente buscar por outros termos como Caixa Milk, Pirâmide, Sacolinha ou Tag.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('todas');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-pink-50 text-[#ac2471] font-semibold text-xs rounded-xl hover:bg-pink-100 transition-colors"
              >
                Ver todos os modelos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOfficialTemplates.map((tpl) => {
                const facesLabel = tpl.facesSummary
                  ? tpl.facesSummary.join(' • ')
                  : tpl.faces.length > 1
                  ? 'Frente • Lateral'
                  : 'Frente';

                return (
                  <div
                    key={tpl.id}
                    className="group bg-white rounded-3xl border border-pink-100/80 hover:border-pink-300 p-4 flex flex-col justify-between shadow-2xs hover:shadow-atelie transition-all duration-200"
                  >
                    <div className="space-y-3">
                      {/* 3D White Model Thumbnail */}
                      <MockupWhiteCard template={tpl} />

                      {/* Product Info */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                            {tpl.subcategory || tpl.category}
                          </span>
                          
                          {/* Face Badge: Frente • Lateral ou Frente */}
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {facesLabel}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-slate-800 text-sm group-hover:text-[#ac2471] transition-colors line-clamp-1">
                          {tpl.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => onSelectTemplate(tpl)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-pink-50 hover:bg-[#ac2471] text-[#ac2471] hover:text-white font-semibold text-xs rounded-2xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm active:scale-98"
                    >
                      <span>Usar Modelo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* ABA 2: MEUS MODELOS */}
      {/* ========================================================= */}
      {activeTab === 'custom' && (
        <>
          {filteredCustomModels.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-pink-100 p-8 space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-3xl bg-pink-50 text-[#ac2471] flex items-center justify-center mx-auto shadow-2xs">
                <FolderHeart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-slate-800 text-base sm:text-lg">
                  Nenhum modelo cadastrado ainda
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tire fotos da frente e lateral das caixas e embalagens exclusivas do seu ateliê para gerar mockups automaticamente sempre que quiser!
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddModelModal}
                className="px-6 py-3 bg-[#ac2471] hover:bg-[#8e1d5d] text-white font-bold text-xs rounded-2xl shadow-xs hover:shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar meu modelo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCustomModels.map((m) => {
                const isMenuOpen = menuOpenModelId === m.id;
                const facesLabel = m.facesSummary && m.facesSummary.length > 0
                  ? m.facesSummary.join(' • ')
                  : m.hasSide
                  ? 'Frente • Lateral'
                  : 'Frente';

                return (
                  <div
                    key={m.id}
                    className="relative group bg-white rounded-3xl border border-pink-100/80 hover:border-pink-300 p-4 flex flex-col justify-between shadow-2xs hover:shadow-atelie transition-all duration-200"
                  >
                    <div className="space-y-3">
                      {/* Photo Thumbnail */}
                      <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-50 border border-pink-50 flex items-center justify-center">
                        {m.frontImageUrl ? (
                          <img
                            src={m.frontImageUrl}
                            alt={m.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-pink-300" />
                        )}

                        {/* Top Options Menu Button */}
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenModelId(isMenuOpen ? null : m.id);
                            }}
                            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs text-slate-600 hover:text-[#ac2471] flex items-center justify-center shadow-xs border border-pink-100 cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-8 w-36 bg-white rounded-2xl shadow-lg border border-pink-100 p-1.5 space-y-1 z-30 animate-in fade-in duration-150">
                              <button
                                type="button"
                                onClick={() => handleRenameClick(m)}
                                className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-pink-50 hover:text-[#ac2471] flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Renomear</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(m)}
                                className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                            {m.subcategory || m.category}
                          </span>
                          
                          {/* Face Badge: Frente • Lateral ou Frente */}
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {facesLabel}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-slate-800 text-sm group-hover:text-[#ac2471] transition-colors line-clamp-1">
                          {m.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {m.description || `Modelo particular do seu ateliê.`}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        let finalTemplate = m.template;
                        if (!finalTemplate || !finalTemplate.faces || finalTemplate.faces.length === 0) {
                          finalTemplate = buildCustomTemplateFromConfig(
                            m.name,
                            m.category || 'caixinhas',
                            m.id,
                            m.frontSurfaceConfig,
                            m.sideSurfaceConfig,
                            m.seamConfig,
                            m.hasSide,
                            m.frontImageUrl,
                            m.sideImageUrl,
                            m.userId
                          );
                        }
                        onSelectTemplate({
                          ...finalTemplate,
                          id: m.id,
                          name: m.name,
                          category: m.category,
                          frontImageUrl: m.frontImageUrl || finalTemplate?.frontImageUrl,
                          sideImageUrl: m.sideImageUrl || finalTemplate?.sideImageUrl,
                          baseImageUrl: m.frontImageUrl || finalTemplate?.baseImageUrl,
                          isCustomModel: true,
                          active: true
                        });
                      }}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-pink-50 hover:bg-[#ac2471] text-[#ac2471] hover:text-white font-semibold text-xs rounded-2xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm active:scale-98"
                    >
                      <span>Usar Modelo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
};
