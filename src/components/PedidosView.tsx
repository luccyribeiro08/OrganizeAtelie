import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  LayoutGrid,
  List,
  MessageCircle,
  PackageCheck,
  Plus,
  Printer,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Order, OrderStatus, OrderOrigin } from '../types';
import {
  createWhatsAppLink,
  formatCurrency,
  formatDate,
  generateWhatsAppOrderMessage,
  getDaysRemaining
} from '../utils/helpers';

interface PedidosViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onPrintOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
  onNavigateToNewOrder: () => void;
}

export const PedidosView: React.FC<PedidosViewProps> = ({
  orders,
  onSelectOrder,
  onPrintOrder,
  onUpdateStatus,
  onDeleteOrder,
  onNavigateToNewOrder
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [originFilter, setOriginFilter] = useState<string>('todos');

  // Status lists
  const allStatuses: OrderStatus[] = [
    'Rascunho',
    'Pendente',
    'Arte Aprovada',
    'Em Produção',
    'Pronto p/ Envio',
    'Finalizado'
  ];

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'todos' || order.status === statusFilter;
    const matchOrigin = originFilter === 'todos' || order.origin === originFilter;

    return matchSearch && matchStatus && matchOrigin;
  });

  // Financial and active stats
  const activeOrders = orders.filter((o) => o.status !== 'Finalizado' && o.status !== 'Rascunho');
  const inProductionCount = orders.filter((o) => o.status === 'Em Produção').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.financial.total, 0);
  const totalPendingPayment = orders
    .filter((o) => o.status === 'Em Produção' || o.status === 'Pronto p/ Envio')
    .reduce((sum, o) => sum + (o.status === 'Finalizado' ? 0 : o.financial.remaining), 0);

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'Rascunho':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Pendente':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Arte Aprovada':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Em Produção':
        return 'bg-purple-100 text-purple-800 border-purple-200 animate-pulse';
      case 'Pronto p/ Envio':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Finalizado':
        return 'bg-pink-100 text-[#ac2471] border-pink-200';
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Gestão de Pedidos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe a produção, prazos de entrega e pagamentos do seu ateliê.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switch View Toggle */}
          <div className="bg-white border border-pink-100 rounded-2xl p-1 flex items-center shadow-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-[#ffd1dc] text-[#ac2471]' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-[#ffd1dc] text-[#ac2471]' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Visualização em Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onNavigateToNewOrder}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#9d174d] to-[#be185d] hover:from-[#831843] hover:to-[#9d174d] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-atelie space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pedidos Ativos
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-800">
              {activeOrders.length}
            </span>
            <span className="text-xs text-pink-600 font-semibold bg-pink-50 px-2 py-0.5 rounded-full">
              Em andamento
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-atelie space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Em Confecção
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-purple-700">
              {inProductionCount}
            </span>
            <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
              Na mesa de corte
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-atelie space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Faturamento Total
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-heading font-extrabold text-[#ac2471]">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-atelie space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            A Receber (Restante)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-heading font-extrabold text-amber-700">
              {formatCurrency(totalPendingPayment)}
            </span>
            <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
              Sinais e saldos
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-pink-100 shadow-atelie flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, tema ou código..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#ac2471]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-2xl px-3 py-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              {allStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Origin Filter */}
          <div className="flex items-center gap-1.5 bg-[#f8f9fa] border border-[#f0e4e8] rounded-2xl px-3 py-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Origem:</span>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todas</option>
              <option value="Shopee">Shopee</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Loja Física">Loja Física</option>
              <option value="Elo7">Elo7</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: LIST VIEW ================= */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-pink-100 shadow-atelie overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-pink-300 mx-auto" />
              <h3 className="font-heading font-bold text-slate-800 text-base">
                Nenhum pedido encontrado
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tente ajustar seus termos de busca ou crie uma nova encomenda agora mesmo.
              </p>
              <button
                onClick={onNavigateToNewOrder}
                className="mt-2 px-5 py-2 rounded-xl bg-[#ac2471] text-white text-xs font-semibold hover:bg-[#831843]"
              >
                + Criar Pedido
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-[#faf7f8] border-b border-pink-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Código / Cliente</th>
                    <th className="py-4 px-4">Tema & Tipo</th>
                    <th className="py-4 px-4">Origem</th>
                    <th className="py-4 px-4">Entrega</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Financeiro</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {filteredOrders.map((order) => {
                    const days = getDaysRemaining(order.deliveryDate);
                    const waMessage = generateWhatsAppOrderMessage(order);
                    const waLink = createWhatsAppLink(order.clientPhone, waMessage);

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-[#fff9fb] transition-colors group cursor-pointer"
                        onClick={() => onSelectOrder(order)}
                      >
                        {/* Código / Cliente */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {order.mockupImages.length > 0 ? (
                              <img
                                src={order.mockupImages[0]}
                                alt={order.theme}
                                className="w-10 h-10 rounded-xl object-cover border border-pink-200 flex-shrink-0"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=150&q=80';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#ac2471] font-bold flex items-center justify-center text-xs">
                                ✂️
                              </div>
                            )}
                            <div>
                              <span className="text-[10px] font-bold text-pink-600 block">
                                {order.code}
                              </span>
                              <span className="font-heading font-bold text-slate-900 text-sm block">
                                {order.clientName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {order.clientPhone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tema & Tipo */}
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-800 block">
                            {order.theme}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {order.orderType} • {order.items.length} itens
                          </span>
                        </td>

                        {/* Origem */}
                        <td className="py-4 px-4">
                          <span className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-pink-50 text-slate-700">
                            {order.origin}
                          </span>
                        </td>

                        {/* Entrega */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800 block">
                              {formatDate(order.deliveryDate)}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                days.days <= 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : days.days <= 2
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {days.text}
                            </span>
                          </div>
                        </td>

                        {/* Status (Interactive selector) */}
                        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                            className={`text-xs font-bold px-3 py-1 rounded-full border focus:outline-hidden cursor-pointer ${getStatusBadgeClass(
                              order.status
                            )}`}
                          >
                            {allStatuses.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Financeiro */}
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-heading font-bold text-slate-900 block">
                              {formatCurrency(order.financial.total)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {order.status === 'Finalizado' ? (
                                <span className="text-emerald-600 font-semibold">100% Pago</span>
                              ) : order.financial.remaining > 0 ? (
                                <span className="text-amber-600 font-semibold">
                                  Falta {formatCurrency(order.financial.remaining)}
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-semibold">100% Pago</span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Direct Send */}
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                              title="Enviar mensagem WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>

                            {/* Print Receipt / Production Sheet */}
                            <button
                              onClick={() => onPrintOrder(order)}
                              className="p-2 text-slate-500 hover:text-[#ac2471] hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
                              title="Imprimir Recibo e Ficha de Produção"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* View Details */}
                            <button
                              onClick={() => onSelectOrder(order)}
                              className="p-2 text-slate-500 hover:text-[#ac2471] hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
                              title="Ver Detalhes do Pedido"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (confirm(`Deseja realmente excluir o pedido ${order.code}?`)) {
                                  onDeleteOrder(order.id);
                                }
                              }}
                              className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: KANBAN BOARD ================= */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 items-start">
          {allStatuses.map((status) => {
            const columnOrders = filteredOrders.filter((o) => o.status === status);
            return (
              <div
                key={status}
                className="bg-white/80 rounded-3xl p-4 border border-pink-100/80 shadow-xs space-y-3 min-h-[400px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-pink-50">
                  <span className="font-heading font-bold text-xs text-slate-800">
                    {status}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-[#ac2471]">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Cards in Column */}
                <div className="space-y-3">
                  {columnOrders.map((order) => {
                    const days = getDaysRemaining(order.deliveryDate);
                    return (
                      <div
                        key={order.id}
                        onClick={() => onSelectOrder(order)}
                        className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-bold text-pink-600">
                            {order.code}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              days.days <= 0
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-pink-50 text-slate-600'
                            }`}
                          >
                            {days.text}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">
                            {order.clientName}
                          </h4>
                          <p className="text-[11px] text-pink-700 font-medium line-clamp-1">
                            Tema: {order.theme}
                          </p>
                        </div>

                        {order.mockupImages.length > 0 && (
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-pink-50">
                            <img
                              src={order.mockupImages[0]}
                              alt={order.theme}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <div className="pt-2 border-t border-pink-50 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">
                            {formatCurrency(order.financial.total)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {order.origin}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
