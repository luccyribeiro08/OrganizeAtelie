import React, { useState } from 'react';
import {
  Edit2,
  FolderHeart,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { CatalogItem } from '../types';
import { formatCurrency, readFileAsDataUrl, roundCurrency } from '../utils/helpers';
import { DecimalInput } from './DecimalInput';

interface CatalogoViewProps {
  catalog: CatalogItem[];
  onAddCatalogItem: (item: CatalogItem) => void;
  onUpdateCatalogItem: (item: CatalogItem) => void;
  onDeleteCatalogItem: (itemId: string) => void;
  onSelectProductForOrder: (item: CatalogItem) => void;
}

export const CatalogoView: React.FC<CatalogoViewProps> = ({
  catalog,
  onAddCatalogItem,
  onUpdateCatalogItem,
  onDeleteCatalogItem,
  onSelectProductForOrder
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Topos de Bolo');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(35.0);
  const [estimatedDays, setEstimatedDays] = useState<number>(3);
  const [imageUrl, setImageUrl] = useState('');

  const categories = [
    'todos',
    'Topos de Bolo',
    'Kit Festa',
    'Cadernos & Planners',
    'Lembrancinhas',
    'Papelaria Escolar',
    'Papelaria Corporativa'
  ];

  const filteredItems = catalog.filter((item) => {
    const matchCat = selectedCategory === 'todos' || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Topos de Bolo');
    setDescription('');
    setBasePrice(35.0);
    setEstimatedDays(3);
    setImageUrl('https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80');
    setShowModal(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description);
    setBasePrice(item.basePrice);
    setEstimatedDays(item.estimatedDays);
    setImageUrl(item.imageUrl);
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

    if (editingItem) {
      const updatedItem: CatalogItem = {
        ...editingItem,
        name: name.trim(),
        category,
        description: description.trim() || 'Produto artesanal personalizado do ateliê.',
        basePrice: roundCurrency(basePrice || 0),
        estimatedDays: estimatedDays || 3,
        imageUrl: imageUrl.trim() || editingItem.imageUrl,
        tags: [category, 'Personalizados', 'Ateliê'],
      };
      onUpdateCatalogItem(updatedItem);
    } else {
      const newItem: CatalogItem = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        category,
        description: description.trim() || 'Produto artesanal personalizado do ateliê.',
        basePrice: roundCurrency(basePrice || 0),
        estimatedDays: estimatedDays || 3,
        imageUrl:
          imageUrl.trim() ||
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
        tags: [category, 'Personalizados', 'Ateliê'],
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
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Catálogo do Ateliê
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Produtos, modelos de topos de bolo, kits de caixas e encadernação.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#9d174d] to-[#be185d] hover:from-[#831843] hover:to-[#9d174d] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#ffd1dc] text-[#ac2471] ring-1 ring-[#ac2471]/30 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'
              }`}
            >
              {cat === 'todos' ? 'Todos os Produtos' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar produto..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#f0e4e8] rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#ac2471]"
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
                  <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[#ac2471] shadow-xs">
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
                      onClick={() => onDeleteCatalogItem(item.id)}
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
                    onClick={() => onDeleteCatalogItem(item.id)}
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

      {/* ================= MODAL: Cadastrar / Editar Produto ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-5 animate-in fade-in zoom-in-95">
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
                className="text-slate-400 hover:text-slate-600 p-1"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    CATEGORIA
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  >
                    <option value="Topos de Bolo">Topos de Bolo</option>
                    <option value="Kit Festa">Kit Festa</option>
                    <option value="Cadernos & Planners">Cadernos & Planners</option>
                    <option value="Lembrancinhas">Lembrancinhas</option>
                    <option value="Papelaria Escolar">Papelaria Escolar</option>
                    <option value="Papelaria Corporativa">Papelaria Corporativa</option>
                  </select>
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-semibold bg-gradient-to-r from-[#9d174d] to-[#be185d] text-white rounded-xl shadow-md hover:shadow-lg transition-all"
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
