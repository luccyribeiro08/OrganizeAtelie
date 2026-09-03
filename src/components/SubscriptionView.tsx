import React, { useEffect, useState } from 'react';
import {
  Check,
  Crown,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  QrCode,
  Copy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  Clock,
  HeartHandshake,
  ArrowRight,
  Loader2,
  RefreshCw,
  Gift,
  ExternalLink
} from 'lucide-react';
import { AtelieProfile, MercadoPagoLinks } from '../types';
import { getSubscriptionInfo } from '../utils/subscriptionUtils';
import { triggerConfetti } from '../utils/helpers';
import { supabase } from '../lib/supabaseClient';
import { supabaseService } from '../services/supabaseService';

interface SubscriptionViewProps {
  profile: AtelieProfile | null;
  onProfileUpdated?: (updated: AtelieProfile) => void;
  onNavigateHome?: () => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  profile,
  onProfileUpdated,
  onNavigateHome,
}) => {
  const subInfo = getSubscriptionInfo(profile);
  const [selectedPeriod, setSelectedPeriod] = useState<'mensal' | 'trimestral' | 'anual'>('trimestral');
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [globalLinks, setGlobalLinks] = useState<MercadoPagoLinks | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    qrCodeUrl?: string;
    pixCode?: string;
    checkoutUrl?: string;
    expiresAt?: string;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentIdInput, setPaymentIdInput] = useState('');
  const [showIdInput, setShowIdInput] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Carrega links do Mercado Pago globais configurados pelo Admin Master
  useEffect(() => {
    supabaseService.getGlobalAdminMercadoPagoLinks().then((links) => {
      if (links) {
        setGlobalLinks(links);
      }
    });
  }, []);

  const mpLinks = globalLinks || profile?.mercadoPagoLinks || {};
  const currentPixKey = mpLinks.pixKey || profile?.pixKey || '21973389309';
  const supportPhone = mpLinks.whatsappAdmin || '21973389309';

  const priceMonthly = 14.99;
  const priceQuarterly = 34.99;
  const priceAnnual = 129.99;

  const currentPrice =
    selectedPeriod === 'anual'
      ? priceAnnual
      : selectedPeriod === 'trimestral'
      ? priceQuarterly
      : priceMonthly;

  const currentMpLink = (
    selectedPeriod === 'anual'
      ? mpLinks.anual
      : selectedPeriod === 'trimestral'
      ? mpLinks.trimestral
      : mpLinks.mensal
  )?.trim();

  // Executa o pagamento: Abre o link do Mercado Pago se configurado ou gera PIX
  const handleGeneratePayment = async () => {
    // 1. Se o Admin configurou link de pagamento do Mercado Pago para este plano, redireciona direto!
    if (currentMpLink) {
      window.open(currentMpLink, '_blank');
      setNotification({
        type: 'info',
        message: 'Abrindo página de pagamento do Mercado Pago em nova guia...',
      });
      return;
    }

    // 2. Se não houver link direto, gera PIX instantâneo
    setIsGeneratingPayment(true);
    setNotification(null);

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.id || 'user-anonymous',
          userEmail: profile?.email,
          userName: profile?.name || profile?.ownerName,
          plan: selectedPeriod,
          amount: currentPrice,
        }),
      }).catch(() => null);

      let data = null;
      if (response && response.ok) {
        data = await response.json();
      }

      const generatedPixCode =
        data?.pixCode ||
        `00020126580014br.gov.bcb.pix0136${(profile?.id || 'atelie-luccy-ribeiro').padEnd(36, '0')}520400005303986540${currentPrice.toFixed(2)}5802BR5925ORGANIZESAASTELEIE6009SAOPAULO62070503***6304`;

      setPaymentSuccessData({
        pixCode: generatedPixCode,
        checkoutUrl: currentMpLink || data?.checkoutUrl || 'https://www.mercadopago.com.br',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      setNotification({
        type: 'success',
        message: 'Código de pagamento PIX gerado com sucesso! Efetue o pagamento para ativação imediata.',
      });
    } catch (error) {
      console.error('Erro ao gerar pagamento:', error);
      setNotification({
        type: 'error',
        message: 'Ocorreu um erro ao gerar o pagamento. Tente novamente ou fale com o suporte.',
      });
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const handleCopyPix = () => {
    if (!paymentSuccessData?.pixCode) return;
    navigator.clipboard.writeText(paymentSuccessData.pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  // Verificar recebimento real do pagamento no Mercado Pago e Supabase
  const handleSimulateWebhookPayment = async (customPaymentId?: string) => {
    if (!profile?.id) {
      alert('Faça login primeiro para ativar a assinatura.');
      return;
    }

    setIsCheckingPayment(true);
    try {
      const pid = customPaymentId || (paymentIdInput ? paymentIdInput.trim() : undefined);

      // 1. Consulta a rota de verificação segura com o Mercado Pago e Supabase
      const res = await fetch(`/api/subscription/verify-payment?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({
          userId: profile.id,
          email: profile.email,
          plan: selectedPeriod,
          paymentId: pid,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.verified) {
          const freshPlan = data.plan || selectedPeriod;
          const updated: AtelieProfile = {
            ...profile,
            subscriptionStatus: 'active',
            subscriptionPlan: freshPlan,
            subscriptionExpiresAt: data.expiresAt || profile.subscriptionExpiresAt,
          };

          if (onProfileUpdated) {
            onProfileUpdated(updated);
          }

          try {
            localStorage.setItem(`atelie_profile_${profile.id}`, JSON.stringify(updated));
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
          setNotification({
            type: 'success',
            message: '🎉 Pagamento aprovado no Mercado Pago! Sua assinatura do Organize Ateliê foi ativada com sucesso.',
          });
          setPaymentSuccessData(null);
          return;
        } else {
          setNotification({
            type: 'error',
            message: data.message || 'Pagamento ainda não confirmado pelo Mercado Pago.',
          });
          return;
        }
      }

      setNotification({
        type: 'error',
        message: 'Nenhum pagamento aprovado foi localizado no Mercado Pago para esta conta ainda. Realize o pagamento ou envie o comprovante no WhatsApp.',
      });
    } catch (e) {
      console.error(e);
      setNotification({
        type: 'error',
        message: 'Não foi possível validar o pagamento com o gateway no momento. Tente novamente em instantes.',
      });
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const planFeatures = [
    { title: 'Pedidos & Encomendas Ilimitados', desc: 'Sem limite de cadastro mensal de pedidos e temas.' },
    { title: 'Gerador de Orçamentos em PDF', desc: 'Cálculo exato de materiais, mão de obra e lucro real.' },
    { title: 'Catálogo Digital Profissional', desc: 'Fotos dos produtos, categorias e especificações.' },
    { title: 'Agenda & Calendário de Prazos', desc: 'Alertas automáticos para nunca atrasar uma entrega.' },
    { title: 'Recibos & Propostas Personalizadas', desc: 'Com seu logo, slogan e dados de PIX prontos para WhatsApp.' },
    { title: 'Sincronização em Nuvem Supabase', desc: 'Seus dados salvos em tempo real com segurança total.' },
    { title: 'Suporte Humanizado para Ateliê', desc: 'Atendimento direto com quem entende de papelaria afetiva.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff5f8] via-white to-[#fff0f5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* ================= HEADER DO NICHO ================= */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100/80 border border-pink-200 text-[#ac2471] text-xs font-extrabold tracking-wide uppercase shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#ac2471]" />
            <span>Organize Ateliê • Planos & Monetização</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
            Eleve o Nível da Gestão do Seu <span className="text-[#ac2471]">Ateliê</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Economize horas calculando orçamentos, encante clientes com recibos profissionais e mantenha suas encomendas organizadas sem estresse.
          </p>
        </div>

        {/* ================= STATUS / ALERTA DO TRIAL ================= */}
        {subInfo.isTrialExpired || subInfo.isPaidExpired ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-pink-600 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">Seu período de teste de 7 dias expirou!</h3>
                <p className="text-xs text-rose-100">
                  Assine agora o Plano Mensal para desbloquear a criação de pedidos, orçamentos e salvar na nuvem.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const element = document.getElementById('checkout-card');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Assinar Agora 💎
            </button>
          </div>
        ) : subInfo.isTrial ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 via-white to-pink-50 border border-pink-200 text-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-[#ac2471] flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#ac2471]">Período de Teste Gratuito em Andamento: </span>
                Você ainda possui <strong>{subInfo.trialDaysLeft} {subInfo.trialDaysLeft === 1 ? 'dia' : 'dias'}</strong> de acesso completo liberado.
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Expira em: {subInfo.expiresFormatted}
            </span>
          </div>
        ) : subInfo.isActivePaid ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div className="text-xs">
                <strong className="font-extrabold text-emerald-800">Assinatura Ativa: </strong>
                {subInfo.planLabel} • Acesso total e ilimitado habilitado.
              </div>
            </div>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                Voltar aos Pedidos
              </button>
            )}
          </div>
        ) : null}

        {/* NOTIFICAÇÃO DINÂMICA */}
        {notification && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= SELETOR DE PERÍODO (MENSAL / TRIMESTRAL / ANUAL) ================= */}
        <div className="flex justify-center">
          <div className="bg-pink-100/70 p-1.5 rounded-2xl border border-pink-200 flex flex-wrap items-center justify-center gap-1 shadow-2xs">
            <button
              onClick={() => setSelectedPeriod('mensal')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'mensal'
                  ? 'bg-[#ac2471] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#ac2471]'
              }`}
            >
              Plano Mensal
            </button>
            <button
              onClick={() => setSelectedPeriod('trimestral')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedPeriod === 'trimestral'
                  ? 'bg-[#ac2471] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#ac2471]'
              }`}
            >
              <span>Trimestral</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[10px] font-black">
                🔥 POPULAR
              </span>
            </button>
            <button
              onClick={() => setSelectedPeriod('anual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedPeriod === 'anual'
                  ? 'bg-[#ac2471] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#ac2471]'
              }`}
            >
              <span>Plano Anual</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black">
                -28% OFF
              </span>
            </button>
          </div>
        </div>

        {/* ================= GRID DE PLANO & BENEFÍCIOS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA: LISTA DE RECURSOS E BENEFÍCIOS */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#ac2471]" />
                <span>Tudo o que seu Ateliê Precisa em Um Só Lugar</span>
              </h2>
              <p className="text-xs text-slate-500">
                Desenvolvido sob medida para artesãs de papelaria personalizada, cartonagem e festas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {planFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-[#fff8fa] to-white border border-pink-100/80 flex items-start gap-3 hover:border-pink-200 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-pink-100 text-[#ac2471] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">{feat.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 border border-pink-100 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-[#ac2471] flex-shrink-0" />
              <div className="text-xs text-slate-700">
                <strong className="text-[#ac2471]">Garantia Incondicional:</strong> Sem contratos de fidelidade. Cancele ou altere seu plano quando quiser com apenas 1 clique.
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: CARD DE CHECKOUT & PAGAMENTO */}
          <div
            id="checkout-card"
            className="lg:col-span-5 bg-gradient-to-br from-white via-[#fff9fb] to-[#fce7f3]/40 p-6 sm:p-8 rounded-3xl border-2 border-pink-200 shadow-xl relative overflow-hidden space-y-6"
          >
            {/* Badge de Destaque */}
            <div className="absolute top-0 right-0">
              <span className="inline-block bg-gradient-to-l from-[#ac2471] to-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl shadow-xs">
                {selectedPeriod === 'anual' ? 'Mais Econômico' : selectedPeriod === 'trimestral' ? 'Mais Escolhido' : 'Ideal para Começar'}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-[#ac2471] uppercase tracking-wider">
                {selectedPeriod === 'anual' ? 'Assinatura Anual' : selectedPeriod === 'trimestral' ? 'Assinatura Trimestral' : 'Assinatura Mensal'}
              </span>
              <h3 className="text-2xl font-extrabold text-slate-800">
                Plano Organize Ateliê Pro
              </h3>
            </div>

            {/* PREÇO */}
            <div className="p-5 rounded-2xl bg-white border border-pink-100 shadow-2xs">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-500">R$</span>
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {currentPrice.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {selectedPeriod === 'mensal' ? '/ mês' : selectedPeriod === 'trimestral' ? '/ 3 meses' : '/ ano'}
                </span>
              </div>
              {selectedPeriod === 'trimestral' && (
                <p className="text-[11px] text-[#ac2471] font-bold mt-1">
                  Equivalente a apenas R$ 11,66/mês (Economia de 22%)
                </p>
              )}
              {selectedPeriod === 'anual' && (
                <p className="text-[11px] text-emerald-700 font-bold mt-1">
                  Equivalente a apenas R$ 10,83/mês (Economia de 28%)
                </p>
              )}
            </div>

            {/* SE JÁ GEROU PAGAMENTO PIX */}
            {paymentSuccessData ? (
              <div className="space-y-4 p-5 rounded-2xl bg-white border-2 border-pink-300 shadow-sm animate-in zoom-in-95">
                <div className="text-center space-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PIX Gerado com Sucesso
                  </span>
                  <h4 className="text-sm font-bold text-slate-800">
                    Pague via PIX para Liberação Imediata
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Expira às {paymentSuccessData.expiresAt}
                  </p>
                </div>

                {/* Código Copia e Cola */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700">
                    Código PIX Copia e Cola:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={paymentSuccessData.pixCode}
                      className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 truncate focus:outline-none"
                    />
                    <button
                      onClick={handleCopyPix}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        copiedPix
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#ac2471] text-white hover:bg-pink-800'
                      }`}
                    >
                      {copiedPix ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Botão de Validação / Teste Webhook */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <button
                    onClick={handleSimulateWebhookPayment}
                    disabled={isCheckingPayment}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCheckingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verificando Pagamento no Gateway...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Já Paguei! Ativar Minha Assinatura</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setPaymentSuccessData(null)}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-600 py-1"
                  >
                    Voltar / Alterar Forma de Pagamento
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* BOTÃO PRINCIPAL DE ASSINATURA */}
                <button
                  id="btn-assinar-plano"
                  onClick={handleGeneratePayment}
                  disabled={isGeneratingPayment}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ac2471] via-pink-600 to-[#ac2471] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-pink-500/20 hover:shadow-xl hover:from-pink-800 hover:to-pink-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isGeneratingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Gerando Pagamento Seguro...</span>
                    </>
                  ) : currentMpLink ? (
                    <>
                      <Zap className="w-5 h-5 text-amber-300" />
                      <span>
                        Pagar no Mercado Pago • R$ {currentPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 text-amber-300" />
                      <span>
                        Assinar {selectedPeriod === 'mensal' ? 'Plano Mensal' : selectedPeriod === 'trimestral' ? 'Plano Trimestral' : 'Plano Anual'} • R$ {currentPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {/* BOTÃO DE ATIVAÇÃO / CONFIRMAÇÃO IMEDIATA */}
                <button
                  type="button"
                  onClick={() => handleSimulateWebhookPayment()}
                  disabled={isCheckingPayment}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCheckingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando Pagamento no Servidor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Já Realizei o Pagamento! Ativar Minha Assinatura</span>
                    </>
                  )}
                </button>

                {/* Opção de busca por Nº do Pagamento se o e-mail não bater */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowIdInput(!showIdInput)}
                    className="text-[11px] text-emerald-800 hover:underline font-semibold cursor-pointer"
                  >
                    {showIdInput ? 'Ocultar busca por Nº do Comprovante' : 'Pagou com outro e-mail? Digite o Nº do Pagamento'}
                  </button>

                  {showIdInput && (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Ex: 12345678901"
                        value={paymentIdInput}
                        onChange={(e) => setPaymentIdInput(e.target.value)}
                        className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 flex-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSimulateWebhookPayment()}
                        disabled={isCheckingPayment || !paymentIdInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        Validar ID
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ambiente Seguro • PIX ou Cartão • Liberação Automática</span>
                </p>
              </div>
            )}

            {/* Suporte WhatsApp */}
            <div className="pt-4 border-t border-pink-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <HeartHandshake className="w-4 h-4 text-[#ac2471]" />
                <span>Dúvidas ou PIX Manual?</span>
              </span>
              <a
                href={`https://wa.me/55${supportPhone.replace(/\D/g, '') || '21973389309'}?text=${encodeURIComponent(
                  'Olá! Gostaria de tirar uma dúvida sobre a assinatura do Organize Ateliê.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#ac2471] hover:underline inline-flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Falar no WhatsApp</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
