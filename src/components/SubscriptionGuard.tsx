import React, { useEffect, useState } from 'react';
import { Sparkles, Lock, Loader2, ArrowRight } from 'lucide-react';
import { AtelieProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { getSubscriptionInfo } from '../utils/subscriptionUtils';

interface SubscriptionGuardProps {
  profile: AtelieProfile | null;
  userId?: string;
  isLoading?: boolean;
  onNavigateToSubscription?: () => void;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  profile,
  userId,
  isLoading: initialLoading = false,
  onNavigateToSubscription,
  children,
  fallback,
}) => {
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [currentProfile, setCurrentProfile] = useState<AtelieProfile | null>(profile);

  // Sincroniza estado inicial do perfil
  useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  // Busca dados atualizados do Supabase caso necessário
  useEffect(() => {
    let isMounted = true;
    const fetchFreshProfile = async () => {
      const targetId = userId || profile?.id;
      if (!targetId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .maybeSingle();

        if (isMounted && data && !error) {
          setCurrentProfile((prev) => ({
            ...prev,
            id: data.id,
            name: data.name || prev?.name || '',
            ownerName: data.owner_name || prev?.ownerName || '',
            email: data.email || prev?.email || '',
            isAdmin: Boolean(data.is_admin),
            subscriptionStatus: data.subscription_status || 'trial',
            subscriptionPlan: data.subscription_plan || 'free_trial',
            subscriptionExpiresAt: data.subscription_expires_at,
            trialEndsAt: data.trial_ends_at,
            createdAt: data.created_at || prev?.createdAt,
            phone: data.phone || prev?.phone || '',
            pixKey: data.pix_key || prev?.pixKey || '',
            instagram: data.instagram || prev?.instagram || '',
            address: data.address || prev?.address || '',
            logoUrl: data.logo_url || prev?.logoUrl || '',
            avatarUrl: data.avatar_url || prev?.avatarUrl || '',
            role: data.role || prev?.role || 'Artesã Responsável',
            slogan: data.slogan || prev?.slogan || '',
          }));

          // Verificação automática silenciosa em segundo plano no Mercado Pago
          if (data.subscription_status === 'trial' && !data.is_admin && targetId) {
            fetch(`/api/subscription/verify-payment?_t=${Date.now()}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: targetId, email: data.email }),
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((verifyData) => {
                if (verifyData && verifyData.verified && isMounted) {
                  setCurrentProfile((prev) => ({
                    ...prev,
                    subscriptionStatus: 'active',
                    subscriptionPlan: verifyData.plan || 'trimestral',
                    subscriptionExpiresAt: verifyData.expiresAt,
                  }));
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error('SubscriptionGuard: Erro ao verificar assinatura:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (userId || profile?.id) {
      fetchFreshProfile();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [userId, profile?.id]);

  // 1. Estado de Carregamento (Loading Spinner / Skeleton com design temático de ateliê)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in duration-300">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-pink-100 border-t-[#ac2471] animate-spin flex items-center justify-center"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#ac2471] animate-pulse" />
          </div>
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Verificando Acesso do Ateliê...
        </h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Carregando status de assinatura e permissões na nuvem.
        </p>
      </div>
    );
  }

  // 2. Validação unificada via getSubscriptionInfo (Fonte Única de Verdade)
  const subInfo = getSubscriptionInfo(currentProfile);

  if (subInfo.canPerformAction) {
    return <>{children}</>;
  }

  // 3. Se não puder realizar ações: Exibe Fallback ou Card de Acesso Restrito
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto my-8">
      <div className="bg-gradient-to-br from-white via-[#fff5f8] to-[#fce7f3] border-2 border-pink-200 rounded-3xl p-6 sm:p-10 text-center shadow-lg relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-pink-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#ffd1dc]/50 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-[#ac2471] to-pink-500 text-white flex items-center justify-center shadow-md">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 mb-3">
            <span>🔒</span> Período de Teste Encerrado
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">
            Acesso Restrito ao Ateliê
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-lg mx-auto">
            Seus <strong>7 dias de teste gratuito</strong> chegaram ao fim. Para continuar cadastrando pedidos, gerando orçamentos em PDF e usando todos os recursos, ative seu plano mensal.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                if (onNavigateToSubscription) {
                  onNavigateToSubscription();
                } else {
                  window.location.hash = '#/assinatura';
                }
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ac2471] to-pink-600 text-white font-bold text-sm shadow-md hover:shadow-lg hover:from-pink-800 hover:to-pink-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ver Planos & Assinar</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={async () => {
                const targetId = userId || currentProfile?.id;
                if (!targetId) return;
                setLoading(true);
                try {
                  const res = await fetch(`/api/subscription/verify-payment?_t=${Date.now()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
                    body: JSON.stringify({
                      userId: targetId,
                      email: currentProfile?.email,
                    }),
                  }).catch(() => null);

                  if (res && res.ok) {
                    const data = await res.json();
                    if (data.verified) {
                      window.location.reload();
                      return;
                    } else {
                      alert(data.message || 'Nenhum pagamento aprovado foi localizado no Mercado Pago para esta conta ainda.');
                    }
                  } else {
                    alert('Nenhum pagamento aprovado foi localizado ainda. Por favor, conclua o pagamento.');
                  }
                } catch (e) {
                  console.error(e);
                  alert('Erro ao consultar gateway de pagamento.');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm shadow-md hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Já Paguei! Verificar Pagamento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
