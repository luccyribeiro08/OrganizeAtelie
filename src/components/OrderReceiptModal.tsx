import React, { useState } from 'react';
import { CheckCircle2, Download, Loader2, MessageCircle, Printer, Sparkles, X } from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { AtelieProfile, Order } from '../types';
import { createWhatsAppLink, formatCurrency, formatDate } from '../utils/helpers';
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

  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const generateReceiptBlob = async (element: HTMLElement): Promise<Blob | null> => {
    // Tier 1: Try html-to-image toBlob
    try {
      const blob = await toBlob(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      if (blob) return blob;
    } catch (e1) {
      console.warn('html-to-image toBlob falhou, tentando toPng dataUrl...', e1);
    }

    // Tier 2: Try html-to-image toPng dataUrl
    try {
      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      if (dataUrl) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        if (blob) return blob;
      }
    } catch (e2) {
      console.warn('html-to-image toPng falhou, tentando html2canvas...', e2);
    }

    // Tier 3: Try html2canvas fallback
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    } catch (e3) {
      console.warn('html2canvas falhou...', e3);
    }

    return null;
  };

  const handleSendWhatsAppPNG = async () => {
    const printableElement = document.getElementById('printable-order');
    if (!printableElement) return;

    try {
      setIsGeneratingPng(true);
      setFeedbackMsg('Gerando recibo em imagem PNG...');

      const blob = await generateReceiptBlob(printableElement);

      const cleanCode = (order.code || 'PED').replace(/[^a-zA-Z0-9]/g, '');
      const cleanName = (order.clientName || 'Cliente').replace(/\s+/g, '_');
      const fileName = `Recibo_${cleanCode}_${cleanName}.png`;

      const isFinalized = order.status === 'Finalizado';
      const waMessage =
        `Olá, *${order.clientName}*! Tudo bem? 💕\n\n` +
        `Segue o comprovante e *Recibo Oficial do seu Pedido (${order.code})* do *${profile.name}*!\n\n` +
        `📋 *Tema:* ${order.theme}\n` +
        `📦 *Previsão de Entrega:* ${formatDate(order.deliveryDate)}\n` +
        `💰 *Valor Total:* ${formatCurrency(order.financial.total)}\n` +
        (!isFinalized && order.financial.remaining > 0
          ? `💵 *Saldo Restante:* ${formatCurrency(order.financial.remaining)}\n`
          : `✅ *Status:* 100% Quitado!\n`) +
        (profile.pixKey && !isFinalized && order.financial.remaining > 0
          ? `🔑 *Chave PIX:* ${profile.pixKey}\n\n`
          : '\n') +
        `Qualquer dúvida estamos à disposição! ✨`;

      const waLink = createWhatsAppLink(order.clientPhone, waMessage);

      if (blob) {
        // 1. Trigger PNG file download so the user has the image ready
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        } catch (downErr) {
          console.warn('Erro no download automático:', downErr);
        }

        // 2. Try to copy PNG to clipboard for instant pasting (Ctrl+V / Paste)
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob,
              }),
            ]);
          }
        } catch (clipErr) {
          console.warn('Clipboard write fallback:', clipErr);
        }

        // 3. Open WhatsApp directly in the conversation with the registered client number
        const linkElem = document.createElement('a');
        linkElem.href = waLink;
        linkElem.target = '_blank';
        linkElem.rel = 'noopener noreferrer';
        document.body.appendChild(linkElem);
        linkElem.click();
        document.body.removeChild(linkElem);

        setIsGeneratingPng(false);
        setFeedbackMsg(`Recibo PNG pronto! Abrindo conversa no WhatsApp de ${order.clientName}...`);
        setTimeout(() => setFeedbackMsg(null), 4500);
      } else {
        // Fallback: open WhatsApp directly with full order details text
        const linkElem = document.createElement('a');
        linkElem.href = waLink;
        linkElem.target = '_blank';
        linkElem.rel = 'noopener noreferrer';
        document.body.appendChild(linkElem);
        linkElem.click();
        document.body.removeChild(linkElem);

        setIsGeneratingPng(false);
        setFeedbackMsg(`Abrindo conversa no WhatsApp de ${order.clientName}...`);
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao processar recibo:', err);
      setIsGeneratingPng(false);
      const fallbackWaMessage = `Olá, *${order.clientName}*! Segue o recibo do seu Pedido (${order.code}) do ${profile.name}.`;
      const fallbackLink = createWhatsAppLink(order.clientPhone, fallbackWaMessage);
      window.open(fallbackLink, '_blank');
      setFeedbackMsg(`Abrindo WhatsApp de ${order.clientName}...`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-pink-100 space-y-6 animate-in fade-in zoom-in-95 my-8 max-h-[95vh] overflow-y-auto">
        {/* Actions Bar (hidden when printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-100 no-print">
          <div>
            <span className="text-xs font-bold text-slate-700 block">
              Recibo & Ficha de Confecção
            </span>
            <span className="text-[11px] text-slate-400">
              Pedido {order.code} • {order.clientName}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Button 1: Somente Imprimir */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Imprimir ficha de pedidos e recibo na impressora física"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir Recibo & Ficha</span>
            </button>

            {/* Button 2: Enviar Recibo via WhatsApp em formato PNG */}
            <button
              type="button"
              onClick={handleSendWhatsAppPNG}
              disabled={isGeneratingPng}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Gerar imagem PNG do recibo e enviar direto para o WhatsApp da cliente"
            >
              {isGeneratingPng ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <MessageCircle className="w-4 h-4 text-white" />
              )}
              <span>{isGeneratingPng ? 'Gerando PNG...' : 'Enviar Recibo PNG (WhatsApp)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-pink-50 cursor-pointer"
              title="Fechar visualização"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Message Toast */}
        {feedbackMsg && (
          <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-xs font-semibold text-[#ac2471] flex items-center justify-between animate-in fade-in no-print">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ac2471]" />
              <span>{feedbackMsg}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-pink-400 hover:text-pink-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ================= PRINTABLE CONTENT ================= */}
        <div className="space-y-6 p-4 sm:p-6 border border-slate-200 rounded-2xl bg-white text-slate-800" id="printable-order">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-pink-200">
            <BrandLogo size="md" showSubtitle={true} customLogoUrl={profile.logoUrl} atelierName={profile.name} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block uppercase text-[10px] tracking-wider text-pink-700">
                Dados da Cliente
              </span>
              <p><strong>Nome:</strong> {order.clientName}</p>
              <p><strong>Telefone/WhatsApp:</strong> {order.clientPhone || 'Não informado'}</p>
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
            <p><strong>Tema do Pedido:</strong> {order.theme} • {order.orderType}</p>
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
          {(() => {
            const isFinalized = order.status === 'Finalizado';
            const depositPercentage =
              order.financial.paymentProgress ||
              (order.financial.total > 0
                ? Math.round((order.financial.deposit / order.financial.total) * 100)
                : 0);

            return (
              <div className="flex justify-between items-center p-3.5 bg-pink-50/80 border border-pink-100 rounded-xl text-xs">
                <div className="space-y-1">
                  <p>
                    <strong>Forma de Pagamento:</strong> {order.financial.paymentMethod}
                  </p>
                  <p>
                    <strong>Sinal Pago ({depositPercentage}%):</strong>{' '}
                    {formatCurrency(order.financial.deposit)}
                  </p>
                  
                  {isFinalized ? (
                    <p className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                      <span>Valor Total: {formatCurrency(order.financial.total)} (Quitado)</span>
                    </p>
                  ) : (
                    <p className="text-amber-800 font-bold">
                      <strong>Saldo Restante:</strong> {formatCurrency(order.financial.remaining)}
                    </p>
                  )}

                  {profile.pixKey && !isFinalized && order.financial.remaining > 0 && (
                    <p className="text-[10px] text-slate-500 font-mono pt-0.5">
                      Chave PIX para saldo: {profile.pixKey}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    {isFinalized ? 'Valor Total Pago' : 'Total do Pedido'}
                  </span>
                  <span className="text-xl font-heading font-extrabold text-[#ac2471]">
                    {formatCurrency(order.financial.total)}
                  </span>
                  {isFinalized && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full inline-block mt-1">
                      100% PAGO
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

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

        {/* Bottom Fast Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-pink-100 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Recibo & Ficha</span>
          </button>

          <button
            type="button"
            onClick={handleSendWhatsAppPNG}
            disabled={isGeneratingPng}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingPng ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <MessageCircle className="w-4 h-4 text-white" />
            )}
            <span>{isGeneratingPng ? 'Gerando Imagem PNG...' : 'Enviar Recibo PNG p/ WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
