import { MockupTemplate, MockupCategory } from '../types/mockupTypes';

export const MOCKUP_CATEGORIES: { id: MockupCategory; label: string; icon: string }[] = [
  { id: 'todas', label: 'Todos os Modelos', icon: 'Sparkles' },
  { id: 'sacolinhas', label: 'Sacolinhas', icon: 'ShoppingBag' },
  { id: 'caixinhas', label: 'Caixinhas', icon: 'Box' },
  { id: 'centros-de-mesa', label: 'Centros de Mesa', icon: 'PartyPopper' },
  { id: 'tags', label: 'Tags & Etiquetas', icon: 'Tag' },
  { id: 'embalagens', label: 'Embalagens & Ziplock', icon: 'Package' },
  { id: 'papelaria', label: 'Papelaria & Convites', icon: 'FileText' },
  { id: 'festas', label: 'Porta Doces & Festas', icon: 'Gift' },
  { id: 'outros', label: 'Outros Modelos', icon: 'Layers' },
];

export const MOCKUP_TEMPLATES: MockupTemplate[] = [
  // =========================================================================
  // 1. CAIXA MILK (Model 1) - Frente + Lateral Contínuas (FRENTE -> LATERAL)
  // =========================================================================
  {
    id: 'caixa-milk',
    name: 'Caixa Milk',
    slug: 'caixa-milk',
    category: 'caixinhas',
    subcategory: 'Clássicos de Papelaria',
    description: 'Caixa clássica com topo triangular articulado, laço de cetim e estampa contínua entre frente e lateral.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'upper-center',
      safeMargins: { top: 0.03, bottom: 0.02, left: 0.02, right: 0.02 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.72
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 220, y: 780, width: 560, height: 100, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 820, rx: 270, ry: 45, blur: 22, opacity: 0.25 }
      },
      {
        type: 'floor_contact',
        bounds: { x: 250, y: 790, width: 480, height: 40, blur: 8, opacity: 0.45 },
        ellipse: { cx: 500, cy: 805, rx: 210, ry: 16, blur: 6, opacity: 0.45 }
      }
    ],
    faces: [
      // 1. Topo Telhado Frontal (0% a 72% horizontal, 0% a 25% vertical da textura contínua)
      {
        id: 'top_roof_front',
        name: 'Topo Frontal',
        printable: true,
        quad: {
          p0: { x: 300, y: 260 },
          p1: { x: 580, y: 260 },
          p2: { x: 620, y: 440 },
          p3: { x: 260, y: 440 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.72,
          startY: 0.0,
          endY: 0.25
        },
        gradientShade: {
          start: { x: 300, y: 260 },
          end: { x: 580, y: 440 },
          startColor: 'rgba(255,255,255,0.16)',
          endColor: 'rgba(0,0,0,0.03)'
        }
      },
      // 2. Topo Telhado Lateral (72% a 100% horizontal, 0% a 25% vertical da mesma textura contínua)
      {
        id: 'top_roof_side',
        name: 'Topo Lateral',
        printable: true,
        quad: {
          p0: { x: 580, y: 260 },
          p1: { x: 660, y: 230 },
          p2: { x: 720, y: 400 },
          p3: { x: 620, y: 440 },
        },
        textureSlice: {
          startX: 0.72,
          endX: 1.0,
          startY: 0.0,
          endY: 0.25
        },
        shadingColor: 'rgba(0, 0, 0, 0.22)',
        gradientShade: {
          start: { x: 580, y: 260 },
          end: { x: 720, y: 400 },
          startColor: 'rgba(0,0,0,0.12)',
          endColor: 'rgba(0,0,0,0.28)'
        }
      },
      // 3. Face Frontal Principal (0% a 72% horizontal, 25% a 100% vertical)
      {
        id: 'front',
        name: 'Frente',
        printable: true,
        quad: {
          p0: { x: 260, y: 440 },
          p1: { x: 620, y: 440 },
          p2: { x: 620, y: 790 },
          p3: { x: 260, y: 790 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.72,
          startY: 0.25,
          endY: 1.0
        },
        shadingColor: 'rgba(255, 255, 255, 0.02)',
        gradientShade: {
          start: { x: 260, y: 440 },
          end: { x: 620, y: 790 },
          startColor: 'rgba(255,255,255,0.06)',
          endColor: 'rgba(0,0,0,0.05)'
        }
      },
      // 4. Lateral Direita Principal (72% a 100% horizontal, 25% a 100% vertical)
      {
        id: 'side_right',
        name: 'Lateral',
        printable: true,
        quad: {
          p0: { x: 620, y: 440 },
          p1: { x: 720, y: 400 },
          p2: { x: 720, y: 740 },
          p3: { x: 620, y: 790 },
        },
        textureSlice: {
          startX: 0.72,
          endX: 1.0,
          startY: 0.25,
          endY: 1.0
        },
        shadingColor: 'rgba(0, 0, 0, 0.20)',
        gradientShade: {
          start: { x: 620, y: 440 },
          end: { x: 720, y: 740 },
          startColor: 'rgba(0,0,0,0.12)',
          endColor: 'rgba(0,0,0,0.28)'
        }
      }
    ],
    creases: [
      // Linha de Costura vertical entre frente e lateral
      { p1: { x: 620, y: 440 }, p2: { x: 620, y: 790 }, color: 'rgba(0,0,0,0.35)', width: 1.5, type: 'inner_shadow' },
      { p1: { x: 621, y: 440 }, p2: { x: 621, y: 790 }, color: 'rgba(255,255,255,0.4)', width: 1, type: 'outer_highlight' },
      // Vinco horizontal inferior do telhado
      { p1: { x: 260, y: 440 }, p2: { x: 620, y: 440 }, color: 'rgba(0,0,0,0.25)', width: 1.2, type: 'inner_shadow' },
      { p1: { x: 620, y: 440 }, p2: { x: 720, y: 400 }, color: 'rgba(0,0,0,0.3)', width: 1.2, type: 'inner_shadow' },
      // Vincos do topo
      { p1: { x: 300, y: 260 }, p2: { x: 580, y: 260 }, color: 'rgba(0,0,0,0.3)', width: 1.5 },
      { p1: { x: 580, y: 260 }, p2: { x: 660, y: 230 }, color: 'rgba(0,0,0,0.35)', width: 1.5 }
    ],
    overlays: [
      // Laço de Cetim Superior
      {
        type: 'bow_tie',
        points: [
          { x: 450, y: 250 },
          { x: 420, y: 225 },
          { x: 480, y: 225 },
          { x: 450, y: 290 }
        ],
        color: '#ffd1dc'
      }
    ]
  },

  // =========================================================================
  // 2. CAIXA PIRÂMIDE (Model 2) - Frente + Lateral Contínuas (FRENTE -> LATERAL)
  // =========================================================================
  {
    id: 'caixa-piramide',
    name: 'Caixa Pirâmide',
    slug: 'caixa-piramide',
    category: 'caixinhas',
    subcategory: 'Clássicos de Papelaria',
    description: 'Caixa piramidal com ápice pontiagudo e estampa contínua entre frente e lateral.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'pyramid-balanced',
      safeMargins: { top: 0.16, bottom: 0.03, left: 0.04, right: 0.04 },
      bleed: 0.015
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.65
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 240, y: 780, width: 520, height: 90, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 820, rx: 240, ry: 40, blur: 20, opacity: 0.25 }
      }
    ],
    faces: [
      // Face Frontal Triangular (0% a 65% da textura)
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 490, y: 180 },
          p1: { x: 510, y: 180 },
          p2: { x: 560, y: 810 },
          p3: { x: 330, y: 800 },
        },
        clipPolygon: [
          { x: 500, y: 180 },
          { x: 560, y: 810 },
          { x: 330, y: 800 }
        ],
        textureSlice: {
          startX: 0.0,
          endX: 0.65,
          startY: 0.0,
          endY: 1.0
        },
        gradientShade: {
          start: { x: 500, y: 180 },
          end: { x: 330, y: 800 },
          startColor: 'rgba(255,255,255,0.08)',
          endColor: 'rgba(0,0,0,0.05)'
        }
      },
      // Face Lateral Direita Triangular (65% a 100% da textura)
      {
        id: 'side_right',
        name: 'Lateral',
        quad: {
          p0: { x: 500, y: 180 },
          p1: { x: 520, y: 180 },
          p2: { x: 730, y: 770 },
          p3: { x: 560, y: 810 },
        },
        clipPolygon: [
          { x: 510, y: 180 },
          { x: 730, y: 770 },
          { x: 560, y: 810 }
        ],
        textureSlice: {
          startX: 0.65,
          endX: 1.0,
          startY: 0.0,
          endY: 1.0
        },
        shadingColor: 'rgba(0, 0, 0, 0.22)',
        gradientShade: {
          start: { x: 510, y: 180 },
          end: { x: 730, y: 770 },
          startColor: 'rgba(0,0,0,0.12)',
          endColor: 'rgba(0,0,0,0.28)'
        }
      }
    ],
    creases: [
      { p1: { x: 510, y: 180 }, p2: { x: 560, y: 810 }, color: 'rgba(0,0,0,0.32)', width: 1.5, type: 'inner_shadow' },
      { p1: { x: 511, y: 180 }, p2: { x: 561, y: 810 }, color: 'rgba(255,255,255,0.45)', width: 1, type: 'outer_highlight' },
      { p1: { x: 330, y: 800 }, p2: { x: 560, y: 810 }, color: 'rgba(0,0,0,0.25)', width: 1.2 },
      { p1: { x: 560, y: 810 }, p2: { x: 730, y: 770 }, color: 'rgba(0,0,0,0.25)', width: 1.2 }
    ]
  },

  // =========================================================================
  // 3. SACOLINHA ESCALOPADA HORIZONTAL (Model 3) - Frente + Lateral Contínuas
  // =========================================================================
  {
    id: 'sacolinha-escalopada-horizontal',
    name: 'Sacolinha Escalopada Horizontal',
    slug: 'sacolinha-escalopada-horizontal',
    category: 'sacolinhas',
    subcategory: 'Sacolinhas Decoradas',
    description: 'Sacola horizontal com borda recortada em ondas escalopadas e alças de fita de cetim.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.10, bottom: 0.03, left: 0.03, right: 0.03 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.78
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 180, y: 760, width: 640, height: 110, blur: 26, opacity: 0.28 },
        ellipse: { cx: 500, cy: 805, rx: 300, ry: 45, blur: 24, opacity: 0.25 }
      }
    ],
    faces: [
      // Face Frontal Principal (0% a 78% da textura contínua)
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 220, y: 380 },
          p1: { x: 700, y: 380 },
          p2: { x: 680, y: 790 },
          p3: { x: 240, y: 790 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.78,
          startY: 0.0,
          endY: 1.0
        },
        gradientShade: {
          start: { x: 220, y: 380 },
          end: { x: 700, y: 790 },
          startColor: 'rgba(255,255,255,0.06)',
          endColor: 'rgba(0,0,0,0.06)'
        }
      },
      // Dobra Lateral Direita (78% a 100% da mesma textura contínua)
      {
        id: 'side_right',
        name: 'Lateral',
        quad: {
          p0: { x: 700, y: 380 },
          p1: { x: 760, y: 340 },
          p2: { x: 740, y: 750 },
          p3: { x: 680, y: 790 },
        },
        textureSlice: {
          startX: 0.78,
          endX: 1.0,
          startY: 0.0,
          endY: 1.0
        },
        shadingColor: 'rgba(0, 0, 0, 0.20)',
        gradientShade: {
          start: { x: 700, y: 380 },
          end: { x: 760, y: 750 },
          startColor: 'rgba(0,0,0,0.08)',
          endColor: 'rgba(0,0,0,0.26)'
        }
      }
    ],
    creases: [
      { p1: { x: 700, y: 380 }, p2: { x: 680, y: 790 }, color: 'rgba(0,0,0,0.3)', width: 1.5, type: 'inner_shadow' },
      { p1: { x: 701, y: 380 }, p2: { x: 681, y: 790 }, color: 'rgba(255,255,255,0.4)', width: 1, type: 'outer_highlight' }
    ],
    overlays: [
      // Alça de Fita de Cetim Dupla
      {
        type: 'handle_ribbon',
        points: [
          { x: 380, y: 400 },
          { x: 420, y: 220 },
          { x: 580, y: 220 },
          { x: 620, y: 400 }
        ],
        color: '#ffb6c1'
      }
    ]
  },

  // =========================================================================
  // 4. SACOLINHA VERTICAL (Model 4) - Frente + Lateral Contínuas
  // =========================================================================
  {
    id: 'sacolinha-vertical',
    name: 'Sacolinha Vertical',
    slug: 'sacolinha-vertical',
    category: 'sacolinhas',
    subcategory: 'Sacolinhas Clássicas',
    description: 'Sacola vertical elegante com ilhós, cordão e fole lateral em estampa contínua.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.10, bottom: 0.03, left: 0.03, right: 0.03 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.75
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 260, y: 790, width: 480, height: 90, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 825, rx: 220, ry: 38, blur: 20, opacity: 0.25 }
      }
    ],
    faces: [
      // Face Frontal (0% a 75% da textura)
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 280, y: 300 },
          p1: { x: 640, y: 300 },
          p2: { x: 620, y: 810 },
          p3: { x: 300, y: 810 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.75,
          startY: 0.0,
          endY: 1.0
        },
        gradientShade: {
          start: { x: 280, y: 300 },
          end: { x: 640, y: 810 },
          startColor: 'rgba(255,255,255,0.06)',
          endColor: 'rgba(0,0,0,0.06)'
        }
      },
      // Lateral Fole Direita (75% a 100% da textura)
      {
        id: 'side_right',
        name: 'Lateral',
        quad: {
          p0: { x: 640, y: 300 },
          p1: { x: 720, y: 260 },
          p2: { x: 700, y: 770 },
          p3: { x: 620, y: 810 },
        },
        textureSlice: {
          startX: 0.75,
          endX: 1.0,
          startY: 0.0,
          endY: 1.0
        },
        shadingColor: 'rgba(0, 0, 0, 0.20)',
        gradientShade: {
          start: { x: 640, y: 300 },
          end: { x: 720, y: 770 },
          startColor: 'rgba(0,0,0,0.08)',
          endColor: 'rgba(0,0,0,0.26)'
        }
      }
    ],
    creases: [
      { p1: { x: 640, y: 300 }, p2: { x: 620, y: 810 }, color: 'rgba(0,0,0,0.3)', width: 1.5, type: 'inner_shadow' },
      { p1: { x: 641, y: 300 }, p2: { x: 621, y: 810 }, color: 'rgba(255,255,255,0.4)', width: 1, type: 'outer_highlight' }
    ],
    overlays: [
      {
        type: 'handle_cord',
        points: [
          { x: 420, y: 340 },
          { x: 440, y: 170 },
          { x: 540, y: 170 },
          { x: 560, y: 340 }
        ],
        color: '#e2e8f0'
      }
    ]
  },

  // =========================================================================
  // 5. ZIPLOCK PERSONALIZADO (Model 5) - Face Única Frontal
  // =========================================================================
  {
    id: 'ziplock-personalizado',
    name: 'Ziplock Personalizado',
    slug: 'ziplock-personalizado',
    category: 'embalagens',
    subcategory: 'Stand-up Pouch',
    description: 'Embalagem pouch metalizada com fecho ziplock hermético e área frontal personalizada.',
    facesSummary: ['Frente'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.06, bottom: 0.04, left: 0.04, right: 0.04 },
      bleed: 0.01
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 240, y: 800, width: 520, height: 80, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 830, rx: 240, ry: 35, blur: 20, opacity: 0.25 }
      }
    ],
    faces: [
      // Área de Impressão Frontal do Pacote (100% da textura)
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 300, y: 340 },
          p1: { x: 700, y: 340 },
          p2: { x: 670, y: 820 },
          p3: { x: 330, y: 820 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 1.0,
          startY: 0.0,
          endY: 1.0
        },
        gradientShade: {
          start: { x: 300, y: 340 },
          end: { x: 700, y: 820 },
          startColor: 'rgba(255,255,255,0.12)',
          endColor: 'rgba(0,0,0,0.06)'
        }
      }
    ],
    creases: [
      { p1: { x: 280, y: 220 }, p2: { x: 320, y: 825 }, color: 'rgba(0,0,0,0.15)', width: 2 },
      { p1: { x: 720, y: 220 }, p2: { x: 680, y: 825 }, color: 'rgba(0,0,0,0.15)', width: 2 },
      { p1: { x: 280, y: 290 }, p2: { x: 720, y: 290 }, color: 'rgba(0,0,0,0.22)', width: 2 }
    ],
    overlays: [
      {
        type: 'ziplock_seal',
        points: [
          { x: 280, y: 220 },
          { x: 720, y: 220 },
          { x: 720, y: 290 },
          { x: 280, y: 290 }
        ],
        color: '#f1f5f9'
      }
    ]
  },

  // =========================================================================
  // 6. MALETA CORAÇÃO (Model 6) - Frente + Lateral Contínuas
  // =========================================================================
  {
    id: 'maleta-coracao',
    name: 'Maleta Coração',
    slug: 'maleta-coracao',
    category: 'caixinhas',
    subcategory: 'Maletinhas Especiais',
    description: 'Caixa maleta luxo com fecho superior decorativo em formato de coração.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'upper-center',
      safeMargins: { top: 0.04, bottom: 0.02, left: 0.02, right: 0.02 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.76
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 200, y: 780, width: 600, height: 90, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 815, rx: 270, ry: 40, blur: 22, opacity: 0.25 }
      }
    ],
    faces: [
      // 1. Topo Fecho Coração (0% a 76% horizontal, 0% a 25% vertical)
      {
        id: 'top_flap',
        name: 'Topo Coração',
        printable: true,
        quad: {
          p0: { x: 310, y: 310 },
          p1: { x: 630, y: 310 },
          p2: { x: 680, y: 460 },
          p3: { x: 260, y: 460 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.76,
          startY: 0.0,
          endY: 0.25
        },
        gradientShade: {
          start: { x: 310, y: 310 },
          end: { x: 680, y: 460 },
          startColor: 'rgba(255,255,255,0.15)',
          endColor: 'rgba(0,0,0,0.04)'
        }
      },
      // 2. Face Frontal Principal (0% a 76% horizontal, 25% a 100% vertical)
      {
        id: 'front',
        name: 'Frente',
        printable: true,
        quad: {
          p0: { x: 260, y: 460 },
          p1: { x: 680, y: 460 },
          p2: { x: 660, y: 800 },
          p3: { x: 280, y: 800 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.76,
          startY: 0.25,
          endY: 1.0
        },
        gradientShade: {
          start: { x: 260, y: 460 },
          end: { x: 680, y: 800 },
          startColor: 'rgba(255,255,255,0.06)',
          endColor: 'rgba(0,0,0,0.06)'
        }
      },
      // 3. Lateral Direita (76% a 100% horizontal, 25% a 100% vertical)
      {
        id: 'side_right',
        name: 'Lateral',
        printable: true,
        quad: {
          p0: { x: 680, y: 460 },
          p1: { x: 750, y: 420 },
          p2: { x: 730, y: 760 },
          p3: { x: 660, y: 800 },
        },
        textureSlice: {
          startX: 0.76,
          endX: 1.0,
          startY: 0.25,
          endY: 1.0
        },
        shadingColor: 'rgba(0, 0, 0, 0.20)',
        gradientShade: {
          start: { x: 680, y: 460 },
          end: { x: 750, y: 760 },
          startColor: 'rgba(0,0,0,0.08)',
          endColor: 'rgba(0,0,0,0.26)'
        }
      }
    ],
    creases: [
      { p1: { x: 260, y: 460 }, p2: { x: 680, y: 460 }, color: 'rgba(0,0,0,0.25)', width: 1.5 },
      { p1: { x: 680, y: 460 }, p2: { x: 660, y: 800 }, color: 'rgba(0,0,0,0.3)', width: 1.5, type: 'inner_shadow' }
    ]
  },

  // =========================================================================
  // 7. MALETA ALTA ESCALOPADA (Model 7) - Frente + Lateral Contínuas
  // =========================================================================
  {
    id: 'maleta-alta-escalopada',
    name: 'Maleta Alta Escalopada',
    slug: 'maleta-alta-escalopada',
    category: 'caixinhas',
    subcategory: 'Maletinhas Especiais',
    description: 'Maletinha alta tipo gable box com abas escalopadas e alça embutida.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'upper-center',
      safeMargins: { top: 0.05, bottom: 0.02, left: 0.02, right: 0.02 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.74
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 240, y: 800, width: 520, height: 90, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 830, rx: 240, ry: 40, blur: 20, opacity: 0.25 }
      }
    ],
    faces: [
      // 1. Topo Alça (0% a 74% horizontal, 0% a 22% vertical)
      {
        id: 'top_handle',
        name: 'Topo Alça',
        printable: true,
        quad: {
          p0: { x: 320, y: 220 },
          p1: { x: 620, y: 220 },
          p2: { x: 660, y: 400 },
          p3: { x: 280, y: 400 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.74,
          startY: 0.0,
          endY: 0.22
        },
        gradientShade: {
          start: { x: 320, y: 220 },
          end: { x: 660, y: 400 },
          startColor: 'rgba(255,255,255,0.15)',
          endColor: 'rgba(0,0,0,0.04)'
        }
      },
      // 2. Face Frontal Principal (0% a 74% horizontal, 22% a 100% vertical)
      {
        id: 'front',
        name: 'Frente',
        printable: true,
        quad: {
          p0: { x: 280, y: 400 },
          p1: { x: 660, y: 400 },
          p2: { x: 640, y: 810 },
          p3: { x: 300, y: 810 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.74,
          startY: 0.22,
          endY: 1.0
        },
        gradientShade: {
          start: { x: 280, y: 400 },
          end: { x: 660, y: 810 },
          startColor: 'rgba(255,255,255,0.06)',
          endColor: 'rgba(0,0,0,0.06)'
        }
      },
      // 3. Lateral Direita (74% a 100% horizontal, 22% a 100% vertical)
      {
        id: 'side_right',
        name: 'Lateral',
        printable: true,
        quad: {
          p0: { x: 660, y: 400 },
          p1: { x: 740, y: 360 },
          p2: { x: 720, y: 770 },
          p3: { x: 640, y: 810 },
        },
        textureSlice: {
          startX: 0.74,
          endX: 1.0,
          startY: 0.22,
          endY: 1.0
        },
        shadingColor: 'rgba(0, 0, 0, 0.20)',
        gradientShade: {
          start: { x: 660, y: 400 },
          end: { x: 740, y: 770 },
          startColor: 'rgba(0,0,0,0.08)',
          endColor: 'rgba(0,0,0,0.26)'
        }
      }
    ],
    creases: [
      { p1: { x: 280, y: 400 }, p2: { x: 660, y: 400 }, color: 'rgba(0,0,0,0.25)', width: 1.5 },
      { p1: { x: 660, y: 400 }, p2: { x: 640, y: 810 }, color: 'rgba(0,0,0,0.3)', width: 1.5, type: 'inner_shadow' }
    ]
  },

  // =========================================================================
  // 8. CAIXA CANUDO (Model 8) - Frente + Lateral Contínuas
  // =========================================================================
  {
    id: 'caixa-canudo',
    name: 'Caixa Canudo',
    slug: 'caixa-canudo',
    category: 'caixinhas',
    subcategory: 'Caixas com Aplique',
    description: 'Caixa vertical com abertura superior para canudo decorativo em estampa contínua.',
    facesSummary: ['Frente', 'Lateral', 'Tampa'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.04, bottom: 0.02, left: 0.02, right: 0.02 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.72
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 280, y: 790, width: 440, height: 90, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 825, rx: 200, ry: 38, blur: 20, opacity: 0.25 }
      }
    ],
    faces: [
      // 1. Tampa Superior (0% a 72% horizontal, 0% a 18% vertical)
      {
        id: 'top',
        name: 'Tampa',
        printable: true,
        quad: {
          p0: { x: 300, y: 260 },
          p1: { x: 540, y: 260 },
          p2: { x: 620, y: 340 },
          p3: { x: 300, y: 340 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.72,
          startY: 0.0,
          endY: 0.18
        },
        shadingColor: 'rgba(255,255,255,0.18)'
      },
      // 2. Face Frontal Principal (0% a 72% horizontal, 18% a 100% vertical)
      {
        id: 'front',
        name: 'Frente',
        printable: true,
        quad: {
          p0: { x: 300, y: 340 },
          p1: { x: 620, y: 340 },
          p2: { x: 610, y: 810 },
          p3: { x: 310, y: 810 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.72,
          startY: 0.18,
          endY: 1.0
        },
        gradientShade: {
          start: { x: 300, y: 340 },
          end: { x: 620, y: 810 },
          startColor: 'rgba(255,255,255,0.06)',
          endColor: 'rgba(0,0,0,0.06)'
        }
      },
      // 3. Lateral Direita (72% a 100% horizontal, 18% a 100% vertical)
      {
        id: 'side_right',
        name: 'Lateral',
        printable: true,
        quad: {
          p0: { x: 620, y: 340 },
          p1: { x: 700, y: 300 },
          p2: { x: 690, y: 770 },
          p3: { x: 610, y: 810 },
        },
        textureSlice: {
          startX: 0.72,
          endX: 1.0,
          startY: 0.18,
          endY: 1.0
        },
        shadingColor: 'rgba(0, 0, 0, 0.20)',
        gradientShade: {
          start: { x: 620, y: 340 },
          end: { x: 700, y: 770 },
          startColor: 'rgba(0,0,0,0.08)',
          endColor: 'rgba(0,0,0,0.26)'
        }
      }
    ],
    creases: [
      { p1: { x: 620, y: 340 }, p2: { x: 610, y: 810 }, color: 'rgba(0,0,0,0.3)', width: 1.5, type: 'inner_shadow' }
    ]
  },

  // =========================================================================
  // 9. CENTRO DE MESA ESCALOPADO (Model 9) - Frente + Lateral Contínuas
  // =========================================================================
  {
    id: 'centro-de-mesa-escalopado',
    name: 'Centro de Mesa Escalopado',
    slug: 'centro-de-mesa-escalopado',
    category: 'centros-de-mesa',
    subcategory: 'Cachepots & Centros de Mesa',
    description: 'Cachepot decorado com bordas escalopadas, ampla face frontal e laterais de apoio.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.06, bottom: 0.03, left: 0.03, right: 0.03 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.75
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 200, y: 780, width: 600, height: 100, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 820, rx: 280, ry: 45, blur: 22, opacity: 0.25 }
      }
    ],
    faces: [
      // Face Frontal do Cachepot (0% a 75% da textura)
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 240, y: 360 },
          p1: { x: 680, y: 360 },
          p2: { x: 620, y: 800 },
          p3: { x: 300, y: 800 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.75,
          startY: 0.0,
          endY: 1.0
        },
        gradientShade: {
          start: { x: 240, y: 360 },
          end: { x: 680, y: 800 },
          startColor: 'rgba(255,255,255,0.08)',
          endColor: 'rgba(0,0,0,0.06)'
        }
      },
      // Lateral Direita do Cachepot (75% a 100% da textura)
      {
        id: 'side_right',
        name: 'Lateral',
        quad: {
          p0: { x: 680, y: 360 },
          p1: { x: 760, y: 380 },
          p2: { x: 700, y: 760 },
          p3: { x: 620, y: 800 },
        },
        textureSlice: {
          startX: 0.75,
          endX: 1.0,
          startY: 0.0,
          endY: 1.0
        },
        shadingColor: 'rgba(0, 0, 0, 0.20)',
        gradientShade: {
          start: { x: 680, y: 360 },
          end: { x: 760, y: 760 },
          startColor: 'rgba(0,0,0,0.08)',
          endColor: 'rgba(0,0,0,0.26)'
        }
      }
    ],
    creases: [
      { p1: { x: 680, y: 360 }, p2: { x: 620, y: 800 }, color: 'rgba(0,0,0,0.25)', width: 1.5, type: 'inner_shadow' }
    ]
  },

  // =========================================================================
  // 10. TAG REDONDA (Model 10) - Face Única Frontal (Item Plano)
  // =========================================================================
  {
    id: 'tag-redonda-5cm',
    name: 'Tag Redonda (5 cm)',
    slug: 'tag-redonda-5cm',
    category: 'tags',
    subcategory: 'Tags Circulares',
    tagSize: '5 cm',
    description: 'Tag circular clássica com recorte perfeito, furo para cordão e acabamento profissional.',
    facesSummary: ['Frente'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.08, bottom: 0.08, left: 0.08, right: 0.08 },
      bleed: 0.02
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 230, y: 760, width: 540, height: 80, blur: 22, opacity: 0.25 },
        ellipse: { cx: 500, cy: 790, rx: 250, ry: 35, blur: 18, opacity: 0.25 }
      }
    ],
    faces: [
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 220, y: 220 },
          p1: { x: 780, y: 220 },
          p2: { x: 780, y: 780 },
          p3: { x: 220, y: 780 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 1.0,
          startY: 0.0,
          endY: 1.0
        },
        clipPolygon: Array.from({ length: 36 }, (_, i) => {
          const angle = (i / 36) * Math.PI * 2;
          return {
            x: 500 + Math.cos(angle) * 280,
            y: 500 + Math.sin(angle) * 280
          };
        }),
        gradientShade: {
          start: { x: 220, y: 220 },
          end: { x: 780, y: 780 },
          startColor: 'rgba(255,255,255,0.1)',
          endColor: 'rgba(0,0,0,0.05)'
        }
      }
    ],
    overlays: [
      {
        type: 'hole_punch',
        points: [{ x: 500, y: 260 }],
        color: '#ffffff'
      }
    ]
  },

  // =========================================================================
  // 11. TAG QUADRADA (Model 11) - Face Única Frontal (Item Plano)
  // =========================================================================
  {
    id: 'tag-quadrada-5x5',
    name: 'Tag Quadrada (5x5 cm)',
    slug: 'tag-quadrada-5x5',
    category: 'tags',
    subcategory: 'Tags Quadradas',
    tagSize: '5x5 cm',
    description: 'Tag quadrada com cantos delicadamente arredondados e furo superior para fita.',
    facesSummary: ['Frente'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.08, bottom: 0.08, left: 0.08, right: 0.08 },
      bleed: 0.02
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 220, y: 760, width: 560, height: 80, blur: 22, opacity: 0.25 },
        ellipse: { cx: 500, cy: 790, rx: 260, ry: 35, blur: 18, opacity: 0.25 }
      }
    ],
    faces: [
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 240, y: 240 },
          p1: { x: 760, y: 240 },
          p2: { x: 760, y: 760 },
          p3: { x: 240, y: 760 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 1.0,
          startY: 0.0,
          endY: 1.0
        },
        gradientShade: {
          start: { x: 240, y: 240 },
          end: { x: 760, y: 760 },
          startColor: 'rgba(255,255,255,0.08)',
          endColor: 'rgba(0,0,0,0.05)'
        }
      }
    ],
    overlays: [
      {
        type: 'hole_punch',
        points: [{ x: 500, y: 280 }],
        color: '#ffffff'
      }
    ]
  },

  // =========================================================================
  // MODELOS ADICIONAIS DO CATÁLOGO COM CONTINUOUS WRAP
  // =========================================================================
  {
    id: 'caixa-sushi',
    name: 'Caixa Sushi',
    slug: 'caixa-sushi',
    category: 'caixinhas',
    subcategory: 'Festas Especiais',
    description: 'Caixa com base trapézio e topo articulado de papelaria de luxo.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.03, bottom: 0.03, left: 0.03, right: 0.03 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.75
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 220, y: 790, width: 560, height: 90, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 825, rx: 260, ry: 40, blur: 20, opacity: 0.25 }
      }
    ],
    faces: [
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 280, y: 380 },
          p1: { x: 660, y: 380 },
          p2: { x: 610, y: 800 },
          p3: { x: 330, y: 800 },
        },
        textureSlice: { startX: 0.0, endX: 0.75 },
        gradientShade: {
          start: { x: 280, y: 380 },
          end: { x: 660, y: 800 },
          startColor: 'rgba(255,255,255,0.08)',
          endColor: 'rgba(0,0,0,0.06)'
        }
      },
      {
        id: 'side_right',
        name: 'Lateral',
        quad: {
          p0: { x: 660, y: 380 },
          p1: { x: 740, y: 340 },
          p2: { x: 690, y: 760 },
          p3: { x: 610, y: 800 },
        },
        textureSlice: { startX: 0.75, endX: 1.0 },
        shadingColor: 'rgba(0, 0, 0, 0.20)'
      }
    ]
  },
  {
    id: 'caixa-bala',
    name: 'Caixa Bala',
    slug: 'caixa-bala',
    category: 'caixinhas',
    subcategory: 'Festas Especiais',
    description: 'Caixa formato bombom/bala com laterais franzidas e laços de fita.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.03, bottom: 0.03, left: 0.03, right: 0.03 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.75
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 160, y: 740, width: 680, height: 100, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 780, rx: 320, ry: 45, blur: 22, opacity: 0.25 }
      }
    ],
    faces: [
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 280, y: 340 },
          p1: { x: 640, y: 340 },
          p2: { x: 640, y: 700 },
          p3: { x: 280, y: 700 },
        },
        textureSlice: { startX: 0.0, endX: 0.75 }
      },
      {
        id: 'side_right',
        name: 'Lateral',
        quad: {
          p0: { x: 640, y: 340 },
          p1: { x: 740, y: 340 },
          p2: { x: 740, y: 700 },
          p3: { x: 640, y: 700 },
        },
        textureSlice: { startX: 0.75, endX: 1.0 },
        shadingColor: 'rgba(0, 0, 0, 0.20)'
      }
    ]
  },
  {
    id: 'caixa-cubo',
    name: 'Caixa Cubo',
    slug: 'caixa-cubo',
    category: 'caixinhas',
    subcategory: 'Básicos',
    description: 'Caixa cúbica perfeita com visão 3D frontal e lateral.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.03, bottom: 0.03, left: 0.03, right: 0.03 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.70
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 220, y: 780, width: 560, height: 90, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 815, rx: 250, ry: 40, blur: 20, opacity: 0.25 }
      }
    ],
    faces: [
      {
        id: 'top',
        name: 'Tampa',
        printable: true,
        quad: {
          p0: { x: 280, y: 400 },
          p1: { x: 400, y: 340 },
          p2: { x: 740, y: 340 },
          p3: { x: 620, y: 400 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.70,
          startY: 0.0,
          endY: 0.28
        },
        shadingColor: 'rgba(255, 255, 255, 0.15)',
        gradientShade: {
          start: { x: 280, y: 400 },
          end: { x: 740, y: 340 },
          startColor: 'rgba(255,255,255,0.18)',
          endColor: 'rgba(0,0,0,0.02)'
        }
      },
      {
        id: 'front',
        name: 'Frente',
        printable: true,
        quad: {
          p0: { x: 280, y: 400 },
          p1: { x: 620, y: 400 },
          p2: { x: 620, y: 780 },
          p3: { x: 280, y: 780 },
        },
        textureSlice: {
          startX: 0.0,
          endX: 0.70,
          startY: 0.28,
          endY: 1.0
        },
        gradientShade: {
          start: { x: 280, y: 400 },
          end: { x: 620, y: 780 },
          startColor: 'rgba(255,255,255,0.06)',
          endColor: 'rgba(0,0,0,0.06)'
        }
      },
      {
        id: 'side_right',
        name: 'Lateral',
        printable: true,
        quad: {
          p0: { x: 620, y: 400 },
          p1: { x: 740, y: 340 },
          p2: { x: 740, y: 720 },
          p3: { x: 620, y: 780 },
        },
        textureSlice: {
          startX: 0.70,
          endX: 1.0,
          startY: 0.28,
          endY: 1.0
        },
        shadingColor: 'rgba(0, 0, 0, 0.20)',
        gradientShade: {
          start: { x: 620, y: 400 },
          end: { x: 740, y: 720 },
          startColor: 'rgba(0,0,0,0.08)',
          endColor: 'rgba(0,0,0,0.26)'
        }
      }
    ]
  },
  {
    id: 'porta-bis',
    name: 'Porta Bis Duplo',
    slug: 'porta-bis',
    category: 'festas',
    subcategory: 'Guloseimas',
    description: 'Suporte personalizado para chocolates Bis com aplique 3D frontal.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.03, bottom: 0.03, left: 0.03, right: 0.03 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.75
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 260, y: 770, width: 480, height: 80, blur: 20, opacity: 0.25 },
        ellipse: { cx: 500, cy: 800, rx: 220, ry: 35, blur: 18, opacity: 0.25 }
      }
    ],
    faces: [
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 280, y: 400 },
          p1: { x: 640, y: 400 },
          p2: { x: 640, y: 780 },
          p3: { x: 280, y: 780 },
        },
        textureSlice: { startX: 0.0, endX: 0.75 }
      },
      {
        id: 'side_right',
        name: 'Lateral',
        quad: {
          p0: { x: 640, y: 400 },
          p1: { x: 720, y: 360 },
          p2: { x: 720, y: 740 },
          p3: { x: 640, y: 780 },
        },
        textureSlice: { startX: 0.75, endX: 1.0 },
        shadingColor: 'rgba(0, 0, 0, 0.20)'
      }
    ]
  },
  {
    id: 'porta-kitkat',
    name: 'Porta KitKat Luxo',
    slug: 'porta-kitkat',
    category: 'festas',
    subcategory: 'Guloseimas',
    description: 'Porta chocolate KitKat em formato livro com passamanarias e visor.',
    facesSummary: ['Frente', 'Lateral'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.03, bottom: 0.03, left: 0.03, right: 0.03 },
      bleed: 0.01
    },
    seamConfig: {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint: 0.78
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 220, y: 780, width: 560, height: 90, blur: 24, opacity: 0.28 },
        ellipse: { cx: 500, cy: 815, rx: 250, ry: 40, blur: 20, opacity: 0.25 }
      }
    ],
    faces: [
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 280, y: 320 },
          p1: { x: 680, y: 320 },
          p2: { x: 680, y: 800 },
          p3: { x: 280, y: 800 },
        },
        textureSlice: { startX: 0.0, endX: 0.78 },
        gradientShade: {
          start: { x: 280, y: 320 },
          end: { x: 680, y: 800 },
          startColor: 'rgba(255,255,255,0.06)',
          endColor: 'rgba(0,0,0,0.06)'
        }
      },
      {
        id: 'side_right',
        name: 'Lombada',
        quad: {
          p0: { x: 680, y: 320 },
          p1: { x: 750, y: 300 },
          p2: { x: 750, y: 780 },
          p3: { x: 680, y: 800 },
        },
        textureSlice: { startX: 0.78, endX: 1.0 },
        shadingColor: 'rgba(0, 0, 0, 0.22)'
      }
    ]
  },
  {
    id: 'tag-escalopada',
    name: 'Tag Escalopada',
    slug: 'tag-escalopada',
    category: 'tags',
    subcategory: 'Tags Especiais',
    tagSize: '6 cm',
    description: 'Tag redonda com bordas em flor escalopada e furo central.',
    facesSummary: ['Frente'],
    artPlacementConfig: {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins: { top: 0.08, bottom: 0.08, left: 0.08, right: 0.08 },
      bleed: 0.02
    },
    canvasSize: { width: 1000, height: 1000 },
    active: true,
    shadows: [
      {
        type: 'floor_soft',
        bounds: { x: 230, y: 760, width: 540, height: 80, blur: 22, opacity: 0.25 },
        ellipse: { cx: 500, cy: 790, rx: 250, ry: 35, blur: 18, opacity: 0.25 }
      }
    ],
    faces: [
      {
        id: 'front',
        name: 'Frente',
        quad: {
          p0: { x: 220, y: 220 },
          p1: { x: 780, y: 220 },
          p2: { x: 780, y: 780 },
          p3: { x: 220, y: 780 },
        },
        textureSlice: { startX: 0.0, endX: 1.0 },
        clipPolygon: Array.from({ length: 48 }, (_, i) => {
          const angle = (i / 48) * Math.PI * 2;
          const r = 280 + Math.sin(i * 1.5) * 15;
          return {
            x: 500 + Math.cos(angle) * r,
            y: 500 + Math.sin(angle) * r
          };
        })
      }
    ]
  }
];

// Helper para buscar templates por categoria ou termo de busca
export function filterMockupTemplates(
  categoryOrTemplates: MockupTemplate[] | MockupCategory,
  categoryOrQuery: MockupCategory | string = 'todas',
  searchQuery: string = ''
): MockupTemplate[] {
  let list: MockupTemplate[];
  let cat: MockupCategory;
  let query: string;

  if (Array.isArray(categoryOrTemplates)) {
    list = categoryOrTemplates;
    cat = (categoryOrQuery as MockupCategory) || 'todas';
    query = searchQuery.trim().toLowerCase();
  } else {
    list = MOCKUP_TEMPLATES;
    cat = (categoryOrTemplates as MockupCategory) || 'todas';
    query = (categoryOrQuery as string).trim().toLowerCase();
  }

  return list.filter((template) => {
    if (!template.active) return false;
    const matchesCategory = cat === 'todas' || template.category === cat;
    const matchesSearch =
      !query ||
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      (template.subcategory && template.subcategory.toLowerCase().includes(query)) ||
      (template.tagSize && template.tagSize.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });
}
