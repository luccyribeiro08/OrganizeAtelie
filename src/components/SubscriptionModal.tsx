import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Crown,
  ExternalLink,
  Gift,
  HelpCircle,
  Loader2,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { AtelieProfile, MercadoPagoLinks } from '../types';
import { getSubscriptionInfo } from '../utils/subscriptionUtils';
import { createWhatsAppLink, formatCurrency, triggerConfetti } from '../utils/helpers';
import { supabaseService } from '../services/supabaseService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AtelieProfile | null;
  adminContactPhone?: string;
  adminPixKey?: string;
  onProfileUpdated?: (updated: AtelieProfile) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  profile,
  adminContactPhone = '21973389309',
  adminPixKey,
  onProfileUpdated,
}) => {
  if (!isOpen) return null;

  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'trimestral' | 'anual'>('trimestral');
  const [showPixDetails, setShowPixDetails] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [globalLinks, setGlobalLinks] = useState<MercadoPagoLinks | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  // Carrega os links do Mercado Pago configurados pela Administradora Master
  useEffect(() => {
    if (!isOpen) return;
    const fetchGlobalLinks = async () => {
      const links = await supabaseService.getGlobalAdminMercadoPagoLinks();
      if (links) {
        setGlobalLinks(links);
      }
    };
    fetchGlobalLinks();
  }, [isOpen]);

  // Polling automático para detectar ativação em segundo plano (Webhook do Mercado Pago)
  useEffect(() => {
    if (!isOpen || !profile?.id) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await supabaseService.getProfile(profile.id);
        if (fresh && (fresh.subscriptionStatus === 'active' || fresh.subscriptionStatus === 'admin')) {
          if (onProfileUpdated) onProfileUpdated(fresh);
          triggerConfetti();
          setActivationSuccess(true);
          setTimeout(() => onClose(), 1500);
        }
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, profile?.id]);

  const subInfo = getSubscriptionInfo(profile);

  // Render dedicated Master Vitalício Modal for Admin (no pricing/sale options)
  if (subInfo.isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-purple-100 space-y-6 animate-in fade-in zoom-in-95 my-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-pink-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Crown Icon */}
          <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-800 to-[#ac2471] flex items-center justify-center text-white shadow-lg shadow-purple-200">
            <Crown className="w-8 h-8 text-amber-300" />
          </div>

          {/* Title & Badge */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Administradora Master
            </span>
            <h2 className="text-2xl font-heading font-extrabold text-slate-900">
              Acesso Vitalício Ativado
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Sua conta possui <strong>Acesso Vitalício Permanente</strong> ao Organize Ateliê. Você tem liberação ilimitada de todos os recursos sem mensalidades ou prazos de expiração.
            </p>
          </div>

          {/* Feature List */}
          <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 text-left space-y-2.5 text-xs text-purple-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>Pedidos, Clientes & Catálogo:</strong> Criação Ilimitada</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>Painel Admin:</strong> Gerenciamento total de clientes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>Vendas & Mercado Pago:</strong> Links globais ativos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>Validade:</strong> Vitalício (Nunca expira)</span>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-800 to-[#ac2471] hover:from-purple-900 hover:to-pink-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Entendido, Continuar no Ateliê ✨
          </button>
        </div>
      </div>
    );
  }

  // Mercado Pago links from global admin config, profile, or fallback defaults
  const mpLinks = globalLinks || profile?.mercadoPagoLinks || {};
  const currentPixKey = mpLinks.pixKey || adminPixKey || profile?.pixKey || '21973389309';
  const supportPhone = mpLinks.whatsappAdmin || adminContactPhone || '21973389309';

  const plans = [
    {
      id: 'mensal' as const,
      name: 'Plano Mensal',
      price: 14.99,
      period: 'mês',
      equivalent: 'R$ 14,99 / mês',
      tag: 'Ideal para começar',
      tagClass: 'bg-slate-100 text-slate-700',
      badge: null,
      mpLink: mpLinks.mensal || '',
      features: [
        'Acesso total e ilimitado ao sistema',
        'Gestão de pedidos e kanban de produção',
        'Cadastro ilimitado de clientes e histórico',
        'Catálogo de produtos e categorias',
        'Calculadora automática de orçamentos',
        'Recibos em PDF e WhatsApp direto',
        'Backup automático na nuvem',
      ],
    },
    {
      id: 'trimestral' as const,
      name: 'Plano Trimestral',
      price: 34.99,
      period: '3 meses',
      equivalent: 'Apenas R$ 11,66 / mês',
      tag: 'Mais Escolhido • Economize 22%',
      tagClass: 'bg-pink-100 text-[#ac2471] font-bold border border-pink-200',
      badge: '🔥 MAIS POPULAR',
      mpLink: mpLinks.trimestral || '',
      popular: true,
      features: [
        'Tudo do Plano Mensal incluído',
        'Economia garantida de 22%',
        '3 meses de tranquilidade total',
        'Acesso prioritário a novas ferramentas',
        'Suporte dedicado no WhatsApp',
      ],
    },
    {
      id: 'anual' as const,
      name: 'Plano Anual',
      price: 129.99,
      period: 'ano',
      equivalent: 'Apenas R$ 10,83 / mês',
      tag: 'Super Economia • Economize 28%',
      tagClass: 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200',
      badge: '⭐ MELHOR CUSTO-BENEFÍCIO',
      mpLink: mpLinks.anual || '',
      bestValue: true,
      features: [
        'Tudo do Plano Trimestral incluído',
        'Economia de mais de R$ 50 no ano',
        '1 ano completo de acesso ininterrupto',
        'Selo de Ateliê Premium verificado',
        'Suporte VIP via WhatsApp',
      ],
    },
  ];

  const currentPlan = plans.find((p) => p.id === selectedPlan) || plans[1];

  const handleCopyPix = () => {
    if (!currentPixKey) return;
    navigator.clipboard.writeText(currentPixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handlePay = (plan: typeof plans[0]) => {
    const rawLink = plan.mpLink?.trim() || '';
    if (rawLink) {
      const targetUrl = rawLink.startsWith('http://') || rawLink.startsWith('https://')
        ? rawLink
        : `https://${rawLink}`;
      window.open(targetUrl, '_blank');
    } else {
      // Se ainda não houver link do Mercado Pago configurado, abre a opção de PIX / WhatsApp
      setShowPixDetails(true);
    }
  };

  const [verificationMessage, setVerificationMessage] = useState<{ type: 'error' | 'info' | 'success'; text: string } | null>(null);
  const [paymentIdInput, setPaymentIdInput] = useState('');
  const [showIdInput, setShowIdInput] = useState(false);

  const handleConfirmPayment = async (customPaymentId?: string) => {
    if (!profile?.id) return;
    setIsActivating(true);
    setVerificationMessage(null);

    try {
      const pid = customPaymentId || (paymentIdInput ? paymentIdInput.trim() : undefined);

      // 1. Chama a API de verificação real de pagamento no Mercado Pago e Supabase
      const res = await fetch(`/api/subscription/verify-payment?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({
          userId: profile.id,
          email: profile.email,
          plan: selectedPlan,
          paymentId: pid,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.verified) {
          const freshPlan = data.plan || selectedPlan;
          const updatedProfile: AtelieProfile = {
            ...profile,
            subscriptionStatus: 'active',
            subscriptionPlan: freshPlan,
            subscriptionExpiresAt: data.expiresAt || profile.subscriptionExpiresAt,
          };

          if (onProfileUpdated) {
            onProfileUpdated(updatedProfile);
          }

          try {
            localStorage.setItem(`atelie_profile_${profile.id}`, JSON.stringify(updatedProfile));
            const currentStored = localStorage.getItem('atelie_current_user_v3');
            if (currentStored) {
              const parsed = JSON.parse(currentStored);
              localStorage.setItem(
                'atelie_current_user_v3',
                JSON.stringify({
                  ...parsed,
                  subscriptionStatus: 'active',
                  subscriptionPlan: freshPlan,
                  subscriptionExpiresAt: data.expiresAt || profile.subscriptionExpiresAt,
                })
              );
            }
          } catch {}

          triggerConfetti();
          setActivationSuccess(true);
          setVerificationMessage({
            type: 'success',
            text: '🎉 Pagamento aprovado no Mercado Pago! Sua assinatura foi ativada com sucesso.',
          });
          setTimeout(() => {
            onClose();
          }, 2000);
          return;
        } else {
          setVerificationMessage({
            type: 'error',
            text: data.message || 'Nenhum pagamento aprovado foi localizado no Mercado Pago para esta conta.',
          });
          return;
        }
      }

      setVerificationMessage({
        type: 'error',
        text: 'Nenhum pagamento aprovado foi localizado no Mercado Pago para esta conta ainda. Realize o pagamento ou envie o comprovante no WhatsApp.',
      });
    } catch (e) {
      console.error('Erro ao verificar pagamento:', e);
      setVerificationMessage({
        type: 'error',
        text: 'Erro ao consultar o gateway de pagamento. Tente novamente em instantes.',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleNotifyPayment = () => {
    const planName = currentPlan.name;
    const userEmail = profile?.email || 'meu email';
    const userName = profile?.ownerName || profile?.name || 'Cliente';
    const msg =
      `Olá! Acabei de realizar o pagamento da assinatura do *Organize Ateliê*! 🎉💕\n\n` +
      `📋 *Plano Escolhido:* ${planName} (${formatCurrency(currentPlan.price)})\n` +
      `👤 *Nome:* ${userName}\n` +
      `📧 *E-mail de Acesso:* ${userEmail}\n\n` +
      `Segue meu comprovante em anexo para ativação do meu acesso! ✨`;

    window.open(createWhatsAppLink(supportPhone, msg), '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl border border-pink-100 space-y-6 animate-in fade-in zoom-in-95 my-6 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-pink-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ac2471] to-pink-500 flex items-center justify-center text-white shadow-xs">
                <Crown className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
                Planos de Acesso Organize Ateliê
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Transforme a gestão da sua papelaria afetiva com ferramentas feitas sob medida para artesãs.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-pink-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Status Banner */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
            subInfo.isTrialExpired || subInfo.isPaidExpired
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-pink-50 border-pink-200 text-[#ac2471]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {subInfo.isTrialExpired || subInfo.isPaidExpired ? (
              <Zap className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : (
              <Gift className="w-5 h-5 text-[#ac2471] flex-shrink-0" />
            )}
            <div>
              <span className="font-bold block">
                {subInfo.isTrialExpired
                  ? 'Seu teste grátis de 7 dias terminou!'
                  : subInfo.isPaidExpired
                  ? 'Sua assinatura venceu!'
                  : `Você está no período de teste gratuito (${subInfo.trialDaysLeft} dias restantes)`}
              </span>
              <span className="text-[11px] sm:text-xs opacity-90">
                {subInfo.isTrialExpired || subInfo.isPaidExpired
                  ? 'Escolha um plano abaixo para desbloquear o salvamento, criação de pedidos e clientes.'
                  : 'Aproveite para assinar com desconto e garantir seu ateliê 100% organizado sem interrupções.'}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Pricing Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-3xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  plan.popular
                    ? 'border-[#ac2471] bg-gradient-to-b from-pink-50/60 to-white shadow-md shadow-pink-100/50 scale-[1.02]'
                    : plan.bestValue
                    ? 'border-emerald-500 bg-gradient-to-b from-emerald-50/50 to-white shadow-sm'
                    : 'border-slate-200 bg-white hover:border-pink-300'
                } ${isSelected ? 'ring-2 ring-[#ac2471]/40' : ''}`}
              >
                {/* Badge Header */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ac2471] text-white shadow-xs tracking-wider uppercase">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <div>
                    <span className="font-heading font-extrabold text-base text-slate-900 block">
                      {plan.name}
                    </span>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 ${plan.tagClass}`}>
                      {plan.tag}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="pt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-semibold text-slate-500">R$</span>
                      <span className="text-3xl font-heading font-extrabold text-slate-900">
                        {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-xs font-medium text-slate-500">/{plan.period}</span>
                    </div>
                    <span className="text-[11px] font-bold text-pink-700 block mt-0.5">
                      {plan.equivalent}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button */}
                <div className="pt-5 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePay(plan);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#ac2471] to-pink-600 hover:from-[#831843] hover:to-pink-700 text-white'
                        : plan.bestValue
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Pagar com Mercado Pago</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action: Já Paguei / Verificar no Mercado Pago */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Já efetuou o pagamento no Mercado Pago ou PIX?
              </span>
              <p className="text-[11px] sm:text-xs text-emerald-700 leading-relaxed">
                Clique ao lado para verificar a aprovação no Mercado Pago e liberar o seu acesso.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isActivating || activationSuccess}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95 cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando Mercado Pago...</span>
                </>
              ) : activationSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Assinatura Ativada! 🎉</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Já Paguei! Verificar Pagamento</span>
                </>
              )}
            </button>
          </div>

          {/* Mensagem de Feedback de Verificação */}
          {verificationMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-medium border flex items-start gap-2 animate-in fade-in ${
                verificationMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-900'
              }`}
            >
              {verificationMessage.type === 'error' ? (
                <HelpCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{verificationMessage.text}</span>
            </div>
          )}

          {/* Validação por Nº do Pagamento se o e-mail não bater */}
          <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowIdInput(!showIdInput)}
              className="text-[11px] text-emerald-800 hover:underline font-semibold cursor-pointer"
            >
              {showIdInput ? 'Ocultar busca por Nº do Comprovante' : 'Pagou com outro e-mail? Digite o Nº do Pagamento'}
            </button>

            {showIdInput && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Ex: 12345678901"
                  value={paymentIdInput}
                  onChange={(e) => setPaymentIdInput(e.target.value)}
                  className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 w-full sm:w-44 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleConfirmPayment()}
                  disabled={isActivating || !paymentIdInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  Validar ID
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods & PIX Box */}
        <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">
                  Pagamento Seguro com Mercado Pago, PIX ou Cartão
                </span>
                <span className="text-[11px] text-slate-500">
                  Liberação imediata da sua assinatura com suporte personalizado.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPixDetails(!showPixDetails)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <QrCode className="w-3.5 h-3.5 text-[#ac2471]" />
                <span>{showPixDetails ? 'Ocultar Chave PIX' : 'Pagar com PIX Direto'}</span>
              </button>

              <button
                type="button"
                onClick={handleNotifyPayment}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Suporte WhatsApp</span>
              </button>
            </div>
          </div>

          {/* PIX Quick Copy Box */}
          {showPixDetails && (
            <div className="p-3.5 bg-pink-50/80 border border-pink-200 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#ac2471] text-xs">
                  Chave PIX para Pagamento ({currentPlan.name} - {formatCurrency(currentPlan.price)}):
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Favorecido: {profile?.ownerName || 'Luccy Ribeiro'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentPixKey}
                  className="w-full bg-white border border-pink-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-3 py-1.5 rounded-lg bg-[#ac2471] hover:bg-[#831843] text-white font-bold text-xs flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {copiedPix ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Chave</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-600">
                Após fazer o PIX no valor de <strong>{formatCurrency(currentPlan.price)}</strong>, clique no botão <strong>"Já Paguei! Ativar Minha Assinatura"</strong> acima para desbloquear seu acesso na hora!
              </p>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-100">
          <span>✨ Sem fidelidade ou taxas escondidas. Cancele quando quiser.</span>
          <span>Dúvidas? Fale conosco: {supportPhone}</span>
        </div>
      </div>
    </div>
  );
};
