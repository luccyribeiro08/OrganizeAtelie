import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Gift,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';
import { formatCurrency, formatDate, getDaysRemaining } from '../utils/helpers';

interface AgendaViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ orders, onSelectOrder }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Helper to get days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Build grid calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // Get orders for a specific day string 'YYYY-MM-DD'
  const getOrdersForDay = (day: number) => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formatted = `${currentYear}-${monthStr}-${dayStr}`;
    return orders.filter((o) => o.deliveryDate === formatted);
  };

  // Urgent Orders List
  const urgentOrders = orders
    .filter((o) => o.status !== 'Finalizado')
    .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Agenda de Entregas & Prazos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Planejamento visual das encomendas com prazos para o ateliê nunca atrasar.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-pink-100 shadow-xs">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-slate-600 hover:bg-pink-50 hover:text-[#ac2471] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-heading font-bold text-slate-800 px-3 min-w-32 text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-slate-600 hover:bg-pink-50 hover:text-[#ac2471] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-atelie border border-pink-100/70 space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-pink-50">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-24 sm:h-28 rounded-2xl bg-pink-50/20" />;
              }

              const dayOrders = getOrdersForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth &&
                new Date().getFullYear() === currentYear;

              return (
                <div
                  key={`day-${day}`}
                  className={`h-24 sm:h-28 rounded-2xl p-2 border flex flex-col justify-between transition-all ${
                    isToday
                      ? 'border-[#ac2471] bg-pink-50/50 shadow-xs'
                      : dayOrders.length > 0
                      ? 'border-pink-200/80 bg-white hover:border-pink-300'
                      : 'border-[#f3ebef] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-[#ac2471] text-white' : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayOrders.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pink-100 text-[#ac2471]">
                        {dayOrders.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-16 scrollbar-none">
                    {dayOrders.map((ord) => (
                      <button
                        key={ord.id}
                        onClick={() => onSelectOrder(ord)}
                        className="w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#ffd1dc]/70 hover:bg-[#ffd1dc] text-[#ac2471] truncate block transition-colors cursor-pointer"
                        title={`${ord.clientName} - ${ord.theme}`}
                      >
                        {ord.clientName.split(' ')[0]}: {ord.theme}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Upcoming Timeline & Deliveries */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-atelie border border-pink-100/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-pink-100/70 flex items-center justify-center text-[#ac2471]">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-heading font-bold text-slate-800 tracking-tight">
                Próximas Entregas
              </h2>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {urgentOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-pink-300" />
                  Nenhuma entrega pendente na agenda!
                </div>
              ) : (
                urgentOrders.map((order) => {
                  const days = getDaysRemaining(order.deliveryDate);
                  return (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="p-4 rounded-2xl bg-[#fdf9fa] hover:bg-[#fbf0f4] border border-pink-100/80 cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-pink-600 block">
                            {order.code} • {order.origin}
                          </span>
                          <h4 className="font-heading font-bold text-xs text-slate-900 group-hover:text-[#ac2471] transition-colors">
                            {order.clientName}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            days.days <= 0
                              ? 'bg-rose-500 text-white'
                              : days.days <= 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-pink-100 text-[#ac2471]'
                          }`}
                        >
                          {days.text}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-pink-50">
                        <span>Tema: {order.theme}</span>
                        <span className="font-bold text-slate-800">
                          {formatDate(order.deliveryDate)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
