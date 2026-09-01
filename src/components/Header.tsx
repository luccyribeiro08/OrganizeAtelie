import React, { useState } from 'react';
import { Bell, Check, ChevronDown, LogOut, Menu, Settings, Sparkles, User, X } from 'lucide-react';
import { AtelieProfile, Order } from '../types';
import { formatDate, getDaysRemaining } from '../utils/helpers';

interface HeaderProps {
  profile: AtelieProfile;
  orders: Order[];
  onOpenMobileMenu: () => void;
  onSelectOrder?: (order: Order) => void;
  onLogout?: () => void;
  onNavigateSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  orders,
  onOpenMobileMenu,
  onSelectOrder,
  onLogout,
  onNavigateSettings
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Urgent deliveries (due today, tomorrow, or in next 3 days)
  const urgentDeliveries = orders.filter((o) => {
    if (o.status === 'Finalizado' || o.status === 'Rascunho') return false;
    const remaining = getDaysRemaining(o.deliveryDate);
    return remaining.days <= 3;
  });

  return (
    <header className="sticky top-0 z-30 bg-[#ffffff]/95 backdrop-blur-md border-b border-pink-100/70 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left: Website Brand & User Atelier Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-pink-50 hover:text-[#ac2471]"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-heading font-extrabold text-slate-800 tracking-tight text-base sm:text-lg leading-tight">
              Organize
            </span>
            <span className="font-heading font-extrabold text-[#ac2471] tracking-tight text-base sm:text-lg leading-tight">
              Ateliê
            </span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-pink-700/90 leading-none truncate max-w-[180px] sm:max-w-xs">
            {profile.name || 'Meu Ateliê'}
          </span>
        </div>
      </div>

      {/* Right: Notifications & Responsible Person Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            className="relative p-2.5 rounded-2xl text-slate-600 hover:text-[#ac2471] hover:bg-pink-50 transition-colors cursor-pointer"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {urgentDeliveries.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ac2471] rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Modal Popup */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-atelie-lg border border-pink-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-pink-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#ac2471]" />
                  <h3 className="font-heading font-semibold text-slate-800 text-sm">
                    Lembretes & Prazos
                  </h3>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                {urgentDeliveries.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                    Tudo em dia! Nenhuma entrega urgente para os próximos 3 dias.
                  </div>
                ) : (
                  urgentDeliveries.map((order) => {
                    const daysInfo = getDaysRemaining(order.deliveryDate);
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setShowNotifications(false);
                          if (onSelectOrder) onSelectOrder(order);
                        }}
                        className="p-3 rounded-xl bg-[#fdf8f9] hover:bg-[#faebf0] border border-pink-100/80 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-800 text-xs">
                              {order.clientName} ({order.code})
                            </p>
                            <p className="text-[11px] text-pink-700 font-medium">
                              Tema: {order.theme}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              daysInfo.days <= 0
                                ? 'bg-rose-500 text-white'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {daysInfo.text}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Entrega: {formatDate(order.deliveryDate)}</span>
                          <span className="text-[#ac2471] font-semibold">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2 border-t border-pink-50 text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  Organize Ateliê sempre pontual
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Responsible Person Profile on the top-right */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl hover:bg-pink-50/80 transition-colors border border-pink-100/70 sm:border-pink-100 cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {profile.ownerName || 'Responsável'}
              </p>
              <p className="text-[11px] font-medium text-[#ac2471] leading-tight">
                {profile.role || 'Artesã Responsável'}
              </p>
            </div>
            <div className="relative flex-shrink-0">
              <img
                src={profile.avatarUrl || profile.logoUrl}
                alt={profile.ownerName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-cover ring-2 ring-pink-200/80 shadow-xs bg-pink-50"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                }}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-atelie-lg border border-pink-100 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-pink-50">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {profile.ownerName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {profile.name}
                </p>
              </div>

              <div className="py-1 space-y-0.5">
                {onNavigateSettings && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onNavigateSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#ac2471] hover:bg-pink-50 rounded-xl transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-pink-600" />
                    <span>Meu Perfil & Ateliê</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sair da Conta</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
