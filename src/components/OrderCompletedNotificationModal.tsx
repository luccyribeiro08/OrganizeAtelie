import React, { useState } from 'react';
import {
  Check,
  Copy,
  HeartHandshake,
  Instagram,
  MessageCircle,
  PartyPopper,
  Phone,
  Send,
  Sparkles,
  Star,
  User,
  X
} from 'lucide-react';
import { AtelieProfile, Client, Order } from '../types';
import { createWhatsAppLink, generateOrderCompletedWhatsAppMessage } from '../utils/helpers';

interface OrderCompletedNotificationModalProps {
  order: Order;
  profile?: AtelieProfile;
  clients?: Client[];
  onClose: () => void;
}

export const OrderCompletedNotificationModal: React.FC<OrderCompletedNotificationModalProps> = ({
  order,
  profile,
  clients = [],
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // 1. Resolve Best Phone Number (from order or linked registered client)
  const resolvePhone = (): { phone: string; source: 'pedido' | 'cadastro' } => {
    if (order.clientPhone && order.clientPhone.trim()) {
      return { phone: order.clientPhone.trim(), source: 'pedido' };
    }
    const cleanPhone = (order.clientPhone || '').replace(/\D/g, '');
    const matched = clients.find(
      (c) =>
        c.name.trim().toLowerCase() === order.clientName.trim().toLowerCase() ||
        (cleanPhone && c.phone.replace(/\D/g, '') === cleanPhone)
    );
    if (matched && matched.phone) {
      return { phone: matched.phone, source: 'cadastro' };
    }
    return { phone: order.clientPhone || '', source: 'pedido' };
  };

  const { phone: targetPhone, source: phoneSource } = resolvePhone();

  // 2. Generate Completion / Gratitude Message
  const completedMessage = generateOrderCompletedWhatsAppMessage(
    order,
    profile?.ownerName,
    profile?.name,
    profile?.instagram
  );

  const waLink = createWhatsAppLink(targetPhone, completedMessage);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(completedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Erro ao copiar mensagem', e);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!targetPhone) {
      alert('Por favor, informe um telefone/WhatsApp válido para esta cliente antes de enviar.');
      return;
    }
    window.open(waLink, '_blank');
  };

  const instaHandle = profile?.instagram
    ? profile.instagram.startsWith('@')
      ? profile.instagram
      : `@${profile.instagram}`
    : '@atelie';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-100 p-6 sm:p-8 animate-in zoom-in-95 duration-200 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-sm">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg sm:text-xl">
                Pedido Concluído: Pós-Venda & Avaliação!
              </h3>
              <p className="text-xs text-slate-500">
                Agradeça a cliente, peça avaliação e convide-a para seguir o seu Instagram.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-pink-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Info Pill */}
        <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-2 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <User className="w-4 h-4 text-[#ac2471]" />
              <span>{order.clientName}</span>
              <span className="text-[11px] font-normal text-slate-500">({order.code})</span>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-pink-100 text-[#ac2471] text-[10px] font-bold flex items-center gap-1">
              <Check className="w-3 h-3" />
              Finalizado / Entregue
            </span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 text-slate-600">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#ac2471]" />
              <span>
                <strong>Telefone:</strong> {targetPhone || 'Não informado'}
              </span>
              {phoneSource === 'cadastro' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-700 font-semibold">
                  Do Cadastro
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[#ac2471] font-semibold">
              <Instagram className="w-3.5 h-3.5" />
              <span>{instaHandle}</span>
            </div>
          </div>
        </div>

        {/* Highlights badges */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11px] font-medium text-rose-700 flex flex-col items-center gap-1">
            <HeartHandshake className="w-4 h-4" />
            <span>Agradecimento</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-[11px] font-medium text-amber-700 flex flex-col items-center gap-1">
            <Star className="w-4 h-4" />
            <span>Avaliação</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-[11px] font-medium text-purple-700 flex flex-col items-center gap-1">
            <Instagram className="w-4 h-4" />
            <span>Instagram</span>
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Mensagem de Conclusão no WhatsApp</span>
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-bold text-[#ac2471] hover:text-[#831843] flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed shadow-inner">
            {completedMessage}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#ac2471] text-xs font-bold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
