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

  // Production Time & Labor Cost State
  const [laborHours, setLaborHours] = useState<number>(1);
  const [laborMinutes, setLaborMinutes] = useState<number>(15);
  const [hourlyRate, setHourlyRate] = useState<number>(20.0);
  const [laborCost, setLaborCost] = useState<number>(25.0);

  // Overhead & Extras
  const [additionalCosts, setAdditionalCosts] = useState<number>(0.0);

  // Profit Margin
  const [profitMargin, setProfitMargin] = useState<number>(40);

  // Success Feedback state
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Production Time & Calculation Math
  const totalLaborHours = (laborHours || 0) + (laborMinutes || 0) / 60;
  const calculatedLaborCost = roundCurrency(totalLaborHours * (hourlyRate || 0));

  const totalMaterialsCost = roundCurrency(materials.reduce((acc, m) => acc + (m.unitCost || 0) * (m.quantityUsed || 0), 0));
  const materialsAndExtrasCost = roundCurrency(totalMaterialsCost + (additionalCosts || 0));
  const baseCost = roundCurrency(materialsAndExtrasCost + (laborCost || 0));
  const profitValue = roundCurrency(baseCost * (profitMargin / 100));
  const calculatedPrice = roundCurrency(baseCost + profitValue);
  const roundedPrice = calculatedPrice;

  // Sync helper when time or rate changes
  const handleUpdateTime = (newHours: number, newMinutes: number, newRate: number = hourlyRate) => {
    const validHours = Math.max(0, isNaN(newHours) ? 0 : newHours);
    const validMinutes = Math.max(0, Math.min(59, isNaN(newMinutes) ? 0 : newMinutes));
    setLaborHours(validHours);
    setLaborMinutes(validMinutes);
    setHourlyRate(newRate);
    const cost = roundCurrency((validHours + validMinutes / 60) * newRate);
    setLaborCost(cost);
  };

  const handleUpdateHourlyRate = (newRate: number) => {
    const validRate = Math.max(0, isNaN(newRate) ? 0 : newRate);
    setHourlyRate(validRate);
    const cost = roundCurrency(totalLaborHours * validRate);
    setLaborCost(cost);
  };

  const handleSetQuickTime = (hours: number, minutes: number) => {
    handleUpdateTime(hours, minutes, hourlyRate);
  };

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
    setLaborHours(1);
    setLaborMinutes(15);
    setHourlyRate(20.0);
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
    setLaborHours(1);
    setLaborMinutes(15);
    setHourlyRate(20.0);
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

    const loadedHourlyRate = quote.hourlyRate && quote.hourlyRate > 0 ? quote.hourlyRate : 20.0;
    const loadedHours = quote.laborHours !== undefined ? quote.laborHours : (quote.laborCost ? Math.floor(quote.laborCost / loadedHourlyRate) : 1);
    const loadedMinutes = quote.laborMinutes !== undefined ? quote.laborMinutes : (quote.laborCost ? Math.round(((quote.laborCost / loadedHourlyRate) - loadedHours) * 60) : 15);
    const loadedLaborCost = quote.laborCost ?? 25.0;

    setLaborHours(loadedHours);
    setLaborMinutes(loadedMinutes);
    setHourlyRate(loadedHourlyRate);
    setLaborCost(loadedLaborCost);
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
      laborHours,
      laborMinutes,
      hourlyRate,
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

            {/* Mão de Obra & Custos Adicionais */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-pink-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-pink-100/70 flex items-center justify-center text-[#ac2471]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-heading">
                      Mão de Obra & Custos Adicionais
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Calculado automaticamente com base no tempo de produção e valor da sua hora.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-[#ac2471] rounded-full text-xs font-bold self-start sm:self-auto">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cálculo Automático</span>
                </div>
              </div>

              {/* Grid: Tempo de Produção + Valor da Hora */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Tempo de Produção (7 cols) */}
                <div className="md:col-span-7 space-y-3 bg-[#faf7f8] p-4 sm:p-5 rounded-2xl border border-pink-100/80">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#ac2471]" />
                    <span>Tempo de Produção da Artesã</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Horas</span>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={laborHours === 0 ? '' : laborHours}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            handleUpdateTime(val, laborMinutes);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#f0e4e8] rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471] text-center"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                          h
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Minutos</span>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          step="5"
                          value={laborMinutes === 0 ? '' : laborMinutes}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            handleUpdateTime(laborHours, val);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#f0e4e8] rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471] text-center"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                          min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Atalhos Rápidos de Tempo */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Atalhos Rápidos:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '15 min', h: 0, m: 15 },
                        { label: '30 min', h: 0, m: 30 },
                        { label: '45 min', h: 0, m: 45 },
                        { label: '1 hora', h: 1, m: 0 },
                        { label: '1h 30m', h: 1, m: 30 },
                        { label: '2 horas', h: 2, m: 0 },
                        { label: '3 horas', h: 3, m: 0 },
                        { label: '4 horas', h: 4, m: 0 },
                      ].map((chip) => {
                        const isSelected = laborHours === chip.h && laborMinutes === chip.m;
                        return (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => handleSetQuickTime(chip.h, chip.m)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#ac2471] text-white shadow-2xs'
                                : 'bg-white text-slate-600 hover:bg-pink-100 hover:text-[#ac2471] border border-pink-100'
                            }`}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Valor da Hora da Artesã (5 cols) */}
                <div className="md:col-span-5 space-y-3 bg-[#faf7f8] p-4 sm:p-5 rounded-2xl border border-pink-100/80 flex flex-col justify-between">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-[#ac2471]" />
                      <span>Valor da sua Hora (R$/h)</span>
                    </label>
                    <DecimalInput
                      value={hourlyRate}
                      onChangeValue={handleUpdateHourlyRate}
                      prefix="R$"
                      placeholder="20,00"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#f0e4e8] rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      Quanto você cobra por hora trabalhada na confecção das peças.
                    </p>
                  </div>

                  {/* Pre-sets de valor da hora */}
                  <div className="pt-2 border-t border-pink-100/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Sugestões de Hora:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[15, 20, 25, 30].map((rateVal) => (
                        <button
                          key={rateVal}
                          type="button"
                          onClick={() => handleUpdateHourlyRate(rateVal)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                            hourlyRate === rateVal
                              ? 'bg-pink-200 text-[#ac2471]'
                              : 'bg-white text-slate-500 hover:bg-pink-100 hover:text-[#ac2471] border border-pink-100'
                          }`}
                        >
                          R$ {rateVal},00/h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Linha Inferior: Resumo Calculado da Mão de Obra + Custos Extras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Resultado Automático da Mão de Obra */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/90 to-rose-50/50 border border-pink-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#ac2471] uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      VALOR DA MÃO DE OBRA
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {laborHours}h{laborMinutes > 0 ? ` ${laborMinutes}m` : ''} × {formatCurrency(hourlyRate)}/h
                    </span>
                  </div>

                  <DecimalInput
                    value={laborCost}
                    onChangeValue={(val) => setLaborCost(val)}
                    prefix="R$"
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 bg-white border border-pink-200 rounded-xl text-sm font-extrabold text-[#ac2471] focus:outline-hidden focus:border-[#ac2471] shadow-2xs"
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Calculado automaticamente pelo tempo</span>
                    {laborCost !== calculatedLaborCost && (
                      <button
                        type="button"
                        onClick={() => setLaborCost(calculatedLaborCost)}
                        className="text-[#ac2471] hover:underline font-bold cursor-pointer"
                        title="Restaurar valor exato do cálculo do tempo"
                      >
                        Restaurar ({formatCurrency(calculatedLaborCost)})
                      </button>
                    )}
                  </div>
                </div>

                {/* Custos Extras / Energia */}
                <div className="p-4 rounded-2xl bg-[#faf7f8] border border-pink-100 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    🔌 Custos Extras / Desgaste / Energia (R$)
                  </label>
                  <DecimalInput
                    value={additionalCosts}
                    onChangeValue={(val) => setAdditionalCosts(val)}
                    prefix="R$"
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#f0e4e8] rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                  />
                  <p className="text-[10px] text-slate-400">
                    Desgaste de lâmina de corte, cola quente, fita banana e energia elétrica.
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
                  <span>Margem de Lucro s/ Custo Base Total</span>
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
                <div className="flex justify-between text-pink-700 font-bold pt-1 border-t border-pink-50">
                  <div className="flex flex-col">
                    <span>Mão de Obra da Artesã:</span>
                    <span className="text-[10px] text-pink-500 font-normal">
                      {laborHours}h{laborMinutes > 0 ? ` ${laborMinutes}m` : ''} @ {formatCurrency(hourlyRate)}/h
                    </span>
                  </div>
                  <span className="font-bold">{formatCurrency(laborCost)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold pt-2 pb-2 px-2.5 my-1 border border-pink-100 bg-pink-50/60 rounded-xl">
                  <span>Custo Base Total:</span>
                  <span className="text-[#ac2471] font-heading font-extrabold">{formatCurrency(baseCost)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1">
                  <span>Lucro s/ Custo Total ({profitMargin}%):</span>
                  <span>+{formatCurrency(profitValue)}</span>
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
                          <span>Mão de Obra:</span>
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(quote.laborCost || 0)}
                            {((quote.laborHours || 0) > 0 || (quote.laborMinutes || 0) > 0) && (
                              <span className="text-pink-600 font-normal ml-1 text-[10px]">
                                ({quote.laborHours || 0}h{quote.laborMinutes ? ` ${quote.laborMinutes}m` : ''})
                              </span>
                            )}
                          </span>
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
