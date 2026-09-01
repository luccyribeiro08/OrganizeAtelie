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
  ownerName?: string,
  atelieName?: string,
  pixKey?: string
): string {
  const sender = ownerName || 'Luccy Ribeiro';
  const atelie = atelieName || 'Organize Ateliê';
  const key = pixKey || '';

  const depositPercent =
    order.financial.paymentProgress ||
    (order.financial.total > 0
      ? Math.round((order.financial.deposit / order.financial.total) * 100)
      : 0);

  const depositText = `• *Sinal Pago (Entrada${depositPercent > 0 ? ` ${depositPercent}%` : ''}):* ${formatCurrency(order.financial.deposit)}`;

  let remainingText = '';
  if (order.status === 'Finalizado' || order.financial.remaining <= 0) {
    remainingText = `• *Saldo Restante:* 100% Quitado / Pago ✓`;
  } else {
    remainingText = `• *Valor Restante (a pagar na entrega do produto ou retirada):* ${formatCurrency(order.financial.remaining)}`;
  }

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
    `Aqui é *${sender}* do *${atelie}*! Seu pedido *${order.code}* foi registrado com muito carinho em nosso sistema! ✨\n\n` +
    `📋 *Resumo da Encomenda:*\n` +
    `• *Tema:* ${order.theme}\n` +
    `• *Data de Entrega:* ${formatDate(order.deliveryDate)}\n` +
    `• *Forma de Entrega:* ${order.deliveryMethod}\n\n` +
    `📦 *Itens:*\n${itemsText}\n\n` +
    `💰 *Financeiro:*\n` +
    `• *Valor Total:* ${formatCurrency(order.financial.total)}\n` +
    `${depositText}\n` +
    `${remainingText}\n` +
    (order.financial.remaining > 0 && key
      ? `\n🔑 *Chave PIX para pagamento do saldo:* \`${key}\`\n`
      : '') +
    `\nEstamos preparando tudo nos mínimos detalhes com muito carinho! Se tiver qualquer dúvida, é só nos chamar por aqui! 💖✂️`
  );
}

export function generateOrderReadyWhatsAppMessage(
  order: Order,
  ownerName?: string,
  atelieName?: string,
  atelieAddress?: string,
  pixKey?: string
): string {
  const sender = ownerName || 'Luccy Ribeiro';
  const atelie = atelieName || 'Organize Ateliê';
  const delivery = order.deliveryMethod || 'Retirada no Ateliê';

  let deliveryInstruction = '';
  if (delivery === 'Retirada no Ateliê') {
    deliveryInstruction =
      `🏪 *Instruções de Retirada:*\n` +
      `Sua encomenda já está pronta, embalada com todo capricho e te esperando para retirada no ateliê!\n` +
      (atelieAddress ? `📍 *Endereço:* ${atelieAddress}\n` : '') +
      (order.deliveryAddress ? `📝 *Observação de Retirada:* ${order.deliveryAddress}\n` : '');
  } else if (delivery === 'Motoboy') {
    deliveryInstruction =
      `🛵 *Entrega via Motoboy:*\n` +
      `Sua encomenda já está prontinha e embalada com todo cuidado para ser enviada por motoboy!\n` +
      (order.deliveryAddress ? `📍 *Endereço de Entrega:* ${order.deliveryAddress}\n` : '') +
      `Assim que o motoboy sair para a rota de entrega, te avisamos por aqui! 🛵💨`;
  } else {
    deliveryInstruction =
      `📦 *Envio via ${delivery}:*\n` +
      `Sua encomenda já está finalizada e pronta para ser postada/despachada!\n` +
      (order.deliveryAddress ? `📍 *Endereço de Destino:* ${order.deliveryAddress}\n` : '') +
      `Assim que realizarmos a postagem, te encaminharemos o comprovante/código de rastreio! ✨`;
  }

  let financialText = '';
  if (order.financial.remaining <= 0 || order.status === 'Finalizado') {
    financialText = `💰 *Pagamento:* 100% Quitado / Pago ✓`;
  } else {
    financialText =
      `💰 *Saldo Restante a Pagar na Entrega/Retirada:* ${formatCurrency(order.financial.remaining)}\n` +
      (pixKey ? `🔑 *Chave PIX:* \`${pixKey}\`` : '');
  }

  return (
    `✨ *OBA! SEU PEDIDO ESTÁ PRONTO!* ✨\n\n` +
    `Olá, *${order.clientName}*! Tudo bem?\n` +
    `Aqui é *${sender}* do *${atelie}*! Passando com muita alegria para avisar que sua encomenda *${order.theme}* (Pedido *${order.code}*) está 100% pronta e linda! 💖✂️\n\n` +
    `${deliveryInstruction.trim()}\n\n` +
    `${financialText.trim()}\n\n` +
    `Ficamos muito felizes em fazer parte deste momento especial! Se precisar de algo ou for retirar, é só nos responder por aqui! 🌸🎀`
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

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getOrderMonthKey(order: Order): string {
  // If order is completed, prioritize completedAt or deliveryDate
  const dateStr = order.completedAt || order.deliveryDate || order.orderDate || order.createdAt;
  if (!dateStr) return getCurrentMonthKey();
  
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}`;
    }
  }
  return getCurrentMonthKey();
}

export function formatMonthYear(monthKey: string): string {
  if (!monthKey || monthKey === 'todos') return 'Todos os Meses';
  const parts = monthKey.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_NAMES_PT[monthIndex]} de ${year}`;
    }
  }
  return monthKey;
}

export function getAvailableMonths(orders: Order[]): { key: string; label: string; isCurrent: boolean }[] {
  const currentKey = getCurrentMonthKey();
  const keysSet = new Set<string>();
  keysSet.add(currentKey);

  orders.forEach((o) => {
    const key = getOrderMonthKey(o);
    if (key) keysSet.add(key);
  });

  const sortedKeys = Array.from(keysSet).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => ({
    key,
    label: formatMonthYear(key) + (key === currentKey ? ' (Mês Atual)' : ''),
    isCurrent: key === currentKey,
  }));
}

export function calculateMonthlyMetrics(orders: Order[], monthKey?: string) {
  const targetKey = monthKey || getCurrentMonthKey();
  
  const finalizedOrders = orders.filter((o) => {
    if (o.status !== 'Finalizado') return false;
    if (targetKey === 'todos') return true;
    return getOrderMonthKey(o) === targetKey;
  });

  const totalRevenue = finalizedOrders.reduce((sum, o) => sum + (o.financial?.total || 0), 0);
  const finalizedCount = finalizedOrders.length;
  const averageTicket = finalizedCount > 0 ? totalRevenue / finalizedCount : 0;

  return {
    monthKey: targetKey,
    monthLabel: formatMonthYear(targetKey),
    finalizedCount,
    totalRevenue,
    averageTicket,
    orders: finalizedOrders,
  };
}
