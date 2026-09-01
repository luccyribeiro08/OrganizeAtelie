import React from 'react';
import { Printer, Sparkles, X } from 'lucide-react';
import { AtelieProfile, Order } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { BrandLogo } from './BrandLogo';

interface OrderReceiptModalProps {
  order: Order | null;
  profile: AtelieProfile;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  profile,
  onClose
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-6 animate-in fade-in zoom-in-95 my-8 max-h-[95vh] overflow-y-auto">
        {/* Actions Bar (hidden when printing) */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100 no-print">
          <span className="text-xs font-semibold text-slate-500">
            Visualização de Impressão (Recibo & Ficha de Confecção)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ac2471] text-white text-xs font-bold hover:bg-[#831843] transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-pink-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= PRINTABLE CONTENT ================= */}
        <div className="space-y-6 p-4 border border-slate-200 rounded-2xl bg-white text-slate-800" id="printable-order">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-pink-200">
            <BrandLogo size="md" showSubtitle={true} />
            <div className="text-right">
              <span className="text-sm font-extrabold text-[#ac2471] block font-heading">
                FICHA DE PEDIDO & RECIBO
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {order.code}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Emissão: {formatDate(order.orderDate)}
              </span>
            </div>
          </div>

          {/* Client & Production Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider text-pink-700">
                Dados da Cliente
              </span>
              <p><strong>Nome:</strong> {order.clientName}</p>
              <p><strong>Telefone/WhatsApp:</strong> {order.clientPhone}</p>
              {order.clientInstagram && <p><strong>Instagram:</strong> {order.clientInstagram}</p>}
              <p><strong>Origem:</strong> {order.origin}</p>
            </div>

            <div className="p-3 bg-pink-50/50 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider text-pink-700">
                Dados da Entrega
              </span>
              <p><strong>Data de Entrega:</strong> {formatDate(order.deliveryDate)}</p>
              <p><strong>Forma:</strong> {order.deliveryMethod}</p>
              {order.deliveryAddress && <p><strong>Endereço:</strong> {order.deliveryAddress}</p>}
              <p><strong>Status:</strong> {order.status}</p>
            </div>
          </div>

          {/* Theme & Customization */}
          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5">
            <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider text-pink-700">
              Tema & Detalhes de Personalização
            </span>
            <p><strong>Tema do Pedido:</strong> {order.theme}</p>
            {order.personalization.honoreeName && (
              <p><strong>Homenageado(a):</strong> {order.personalization.honoreeName} ({order.personalization.age || ''})</p>
            )}
            {order.personalization.colorPalette && (
              <p><strong>Paleta de Cores:</strong> {order.personalization.colorPalette}</p>
            )}
            {order.personalization.tagPhrase && (
              <p><strong>Frase da Tag:</strong> "{order.personalization.tagPhrase}"</p>
            )}
            {order.personalization.specialNotes && (
              <p className="text-[11px] text-slate-600"><strong>Observações:</strong> {order.personalization.specialNotes}</p>
            )}
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-2">Item / Descrição</th>
                  <th className="p-2 text-center">Qtd</th>
                  <th className="p-2 text-right">Valor Un.</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <span className="font-bold text-slate-800">{it.name}</span>
                      {it.notes && <span className="block text-[10px] text-slate-500">{it.notes}</span>}
                    </td>
                    <td className="p-2 text-center font-bold">{it.quantity}</td>
                    <td className="p-2 text-right">{formatCurrency(it.unitPrice)}</td>
                    <td className="p-2 text-right font-bold">{formatCurrency(it.quantity * it.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary Box */}
          <div className="flex justify-between items-center p-3 bg-pink-50 rounded-xl text-xs">
            <div className="space-y-0.5">
              <p><strong>Forma de Pagamento:</strong> {order.financial.paymentMethod}</p>
              <p><strong>Sinal Pago:</strong> {formatCurrency(order.financial.deposit)}</p>
              <p className="text-amber-800 font-bold"><strong>Saldo Restante:</strong> {formatCurrency(order.financial.remaining)}</p>
              {profile.pixKey && (
                <p className="text-[10px] text-slate-500 font-mono pt-1">
                  Chave PIX: {profile.pixKey}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Total do Pedido</span>
              <span className="text-xl font-heading font-extrabold text-[#ac2471]">
                {formatCurrency(order.financial.total)}
              </span>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">
              {profile.name} • {profile.phone} • {profile.instagram}
            </p>
            <p>
              Agradecemos a preferência! Produtos artesanais e personalizados feitos com muito amor. ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
