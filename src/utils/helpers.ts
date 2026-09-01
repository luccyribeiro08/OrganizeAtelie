import confetti from 'canvas-confetti';
import { Order } from '../types';

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) || 0 : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  // handles YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function getDaysRemaining(deliveryDate: string): { days: number; text: string; isUrgent: boolean } {
  if (!deliveryDate) return { days: 0, text: 'Sem data', isUrgent: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = deliveryDate.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: diffDays, text: `Atrasado há ${Math.abs(diffDays)}d`, isUrgent: true };
  } else if (diffDays === 0) {
    return { days: 0, text: 'Entrega Hoje!', isUrgent: true };
  } else if (diffDays === 1) {
    return { days: 1, text: 'Entrega Amanhã', isUrgent: true };
  } else {
    return { days: diffDays, text: `Em ${diffDays} dias`, isUrgent: diffDays <= 3 };
  }
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function createWhatsAppLink(phone: string, text: string): string {
  let cleaned = cleanPhone(phone);
  if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    cleaned = '55' + cleaned;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export function generateWhatsAppOrderMessage(
  order: Order,
  atelieName: string = 'Organize Ateliê - Luccy Ribeiro',
  pixKey: string = 'luccy.papelaria@pix.com.br'
): string {
  const itemsText = order.items
    .map(
      (item, idx) =>
        `  ${idx + 1}. *${item.name}* (x${item.quantity}) - ${formatCurrency(
          item.unitPrice * item.quantity
        )}`
    )
    .join('\n');

  return (
    `🌸 *Olá, ${order.clientName}!* 🌸\n\n` +
    `Aqui é Luccy Ribeiro do *Organize Ateliê*! Seu pedido *${order.code}* foi registrado com muito carinho em nosso sistema! ✨\n\n` +
    `📋 *Resumo da Encomenda:*\n` +
    `• *Tema:* ${order.theme}\n` +
    `• *Data de Entrega:* ${formatDate(order.deliveryDate)}\n` +
    `• *Forma de Entrega:* ${order.deliveryMethod}\n\n` +
    `📦 *Itens:*\n${itemsText}\n\n` +
    `💰 *Financeiro:*\n` +
    `• *Valor Total:* ${formatCurrency(order.financial.total)}\n` +
    `• *Sinal Pago:* ${formatCurrency(order.financial.deposit)}\n` +
    `• *Restante a Pagar:* ${formatCurrency(order.financial.remaining)}\n` +
    (order.financial.remaining > 0
      ? `\n🔑 *Chave PIX para pagamento:* \`${pixKey}\`\n`
      : '') +
    `\nEstamos preparando tudo nos mínimos detalhes! Se tiver qualquer dúvida, é só nos chamar aqui! 💖✂️`
  );
}

export function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ff69b4', '#ac2471', '#ffd1dc', '#f472b6', '#fb7185', '#fbcfe8'],
  });
}
