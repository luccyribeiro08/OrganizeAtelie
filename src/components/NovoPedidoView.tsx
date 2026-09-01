import React, { useState } from 'react';
import {
  Calendar,
  Check,
  CreditCard,
  Eye,
  Gift,
  HelpCircle,
  Image as ImageIcon,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  User,
  X
} from 'lucide-react';
import {
  CatalogItem,
  DeliveryMethod,
  OrderItem,
  OrderOrigin,
  PaymentMethod,
  Order
} from '../types';
import {
  formatCurrency,
  formatDate,
  getDaysRemaining,
  readFileAsDataUrl,
  triggerConfetti
} from '../utils/helpers';
import { INSPIRATIONS } from '../data/initialData';

interface NovoPedidoViewProps {
  catalog: CatalogItem[];
  onSaveOrder: (order: Order, isDraft?: boolean) => void;
  onNavigateToCatalog?: () => void;
}

export const NovoPedidoView: React.FC<NovoPedidoViewProps> = ({
  catalog,
  onSaveOrder,
  onNavigateToCatalog
}) => {
  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientInstagram, setClientInstagram] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Retirada no Ateliê');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [theme, setTheme] = useState('');
  const [origin, setOrigin] = useState<OrderOrigin>('WhatsApp');
  const [orderType, setOrderType] = useState('Topo de Bolo & Lembrancinhas');

  // Items
  const [items, setItems] = useState<OrderItem[]>([]);

  // Personalization
  const [honoreeName, setHonoreeName] = useState('');
  const [age, setAge] = useState('');
  const [colorPalette, setColorPalette] = useState('');
  const [tagPhrase, setTagPhrase] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Financial
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [customTotal, setCustomTotal] = useState<number | null>(null);
  const [deposit, setDeposit] = useState<number>(0);

  // Gallery Reference Images / Mockups for the order
  const [mockupImages, setMockupImages] = useState<string[]>([]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Inspiration index
  const [inspirationIndex, setInspirationIndex] = useState(0);

  // Quick theme suggestion pills
  const themeSuggestions = [
    'Jardim Encantado',
    'Safari Baby',
    'Barbie & Princesas',
    'Astronauta / Galáxia',
    'Circo Rosa',
    'Bosque Encantado',
    'Ursinho Pooh',
    'Flores & Borboletas'
  ];

  // Calculate items sum
  const itemsTotal = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  const totalAmount = customTotal !== null ? customTotal : itemsTotal;
  const remainingAmount = Math.max(0, totalAmount - (deposit || 0));
  const paymentProgress = totalAmount > 0 ? Math.min(100, Math.round(((deposit || 0) / totalAmount) * 100)) : 0;

  // Add Item
  const handleAddItem = (catalogItem?: CatalogItem) => {
    if (catalogItem) {
      setItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          name: catalogItem.name,
          quantity: 1,
          unitPrice: catalogItem.basePrice,
          imageUrl: catalogItem.imageUrl,
          notes: catalogItem.category
        }
      ]);
    } else {
      // Default to the first catalog item price if available, or 0
      const defaultPrice = catalog.length > 0 ? catalog[0].basePrice : 0;
      const defaultName = catalog.length > 0 ? catalog[0].name : 'Item Personalizado';
      setItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          name: defaultName,
          quantity: 1,
          unitPrice: defaultPrice,
          notes: '',
        }
      ]);
    }
  };

  const handleUpdateItem = (index: number, field: keyof OrderItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload reference photos from device gallery
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const dataUrl = await readFileAsDataUrl(files[i]);
        urls.push(dataUrl);
      } catch (err) {
        console.error('Erro ao processar foto da galeria', err);
      }
    }
    setMockupImages((prev) => [...prev, ...urls]);
    e.target.value = '';
  };

  const handleRemoveMockupImage = (index: number) => {
    setMockupImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Days remaining calculation
  const daysInfo = getDaysRemaining(deliveryDate);

  // Submit
  const handleSubmit = (isDraft = false) => {
    if (!isDraft && !clientName.trim()) {
      alert('Por favor, informe o Nome da Cliente para cadastrar o pedido.');
      return;
    }

    const newOrder: Order = {
      id: `ped-${Date.now()}`,
      code: `#PED-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: clientName.trim() || 'Cliente sem nome',
      clientPhone: clientPhone.trim() || '(11) 90000-0000',
      clientInstagram: clientInstagram.trim(),
      orderDate,
      deliveryDate,
      deliveryMethod,
      deliveryAddress: deliveryAddress.trim(),
      theme: theme.trim() || 'Personalizado',
      origin,
      orderType: orderType || 'Personalizados Diversos',
      items: items.length > 0 ? items : [
        {
          id: 'item-generic-1',
          name: theme ? `Personalizados ${theme}` : 'Itens de Papelaria',
          quantity: 1,
          unitPrice: totalAmount,
        }
      ],
      personalization: {
        honoreeName,
        age,
        colorPalette,
        tagPhrase,
        specialNotes
      },
      financial: {
        paymentMethod,
        total: totalAmount,
        deposit: deposit || 0,
        remaining: remainingAmount,
        paymentProgress,
      },
      status: isDraft ? 'Rascunho' : (deposit >= totalAmount ? 'Arte Aprovada' : 'Pendente'),
      mockupImages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!isDraft) {
      triggerConfetti();
    }
    onSaveOrder(newOrder, isDraft);
  };

  const currentInspiration = INSPIRATIONS[inspirationIndex % INSPIRATIONS.length];

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Header matching Image 10.jpeg */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Novo Pedido
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Preencha os detalhes abaixo para cadastrar uma nova encomenda no ateliê.
          </p>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-3">
          <button
            id="btn-salvar-rascunho"
            onClick={() => handleSubmit(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#ffd1dc]/50 hover:bg-[#ffd1dc] text-[#ac2471] font-semibold text-xs sm:text-sm transition-all duration-200 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Rascunho</span>
          </button>

          <button
            id="btn-finalizar-cadastro"
            onClick={() => handleSubmit(false)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#9d174d] to-[#be185d] hover:from-[#831843] hover:to-[#9d174d] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Finalizar Cadastro</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Form (8 cols on desktop) + Right Cards (4 cols on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Dados do Cliente */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-pink-100/70 flex items-center justify-center text-[#ac2471]">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-heading font-bold text-slate-800 tracking-tight">
                Dados do Cliente
              </h2>
            </div>

            {/* Row 1: Nome da Cliente */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                NOME DA CLIENTE *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-cliente-nome"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Maria Clara Silva"
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] transition-all"
                />
              </div>
            </div>

            {/* Row 2: WhatsApp & Instagram */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  TELEFONE / WHATSAPP
                </label>
                <input
                  id="input-cliente-telefone"
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  INSTAGRAM DA CLIENTE
                </label>
                <input
                  id="input-cliente-instagram"
                  type="text"
                  value={clientInstagram}
                  onChange={(e) => setClientInstagram(e.target.value)}
                  placeholder="@cliente.festa"
                  className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] transition-all"
                />
              </div>
            </div>

            {/* Row 3: Data do Pedido & Data de Entrega */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  DATA DO PEDIDO
                </label>
                <div className="relative">
                  <input
                    id="input-data-pedido"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    DATA DE ENTREGA
                  </label>
                  {deliveryDate && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        daysInfo.days <= 2
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {daysInfo.text}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="input-data-entrega"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Forma e Endereço de Entrega */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  FORMA DE ENTREGA
                </label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                  className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] transition-all"
                >
                  <option value="Retirada no Ateliê">Retirada no Ateliê</option>
                  <option value="Motoboy">Motoboy Express</option>
                  <option value="Correios (SEDEX)">Correios (SEDEX)</option>
                  <option value="Correios (PAC)">Correios (PAC)</option>
                  <option value="Transportadora">Transportadora</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  ENDEREÇO / OBSERVAÇÃO DE ENTREGA
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Rua, número ou horário combinado"
                  className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Detalhes da Encomenda */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-pink-100/70 flex items-center justify-center text-[#ac2471]">
                  <Gift className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-heading font-bold text-slate-800 tracking-tight">
                  Detalhes da Encomenda
                </h2>
              </div>
              <span className="text-xs text-pink-600 font-medium">
                Personalização Ateliê
              </span>
            </div>

            {/* Tema do Pedido */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                TEMA DO PEDIDO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input
                  id="input-pedido-tema"
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: Jardim Encantado, Safari, Barbie..."
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] transition-all"
                />
              </div>

              {/* Quick theme suggestions pills */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
                  Sugestões:
                </span>
                {themeSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTheme(sug)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-pink-50 hover:bg-[#ffd1dc] text-[#ac2471] transition-colors cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Origem e Tipo de Pedido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  ORIGEM DO PEDIDO
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['Shopee', 'WhatsApp', 'Instagram', 'Loja Física', 'Elo7'] as OrderOrigin[]).map((orig) => {
                    const isSelected = origin === orig;
                    return (
                      <button
                        key={orig}
                        type="button"
                        onClick={() => setOrigin(orig)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ffd1dc] text-[#ac2471] ring-1 ring-[#ac2471]/40 shadow-xs'
                            : 'bg-[#f8f9fa] text-slate-600 hover:bg-pink-50'
                        }`}
                      >
                        {orig}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  TIPO DE PEDIDO
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] transition-all"
                >
                  <option value="Topo de Bolo & Lembrancinhas">Topo de Bolo & Lembrancinhas</option>
                  <option value="Kit Festa Escolar">Kit Festa Escolar</option>
                  <option value="Kit Caixas Cenário Luxo">Kit Caixas Cenário Luxo</option>
                  <option value="Cadernos & Planners Artesanais">Cadernos & Planners Artesanais</option>
                  <option value="Lembrancinhas Maternidade / Batizado">Lembrancinhas Maternidade / Batizado</option>
                  <option value="Papelaria Corporativa & Tags">Papelaria Corporativa & Tags</option>
                  <option value="Convites Interativos">Convites Interativos</option>
                  <option value="Outro Personalizado">Outro Personalizado</option>
                </select>
              </div>
            </div>

            {/* Sub-Section: Itens da Encomenda */}
            <div className="pt-4 border-t border-pink-100/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Itens & Produtos ({items.length})
                </h3>
                <div className="flex items-center gap-2">
                  {catalog.length > 0 && (
                    <select
                      onChange={(e) => {
                        const selected = catalog.find((c) => c.id === e.target.value);
                        if (selected) handleAddItem(selected);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="text-xs px-2.5 py-1 rounded-xl bg-pink-50 text-[#ac2471] border border-pink-200/60 font-semibold cursor-pointer"
                    >
                      <option value="" disabled>
                        + Do Catálogo...
                      </option>
                      {catalog.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} - {formatCurrency(cat.basePrice)}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-[#ac2471] text-white hover:bg-[#831843] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Item Manual</span>
                  </button>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-2.5">
                {items.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-[#faf7f8] border border-dashed border-pink-200 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      Nenhum item adicionado a este pedido ainda.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddItem()}
                        className="px-3 py-1.5 rounded-xl bg-[#ac2471] text-white text-xs font-semibold hover:bg-[#831843] transition-colors cursor-pointer"
                      >
                        + Adicionar Item Manual
                      </button>
                      {catalog.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (catalog[0]) handleAddItem(catalog[0]);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-pink-50 text-[#ac2471] text-xs font-semibold hover:bg-pink-100 transition-colors cursor-pointer"
                        >
                          + Adicionar do Catálogo
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#faf7f8] border border-pink-100/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      {/* Item Thumbnail / Direct link preview */}
                      <div className="sm:col-span-1 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-pink-200 cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedPreviewImage(item.imageUrl || null)}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=150&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-pink-100/60 text-pink-500 flex items-center justify-center text-xs font-bold">
                            #{idx + 1}
                          </div>
                        )}
                      </div>

                      {/* Name & Notes */}
                      <div className="sm:col-span-5 space-y-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          placeholder="Nome do produto ou kit"
                          className="w-full px-2.5 py-1.5 bg-white border border-pink-100 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                        />
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => handleUpdateItem(idx, 'notes', e.target.value)}
                          placeholder="Detalhes (ex: papel fotográfico 180g, laço rosa)"
                          className="w-full px-2 py-1 bg-white border border-pink-100/60 rounded-lg text-[11px] text-slate-500 focus:outline-hidden"
                        />
                      </div>

                      {/* Qtd */}
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Qtd</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full px-2 py-1.5 bg-white border border-pink-100 rounded-lg text-xs font-bold text-slate-800 text-center focus:outline-hidden"
                        />
                      </div>

                      {/* Unit Price (Locked: editable only in catalog) */}
                      <div className="sm:col-span-2">
                        <div className="flex items-center gap-1">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase">Valor Un.</label>
                          <span title="Valor fixo do catálogo (editável na aba Catálogo)"><Lock className="w-2.5 h-2.5 text-slate-400" /></span>
                        </div>
                        <div className="w-full px-2 py-1.5 bg-slate-100/80 border border-slate-200/70 rounded-lg text-xs font-bold text-slate-700 text-right cursor-not-allowed flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-normal">R$</span>
                          <span>{item.unitPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Total</span>
                          <span className="text-xs font-bold text-[#ac2471]">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sub-Section: Personalização da Arte */}
            <div className="pt-4 border-t border-pink-100/60 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Personalização da Arte & Detalhes
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nome do(a) Aniversariante / Criança
                  </label>
                  <input
                    type="text"
                    value={honoreeName}
                    onChange={(e) => setHonoreeName(e.target.value)}
                    placeholder="Ex: Helena, Theo, Sophia..."
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Idade / Comemoração
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ex: 1 Aninho, 15 Anos, Batizado..."
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Paleta de Cores Preferida
                  </label>
                  <input
                    type="text"
                    value={colorPalette}
                    onChange={(e) => setColorPalette(e.target.value)}
                    placeholder="Ex: Tons pastéis, Rosa bebê e Ouro"
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Frase da Tag / Adesivo
                  </label>
                  <input
                    type="text"
                    value={tagPhrase}
                    onChange={(e) => setTagPhrase(e.target.value)}
                    placeholder='Ex: "Obrigado por comemorar comigo!"'
                    className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Observações Especiais de Confecção
                </label>
                <textarea
                  rows={2}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="Ex: Usar papel lamicote dourado 250g, fita de gorgurão nº 9 e reforçar a base de acrílico..."
                  className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>
            </div>

            {/* Sub-Section: Reference Photos from Device Gallery */}
            <div className="pt-4 border-t border-pink-100/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Fotos de Referência / Mockup ({mockupImages.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Adicione fotos da sua galeria de referências, moldes ou artes.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-pink-100 text-[#ac2471] hover:bg-[#ffd1dc] transition-colors cursor-pointer border border-pink-200/60 self-start sm:self-auto">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Escolher Foto da Galeria</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Gallery of Reference Images */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {mockupImages.map((imgUrl, i) => (
                  <div
                    key={i}
                    className="group relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-pink-100 bg-pink-50 shadow-xs"
                  >
                    <img
                      src={imgUrl}
                      alt={`Mockup ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewImage(imgUrl)}
                        className="p-1.5 bg-white/90 text-slate-800 rounded-lg hover:bg-white transition-colors cursor-pointer"
                        title="Ver em tela cheia"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMockupImage(i)}
                        className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                        title="Remover imagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (Matching Image 10.jpeg) ================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 3: Financeiro */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-atelie border border-pink-100/70 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-pink-100/70 flex items-center justify-center text-[#ac2471]">
                <CreditCard className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-heading font-bold text-slate-800 tracking-tight">
                Financeiro
              </h2>
            </div>

            {/* FORMA DE PAGAMENTO */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                FORMA DE PAGAMENTO
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#ac2471]/20 focus:border-[#ac2471] transition-all"
              >
                <option value="PIX">PIX</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Boleto">Boleto</option>
                <option value="Link de Pagamento">Link de Pagamento</option>
              </select>
            </div>

            {/* VALOR TOTAL (R$) */}
            <div className="text-center py-2 bg-[#fdfafb] rounded-2xl border border-pink-100/60 p-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                VALOR TOTAL (R$)
              </label>
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold text-[#ac2471] font-heading">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="mt-1">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={customTotal !== null ? customTotal : itemsTotal}
                  onChange={(e) => setCustomTotal(parseFloat(e.target.value) || 0)}
                  className="w-28 text-center text-xs bg-white border border-pink-200 rounded-lg py-1 text-slate-600 focus:outline-hidden"
                  placeholder="Editar total"
                  title="Clique para ajustar o valor total manualmente"
                />
              </div>
            </div>

            {/* SINAL (R$) & RESTANTE */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#f0e4e8]">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  SINAL (R$)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={deposit}
                  onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-pink-100 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-800 text-center focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#f0e4e8] text-center flex flex-col justify-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  RESTANTE
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </div>

            {/* Progresso Pagamento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Progresso Pagamento</span>
                <span className="text-[#ac2471] font-bold">{paymentProgress}%</span>
              </div>
              <div className="h-3 w-full bg-pink-100/70 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#ac2471] to-[#ff69b4] rounded-full transition-all duration-500"
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span>{paymentProgress >= 100 ? 'Pago Total ✨' : 'Sinal Confirmado'}</span>
                <span>100%</span>
              </div>
            </div>

            {/* Big Action Button "+ Criar Pedido" matching Image 10.jpeg */}
            <button
              id="btn-criar-pedido-principal"
              type="button"
              onClick={() => handleSubmit(false)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#9d174d] to-[#be185d] hover:from-[#831843] hover:to-[#9d174d] text-white font-heading font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Pedido</span>
            </button>
          </div>

          {/* Card 4: Inspiração do Dia (matching Image 10.jpeg) */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-atelie border border-pink-100/70 group">
            <div className="relative aspect-video w-full overflow-hidden bg-pink-100">
              <img
                src={currentInspiration.imageUrl}
                alt="Inspiração Ateliê"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onClick={() => setInspirationIndex((prev) => prev + 1)}
                  className="p-1.5 bg-white/80 backdrop-blur-md rounded-xl text-pink-700 hover:bg-white transition-colors cursor-pointer shadow-xs"
                  title="Trocar inspiração"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <h3 className="font-heading font-bold text-slate-800 text-base">
                Inspiração do Dia
              </h3>
              <p className="text-xs text-slate-600 italic leading-relaxed font-script text-base">
                {currentInspiration.quote}
              </p>
              <div className="pt-2 border-t border-pink-50 text-[11px] text-[#ac2471] font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{currentInspiration.tip}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL: Visualizador de Imagem em Tela Cheia ================= */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent rounded-2xl overflow-hidden">
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPreviewImage}
              alt="Visualização"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
