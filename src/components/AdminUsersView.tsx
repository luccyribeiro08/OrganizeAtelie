import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Gift,
  Key,
  Link,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { AtelieProfile, MercadoPagoLinks, SubscriptionPlan, SubscriptionStatus } from '../types';
import { supabaseService } from '../services/supabaseService';
import { formatDate } from '../utils/helpers';
import { getSubscriptionInfo } from '../utils/subscriptionUtils';

interface AdminUsersViewProps {
  currentAdminProfile: AtelieProfile;
  onProfileUpdated?: (updated: AtelieProfile) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  currentAdminProfile,
  onProfileUpdated,
}) => {
  const [users, setUsers] = useState<AtelieProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mercado Pago Config State
  const [mpLinks, setMpLinks] = useState<MercadoPagoLinks>({
    mensal: currentAdminProfile.mercadoPagoLinks?.mensal || '',
    trimestral: currentAdminProfile.mercadoPagoLinks?.trimestral || '',
    anual: currentAdminProfile.mercadoPagoLinks?.anual || '',
    pixKey: currentAdminProfile.mercadoPagoLinks?.pixKey || currentAdminProfile.pixKey || '',
    whatsappAdmin: currentAdminProfile.mercadoPagoLinks?.whatsappAdmin || currentAdminProfile.phone || '',
  });
  const [savingLinks, setSavingLinks] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const allUsers = await supabaseService.getAllUsersForAdmin();
    setUsers(allUsers);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    supabaseService.getGlobalAdminMercadoPagoLinks().then((links) => {
      if (links) {
        setMpLinks({
          mensal: links.mensal || '',
          trimestral: links.trimestral || '',
          anual: links.anual || '',
          pixKey: links.pixKey || currentAdminProfile.pixKey || '',
          whatsappAdmin: links.whatsappAdmin || currentAdminProfile.phone || '',
        });
      }
    });
  }, []);

  const handleSaveMpLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminId = currentAdminProfile.id || 'user-sluccy45-master';
    setSavingLinks(true);

    const success = await supabaseService.saveAdminMercadoPagoLinks(adminId, mpLinks);
    if (success) {
      setSuccessMessage('Links do Mercado Pago salvos e sincronizados para todos os clientes!');
      if (onProfileUpdated) {
        onProfileUpdated({
          ...currentAdminProfile,
          mercadoPagoLinks: mpLinks,
        });
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    }
    setSavingLinks(false);
  };

  const handleUpdateUserPlan = async (
    targetUser: AtelieProfile,
    plan: SubscriptionPlan,
    status: SubscriptionStatus,
    daysToAdd: number | null
  ) => {
    if (!targetUser.id) return;
    setActionLoadingId(targetUser.id);

    const now = new Date();
    let expiresAt: string | null = null;
    let trialEndsAt = targetUser.trialEndsAt;

    if (plan === 'vitalicio' || status === 'admin') {
      expiresAt = null;
    } else if (daysToAdd !== null) {
      // Calculate from current expiration if already active, or from now
      const baseDate =
        targetUser.subscriptionExpiresAt && new Date(targetUser.subscriptionExpiresAt) > now
          ? new Date(targetUser.subscriptionExpiresAt)
          : now;
      expiresAt = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    } else if (plan === 'free_trial') {
      trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      expiresAt = null;
    }

    const success = await supabaseService.updateUserSubscriptionAdmin(targetUser.id, {
      subscriptionStatus: status,
      subscriptionPlan: plan,
      subscriptionExpiresAt: expiresAt,
      trialEndsAt: trialEndsAt,
      isAdmin: status === 'admin',
    });

    if (success) {
      setSuccessMessage(`Plano de ${targetUser.ownerName || targetUser.name} atualizado para ${plan}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchUsers();
    }
    setActionLoadingId(null);
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.ownerName && u.ownerName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  // Calculate Metrics
  const totalUsers = users.length;
  const activeSubscribers = users.filter(
    (u) => u.subscriptionStatus === 'active' || u.subscriptionPlan === 'vitalicio'
  ).length;
  const trialUsers = users.filter((u) => {
    if (u.subscriptionStatus === 'active' || u.isAdmin) return false;
    if (!u.trialEndsAt) return true;
    return new Date(u.trialEndsAt) >= new Date();
  }).length;
  const expiredUsers = totalUsers - activeSubscribers - trialUsers;

  return (
    <div className="space-y-8 animate-in fade-in pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pink-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-700 to-[#ac2471] text-white flex items-center justify-center shadow-xs">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <h1 className="text-2xl font-heading font-extrabold text-slate-900">
              Painel de Administração de Usuárias & Planos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gerencie o acesso das artesãs, aprove pagamentos e configure os links de venda do Mercado Pago.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white border border-pink-200 text-[#ac2471] hover:bg-pink-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Lista</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Usuárias</span>
            <Users className="w-4 h-4 text-[#ac2471]" />
          </div>
          <span className="text-2xl font-heading font-extrabold text-slate-900 block">{totalUsers}</span>
          <span className="text-[10px] text-slate-500">Cadastradas no sistema</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assinantes Pagas</span>
            <Crown className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-heading font-extrabold text-emerald-700 block">{activeSubscribers}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Planos ativos gerando receita</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Em Teste (7 dias)</span>
            <Gift className="w-4 h-4 text-pink-600" />
          </div>
          <span className="text-2xl font-heading font-extrabold text-pink-700 block">{trialUsers}</span>
          <span className="text-[10px] text-slate-500">Potenciais novas clientes</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Testes Vencidos</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-heading font-extrabold text-slate-700 block">{expiredUsers}</span>
          <span className="text-[10px] text-slate-500">Aguardando renovação</span>
        </div>
      </div>

      {/* Mercado Pago Links Configuration Card */}
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-pink-100">
          <Link className="w-5 h-5 text-[#ac2471]" />
          <div>
            <h2 className="text-base font-heading font-extrabold text-slate-900">
              Configuração dos Links de Pagamento do Mercado Pago
            </h2>
            <p className="text-xs text-slate-500">
              Cole abaixo os links gerados na sua conta do Mercado Pago para que os botões de assinatura redirecionem automaticamente.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveMpLinks} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Link Plano Mensal (R$ 14,99)
              </label>
              <input
                type="url"
                placeholder="https://mpago.la/..."
                value={mpLinks.mensal || ''}
                onChange={(e) => setMpLinks({ ...mpLinks, mensal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-[#ac2471]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Link Plano Trimestral (R$ 34,99)
              </label>
              <input
                type="url"
                placeholder="https://mpago.la/..."
                value={mpLinks.trimestral || ''}
                onChange={(e) => setMpLinks({ ...mpLinks, trimestral: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-[#ac2471]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Link Plano Anual (R$ 129,99)
              </label>
              <input
                type="url"
                placeholder="https://mpago.la/..."
                value={mpLinks.anual || ''}
                onChange={(e) => setMpLinks({ ...mpLinks, anual: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-[#ac2471]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Chave PIX para Pagamento Direto
              </label>
              <input
                type="text"
                placeholder="Seu CPF, E-mail, Telefone ou Chave Aleatória"
                value={mpLinks.pixKey || ''}
                onChange={(e) => setMpLinks({ ...mpLinks, pixKey: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-[#ac2471]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                WhatsApp para Receber Comprovantes
              </label>
              <input
                type="text"
                placeholder="Ex: 21973389309"
                value={mpLinks.whatsappAdmin || ''}
                onChange={(e) => setMpLinks({ ...mpLinks, whatsappAdmin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-[#ac2471]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingLinks}
              className="px-5 py-2.5 rounded-xl bg-[#ac2471] hover:bg-[#831843] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {savingLinks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Salvar Links de Pagamento</span>
            </button>
          </div>
        </form>
      </div>

      {/* Users Management Table */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-heading font-extrabold text-slate-900">
              Usuárias Cadastradas ({filteredUsers.length})
            </h2>
            <p className="text-xs text-slate-500">
              Visualize os status de teste e ative assinaturas com 1 clique.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-[#ac2471]"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[850px] text-left text-xs text-slate-600">
            <thead className="bg-[#faf7f8] border-b border-pink-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Usuária & Ateliê</th>
                <th className="py-3.5 px-4">Contato</th>
                <th className="py-3.5 px-4">Cadastro</th>
                <th className="py-3.5 px-4">Status / Expiração</th>
                <th className="py-3.5 px-4 text-right">Ações de Liberação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ac2471]" />
                    <span>Carregando usuárias...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhuma usuária encontrada.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const subInfo = getSubscriptionInfo(u);
                  const isUserAdmin = subInfo.isAdmin;
                  const isCurrentActionLoading = actionLoadingId === u.id;

                  return (
                    <tr key={u.id || u.email} className="hover:bg-pink-50/40 transition-colors">
                      {/* Name & Atelier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-pink-100 text-[#ac2471] font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {u.ownerName ? u.ownerName[0].toUpperCase() : 'A'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{u.ownerName || u.name}</span>
                            <span className="text-[11px] text-pink-700">{u.name || 'Organize Ateliê'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="text-slate-800 block">{u.email}</span>
                          <span className="text-[11px] text-slate-400">{u.phone || 'Sem telefone'}</span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {u.createdAt ? formatDate(u.createdAt) : 'Recente'}
                      </td>

                      {/* Status & Expiration */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${subInfo.statusBadgeClass}`}>
                            {subInfo.statusBadgeText}
                          </span>
                          {subInfo.isAdmin ? (
                            <span className="text-[10px] text-purple-700 font-medium block">
                              Acesso Vitalício Permanente
                            </span>
                          ) : subInfo.isActivePaid ? (
                            <span className="text-[10px] text-slate-500 block">
                              Válido até: {subInfo.expiresFormatted}
                            </span>
                          ) : subInfo.isTrial && !subInfo.isTrialExpired ? (
                            <span className="text-[10px] text-slate-500 block">
                              Fim teste: {subInfo.expiresFormatted}
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-600 font-bold block">
                              🔒 Expirado em {subInfo.expiresFormatted}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {isUserAdmin ? (
                            <span className="text-[11px] text-slate-400 italic">
                              —
                            </span>
                          ) : isCurrentActionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#ac2471]" />
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateUserPlan(u, 'mensal', 'active', 30)}
                                className="px-2 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#ac2471] text-[10px] font-bold border border-pink-200 transition-colors cursor-pointer"
                                title="Ativar 30 dias de acesso (Mensal)"
                              >
                                +30d (Mensal)
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateUserPlan(u, 'trimestral', 'active', 90)}
                                className="px-2 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                                title="Ativar 90 dias de acesso (Trimestral)"
                              >
                                +90d (Trimestral)
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateUserPlan(u, 'anual', 'active', 365)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                                title="Ativar 1 ano de acesso (Anual)"
                              >
                                +1 Ano (Anual)
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateUserPlan(u, 'free_trial', 'trial', 7)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                                title="Conceder mais 7 dias de teste grátis"
                              >
                                +7d Teste
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
