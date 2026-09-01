import React, { useState } from 'react';
import {
  BookmarkPlus,
  Calculator,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Edit3,
  ExternalLink,
  FileCheck,
  FileText,
  FolderHeart,
  MessageCircle,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  User,
  X
} from 'lucide-react';
import { AtelieProfile, MaterialCostItem, Order, Quotation } from '../types';
import { createWhatsAppLink, formatCurrency, formatDate, triggerConfetti, roundCurrency } from '../utils/helpers';
import { DecimalInput } from './DecimalInput';

interface OrcamentoViewProps {
  quotations: Quotation[];
  onSaveQuotation: (quote: Quotation) => void;
  onDeleteQuotation: (quoteId: string) => void;
  onApproveAndCreateOrder: (order: Partial<Order>, quoteId?: string) => void;
  profile?: AtelieProfile;
}

export const OrcamentoView: React.FC<OrcamentoViewProps> = ({
  quotations = [],
  onSaveQuotation,
  onDeleteQuotation,
  onApproveAndCreateOrder,
  profile
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'calculadora' | 'salvos'>('calculadora');
  const [searchQuoteQuery, setSearchQuoteQuery] = useState('');

  // Currently loaded quote ID (if editing a saved quote)
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editingQuoteCode, setEditingQuoteCode] = useState<string | null>(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [theme, setTheme] = useState('');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState<number>(7);

  // Materials Breakdown
  const [materials, setMaterials] = useState<MaterialCostItem[]>([]);

  // Labor - Fixed user-defined value
  const [laborCost, setLaborCost] = useState<number>(25.0);

  // Overhead & Extras
  const [additionalCosts, setAdditionalCosts] = useState<number>(0.0);

  // Profit Margin
  const [profitMargin, setProfitMargin] = useState<number>(40);

  // Success Feedback state
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Calculation Math with Cent Precision
  const totalMaterialsCost = roundCurrency(materials.reduce((acc, m) => acc + (m.unitCost || 0) * (m.quantityUsed || 0), 0));
  const materialsAndExtrasCost = roundCurrency(totalMaterialsCost + (additionalCosts || 0));
  const profitValue = roundCurrency(materialsAndExtrasCost * (profitMargin / 100));
  const calculatedPrice = roundCurrency(materialsAndExtrasCost + profitValue + (laborCost || 0));
  const roundedPrice = calculatedPrice;
  const baseCost = roundCurrency(materialsAndExtrasCost + (laborCost || 0));

  const handleAddMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      {
        id: `mat-${Date.now()}-${Math.random()}`,
        name: 'Novo Insumo / Material',
        unitCost: 1.0,
        quantityUsed: 1,
        subtotal: 1.0,
      }
    ]);
  };

  const handleLoadSampleMaterials = () => {
    setTheme('Topo de Bolo Shaker');
    setMaterials([
      { id: 'm1', name: 'Folhas de Papel Offset 180g (3 un)', unitCost: 0.80, quantityUsed: 3, subtotal: 2.40 },
      { id: 'm2', name: 'Papel Lamicote Dourado 250g (1 un)', unitCost: 3.50, quantityUsed: 1, subtotal: 3.50 },
      { id: 'm3', name: 'Haste Acrílica Transparente (2 un)', unitCost: 1.20, quantityUsed: 2, subtotal: 2.40 },
      { id: 'm4', name: 'Fita Banana / Fita Espuma 3D', unitCost: 1.50, quantityUsed: 1, subtotal: 1.50 },
      { id: 'm5', name: 'Lantejoulas / Miçangas Shaker', unitCost: 2.00, quantityUsed: 1, subtotal: 2.00 },
      { id: 'm6', name: 'Embalagem Celofane e Tag', unitCost: 1.00, quantityUsed: 1, subtotal: 1.00 },
    ]);
    setAdditionalCosts(3.0);
    setLaborCost(25.0);
  };

  const handleUpdateMaterial = (index: number, field: keyof MaterialCostItem, val: any) => {
    setMaterials((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      copy[index].subtotal = copy[index].unitCost * copy[index].quantityUsed;
      return copy;
    });
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearForm = () => {
    setEditingQuoteId(null);
    setEditingQuoteCode(null);
    setClientName('');
    setClientPhone('');
    setTheme('');
    setNotes('');
    setMaterials([]);
    setLaborCost(25.0);
    setAdditionalCosts(0.0);
    setProfitMargin(40);
    setSaveSuccessMessage(null);
  };

  const handleLoadQuoteIntoCalculator = (quote: Quotation) => {
    setEditingQuoteId(quote.id);
    setEditingQuoteCode(quote.code);
    setClientName(quote.clientName || '');
    setClientPhone(quote.clientPhone || '');
    setTheme(quote.theme || '');
    setNotes(quote.notes || '');
    setValidDays(quote.validDays || 7);
    setMaterials(quote.materials || []);
    setLaborCost(quote.laborCost ?? 25.0);
    setAdditionalCosts(quote.additionalCosts || 0);
    setProfitMargin(quote.profitMargin || 40);
    setActiveSubTab('calculadora');
    setSaveSuccessMessage(`Orçamento ${quote.code} carregado na calculadora!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // 1. Save Quote (Salvar Orçamento)
  const handleSaveQuotation = () => {
    if (!theme && !clientName) {
      alert('Por favor, informe pelo menos o nome do cliente ou o tema do projeto para salvar o orçamento.');
      return;
    }

    const quoteId = editingQuoteId || `orc-${Date.now()}`;
    const code = editingQuoteCode || `#ORC-${Math.floor(100 + Math.random() * 900)}`;

    const newQuotation: Quotation = {
      id: quoteId,
      code,
      clientName: clientName.trim() || 'Cliente sem nome',
      clientPhone: clientPhone.trim() || '',
      theme: theme.trim() || 'Papelaria Personalizada',
      materials,
      laborCost,
      additionalCosts,
      profitMargin,
      calculatedPrice,
      suggestedPrice: roundedPrice,
      roundedPrice,
      date: new Date().toISOString().split('T')[0],
      validDays: validDays || 7,
      notes: notes.trim(),
      status: 'Pendente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveQuotation(newQuotation);
    setEditingQuoteId(quoteId);
    setEditingQuoteCode(code);
    setSaveSuccessMessage(`Orçamento ${code} salvo com sucesso! Aguardando aprovação do cliente.`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // 2. Approve and Create Order (Aprovar e Criar Pedido)
  const handleApproveAndCreate = (fromQuote?: Quotation) => {
    triggerConfetti();

    const targetClient = fromQuote ? fromQuote.clientName : (clientName || 'Cliente Orçamento');
    const targetPhone = fromQuote ? (fromQuote.clientPhone || '') : clientPhone;
    const targetTheme = fromQuote ? fromQuote.theme : (theme || 'Papelaria Personalizada');
    const targetPrice = fromQuote ? (fromQuote.roundedPrice || fromQuote.suggestedPrice) : roundedPrice;
    const targetCost = fromQuote
      ? (fromQuote.materials.reduce((acc, m) => acc + m.unitCost * m.quantityUsed, 0) + (fromQuote.additionalCosts || 0) + (fromQuote.laborCost || 0))
      : baseCost;
    const targetNotes = fromQuote ? fromQuote.notes : notes;
    const quoteCode = fromQuote ? fromQuote.code : (editingQuoteCode || '#ORC');

    const depositVal = roundCurrency(targetPrice * 0.5);

    const partialOrder: Partial<Order> = {
      clientName: targetClient,
      clientPhone: targetPhone,
      theme: targetTheme,
      origin: 'WhatsApp',
      orderType: 'Orçamento Aprovado',
      financial: {
        paymentMethod: 'PIX',
        total: roundCurrency(targetPrice),
        deposit: depositVal,
        remaining: roundCurrency(targetPrice - depositVal),
        paymentProgress: 50,
      },
      items: [
        {
          id: `item-quote-${Date.now()}`,
          name: targetTheme,
          quantity: 1,
          unitPrice: roundCurrency(targetPrice),
          notes: `Convertido do ${quoteCode} (Custo base: ${formatCurrency(targetCost)})`,
        }
      ],
      personalization: {
        specialNotes: targetNotes ? `Orçamento ${quoteCode}: ${targetNotes}` : `Convertido a partir do ${quoteCode}`,
      }
    };

    // If approved from an existing quote, update its status
    if (fromQuote) {
      onSaveQuotation({
        ...fromQuote,
        status: 'Aprovado',
        updatedAt: new Date().toISOString(),
      });
    } else if (editingQuoteId) {
      const existing = quotations.find((q) => q.id === editingQuoteId);
      if (existing) {
        onSaveQuotation({
          ...existing,
          status: 'Aprovado',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    onApproveAndCreateOrder(partialOrder, fromQuote?.id || editingQuoteId || undefined);
  };

  const atelieDisplayName = profile?.name || 'Organize Ateliê';
  const ownerDisplayName = profile?.ownerName || 'Artesã Responsável';

  const quoteMessage =
    `🌸 *Orçamento - ${atelieDisplayName}* 🌸\n\n` +
    `Olá, ${clientName || 'Cliente'}! Aqui é ${ownerDisplayName} do *${atelieDisplayName}*! Segue a proposta para sua encomenda:\n\n` +
    `✂️ *Projeto:* ${theme || 'Papelaria Personalizada'}\n` +
    `💵 *Valor do Projeto:* ${formatCurrency(roundedPrice)}\n` +
    `✨ *Incluso:* Papéis nobres especiais, camadas em relevo 3D e acabamentos exclusivos.\n\n` +
    `Condições: 50% de sinal no fechamento do pedido e o restante na entrega do produto ou retirada.\n` +
    (notes ? `📝 *Observações:* ${notes}\n\n` : '\n') +
    `Qualquer dúvida estou à disposição! 💖✂️`;

  const waQuoteLink = createWhatsAppLink(clientPhone, quoteMessage);

  // Filter saved quotations
  const filteredQuotations = quotations.filter((q) => {
    const query = searchQuoteQuery.toLowerCase();
    return (
      q.clientName.toLowerCase().includes(query) ||
      q.code.toLowerCase().includes(query) ||
      q.theme.toLowerCase().includes(query)
    );
  });

  const pendingQuotationsCount = quotations.filter((q) => q.status === 'Pendente').length;

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Orçamentos & Precificação
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Calcule custos, salve orçamentos pendentes e converta em pedidos após aprovação do cliente.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-pink-100 shadow-xs">
          <button
            onClick={() => setActiveSubTab('calculadora')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'calculadora'
                ? 'bg-[#ac2471] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#ac2471] hover:bg-pink-50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Calculadora</span>
          </button>

          <button
            onClick={() => setActiveSubTab('salvos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'salvos'
                ? 'bg-[#ac2471] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#ac2471] hover:bg-pink-50'
            }`}
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Orçamentos Salvos</span>
            {quotations.length > 0 && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeSubTab === 'salvos' ? 'bg-white text-[#ac2471]' : 'bg-pink-100 text-[#ac2471]'
                }`}
              >
                {quotations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= TAB 1: CALCULADORA DE ORÇAMENTO ================= */}
      {activeSubTab === 'calculadora' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Cost Breakdown (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Editing Existing Quote Header (if active) */}
            {editingQuoteId && (
              <div className="p-4 rounded-2xl bg-pink-50/80 border border-pink-200 flex items-center justify-between text-xs text-[#ac2471]">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#ac2471]" />
                  <span>
                    Editando orçamento <strong>{editingQuoteCode}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Novo Orçamento em Branco
                </button>
              </div>
            )}

            {/* Client & Project Data */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Dados da Proposta
                </h2>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="text-xs font-semibold text-slate-400 hover:text-[#ac2471] flex items-center gap-1 cursor-pointer"
                  title="Limpar formulário"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    NOME DO CLIENTE
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Amanda Silva"
                    className="w-full px-3.5 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    WHATSAPP DO CLIENTE
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    PROJETO / TEMA
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Ex: Topo de Bolo Shaker Luxo"
                    className="w-full px-3.5 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                </div>
              </div>

              {/* Observações da proposta */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  OBSERVAÇÕES DO PROJETO (OPCIONAL)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Incluso laços de cetim e camadas com lamicote dourado..."
                  className="w-full px-3.5 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>
            </div>

            {/* Insumos & Materiais */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Insumos & Materiais Gastos
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Papéis especiais, lamicote, fitas, colas e adereços.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-pink-100 text-[#ac2471] hover:bg-[#ffd1dc] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Insumo</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {materials.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#faf7f8] border border-dashed border-pink-200 text-center space-y-3">
                    <Calculator className="w-8 h-8 text-pink-300 mx-auto" />
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Nenhum insumo ou material adicionado a este cálculo. Adicione os papéis e adereços para obter a precificação precisa.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleAddMaterial}
                        className="px-3 py-1.5 rounded-xl bg-[#ac2471] text-white text-xs font-semibold hover:bg-[#831843] transition-colors cursor-pointer"
                      >
                        + Adicionar Primeiro Insumo
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadSampleMaterials}
                        className="px-3 py-1.5 rounded-xl bg-pink-50 text-[#ac2471] text-xs font-semibold hover:bg-pink-100 transition-colors cursor-pointer"
                      >
                        Carregar Exemplo de Insumos
                      </button>
                    </div>
                  </div>
                ) : (
                  materials.map((mat, idx) => (
                    <div
                      key={mat.id}
                      className="p-3 bg-[#faf7f8] rounded-2xl border border-pink-100/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={mat.name}
                          onChange={(e) => handleUpdateMaterial(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-pink-100 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <DecimalInput
                          value={mat.quantityUsed}
                          onChangeValue={(val) => handleUpdateMaterial(idx, 'quantityUsed', val)}
                          placeholder="1"
                          className="w-full px-2 py-1 bg-white border border-pink-100 rounded-lg text-xs text-center font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                          title="Quantidade gasta (aceita decimais)"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <DecimalInput
                          value={mat.unitCost}
                          onChangeValue={(val) => handleUpdateMaterial(idx, 'unitCost', val)}
                          prefix="R$"
                          placeholder="0,00"
                          className="w-full px-2 py-1 bg-white border border-pink-100 rounded-lg text-xs text-right font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                          title="Custo unitário (aceita ponto, vírgula e centavos)"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {formatCurrency(mat.unitCost * mat.quantityUsed)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(idx)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {materials.length > 0 && (
                <div className="flex justify-end pt-2 text-xs font-bold text-slate-700">
                  Total Insumos: <span className="ml-2 text-[#ac2471]">{formatCurrency(totalMaterialsCost)}</span>
                </div>
              )}
            </div>

            {/* Mão de Obra & Custos Fixos */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Mão de Obra & Custos Adicionais
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    VALOR DA MÃO DE OBRA FIXO (R$)
                  </label>
                  <DecimalInput
                    value={laborCost}
                    onChangeValue={(val) => setLaborCost(val)}
                    prefix="R$"
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Valor fixo que você define pelo seu trabalho neste projeto.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    CUSTOS EXTRAS / ENERGIA (R$)
                  </label>
                  <DecimalInput
                    value={additionalCosts}
                    onChangeValue={(val) => setAdditionalCosts(val)}
                    prefix="R$"
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Desgaste de lâmina, cola quente, fita e energia.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing Result & Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-atelie border border-pink-100/70 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-pink-100/70 flex items-center justify-center text-[#ac2471]">
                  <Coins className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-heading font-bold text-slate-800 tracking-tight">
                  Resultado da Precificação
                </h2>
              </div>

              {/* Profit margin slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Margem de Lucro s/ Materiais</span>
                  <span className="text-[#ac2471] font-bold text-sm">{profitMargin}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(parseInt(e.target.value))}
                  className="w-full accent-[#ac2471] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>10% (Básico)</span>
                  <span>40% (Recomendado)</span>
                  <span>100% (Luxo)</span>
                </div>
              </div>

              {/* Breakdown List */}
              <div className="space-y-2 py-3 border-y border-pink-50 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Custos de Materiais:</span>
                  <span className="font-semibold">{formatCurrency(totalMaterialsCost)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Custos Extras / Desgaste:</span>
                  <span className="font-semibold">{formatCurrency(additionalCosts)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Lucro sobre Materiais ({profitMargin}%):</span>
                  <span>+{formatCurrency(profitValue)}</span>
                </div>
                <div className="flex justify-between text-pink-700 font-bold pt-1 border-t border-pink-50">
                  <span>Mão de Obra Fixa:</span>
                  <span className="font-bold">{formatCurrency(laborCost)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-pink-50">
                  <span>Custo Base Total:</span>
                  <span>{formatCurrency(baseCost)}</span>
                </div>
              </div>

              {/* Suggested Price Highlight */}
              <div className="text-center py-4 bg-[#fdfafb] rounded-2xl border border-pink-100/80">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  PREÇO SUGERIDO DE VENDA
                </span>
                <span className="text-3xl font-heading font-extrabold text-[#ac2471]">
                  {formatCurrency(roundedPrice)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {/* 1. Approve & Create Order Button (Requested Feature) */}
                <button
                  type="button"
                  onClick={() => handleApproveAndCreate()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#9d174d] to-[#be185d] hover:from-[#831843] hover:to-[#9d174d] text-white font-heading font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Aprovar e Criar Pedido</span>
                </button>

                {/* 2. Save Quote Button (Requested Feature) */}
                <button
                  type="button"
                  onClick={handleSaveQuotation}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-pink-50 hover:bg-pink-100 text-[#ac2471] font-semibold text-xs border border-pink-200 shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingQuoteId ? 'Salvar Alterações no Orçamento' : 'Salvar Orçamento (Aguardar Aprovação)'}</span>
                </button>

                {/* 3. Send WhatsApp Proposal */}
                <a
                  href={waQuoteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-2xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Orçamento no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ORÇAMENTOS SALVOS / PENDENTES ================= */}
      {activeSubTab === 'salvos' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Bar with Search & Counter */}
          <div className="bg-white p-4 rounded-3xl border border-pink-100 shadow-atelie flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuoteQuery}
                onChange={(e) => setSearchQuoteQuery(e.target.value)}
                placeholder="Buscar orçamento por cliente, tema ou código..."
                className="w-full pl-10 pr-4 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#ac2471]"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                <strong>{pendingQuotationsCount}</strong> aguardando aprovação
              </span>

              <button
                onClick={() => {
                  handleClearForm();
                  setActiveSubTab('calculadora');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ac2471] text-white text-xs font-bold hover:bg-[#831843] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Cálculo</span>
              </button>
            </div>
          </div>

          {/* Quotations List */}
          {filteredQuotations.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-pink-100 shadow-atelie space-y-3">
              <BookmarkPlus className="w-12 h-12 text-pink-300 mx-auto" />
              <h3 className="font-heading font-bold text-slate-800 text-base">
                Nenhum orçamento salvo
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Calcule os custos na calculadora e clique em "Salvar Orçamento" para guardá-lo aqui até que o cliente dê o retorno!
              </p>
              <button
                onClick={() => setActiveSubTab('calculadora')}
                className="mt-2 px-5 py-2 rounded-xl bg-[#ac2471] text-white text-xs font-semibold hover:bg-[#831843] cursor-pointer"
              >
                Ir para a Calculadora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuotations.map((quote) => {
                const isPending = quote.status === 'Pendente';
                const isApproved = quote.status === 'Aprovado';
                const quoteVal = quote.roundedPrice || quote.suggestedPrice || quote.calculatedPrice;

                const specificQuoteMsg =
                  `🌸 *Orçamento - ${atelieDisplayName}* 🌸\n\n` +
                  `Olá, ${quote.clientName}! Aqui é ${ownerDisplayName} do *${atelieDisplayName}*! Segue a proposta para sua encomenda:\n\n` +
                  `✂️ *Projeto:* ${quote.theme}\n` +
                  `💵 *Valor do Projeto:* ${formatCurrency(quoteVal)}\n` +
                  `✨ *Incluso:* Papéis nobres especiais, camadas em relevo 3D e acabamentos exclusivos.\n\n` +
                  `Condições: 50% de sinal no fechamento do pedido e o restante na entrega do produto ou retirada.\n` +
                  (quote.notes ? `📝 *Observações:* ${quote.notes}\n\n` : '\n') +
                  `Qualquer dúvida estou à disposição! 💖✂️`;

                const specificWaLink = createWhatsAppLink(quote.clientPhone || '', specificQuoteMsg);

                return (
                  <div
                    key={quote.id}
                    className="bg-white rounded-3xl p-5 border border-pink-100 shadow-atelie space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Code & Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#ac2471] bg-pink-50 px-2.5 py-0.5 rounded-full">
                          {quote.code}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isApproved ? '✓ Aprovado' : '⏳ Aguardando Aprovação'}
                        </span>
                      </div>

                      {/* Client & Theme */}
                      <div>
                        <h3 className="font-heading font-extrabold text-slate-900 text-sm">
                          {quote.clientName}
                        </h3>
                        {quote.clientPhone && (
                          <p className="text-[11px] text-slate-400">{quote.clientPhone}</p>
                        )}
                        <p className="text-xs text-pink-700 font-semibold mt-1">
                          {quote.theme}
                        </p>
                      </div>

                      {/* Materials Brief */}
                      <div className="p-2.5 rounded-xl bg-[#faf7f8] text-[11px] text-slate-600 space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Insumos ({quote.materials?.length || 0}):</span>
                          <span>{formatCurrency(quote.materials?.reduce((acc, m) => acc + m.unitCost * m.quantityUsed, 0) || 0)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Mão de Obra Fixa:</span>
                          <span>{formatCurrency(quote.laborCost || 0)}</span>
                        </div>
                        {quote.notes && (
                          <p className="text-[10px] text-slate-400 pt-1 border-t border-pink-100/60 truncate">
                            Obs: {quote.notes}
                          </p>
                        )}
                      </div>

                      {/* Price Banner */}
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                          Valor Proposto:
                        </span>
                        <span className="text-xl font-heading font-extrabold text-[#ac2471]">
                          {formatCurrency(quoteVal)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons for this quote */}
                    <div className="pt-3 border-t border-pink-50 space-y-2">
                      {/* Primary: Approve and Create Order */}
                      <button
                        type="button"
                        onClick={() => handleApproveAndCreate(quote)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[#9d174d] to-[#be185d] hover:from-[#831843] hover:to-[#9d174d] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        title="Cliente aprovou! Levar direto para criação de pedido"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprovar e Criar Pedido</span>
                      </button>

                      <div className="grid grid-cols-3 gap-1.5">
                        {/* WhatsApp */}
                        <a
                          href={specificWaLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                          title="Enviar proposta no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        {/* Edit in calculator */}
                        <button
                          type="button"
                          onClick={() => handleLoadQuoteIntoCalculator(quote)}
                          className="flex items-center justify-center p-2 rounded-xl bg-pink-50 text-[#ac2471] hover:bg-pink-100 text-xs font-semibold transition-colors cursor-pointer"
                          title="Carregar na Calculadora"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Deseja excluir o orçamento ${quote.code} de ${quote.clientName}?`)) {
                              onDeleteQuotation(quote.id);
                            }
                          }}
                          className="flex items-center justify-center p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                          title="Excluir Orçamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
