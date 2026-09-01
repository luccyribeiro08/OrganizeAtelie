import { AtelieProfile, CatalogItem, Order, Quotation } from '../types';

export const INITIAL_ATELIE_PROFILE: AtelieProfile = {
  name: 'Organize Ateliê - Luccy Ribeiro',
  ownerName: 'Luccy Ribeiro',
  role: 'Administrador / Vendas',
  slogan: 'Papelaria personalizada feita com amor e perfeição em cada detalhe',
  phone: '(11) 98765-4321',
  pixKey: 'luccy.papelaria@pix.com.br',
  instagram: '@luccyribeiro.papelaria',
  email: 'luccyribeiro08@gmail.com',
  address: 'São Paulo - SP',
  logoUrl: '/logo.png',
  avatarUrl: '/logo.png',
};

export const INITIAL_CATALOG: CatalogItem[] = [
  {
    id: 'cat-1',
    name: 'Topo de Bolo 3D Camadas Luxo',
    category: 'Topos de Bolo',
    description: 'Topo de bolo com efeito 3D em camadas de papel offset 180g, lamicote dourado/prata e hastes em acrílico transparente.',
    basePrice: 38.00,
    estimatedDays: 3,
    imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80',
    tags: ['Topo de Bolo', '3D', 'Luxo', 'Festa'],
  },
  {
    id: 'cat-2',
    name: 'Kit Festa 20 Caixas Personalizadas',
    category: 'Kit Festa',
    description: '5 Caixas Milk, 5 Caixas Pirâmide, 5 Caixas Sushi e 5 Caixas Maletinha com laços de cetim e apliques em relevo.',
    basePrice: 145.00,
    estimatedDays: 5,
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
    tags: ['Kit Festa', 'Caixas', 'Personalizados', 'Lembrancinhas'],
  },
  {
    id: 'cat-3',
    name: 'Caderno A5 Wire-o Personalizado',
    category: 'Cadernos & Planners',
    description: 'Capa dura laminada com acabamento holográfico/fosco, miolo pautado decorado 90g e elástico com passante.',
    basePrice: 58.00,
    estimatedDays: 4,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    tags: ['Caderno', 'Planner', 'Wire-o', 'Encadernação'],
  },
  {
    id: 'cat-4',
    name: 'Caixa Cenário Shaker com Miçangas',
    category: 'Lembrancinhas',
    description: 'Caixa de luxo com visor de acetato transparente, lamicote, miçangas peroladas e flores artesanais de papel.',
    basePrice: 22.50,
    estimatedDays: 4,
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    tags: ['Shaker', 'Luxo', 'Lembrancinha', 'Cenário'],
  },
  {
    id: 'cat-5',
    name: 'Kit Colorir Personalizado com Giz',
    category: 'Lembrancinhas',
    description: 'Revistinha de colorir personalizada no tema com 12 desenhos + caixinha com 6 cores de giz de cera.',
    basePrice: 8.50,
    estimatedDays: 2,
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
    tags: ['Colorir', 'Lembrancinha', 'Escolar', 'Infantil'],
  },
  {
    id: 'cat-6',
    name: 'Agenda Datada 2026 Floral Luxo',
    category: 'Cadernos & Planners',
    description: 'Agenda anual 1 dia por página, cantoneiras douradas metálicas, bolso duplo plástico e fita marcadora.',
    basePrice: 79.00,
    estimatedDays: 5,
    imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80',
    tags: ['Agenda', '2026', 'Floral', 'Organização'],
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ped-1',
    code: '#PED-1024',
    clientName: 'Maria Clara Silva',
    clientPhone: '(11) 99123-4567',
    clientInstagram: '@mariaclarasilva',
    orderDate: '2026-08-28',
    deliveryDate: '2026-09-05',
    deliveryMethod: 'Retirada no Ateliê',
    deliveryAddress: 'Retirada agendada para 15:00',
    theme: 'Jardim Encantado',
    origin: 'WhatsApp',
    orderType: 'Kit Festa & Topo de Bolo',
    items: [
      {
        id: 'item-1',
        name: 'Topo de Bolo 3D Jardim Encantado',
        quantity: 1,
        unitPrice: 45.00,
        imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=400&q=80',
        notes: 'Com borboletas vazadas e flores em camadas'
      },
      {
        id: 'item-2',
        name: 'Caixas Milk com Laço de Gorgurão',
        quantity: 10,
        unitPrice: 8.50,
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        notes: 'Detalhes em lamicote dourado'
      },
      {
        id: 'item-3',
        name: 'Caixas Pirâmide Shaker',
        quantity: 5,
        unitPrice: 12.00,
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
        notes: 'Visor com lantejoulas rosa e ouro'
      }
    ],
    personalization: {
      honoreeName: 'Helena',
      age: '3 Anos',
      colorPalette: 'Rosa Bebê, Verde Menta e Dourado',
      tagPhrase: 'Obrigado por celebrar os 3 aninhos da Helena!',
      specialNotes: 'Cliente pediu para reforçar a haste do topo de bolo.'
    },
    financial: {
      paymentMethod: 'PIX',
      total: 190.00,
      deposit: 100.00,
      remaining: 90.00,
      paymentProgress: 52,
    },
    status: 'Em Produção',
    mockupImages: [
      'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
    ],
    createdAt: '2026-08-28T10:30:00Z',
    updatedAt: '2026-08-29T14:15:00Z',
  },
  {
    id: 'ped-2',
    code: '#PED-1025',
    clientName: 'Juliana Mendes',
    clientPhone: '(11) 98711-2233',
    clientInstagram: '@jumendes_festas',
    orderDate: '2026-08-29',
    deliveryDate: '2026-09-02',
    deliveryMethod: 'Motoboy',
    deliveryAddress: 'Rua das Flores, 450 - Moema, SP',
    theme: 'Safari Baby Menino',
    origin: 'Shopee',
    orderType: 'Kit Lembrancinhas',
    items: [
      {
        id: 'item-201',
        name: 'Kit Caixas Cenário Safari (Leão e Girafa)',
        quantity: 15,
        unitPrice: 9.80,
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-202',
        name: 'Tags de Agradecimento com Fita',
        quantity: 30,
        unitPrice: 1.20,
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
      }
    ],
    personalization: {
      honoreeName: 'Theo',
      age: '1 Ano',
      colorPalette: 'Verde Oliva, Bege e Dourado',
      tagPhrase: 'Theo fez 1 ano!',
      specialNotes: 'Entrega urgente via Motoboy antes das 12h'
    },
    financial: {
      paymentMethod: 'Cartão de Crédito',
      total: 183.00,
      deposit: 183.00,
      remaining: 0.00,
      paymentProgress: 100,
    },
    status: 'Arte Aprovada',
    mockupImages: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
    ],
    createdAt: '2026-08-29T11:00:00Z',
    updatedAt: '2026-08-29T16:00:00Z',
  },
  {
    id: 'ped-3',
    code: '#PED-1026',
    clientName: 'Carla Beatriz Souza',
    clientPhone: '(21) 97654-3210',
    clientInstagram: '@carla.beatriz',
    orderDate: '2026-08-25',
    deliveryDate: '2026-08-30',
    deliveryMethod: 'Correios (SEDEX)',
    deliveryAddress: 'Av. Atlântica, 1200, Copacabana - RJ',
    theme: 'Barbie & Princesas',
    origin: 'Instagram',
    orderType: 'Cadernos & Papelaria Escolar',
    items: [
      {
        id: 'item-301',
        name: 'Caderno A5 Laminado Holográfico Barbie',
        quantity: 2,
        unitPrice: 58.00,
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-302',
        name: 'Bloquinho de Anotações com Caneta Personalizada',
        quantity: 2,
        unitPrice: 24.00,
        imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=400&q=80',
      }
    ],
    personalization: {
      honoreeName: 'Valentina & Giovanna',
      age: 'Volta às Aulas',
      colorPalette: 'Pink, Rosa Choque e Prata',
      tagPhrase: 'Cadernos 2026',
      specialNotes: 'Embalar para presente separadamente.'
    },
    financial: {
      paymentMethod: 'PIX',
      total: 164.00,
      deposit: 164.00,
      remaining: 0.00,
      paymentProgress: 100,
    },
    status: 'Pronto p/ Envio',
    mockupImages: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    ],
    createdAt: '2026-08-25T09:00:00Z',
    updatedAt: '2026-08-29T18:00:00Z',
  }
];

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
