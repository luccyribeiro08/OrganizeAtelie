export type OrderStatus = 
  | 'Rascunho' 
  | 'Pendente' 
  | 'Arte Aprovada' 
  | 'Em Produção' 
  | 'Pronto p/ Envio' 
  | 'Finalizado';

export type PaymentMethod = 
  | 'PIX' 
  | 'Cartão de Crédito' 
  | 'Cartão de Débito' 
  | 'Dinheiro' 
  | 'Boleto' 
  | 'Link de Pagamento';

export type OrderOrigin = 
  | 'Shopee' 
  | 'WhatsApp' 
  | 'Instagram' 
  | 'Loja Física' 
  | 'Elo7';

export type DeliveryMethod = 
  | 'Retirada no Ateliê' 
  | 'Motoboy' 
  | 'Correios (SEDEX)' 
  | 'Correios (PAC)' 
  | 'Transportadora';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  imageUrl?: string; // Direct HTML / Web image URL
}

export interface PersonalizationDetails {
  honoreeName?: string; // Nome da aniversariante/homenageado
  age?: string; // Idade ou data comemorativa
  colorPalette?: string; // Paleta de cores (ex: Rosa bebê, Dourado e Branco)
  tagPhrase?: string; // Frase da tag (ex: "Obrigado pela presença!")
  specialNotes?: string; // Observações da confecção
}

export interface FinancialDetails {
  paymentMethod: PaymentMethod;
  total: number;
  deposit: number; // Sinal pago
  remaining: number; // Restante a pagar
  paymentProgress: number; // Porcentagem (0 a 100)
  pixKey?: string;
  notes?: string;
}

export interface Order {
  id: string;
  code: string; // Ex: #PED-1042
  clientName: string;
  clientPhone: string;
  clientInstagram?: string;
  orderDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  theme: string;
  origin: OrderOrigin;
  orderType: string;
  items: OrderItem[];
  personalization: PersonalizationDetails;
  financial: FinancialDetails;
  status: OrderStatus;
  mockupImages: string[]; // Direct links to HTML image URLs
  createdAt: string;
  updatedAt: string;
  completedAt?: string; // Data e hora em que o pedido foi marcado como Finalizado
}

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  estimatedDays: number;
  imageUrl: string; // Direct image URL
  tags: string[];
}

export interface MaterialCostItem {
  id: string;
  name: string;
  unitCost: number;
  quantityUsed: number;
  subtotal: number;
}

export interface Quotation {
  id: string;
  code: string;
  clientName: string;
  clientPhone?: string;
  theme: string;
  materials: MaterialCostItem[];
  laborCost: number; // Mão de obra fixa (R$)
  laborHours?: number;
  hourlyRate?: number;
  additionalCosts: number;
  profitMargin: number; // %
  calculatedPrice: number;
  suggestedPrice: number;
  roundedPrice?: number;
  date: string;
  validDays: number;
  notes?: string;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  createdAt?: string;
  updatedAt?: string;
}

export interface AtelieProfile {
  name: string;
  ownerName: string;
  role: string;
  slogan: string;
  phone: string;
  pixKey: string;
  instagram: string;
  email: string;
  address: string;
  logoUrl: string;
  avatarUrl: string;
}

export interface UserAccount {
  id: string;
  name: string; // Nome da responsável
  atelieName: string; // Nome do ateliê
  email: string;
  password: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
  logoUrl?: string;
  createdAt: string;
}
