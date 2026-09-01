import React, { useState } from 'react';
import {
  Calculator,
  Check,
  Coins,
  Copy,
  FileCheck,
  MessageCircle,
  Plus,
  Printer,
  Sparkles,
  Trash2
} from 'lucide-react';
import { AtelieProfile, MaterialCostItem, Order, Quotation } from '../types';
import { createWhatsAppLink, formatCurrency, triggerConfetti } from '../utils/helpers';

interface OrcamentoViewProps {
  onConvertToOrder: (order: Partial<Order>) => void;
  profile?: AtelieProfile;
}

export const OrcamentoView: React.FC<OrcamentoViewProps> = ({ onConvertToOrder, profile }) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [theme, setTheme] = useState('');

  // Materials Breakdown - starts clean
  const [materials, setMaterials] = useState<MaterialCostItem[]>([]);

  // Labor - Fixed user-defined value
  const [laborCost, setLaborCost] = useState<number>(25.0); // R$ 25,00

  // Overhead & Extras
  const [additionalCosts, setAdditionalCosts] = useState<number>(0.0);

  // Profit Margin
  const [profitMargin, setProfitMargin] = useState<number>(40); // 40%

  // Calculation Math: Profit margin is applied directly on materials and extras, with fixed labor cost
  const totalMaterialsCost = materials.reduce((acc, m) => acc + (m.unitCost * m.quantityUsed), 0);
  const materialsAndExtrasCost = totalMaterialsCost + additionalCosts;
  const profitValue = materialsAndExtrasCost * (profitMargin / 100);
  const calculatedPrice = materialsAndExtrasCost + profitValue + laborCost;
  const roundedPrice = Math.ceil(calculatedPrice);
  const baseCost = materialsAndExtrasCost + laborCost;

  const handleAddMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      {
        id: `mat-${Date.now()}`,
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

  const handleConvert = () => {
    triggerConfetti();
    onConvertToOrder({
      clientName: clientName || 'Cliente Orçamento',
      clientPhone: clientPhone,
      theme: theme || 'Papelaria Personalizada',
      financial: {
        paymentMethod: 'PIX',
        total: roundedPrice,
        deposit: Math.round(roundedPrice * 0.5),
        remaining: roundedPrice - Math.round(roundedPrice * 0.5),
        paymentProgress: 50,
      },
      items: [
        {
          id: `item-quote-${Date.now()}`,
          name: theme || 'Orçamento Aprovado',
          quantity: 1,
          unitPrice: roundedPrice,
          notes: `Orçamento aprovado (Custo base: ${formatCurrency(baseCost)})`,
        }
      ]
    });
  };

  const atelieDisplayName = profile?.name || 'Organize Ateliê';
  const ownerDisplayName = profile?.ownerName || 'Artesã Responsável';

  const quoteMessage = `🌸 *Orçamento - ${atelieDisplayName}* 🌸\n\n` +
    `Olá, ${clientName || 'Cliente'}! Aqui é ${ownerDisplayName} do *${atelieDisplayName}*! Segue a proposta para sua encomenda:\n\n` +
    `✂️ *Projeto:* ${theme || 'Papelaria Personalizada'}\n` +
    `💵 *Valor do Projeto:* ${formatCurrency(roundedPrice)}\n` +
    `✨ *Incluso:* Papéis nobres especiais, camadas em relevo 3D e acabamentos exclusivos.\n\n` +
    `Condições: 50% de sinal no fechamento do pedido e o restante na entrega.\n` +
    `Qualquer dúvida estou à disposição! 💖✂️`;

  const waQuoteLink = createWhatsAppLink(clientPhone, quoteMessage);

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Calculadora de Orçamento & Precificação
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Calcule insumos, horas de trabalho e margem de lucro real para nunca ter prejuízo.
          </p>
        </div>

        <button
          onClick={handleConvert}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#9d174d] to-[#be185d] hover:from-[#831843] hover:to-[#9d174d] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <FileCheck className="w-4 h-4" />
          <span>Converter em Pedido Real</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cost Breakdown (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Client & Project Data */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Dados da Proposta
            </h2>
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
                  placeholder="Ex: Topo de Bolo Shaker"
                  className="w-full px-3.5 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
              </div>
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
                    Nenhum insumo ou material adicionado a este cálculo. Adicione os papéis, insumos e adereços da sua peça para obter a precificação precisa.
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
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={mat.quantityUsed}
                        onChange={(e) =>
                          handleUpdateMaterial(idx, 'quantityUsed', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-white border border-pink-100 rounded-lg text-xs text-center font-bold text-slate-800 focus:outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={mat.unitCost}
                        onChange={(e) =>
                          handleUpdateMaterial(idx, 'unitCost', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-white border border-pink-100 rounded-lg text-xs text-right font-bold text-slate-800 focus:outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {formatCurrency(mat.unitCost * mat.quantityUsed)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(idx)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded-lg"
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
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={laborCost}
                  onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Valor fixo que você define pelo seu trabalho neste pedido.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  CUSTOS EXTRAS / ENERGIA (R$)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={additionalCosts}
                  onChange={(e) => setAdditionalCosts(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#f0e4e8] rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#ac2471]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Desgaste de lâmina, cola quente, fita e energia.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Result & Proposal Summary (4 cols) */}
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

            {/* Actions: WhatsApp Quote & Convert */}
            <div className="space-y-3">
              <a
                href={waQuoteLink}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Orçamento no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleConvert}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#9d174d] to-[#be185d] text-white font-heading font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Aprovar e Criar Pedido</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
