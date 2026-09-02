import { AtelieProfile } from '../types';

export interface SubscriptionInfo {
  isAdmin: boolean;
  isTrial: boolean;
  isTrialExpired: boolean;
  isActivePaid: boolean;
  isPaidExpired: boolean;
  canPerformAction: boolean;
  daysRemaining: number;
  trialDaysLeft: number;
  statusBadgeText: string;
  statusBadgeClass: string;
  planLabel: string;
  expiresFormatted: string;
}

export function getSubscriptionInfo(profile: AtelieProfile | null): SubscriptionInfo {
  if (!profile) {
    return {
      isAdmin: false,
      isTrial: true,
      isTrialExpired: false,
      isActivePaid: false,
      isPaidExpired: false,
      canPerformAction: true,
      daysRemaining: 7,
      trialDaysLeft: 7,
      statusBadgeText: 'Teste Grátis',
      statusBadgeClass: 'bg-pink-100 text-pink-700 border-pink-200',
      planLabel: 'Teste Grátis (7 dias)',
      expiresFormatted: '',
    };
  }

  // 1. Admin Check (Exclusivo para luccyribeiro08@gmail.com)
  const isTargetAdminEmail = Boolean(
    profile.email && profile.email.trim().toLowerCase() === 'luccyribeiro08@gmail.com'
  );
  const isAdmin = isTargetAdminEmail || Boolean(profile.isAdmin && isTargetAdminEmail);

  if (isAdmin) {
    return {
      isAdmin: true,
      isTrial: false,
      isTrialExpired: false,
      isActivePaid: true,
      isPaidExpired: false,
      canPerformAction: true,
      daysRemaining: 9999,
      trialDaysLeft: 9999,
      statusBadgeText: '👑 Administrador',
      statusBadgeClass: 'bg-purple-100 text-purple-800 border-purple-200 font-bold',
      planLabel: 'Acesso Vitalício Master',
      expiresFormatted: 'Ilimitado',
    };
  }

  const now = new Date();

  // 2. Active Paid Subscription Check
  const isPaidPlan =
    profile.subscriptionStatus === 'active' ||
    profile.subscriptionPlan === 'mensal' ||
    profile.subscriptionPlan === 'trimestral' ||
    profile.subscriptionPlan === 'anual' ||
    profile.subscriptionPlan === 'vitalicio';

  if (isPaidPlan) {
    if (profile.subscriptionPlan === 'vitalicio') {
      return {
        isAdmin: false,
        isTrial: false,
        isTrialExpired: false,
        isActivePaid: true,
        isPaidExpired: false,
        canPerformAction: true,
        daysRemaining: 9999,
        trialDaysLeft: 0,
        statusBadgeText: '⭐ Plano Vitalício',
        statusBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold',
        planLabel: 'Plano Vitalício',
        expiresFormatted: 'Vitalício',
      };
    }

    if (profile.subscriptionExpiresAt) {
      const expiresAt = new Date(profile.subscriptionExpiresAt);
      const diffMs = expiresAt.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysLeft > 0) {
        const planName =
          profile.subscriptionPlan === 'anual'
            ? 'Plano Anual'
            : profile.subscriptionPlan === 'trimestral'
            ? 'Plano Trimestral'
            : 'Plano Mensal';

        return {
          isAdmin: false,
          isTrial: false,
          isTrialExpired: false,
          isActivePaid: true,
          isPaidExpired: false,
          canPerformAction: true,
          daysRemaining: daysLeft,
          trialDaysLeft: 0,
          statusBadgeText: `💎 ${planName}`,
          statusBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold',
          planLabel: `${planName} (${daysLeft}d restantes)`,
          expiresFormatted: expiresAt.toLocaleDateString('pt-BR'),
        };
      } else {
        return {
          isAdmin: false,
          isTrial: false,
          isTrialExpired: true,
          isActivePaid: false,
          isPaidExpired: true,
          canPerformAction: false,
          daysRemaining: 0,
          trialDaysLeft: 0,
          statusBadgeText: '⚠️ Assinatura Vencida',
          statusBadgeClass: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
          planLabel: 'Assinatura Expirada',
          expiresFormatted: expiresAt.toLocaleDateString('pt-BR'),
        };
      }
    }
  }

  // 3. Free Trial Check (7 Days)
  const trialEndStr = profile.trialEndsAt;
  let trialEndsAt = trialEndStr ? new Date(trialEndStr) : null;

  if (!trialEndsAt) {
    const created = profile.createdAt ? new Date(profile.createdAt) : now;
    trialEndsAt = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  const trialDiffMs = trialEndsAt.getTime() - now.getTime();
  const trialDaysLeft = Math.ceil(trialDiffMs / (1000 * 60 * 60 * 24));

  if (trialDaysLeft > 0) {
    return {
      isAdmin: false,
      isTrial: true,
      isTrialExpired: false,
      isActivePaid: false,
      isPaidExpired: false,
      canPerformAction: true,
      daysRemaining: trialDaysLeft,
      trialDaysLeft: trialDaysLeft,
      statusBadgeText: `🎁 Teste: ${trialDaysLeft}d restantes`,
      statusBadgeClass:
        trialDaysLeft <= 2
          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse'
          : 'bg-pink-100 text-[#ac2471] border-pink-200 font-bold',
      planLabel: `Teste Grátis (${trialDaysLeft} dias restantes)`,
      expiresFormatted: trialEndsAt.toLocaleDateString('pt-BR'),
    };
  }

  // 4. Trial Expired
  return {
    isAdmin: false,
    isTrial: true,
    isTrialExpired: true,
    isActivePaid: false,
    isPaidExpired: false,
    canPerformAction: false,
    daysRemaining: 0,
    trialDaysLeft: 0,
    statusBadgeText: '🔒 Teste Expirado',
    statusBadgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    planLabel: 'Período de Teste Encerrado',
    expiresFormatted: trialEndsAt ? trialEndsAt.toLocaleDateString('pt-BR') : '',
  };
}
