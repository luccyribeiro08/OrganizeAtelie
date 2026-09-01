import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  Eye,
  Gift,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Sparkles,
  Tag,
  User,
  X
} from 'lucide-react';
import { AtelieProfile, Order, OrderStatus } from '../types';
import {
  createWhatsAppLink,
  formatCurrency,
  formatDate,
  generateWhatsAppOrderMessage,
  getDaysRemaining
} from '../utils/helpers';

interface OrderDetailsModalProps {
  order: Order | null;
  profile: AtelieProfile;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onPrintOrder: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  profile,
  onClose,
  onUpdateStatus,
  onPrintOrder
}) => {
  const [copiedWA, setCopiedWA] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  if (!order) return null;

  const daysInfo = getDaysRemaining(order.deliveryDate);
  const waMessage = generateWhatsAppOrderMessage(
    order,
    profile.ownerName,
    profile.name,
    profile.pixKey
  );
  const waLink = createWhatsAppLink(order.clientPhone, waMessage);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(waMessage);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  const allStatuses: OrderStatus[] = [
    'Rascunho',
    'Pendente',
    'Arte Aprovada',
    'Em Produção',
    'Pronto p/ Envio',
    'Finalizado'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-6 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-pink-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-[#ac2471]">
                {order.code}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">
                Origem: {order.origin}
              </span>
            </div>
            <h2 className="text-xl font-heading font-extrabold text-slate-900 mt-1">
              {order.clientName}
            </h2>
            <p className="text-xs text-pink-700 font-medium">
              Tema: {order.theme} • {order.orderType}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-pink-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Workflow Bar */}
        <div className="bg-[#fdf9fa] p-4 rounded-2xl border border-pink-100/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              STATUS DO PEDIDO
            </label>
            {order.status === 'Finalizado' && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#ac2471] bg-pink-100/80 px-2.5 py-0.5 rounded-full">
                <Lock className="w-3 h-3" />
                Status Concluído e Bloqueado
              </span>
            )}
          </div>

          {order.status === 'Finalizado' ? (
            <div className="flex items-center gap-2.5 p-3 bg-pink-50 border border-pink-200/80 rounded-xl text-xs text-[#ac2471] font-semibold animate-in fade-in">
              <Lock className="w-4 h-4 text-[#ac2471] flex-shrink-0" />
              <span>
                Este pedido foi <strong>Finalizado</strong> com sucesso! O status foi arquivado na coluna de finalizados e está bloqueado para novas alterações.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((st) => {
                const isCurrent = order.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(order.id, st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#ac2471] text-white shadow-xs scale-105'
                        : 'bg-white text-slate-600 hover:bg-pink-100/70 border border-pink-100'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Client & Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Client Card */}
          <div className="p-4 rounded-2xl bg-white border border-pink-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <User className="w-4 h-4 text-[#ac2471]" />
              <span>Contato da Cliente</span>
            </div>
            <p className="text-slate-600">
              <strong>Telefone/WhatsApp:</strong> {order.clientPhone}
            </p>
            {order.clientInstagram && (
              <p className="text-slate-600">
                <strong>Instagram:</strong> {order.clientInstagram}
              </p>
            )}
            <p className="text-slate-600">
              <strong>Forma de Entrega:</strong> {order.deliveryMethod}
            </p>
            {order.deliveryAddress && (
              <p className="text-slate-600">
                <strong>Endereço:</strong> {order.deliveryAddress}
              </p>
            )}
          </div>

          {/* Dates & Deadlines */}
          <div className="p-4 rounded-2xl bg-white border border-pink-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-[#ac2471]" />
              <span>Datas & Prazo</span>
            </div>
            <p className="text-slate-600">
              <strong>Data do Pedido:</strong> {formatDate(order.orderDate)}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                <strong>Data de Entrega:</strong> {formatDate(order.deliveryDate)}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  daysInfo.days <= 0
                    ? 'bg-rose-500 text-white'
                    : daysInfo.days <= 2
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {daysInfo.text}
              </span>
            </div>
          </div>
        </div>

        {/* Personalization Details */}
        <div className="p-4 rounded-2xl bg-[#faf7f8] border border-pink-100 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <Sparkles className="w-4 h-4 text-[#ac2471]" />
            <span>Dados de Personalização da Arte</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            {order.personalization.honoreeName && (
              <p>
                <strong>Homenageado(a):</strong> {order.personalization.honoreeName}
              </p>
            )}
            {order.personalization.age && (
              <p>
                <strong>Idade/Data:</strong> {order.personalization.age}
              </p>
            )}
            {order.personalization.colorPalette && (
              <p>
                <strong>Paleta de Cores:</strong> {order.personalization.colorPalette}
              </p>
            )}
            {order.personalization.tagPhrase && (
              <p>
                <strong>Frase da Tag:</strong> "{order.personalization.tagPhrase}"
              </p>
            )}
          </div>
          {order.personalization.specialNotes && (
            <p className="text-xs text-slate-600 pt-1 border-t border-pink-100/60">
              <strong>Observações:</strong> {order.personalization.specialNotes}
            </p>
          )}
        </div>

        {/* Items Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Itens da Encomenda ({order.items.length})
          </h4>
          <div className="rounded-2xl border border-pink-100 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf7f8] text-[10px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Item</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Valor Un.</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50 text-slate-600">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {item.name}
                      </span>
                      {item.notes && (
                        <span className="text-[11px] text-slate-400">{item.notes}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-[#ac2471]">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mockups & Direct Image Links */}
        {order.mockupImages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Fotos e Links Diretos da Arte ({order.mockupImages.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {order.mockupImages.map((imgUrl, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl overflow-hidden border border-pink-100 bg-pink-50 relative group cursor-pointer"
                  onClick={() => setSelectedImagePreview(imgUrl)}
                >
                  <img
                    src={imgUrl}
                    alt={`Mockup ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Summary */}
        {(() => {
          const isFinalized = order.status === 'Finalizado';
          const depositPercentage =
            order.financial.paymentProgress ||
            (order.financial.total > 0
              ? Math.round((order.financial.deposit / order.financial.total) * 100)
              : 0);

          return (
            <div className="p-4 rounded-2xl bg-[#fdf9fa] border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-xs text-slate-500">
                  Forma: <strong>{order.financial.paymentMethod}</strong>
                </span>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs">
                  <span>
                    Sinal Pago ({depositPercentage}%):{' '}
                    <strong>{formatCurrency(order.financial.deposit)}</strong>
                  </span>
                  <span>•</span>
                  {isFinalized ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Total Quitado (100% Pago)
                    </span>
                  ) : (
                    <span className="text-amber-700">
                      Restante: <strong>{formatCurrency(order.financial.remaining)}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {isFinalized ? 'Valor Total Quitado' : 'Valor Total'}
                </span>
                <span className="text-2xl font-heading font-extrabold text-[#ac2471]">
                  {formatCurrency(order.financial.total)}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-pink-100">
          <div className="flex items-center gap-2">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Abrir WhatsApp</span>
            </a>

            <button
              onClick={handleCopyMessage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#ac2471] text-xs font-semibold transition-colors"
              title="Copiar texto formatado"
            >
              {copiedWA ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedWA ? 'Copiado!' : 'Copiar Mensagem'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintOrder(order)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ac2471] text-white text-xs font-semibold hover:bg-[#831843] transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha / Recibo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image zoom modal */}
      {selectedImagePreview && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 flex items-center justify-center p-4"
          onClick={() => setSelectedImagePreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent">
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImagePreview}
              alt="Visualização"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
