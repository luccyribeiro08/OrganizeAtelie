import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  History,
  LayoutGrid,
  List,
  Lock,
  MessageCircle,
  PackageCheck,
  Plus,
  Printer,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  X
} from 'lucide-react';
import { Order, OrderStatus, OrderOrigin, AtelieProfile } from '../types';
import {
  calculateMonthlyMetrics,
  createWhatsAppLink,
  formatCurrency,
  formatDate,
  formatMonthYear,
  generateWhatsAppOrderMessage,
  getAvailableMonths,
  getCurrentMonthKey,
  getDaysRemaining,
  getOrderMonthKey
} from '../utils/helpers';

interface PedidosViewProps {
  orders: Order[];
  profile?: AtelieProfile;
  onSelectOrder: (order: Order) => void;
  onPrintOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
  onNavigateToNewOrder: () => void;
  onNotifyReady?: (order: Order) => void;
  onNotifyCompleted?: (order: Order) => void;
}

export const PedidosView: React.FC<PedidosViewProps> = ({
  orders,
  profile,
  onSelectOrder,
  onPrintOrder,
  onUpdateStatus,
  onDeleteOrder,
  onNavigateToNewOrder,
  onNotifyReady,
  onNotifyCompleted
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [originFilter, setOriginFilter] = useState<string>('todos');
  
  // Month selector for finalized orders & monthly revenue
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKey());
  const [showMonthlyHistoryModal, setShowMonthlyHistoryModal] = useState<boolean>(false);

  // Status lists
  const allStatuses: OrderStatus[] = [
    'Rascunho',
    'Pendente',
    'Arte Aprovada',
    'Em Produção',
    'Pronto p/ Envio',
    'Finalizado'
  ];

  // Available months from all orders + current month
  const availableMonths = getAvailableMonths(orders);

  // Calculate monthly stats for the selected month
  const currentMonthMetrics = calculateMonthlyMetrics(orders, selectedMonth);
  const selectedMonthName = formatMonthYear(selectedMonth);

  // Filtered Orders for the views
  const filteredOrders = orders.filter((order) => {
    // Search query matching
    const matchSearch =
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderType.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    // Origin matching
    const matchOrigin = originFilter === 'todos' || order.origin === originFilter;
    if (!matchOrigin) return false;

    // Status matching
    const matchStatus = statusFilter === 'todos' || order.status === statusFilter;
    if (!matchStatus) return false;

    // Month scoping: if order is Finalizado, it respects selectedMonth
    if (order.status === 'Finalizado' && selectedMonth !== 'todos') {
      const orderMonth = getOrderMonthKey(order);
      if (orderMonth !== selectedMonth) return false;
    }

    return true;
  });

  // Active workload stats
  const activeOrders = orders.filter((o) => o.status !== 'Finalizado' && o.status !== 'Rascunho');
  const inProductionCount = orders.filter((o) => o.status === 'Em Produção').length;
  
  // Total pending payments for active orders
  const totalPendingPayment = orders
    .filter((o) => o.status !== 'Finalizado' && o.status !== 'Rascunho')
    .reduce((sum, o) => sum + (o.financial?.remaining || 0), 0);

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
        return 'bg-pink-100 text-[#ac2471] border-pink-200 font-bold';
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
            Acompanhe a produção, prazos de entrega, faturamento mensal e pedidos finalizados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month History Trigger Button */}
          <button
            onClick={() => setShowMonthlyHistoryModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-pink-200 text-[#ac2471] font-semibold text-xs sm:text-sm hover:bg-pink-50/80 shadow-xs transition-all cursor-pointer"
            title="Ver faturamento e pedidos de cada mês"
          >
            <BarChart3 className="w-4 h-4 text-[#ac2471]" />
            <span className="hidden sm:inline">Histórico de Faturamento</span>
            <span className="sm:hidden">Faturamento</span>
          </button>

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

          {/* New Order Button */}
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Pedidos Ativos */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-atelie space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pedidos Ativos
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-800">
              {activeOrders.length}
            </span>
            <span className="text-[11px] text-pink-600 font-semibold bg-pink-50 px-2 py-0.5 rounded-full">
              Em andamento
            </span>
          </div>
        </div>

        {/* Card 2: Em Confecção */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-atelie space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Em Confecção
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-purple-700">
              {inProductionCount}
            </span>
            <span className="text-[11px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
              Na produção
            </span>
          </div>
        </div>

        {/* Card 3: Finalizados no Mês (Required Feature) */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-atelie space-y-1 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Finalizados no Mês
            </span>
            <span className="text-[10px] font-bold text-[#ac2471] bg-pink-50 px-2 py-0.5 rounded-full truncate max-w-[100px]">
              {selectedMonth === 'todos' ? 'Geral' : selectedMonthName.split(' de ')[0]}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-heading font-extrabold text-emerald-700">
              {currentMonthMetrics.finalizedCount}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Concluídos
            </span>
          </div>
        </div>

        {/* Card 4: Faturamento do Mês (Required Feature - Resets Every Month) */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-200/80 shadow-atelie space-y-1 bg-gradient-to-br from-white via-pink-50/20 to-pink-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-pink-700/80 uppercase tracking-wider block truncate">
              Faturamento do Mês
            </span>
            <button
              onClick={() => setShowMonthlyHistoryModal(true)}
              className="text-[10px] font-bold text-[#ac2471] hover:underline cursor-pointer flex items-center gap-0.5"
              title="Consultar outros meses"
            >
              <span>Ver Meses</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-heading font-extrabold text-[#ac2471]">
              {formatCurrency(currentMonthMetrics.totalRevenue)}
            </span>
          </div>
        </div>

        {/* Card 5: A Receber (Saldos) */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-atelie space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
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

      {/* Filters Bar & Month Selector */}
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
          {/* Month Selector for Finalized Orders / Revenue Control */}
          <div className="flex items-center gap-1.5 bg-[#fdf2f6] border border-pink-200 rounded-2xl px-3 py-1.5 shadow-2xs">
            <CalendarRange className="w-3.5 h-3.5 text-[#ac2471]" />
            <span className="text-[11px] font-bold text-pink-700 uppercase">Mês:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#ac2471] focus:outline-hidden cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
              <option value="todos">Todos os Meses</option>
            </select>
          </div>

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
                Tente ajustar seus termos de busca, o filtro de mês ({selectedMonthName}) ou crie uma nova encomenda.
              </p>
              <button
                onClick={onNavigateToNewOrder}
                className="mt-2 px-5 py-2 rounded-xl bg-[#ac2471] text-white text-xs font-semibold hover:bg-[#831843] cursor-pointer"
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
                    const waMessage = generateWhatsAppOrderMessage(
                      order,
                      profile?.ownerName,
                      profile?.name,
                      profile?.pixKey
                    );
                    const waLink = createWhatsAppLink(order.clientPhone, waMessage);
                    const isFinalized = order.status === 'Finalizado';

                    return (
                      <tr
                        key={order.id}
                        className={`transition-colors group cursor-pointer ${
                          isFinalized ? 'bg-[#fefbfc] hover:bg-[#faeef2]' : 'hover:bg-[#fff9fb]'
                        }`}
                        onClick={() => onSelectOrder(order)}
                      >
                        {/* Código / Cliente */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {order.mockupImages && order.mockupImages.length > 0 ? (
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
                            {isFinalized ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block bg-emerald-50 text-emerald-700">
                                Entregue / Concluído
                              </span>
                            ) : (
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
                            )}
                          </div>
                        </td>

                        {/* Status (Interactive for active orders, Locked for Finalizado) */}
                        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                          {isFinalized ? (
                            <div
                              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border bg-pink-100 text-[#ac2471] border-pink-200 cursor-not-allowed select-none shadow-2xs"
                              title="Status Finalizado e Bloqueado contra alterações"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Finalizado</span>
                            </div>
                          ) : (
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
                          )}
                        </td>

                        {/* Financeiro */}
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-heading font-bold text-slate-900 block">
                              {formatCurrency(order.financial.total)}
                            </span>
                            <span className="text-[10px]">
                              {isFinalized ? (
                                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> 100% Pago
                                </span>
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
                            {/* If Pronto p/ Envio, show highlighted Avisar Pronto button */}
                            {order.status === 'Pronto p/ Envio' && onNotifyReady && (
                              <button
                                onClick={() => onNotifyReady(order)}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                title="Avisar no WhatsApp que a encomenda está pronta para retirada/envio!"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Avisar Pronto</span>
                              </button>
                            )}

                            {/* If Finalizado, show highlighted Agradecimento & Avaliacao button */}
                            {isFinalized && onNotifyCompleted && (
                              <button
                                onClick={() => onNotifyCompleted(order)}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-xl flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                title="Enviar mensagem de agradecimento, avaliação e Instagram no WhatsApp"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Agradecimento</span>
                              </button>
                            )}

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
            const isFinalizedColumn = status === 'Finalizado';
            
            // Orders for this column
            const columnOrders = filteredOrders.filter((o) => o.status === status);

            return (
              <div
                key={status}
                className={`rounded-3xl p-4 border shadow-xs space-y-3 min-h-[420px] transition-all ${
                  isFinalizedColumn
                    ? 'bg-gradient-to-b from-[#fdf8fa] to-[#fff5f8] border-pink-200/90'
                    : 'bg-white/80 border-pink-100/80'
                }`}
              >
                {/* Column Header */}
                <div className="pb-2 border-b border-pink-100/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      {isFinalizedColumn && <Lock className="w-3.5 h-3.5 text-[#ac2471]" />}
                      <span>{status}</span>
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isFinalizedColumn
                          ? 'bg-[#ac2471] text-white'
                          : 'bg-pink-50 text-[#ac2471]'
                      }`}
                    >
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* If Finalizado column, display month indicator and quick selector */}
                  {isFinalizedColumn && (
                    <div className="flex items-center justify-between text-[10px] text-pink-700/90 font-semibold pt-0.5">
                      <span className="truncate">
                        {selectedMonth === 'todos' ? 'Todos os meses' : selectedMonthName}
                      </span>
                      <button
                        onClick={() => setShowMonthlyHistoryModal(true)}
                        className="text-[10px] text-[#ac2471] hover:underline cursor-pointer"
                        title="Ver faturamento e pedidos de outros meses"
                      >
                        Trocar mês
                      </button>
                    </div>
                  )}
                </div>

                {/* Cards in Column */}
                <div className="space-y-3">
                  {columnOrders.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                      <p className="text-[11px]">Nenhum pedido</p>
                      {isFinalizedColumn && selectedMonth !== 'todos' && (
                        <p className="text-[10px] text-slate-400">em {selectedMonthName}</p>
                      )}
                    </div>
                  ) : (
                    columnOrders.map((order) => {
                      const days = getDaysRemaining(order.deliveryDate);
                      const isOrderFinalized = order.status === 'Finalizado';

                      return (
                        <div
                          key={order.id}
                          onClick={() => onSelectOrder(order)}
                          className={`p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 group ${
                            isOrderFinalized
                              ? 'bg-white border-pink-200/90 hover:border-pink-300'
                              : 'bg-white border-pink-100 hover:border-pink-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[10px] font-bold text-pink-600">
                              {order.code}
                            </span>
                            {isOrderFinalized ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#ac2471] flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Concluído
                              </span>
                            ) : (
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  days.days <= 0
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-pink-50 text-slate-600'
                                }`}
                              >
                                {days.text}
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">
                              {order.clientName}
                            </h4>
                            <p className="text-[11px] text-pink-700 font-medium line-clamp-1">
                              Tema: {order.theme}
                            </p>
                          </div>

                          {order.mockupImages && order.mockupImages.length > 0 && (
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

                          {order.status === 'Pronto p/ Envio' && onNotifyReady && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNotifyReady(order);
                              }}
                              className="w-full mt-2 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Avisar no WhatsApp</span>
                            </button>
                          )}

                          {isOrderFinalized && onNotifyCompleted && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNotifyCompleted(order);
                              }}
                              className="w-full mt-2 py-1.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Agradecer no WhatsApp</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: HISTÓRICO DE FATURAMENTO MENSAL ================= */}
      {showMonthlyHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-6 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-pink-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#ac2471] flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-heading font-extrabold text-slate-900">
                    Histórico de Faturamento Mensal
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  O faturamento é reiniciado todo mês e contabiliza automaticamente os pedidos finalizados de cada período.
                </p>
              </div>

              <button
                onClick={() => setShowMonthlyHistoryModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-pink-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Overview Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Geral de Todos os Meses */}
              <div className="bg-[#fdf9fa] p-4 rounded-2xl border border-pink-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Finalizado Geral
                </span>
                <span className="text-lg font-heading font-extrabold text-[#ac2471] block">
                  {formatCurrency(
                    orders
                      .filter((o) => o.status === 'Finalizado')
                      .reduce((sum, o) => sum + (o.financial?.total || 0), 0)
                  )}
                </span>
                <span className="text-[10px] text-slate-500">
                  {orders.filter((o) => o.status === 'Finalizado').length} pedidos no histórico
                </span>
              </div>

              {/* Mês Atual Selecionado */}
              <div className="bg-gradient-to-br from-pink-500 to-[#be185d] p-4 rounded-2xl text-white space-y-1 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-100 block">
                  Faturamento {selectedMonth === 'todos' ? 'Geral' : selectedMonthName.split(' de ')[0]}
                </span>
                <span className="text-lg font-heading font-extrabold block">
                  {formatCurrency(currentMonthMetrics.totalRevenue)}
                </span>
                <span className="text-[10px] text-pink-100">
                  {currentMonthMetrics.finalizedCount} pedidos finalizados
                </span>
              </div>

              {/* Média por Pedido */}
              <div className="bg-[#fdf9fa] p-4 rounded-2xl border border-pink-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ticket Médio {selectedMonth === 'todos' ? 'Geral' : selectedMonthName.split(' de ')[0]}
                </span>
                <span className="text-lg font-heading font-extrabold text-slate-800 block">
                  {formatCurrency(currentMonthMetrics.averageTicket)}
                </span>
                <span className="text-[10px] text-slate-500">Média por encomenda</span>
              </div>
            </div>

            {/* Months Breakdown Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Meses do Ateliê</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Clique em um mês para filtrar a visualização
                </span>
              </h4>

              <div className="rounded-2xl border border-pink-100 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf7f8] text-[10px] font-bold text-slate-400 uppercase border-b border-pink-100">
                    <tr>
                      <th className="py-3 px-4">Mês / Ano</th>
                      <th className="py-3 px-3 text-center">Pedidos Finalizados</th>
                      <th className="py-3 px-4 text-right">Faturamento</th>
                      <th className="py-3 px-4 text-right">Ticket Médio</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50 text-slate-600">
                    {availableMonths.map((m) => {
                      const metrics = calculateMonthlyMetrics(orders, m.key);
                      const isSelected = selectedMonth === m.key;

                      return (
                        <tr
                          key={m.key}
                          className={`transition-colors ${
                            isSelected ? 'bg-pink-50/70 font-semibold' : 'hover:bg-[#fdf8fa]'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{m.label}</span>
                              {m.isCurrent && (
                                <span className="text-[9px] bg-pink-100 text-[#ac2471] px-2 py-0.5 rounded-full font-bold">
                                  Atual
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                              {metrics.finalizedCount}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-[#ac2471]">
                            {formatCurrency(metrics.totalRevenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">
                            {formatCurrency(metrics.averageTicket)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedMonth(m.key);
                                setShowMonthlyHistoryModal(false);
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#ac2471] text-white'
                                  : 'bg-pink-100/70 text-[#ac2471] hover:bg-pink-200/70'
                              }`}
                            >
                              {isSelected ? 'Selecionado' : 'Visualizar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-pink-100">
              <button
                onClick={() => {
                  setSelectedMonth('todos');
                  setShowMonthlyHistoryModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Ver Todos os Meses
              </button>

              <button
                onClick={() => setShowMonthlyHistoryModal(false)}
                className="px-5 py-2 rounded-xl bg-[#ac2471] text-white text-xs font-semibold hover:bg-[#831843] transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
