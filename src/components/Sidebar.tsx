import React from 'react';
import {
  CalendarDays,
  Calculator,
  Crown,
  FolderHeart,
  LogOut,
  PlusCircle,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  X
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { ActiveTab } from '../types';
export type { ActiveTab };

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  ordersCount: number;
  urgentCount: number;
  clientsCount?: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  logoUrl?: string;
  atelierName?: string;
  onLogout?: () => void;
  isAdmin?: boolean;
  onOpenPlans?: () => void;
  statusBadgeText?: string;
  statusBadgeClass?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  ordersCount,
  urgentCount,
  clientsCount,
  isOpenMobile,
  setIsOpenMobile,
  logoUrl,
  atelierName,
  onLogout,
  isAdmin = false,
  onOpenPlans,
  statusBadgeText,
  statusBadgeClass,
}) => {
  const menuItems = [
    {
      id: 'pedidos' as ActiveTab,
      label: 'Pedidos',
      icon: ShoppingBag,
      badge: ordersCount > 0 ? ordersCount : undefined,
    },
    {
      id: 'criar-pedido' as ActiveTab,
      label: 'Criar Pedido',
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: 'clientes' as ActiveTab,
      label: 'Clientes',
      icon: Users,
      badge: clientsCount && clientsCount > 0 ? clientsCount : undefined,
    },
    {
      id: 'catalogo' as ActiveTab,
      label: 'Catálogo',
      icon: FolderHeart,
    },
    {
      id: 'orcamento' as ActiveTab,
      label: 'Orçamento',
      icon: Calculator,
    },
    {
      id: 'agenda' as ActiveTab,
      label: 'Agenda',
      icon: CalendarDays,
      badge: urgentCount > 0 ? `${urgentCount} hoje` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
  ];

  if (isAdmin) {
    menuItems.push({
      id: 'admin-usuarios' as ActiveTab,
      label: 'Painel Admin',
      icon: Crown,
      badge: 'Master',
      badgeColor: 'bg-purple-700 text-white',
    });
  }

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#ffffff] border-r border-[#ffd1dc]/40 flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="flex items-center justify-between pb-8">
            <BrandLogo size="md" customLogoUrl={logoUrl} atelierName={atelierName} />
            <button
              onClick={() => setIsOpenMobile(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-pink-50"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#ffd1dc]/60 text-[#ac2471] font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-pink-50/70 hover:text-[#ac2471]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-[#ac2471]' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        item.badgeColor || (isActive ? 'bg-[#ac2471] text-white' : 'bg-pink-100 text-pink-700')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings, Logout & Quick Craft Tip */}
        <div className="pt-6 border-t border-pink-100/60 space-y-2">
          <button
            id="nav-configuracoes"
            onClick={() => handleNavClick('configuracoes')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
              activeTab === 'configuracoes'
                ? 'bg-[#ffd1dc]/60 text-[#ac2471] font-semibold'
                : 'text-slate-600 hover:bg-pink-50 hover:text-[#ac2471]'
            }`}
          >
            <Settings
              className={`w-4 h-4 ${
                activeTab === 'configuracoes' ? 'text-[#ac2471]' : 'text-slate-400'
              }`}
            />
            <span>Configurações</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sair da Conta</span>
            </button>
          )}

          {onOpenPlans && (
            <button
              onClick={onOpenPlans}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold text-[#ac2471] bg-pink-50 hover:bg-pink-100/80 border border-pink-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#ac2471]" />
                <span>Planos & Assinatura</span>
              </div>
              {statusBadgeText && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBadgeClass || 'bg-white text-[#ac2471]'}`}>
                  {statusBadgeText}
                </span>
              )}
            </button>
          )}

          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#fff5f8] to-[#ffeef3] border border-pink-100 text-xs text-pink-900/80 mt-2">
            <div className="flex items-center gap-1.5 font-semibold text-[#ac2471] mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Papelaria Afetiva</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Transformando memórias em papelaria de luxo.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
