import { AtelieProfile, CatalogItem, Client, Order, Quotation } from '../types';

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_ATELIE_PROFILE: AtelieProfile = {
  name: 'Organize Ateliê - Luccy Ribeiro',
  ownerName: 'Luccy Ribeiro',
  username: 'sluccy45',
  role: 'Administrador / Vendas',
  slogan: 'Papelaria personalizada feita com amor e perfeição em cada detalhe',
  phone: '(11) 98765-4321',
  pixKey: 'sluccy45@gmail.com',
  instagram: '@luccyribeiro.papelaria',
  email: 'sluccy45@gmail.com',
  address: 'São Paulo - SP',
  logoUrl: '/logo.png',
  avatarUrl: '/logo.png',
};

export const DEFAULT_CATALOG_CATEGORIES: string[] = [
  'Topos de Bolo',
  'Kit Festa',
  'Cadernos & Planners',
  'Lembrancinhas',
  'Papelaria Escolar',
  'Papelaria Corporativa'
];

export const DEFAULT_ORDER_TYPES: string[] = [
  'Topo de Bolo & Lembrancinhas',
  'Kit Festa Escolar',
  'Kit Caixas Cenário Luxo',
  'Cadernos & Planners Artesanais',
  'Lembrancinhas Maternidade / Batizado',
  'Papelaria Corporativa & Tags',
  'Convites Interativos',
  'Outro Personalizado'
];

export const INITIAL_CATALOG: CatalogItem[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_QUOTATIONS: Quotation[] = [];

export const INSPIRATIONS = [
  {
    quote: '"A organização é a chave para transformar criatividade em arte..."',
    author: 'Luccy Ribeiro',
    tip: 'Dica do dia: Sempre refile os papéis laminados com estilete de 30° para evitar rebarbas no corte.',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
  },
  {
    quote: '"Cada detalhe colocado com carinho conta uma história inesquecível."',
    author: 'Ateliê Criativo',
    tip: 'Tendência da semana: Mistura de papel perolizado com fitas de cetim rosa bebê e toques em foil dourado.',
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
  },
  {
    quote: '"O artesanato não é apenas um produto, é um pedaço do coração do artesão."',
    author: 'Papelaria Afetiva',
    tip: 'Dica financeira: Calcule sempre 15% de margem extra para perdas e testes de corte.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  }
];


