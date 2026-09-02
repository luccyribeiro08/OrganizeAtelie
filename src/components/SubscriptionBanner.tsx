import React from 'react';
import { Crown, Gift, Sparkles, Zap } from 'lucide-react';
import { AtelieProfile } from '../types';
import { getSubscriptionInfo } from '../utils/subscriptionUtils';

interface SubscriptionBannerProps {
  profile: AtelieProfile | null;
  onOpenPlans: () => void;
  onOpenAdmin?: () => void;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({
  profile,
  onOpenPlans,
  onOpenAdmin,
}) => {
  const subInfo = getSubscriptionInfo(profile);

  // Admin Banner
  if (subInfo.isAdmin) {
    return (
      <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-[#ac2471] text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-300" />
          <span className="font-bold">Painel de Administrador Master</span>
          <span className="hidden sm:inline text-purple-200">• Acesso Vitalício Ilimitado</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold backdrop-blur-xs transition-colors cursor-pointer"
            >
              Gerenciar Usuárias & Planos
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active Paid Plan Banner
  if (subInfo.isActivePaid) {
    return null; // Keep layout clean for fully subscribed paying users
  }

  // Trial Expired Banner
  if (subInfo.isTrialExpired || subInfo.isPaidExpired) {
    return (
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-pink-700 text-white px-4 py-2.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm animate-in fade-in select-none">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Zap className="w-4 h-4 text-amber-300 animate-pulse flex-shrink-0" />
          <span>
            <strong className="font-bold">Seu período de teste de 7 dias terminou.</strong> As funções de criação e salvamento estão bloqueadas no modo demonstração.
          </span>
        </div>

        <button
          onClick={onOpenPlans}
          className="px-4 py-1.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-extrabold shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          Desbloquear Acesso Agora 💎
        </button>
      </div>
    );
  }

  // Active Free Trial Banner (Remaining days)
  return (
    <div className="bg-gradient-to-r from-pink-500 via-[#ac2471] to-purple-700 text-white px-4 py-2 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs select-none">
      <div className="flex items-center gap-2 text-center sm:text-left">
        <Gift className="w-4 h-4 text-pink-200 flex-shrink-0" />
        <span>
          🎁 <strong className="font-bold">Teste Grátis do Organize Ateliê:</strong> Você tem{' '}
          <strong className="underline underline-offset-2">
            {subInfo.trialDaysLeft} {subInfo.trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}
          </strong>{' '}
          para testar todas as ferramentas liberadas.
        </span>
      </div>

      <button
        onClick={onOpenPlans}
        className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-extrabold backdrop-blur-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
      >
        Ver Planos & Preços ✨
      </button>
    </div>
  );
};
