import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit2,
  FolderHeart,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Tags,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { CatalogItem } from '../types';
import { DEFAULT_CATALOG_CATEGORIES } from '../data/initialData';
import { formatCurrency, readFileAsDataUrl, roundCurrency } from '../utils/helpers';
import { DecimalInput } from './DecimalInput';

interface CatalogoViewProps {
  catalog: CatalogItem[];
  categories?: string[];
  onAddCatalogItem: (item: CatalogItem) => void;
  onUpdateCatalogItem: (item: CatalogItem) => void;
  onDeleteCatalogItem: (itemId: string) => void;
  onSelectProductForOrder: (item: CatalogItem) => void;
  onUpdateCategories?: (
    newCategories: string[],
    renamedMap?: { oldName: string; newName: string },
    deletedCategory?: string
  ) => void;
}

export const CatalogoView: React.FC<CatalogoViewProps> = ({
  catalog = [],
  categories = DEFAULT_CATALOG_CATEGORIES,
  onAddCatalogItem,
  onUpdateCatalogItem,
  onDeleteCatalogItem,
  onSelectProductForOrder,
  onUpdateCategories,
}) => {
  const [localCategories, setLocalCategories] = useState<string[]>(categories);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Product Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Category Manager Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null);

  // Fast inline category creation inside Product Modal
  const [showInlineNewCat, setShowInlineNewCat] = useState(false);
  const [inlineNewCatName, setInlineNewCatName] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(35.0);
  const [estimatedDays, setEstimatedDays] = useState<number>(3);
  const [imageUrl, setImageUrl] = useState('');

  // Sync with prop categories when changed
  const activeCategoriesSource = categories && categories.length > 0 ? categories : localCategories;

  // Compute distinct list of all categories including any existing in products
  const categoriesList = useMemo(() => {
    const list = [...activeCategoriesSource];
    // Add any category from existing catalog items that might not be in the list
    catalog.forEach((item) => {
      if (item.category && !list.includes(item.category)) {
        list.push(item.category);
      }
    });
    return list.filter((c) => c && c.trim().length > 0);
  }, [activeCategoriesSource, catalog]);

  // Filtered Products
  const filteredItems = catalog.filter((item) => {
    const matchCat = selectedCategory === 'todos' || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Category Handlers
  const handleAddCategory = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === 'todos') {
      alert('O nome "todos" é reservado para a listagem completa.');
      return;
    }
    if (categoriesList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('Esta categoria já existe no catálogo.');
      return;
    }

    const updated = [...categoriesList, trimmed];
    if (onUpdateCategories) {
      onUpdateCategories(updated);
    } else {
      setLocalCategories(updated);
    }
    setCategoryFeedback(`Categoria "${trimmed}" adicionada com sucesso!`);
    setTimeout(() => setCategoryFeedback(null), 3500);
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCatIndex(null);
      return;
    }
    if (trimmed.toLowerCase() === 'todos') {
      alert('O nome "todos" é reservado para a listagem completa.');
      return;
    }
    if (
      categoriesList.some(
        (c) => c.toLowerCase() === trimmed.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase()
      )
    ) {
      alert('Já existe outra categoria com esse nome.');
      return;
    }

    const updated = categoriesList.map((c) => (c === oldName ? trimmed : c));
    if (selectedCategory === oldName) setSelectedCategory(trimmed);
    if (category === oldName) setCategory(trimmed);

    if (onUpdateCategories) {
      onUpdateCategories(updated, { oldName, newName: trimmed });
    } else {
      setLocalCategories(updated);
    }

    setEditingCatIndex(null);
    setCategoryFeedback(`Categoria renomeada para "${trimmed}"!`);
    setTimeout(() => setCategoryFeedback(null), 3500);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const count = catalog.filter((item) => item.category === catToDelete).length;
    const confirmMsg =
      count > 0
        ? `A categoria "${catToDelete}" possui ${count} produto(s) vinculado(s).\n\nDeseja realmente excluir esta categoria? Os produtos serão transferidos para outra categoria do catálogo.`
        : `Deseja realmente excluir a categoria "${catToDelete}"?`;

    if (!confirm(confirmMsg)) return;

    const updated = categoriesList.filter((c) => c !== catToDelete);
    if (selectedCategory === catToDelete) setSelectedCategory('todos');
    if (category === catToDelete) setCategory(updated[0] || 'Topos de Bolo');

    if (onUpdateCategories) {
      onUpdateCategories(updated, undefined, catToDelete);
    } else {
      setLocalCategories(updated);
    }

    setCategoryFeedback(`Categoria "${catToDelete}" excluída.`);
    setTimeout(() => setCategoryFeedback(null), 3500);
  };

  // Product Modal Openers
  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCategory(categoriesList[0] || 'Topos de Bolo');
    setDescription('');
    setBasePrice(35.0);
    setEstimatedDays(3);
    setImageUrl('https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80');
    setShowInlineNewCat(false);
    setInlineNewCatName('');
    setShowModal(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || categoriesList[0] || 'Topos de Bolo');
    setDescription(item.description);
    setBasePrice(item.basePrice);
    setEstimatedDays(item.estimatedDays);
    setImageUrl(item.imageUrl);
    setShowInlineNewCat(false);
    setInlineNewCatName('');
    setShowModal(true);
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageUrl(dataUrl);
    } catch (err) {
      console.error('Erro ao carregar imagem', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category.trim() || categoriesList[0] || 'Geral';

    if (editingItem) {
      const updatedItem: CatalogItem = {
        ...editingItem,
        name: name.trim(),
        category: finalCategory,
        description: description.trim() || 'Produto artesanal personalizado do ateliê.',
        basePrice: roundCurrency(basePrice || 0),
        estimatedDays: estimatedDays || 3,
        imageUrl: imageUrl.trim() || editingItem.imageUrl,
        tags: [finalCategory, 'Personalizados', 'Ateliê'],
      };
      onUpdateCatalogItem(updatedItem);
    } else {
      const newItem: CatalogItem = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        category: finalCategory,
        description: description.trim() || 'Produto artesanal personalizado do ateliê.',
        basePrice: roundCurrency(basePrice || 0),
        estimatedDays: estimatedDays || 3,
        imageUrl:
          imageUrl.trim() ||
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
        tags: [finalCategory, 'Personalizados', 'Ateliê'],
      };
      onAddCatalogItem(newItem);
    }

    setShowModal(false);
    setEditingItem(null);
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Catálogo do Ateliê</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-50 text-[#ac2471] border border-pink-100/80">
              {catalog.length} produtos
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Produtos, modelos de topos de bolo, kits de caixas, lembrancinhas e encadernação.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-300 text-[#ac2471] font-semibold text-xs sm:text-sm shadow-xs transition-all duration-200 cursor-pointer"
            title="Adicionar, editar e remover categorias do catálogo"
          >
            <Tags className="w-4 h-4 text-[#ac2471]" />
            <span>Gerenciar Categorias</span>
            <span className="ml-0.5 px-2 py-0.5 rounded-full bg-pink-100 text-[#ac2471] text-[10px] font-bold">
              {categoriesList.length}
            </span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#9d174d] to-[#be185d] hover:from-[#831843] hover:to-[#9d174d] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Produto</span>
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white p-3.5 rounded-3xl border border-pink-100 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'todos'
                ? 'bg-[#ffd1dc] text-[#ac2471] ring-1 ring-[#ac2471]/30 shadow-xs'
                : 'bg-pink-50/40 text-slate-600 hover:bg-pink-50 border border-pink-100/60'
            }`}
          >
            <span>Todos os Produtos</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 font-bold">
              {catalog.length}
            </span>
          </button>

          {categoriesList.map((cat) => {
            const count = catalog.filter((item) => item.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#ffd1dc] text-[#ac2471] ring-1 ring-[#ac2471]/30 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'
                }`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/80 text-[#ac2471]' : 'bg-pink-50 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3 py-2 rounded-2xl text-xs font-bold text-[#ac2471] hover:bg-pink-50 border border-dashed border-pink-200 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ml-1"
            title="Criar nova categoria"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Categoria</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72 flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome ou categoria..."
            className="w-full pl-10 pr-4 py-2 bg-pink-50/30 hover:bg-pink-50/60 focus:bg-white border border-[#f0e4e8] rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#ac2471] transition-all"
          />
        </div>
      </div>

      {/* Catalog Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-pink-100 p-12 text-center space-y-3 shadow-atelie max-w-lg mx-auto">
          <Sparkles className="w-10 h-10 text-pink-300 mx-auto" />
          <h3 className="font-heading font-bold text-slate-800 text-base">
            {catalog.length === 0 ? 'Seu catálogo está limpo e pronto' : 'Nenhum produto encontrado'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {catalog.length === 0
              ? 'Cadastre seus topos de bolo, kits festa, lembrancinhas, caixas personalizadas e encadernação para agilizar seus pedidos e orçamentos.'
              : 'Tente selecionar outra categoria ou limpar o termo de busca.'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-5 py-2.5 rounded-2xl bg-[#ac2471] text-white text-xs font-semibold hover:bg-[#831843] transition-colors cursor-pointer shadow-sm"
          >
            + Cadastrar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl overflow-hidden border border-pink-100 shadow-atelie hover:shadow-atelie-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Product Image */}
                <div className="relative aspect-square w-full overflow-hidden bg-pink-50">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[#ac2471] shadow-xs border border-pink-100">
                    {item.category}
                  </span>

                  {/* Edit and Delete action buttons side by side */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 bg-white/90 text-slate-700 hover:text-[#ac2471] hover:bg-white rounded-full shadow-xs transition-colors cursor-pointer"
                      title="Editar produto"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir "${item.name}" do catálogo?`)) {
                          onDeleteCatalogItem(item.id);
                        }
                      }}
                      className="p-1.5 bg-black/50 text-white rounded-full hover:bg-rose-600 transition-all cursor-pointer"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-2">
                  <h3 className="font-heading font-bold text-slate-800 text-sm leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span>⏱️ Produção: {item.estimatedDays} dias úteis</span>
                  </div>
                </div>
              </div>

              {/* Bottom Price & Actions */}
              <div className="p-5 pt-0 flex items-center justify-between border-t border-pink-50/80 mt-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Preço Base
                  </span>
                  <span className="text-lg font-heading font-extrabold text-[#ac2471]">
                    {formatCurrency(item.basePrice)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-50 hover:bg-[#ffd1dc] text-[#ac2471] text-xs font-semibold transition-colors cursor-pointer"
                    title="Editar produto"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja excluir "${item.name}" do catálogo?`)) {
                        onDeleteCatalogItem(item.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                    title="Excluir produto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL: Gerenciar Categorias ================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-50 text-[#ac2471]">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-slate-900 text-lg">
                    Gerenciar Categorias
                  </h3>
                  <p className="text-xs text-slate-500">
                    Adicione, renomeie ou exclua as categorias do seu catálogo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCatIndex(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-pink-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback Alert */}
            {categoryFeedback && (
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{categoryFeedback}</span>
              </div>
            )}

            {/* Add Category Section */}
            <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Adicionar Nova Categoria
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="Ex: Convites de Luxo, Caixas Cartonadas..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-pink-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newCatInput.trim()) {
                        handleAddCategory(newCatInput.trim());
                        setNewCatInput('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCatInput.trim()) {
                      handleAddCategory(newCatInput.trim());
                      setNewCatInput('');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#ac2471] hover:bg-[#831843] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                <span>Categorias Cadastradas ({categoriesList.length})</span>
                <span className="text-[11px] text-slate-400 font-normal">Clique no lápis para renomear</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {categoriesList.length === 0 ? (
                  <div className="text-center p-6 text-slate-400 text-xs bg-slate-50 rounded-2xl">
                    Nenhuma categoria cadastrada. Adicione uma acima.
                  </div>
                ) : (
                  categoriesList.map((cat, idx) => {
                    const count = catalog.filter((item) => item.category === cat).length;
                    const isEditing = editingCatIndex === idx;

                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white border border-pink-100 hover:border-pink-200 shadow-2xs gap-3 transition-all"
                      >
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-xl bg-pink-50/50 border border-pink-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleRenameCategory(cat, editingCatName);
                                } else if (e.key === 'Escape') {
                                  setEditingCatIndex(null);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRenameCategory(cat, editingCatName)}
                              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs transition-colors cursor-pointer shadow-2xs"
                              title="Salvar novo nome"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatIndex(null)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#ac2471] flex items-center justify-center font-bold text-xs flex-shrink-0">
                                <Tag className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                  {cat}
                                </h4>
                                <span className="text-[11px] text-slate-400">
                                  {count} produto{count !== 1 ? 's' : ''} vinculado{count !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatIndex(idx);
                                  setEditingCatName(cat);
                                }}
                                className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#ac2471] text-xs transition-colors cursor-pointer"
                                title="Editar nome da categoria"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs transition-colors cursor-pointer"
                                title="Excluir categoria"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-pink-100">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCatIndex(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#ac2471] hover:bg-[#831843] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Cadastrar / Editar Produto ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2.5">
                <FolderHeart className="w-5 h-5 text-[#ac2471]" />
                <h3 className="font-heading font-bold text-slate-900 text-lg">
                  {editingItem ? 'Editar Produto do Catálogo' : 'Novo Produto no Catálogo'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-pink-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  NOME DO PRODUTO *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Topo de Bolo Shaker Ouro"
                  className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      CATEGORIA *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInlineNewCat(!showInlineNewCat)}
                      className="text-[11px] font-bold text-[#ac2471] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showInlineNewCat ? 'Listar' : 'Nova'}</span>
                    </button>
                  </div>

                  {showInlineNewCat ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={inlineNewCatName}
                        onChange={(e) => setInlineNewCatName(e.target.value)}
                        placeholder="Nova categoria..."
                        className="flex-1 px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (inlineNewCatName.trim()) {
                              handleAddCategory(inlineNewCatName.trim());
                              setCategory(inlineNewCatName.trim());
                              setInlineNewCatName('');
                              setShowInlineNewCat(false);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (inlineNewCatName.trim()) {
                            handleAddCategory(inlineNewCatName.trim());
                            setCategory(inlineNewCatName.trim());
                            setInlineNewCatName('');
                            setShowInlineNewCat(false);
                          }
                        }}
                        className="px-3 py-2 bg-[#ac2471] text-white text-xs font-bold rounded-xl hover:bg-[#831843] transition-colors cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471] cursor-pointer"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PREÇO BASE (R$)
                  </label>
                  <DecimalInput
                    value={basePrice}
                    onChangeValue={(val) => setBasePrice(val)}
                    prefix="R$"
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  PRAZO ESTIMADO DE PRODUÇÃO (DIAS)
                </label>
                <input
                  type="number"
                  min="1"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>

              {/* Gallery Image Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  FOTO DO PRODUTO (GALERIA DO DISPOSITIVO)
                </label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-pink-200 bg-pink-50 flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl border border-dashed border-pink-200 bg-pink-50/50 flex items-center justify-center text-pink-400 flex-shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-50 hover:bg-[#ffd1dc] text-[#ac2471] rounded-xl font-semibold text-xs transition-colors cursor-pointer border border-pink-200/60">
                    <Upload className="w-4 h-4" />
                    <span>Escolher Imagem da Galeria</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Selecione uma foto da sua galeria de fotos ou arquivos.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  DESCRIÇÃO & ESPECIFICAÇÕES
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Materiais usados (papel fotográfico, gramatura, acabamento)..."
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-semibold bg-gradient-to-r from-[#9d174d] to-[#be185d] text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {editingItem ? 'Salvar Alterações' : 'Salvar no Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
