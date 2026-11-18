import {
  MockupCategory,
  MockupFace,
  MockupTemplate,
  ModelAnalysisResult,
  Point2D,
  Quad2D,
  SurfaceConfig,
  SeamConfig,
  ArtPlacementConfig,
  ArtFocalStrategy,
  SafeMargins
} from '../types/mockupTypes';
import { loadImageFromFile } from './mockupRenderer';

/**
 * Detecta e retifica a superfície útil do produto a partir de uma fotografia.
 * Isola o objeto do fundo, localiza o quadrilátero da face e calcula a proporção geométrica real
 * corrigida de perspectiva (independente de zoom, margens ou resolução da câmera).
 */
export function detectProductSurface(img: HTMLImageElement): SurfaceConfig {
  const analysisWidth = 320;
  const analysisHeight = Math.round((img.height / img.width) * analysisWidth) || 320;

  const canvas = document.createElement('canvas');
  canvas.width = analysisWidth;
  canvas.height = analysisHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    // Fallback padrão se não for possível acessar o contexto 2D
    const aspect = img.width / img.height;
    return {
      quad: {
        p0: { x: 0.15, y: 0.15 },
        p1: { x: 0.85, y: 0.15 },
        p2: { x: 0.85, y: 0.85 },
        p3: { x: 0.15, y: 0.85 },
      },
      rectifiedWidth: img.width * 0.7,
      rectifiedHeight: img.height * 0.7,
      aspectRatio: aspect,
      confidence: 0.8
    };
  }

  ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight);
  const imgData = ctx.getImageData(0, 0, analysisWidth, analysisHeight);
  const data = imgData.data;

  // 1. Amostragem das 4 bordas para estimar cor do fundo
  const samplePixels: number[][] = [];
  for (let x = 0; x < analysisWidth; x += 10) {
    // Top & Bottom
    const topIdx = (0 * analysisWidth + x) * 4;
    const botIdx = ((analysisHeight - 1) * analysisWidth + x) * 4;
    samplePixels.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
    samplePixels.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
  }
  for (let y = 0; y < analysisHeight; y += 10) {
    // Left & Right
    const leftIdx = (y * analysisWidth + 0) * 4;
    const rightIdx = (y * analysisWidth + (analysisWidth - 1)) * 4;
    samplePixels.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
    samplePixels.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
  }

  // Cor média de fundo
  let bgR = 0, bgG = 0, bgB = 0;
  for (const p of samplePixels) {
    bgR += p[0];
    bgG += p[1];
    bgB += p[2];
  }
  bgR /= samplePixels.length;
  bgG /= samplePixels.length;
  bgB /= samplePixels.length;

  // 2. Limiarização e detecção do polígono do produto
  let minX = analysisWidth, maxX = 0, minY = analysisHeight, maxY = 0;
  let foregroundCount = 0;

  // Matriz de pontos de primeiro plano
  const fgPoints: Point2D[] = [];
  const threshold = 28; // Distância euclidiana mínima para ser considerado produto

  for (let y = 0; y < analysisHeight; y += 2) {
    for (let x = 0; x < analysisWidth; x += 2) {
      const idx = (y * analysisWidth + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a < 50) continue; // Transparente

      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      if (dist > threshold) {
        foregroundCount++;
        fgPoints.push({ x, y });
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const totalEvaluated = (analysisWidth / 2) * (analysisHeight / 2);
  const fgRatio = foregroundCount / totalEvaluated;

  // Se a detecção falhar por contraste baixo ou imagem vazia
  if (fgRatio < 0.05 || minX >= maxX || minY >= maxY) {
    const rawAspect = img.width / img.height;
    return {
      quad: {
        p0: { x: 0.15, y: 0.15 },
        p1: { x: 0.85, y: 0.15 },
        p2: { x: 0.85, y: 0.85 },
        p3: { x: 0.15, y: 0.85 },
      },
      rectifiedWidth: img.width * 0.7,
      rectifiedHeight: img.height * 0.7,
      aspectRatio: rawAspect,
      confidence: 0.40 // Baixa confiança
    };
  }

  // 3. Localização dos 4 cantos extremos do produto (p0=TopLeft, p1=TopRight, p2=BotRight, p3=BotLeft)
  let p0 = { x: minX, y: minY };
  let p1 = { x: maxX, y: minY };
  let p2 = { x: maxX, y: maxY };
  let p3 = { x: minX, y: maxY };

  let minTL = Infinity, maxTR = -Infinity, maxBR = -Infinity, minBL = Infinity;

  for (const pt of fgPoints) {
    // Top-Left: minimiza x + y
    if (pt.x + pt.y < minTL) {
      minTL = pt.x + pt.y;
      p0 = pt;
    }
    // Top-Right: maximiza x - y
    if (pt.x - pt.y > maxTR) {
      maxTR = pt.x - pt.y;
      p1 = pt;
    }
    // Bottom-Right: maximiza x + y
    if (pt.x + pt.y > maxBR) {
      maxBR = pt.x + pt.y;
      p2 = pt;
    }
    // Bottom-Left: minimiza x - y
    if (pt.x - pt.y < minBL) {
      minBL = pt.x - pt.y;
      p3 = pt;
    }
  }

  // Normaliza os cantos para coordenadas 0..1
  const normQuad: Quad2D = {
    p0: { x: p0.x / analysisWidth, y: p0.y / analysisHeight },
    p1: { x: p1.x / analysisWidth, y: p1.y / analysisHeight },
    p2: { x: p2.x / analysisWidth, y: p2.y / analysisHeight },
    p3: { x: p3.x / analysisWidth, y: p3.y / analysisHeight },
  };

  // 4. Retificação e cálculo de distâncias métricas reais da superfície
  const topWidth = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const botWidth = Math.hypot(p2.x - p3.x, p2.y - p3.y);
  const leftHeight = Math.hypot(p3.x - p0.x, p3.y - p0.y);
  const rightHeight = Math.hypot(p2.x - p1.x, p2.y - p1.y);

  const rectifiedWidth = (topWidth + botWidth) / 2;
  const rectifiedHeight = (leftHeight + rightHeight) / 2;

  let aspectRatio = rectifiedHeight > 0 ? rectifiedWidth / rectifiedHeight : 1.0;
  // Limites saudáveis de aspect ratio para caixinhas e produtos de papelaria (0.25 a 4.0)
  aspectRatio = Math.max(0.25, Math.min(4.0, aspectRatio));

  // 5. Cálculo do nível de confiança
  let confidence = 0.90;
  if (fgRatio < 0.12 || fgRatio > 0.95) confidence -= 0.25;
  if (rectifiedWidth < analysisWidth * 0.15 || rectifiedHeight < analysisHeight * 0.15) confidence -= 0.30;

  return {
    quad: normQuad,
    rectifiedWidth,
    rectifiedHeight,
    aspectRatio,
    confidence: Math.max(0.2, Math.min(0.98, confidence))
  };
}

/**
 * Constrói dinamicamente o template completo do produto a partir das configurações geométricas analisadas.
 * Garante que faces, proporções, costuras (seams), vincos (creases) e sombras correspondam exatamente
 * à geometria do molde cadastrado pela usuária.
 */
export function buildCustomTemplateFromConfig(
  name: string,
  category: MockupCategory,
  idOrSlug: string,
  frontSurface?: SurfaceConfig | null,
  sideSurface?: SurfaceConfig | null,
  customSeamConfig?: SeamConfig | null,
  hasSide: boolean = true,
  frontImageUrl?: string,
  sideImageUrl?: string,
  userId?: string
): MockupTemplate {
  const frontAspect = frontSurface?.aspectRatio || 0.75;
  const sideAspect = (hasSide && sideSurface) ? (sideSurface.aspectRatio || 0.38) : (hasSide ? frontAspect * 0.45 : 0);

  const faces: MockupFace[] = [];
  const facesSummary: string[] = ['Frente'];
  let seamConfig: SeamConfig | undefined = undefined;

  if (hasSide) {
    facesSummary.push('Lateral');
    const totalUnfoldedWidth = frontAspect + sideAspect;
    let seamPoint = customSeamConfig?.seamPoint ?? (frontAspect / (totalUnfoldedWidth || 1.0));
    seamPoint = Math.max(0.40, Math.min(0.88, seamPoint));
    seamPoint = Number(seamPoint.toFixed(3));

    seamConfig = {
      frontEdge: 'right',
      sideEdge: 'left',
      direction: 'front-to-side',
      seamPoint
    };

    const sideProjFactor = 0.85;
    const apparentAspect = frontAspect + sideAspect * sideProjFactor;

    let H = 500;
    let W = H * apparentAspect;

    if (W > 680) {
      W = 680;
      H = W / apparentAspect;
    }
    if (H > 580) {
      H = 580;
      W = H * apparentAspect;
    }

    const W_front = Math.round(W * (frontAspect / apparentAspect));
    const W_side = Math.round(W - W_front);

    const X_start = Math.round((1000 - W) / 2);
    const X_seam = X_start + W_front;
    const X_end = X_start + Math.round(W);

    const Y_bot = 800;
    const Y_top = Math.round(Y_bot - H);
    const Y_side_tilt = Math.round(W_side * 0.35);

    const isRoofDetected = frontSurface?.quad ? (
      (frontSurface.quad.p1.x - frontSurface.quad.p0.x) < (frontSurface.quad.p2.x - frontSurface.quad.p3.x) * 0.95
    ) : false;

    const hasTopRoof =
      category === 'caixinhas' &&
      frontAspect > 0.50 &&
      frontAspect < 1.35 &&
      (isRoofDetected ||
        name.toLowerCase().includes('milk') ||
        name.toLowerCase().includes('malet') ||
        name.toLowerCase().includes('bala') ||
        name.toLowerCase().includes('lancheira'));

    if (hasTopRoof) {
      facesSummary.push('Topo');

      const H_roof = Math.round(H * 0.25);
      const H_body = H - H_roof;
      const Y_shoulder = Y_bot - H_body;

      const W_ridge = Math.round(W_front * 0.78);
      const X_ridge_left = X_start + Math.round((W_front - W_ridge) / 2);
      const X_ridge_right = X_ridge_left + W_ridge;

      // 1. Topo Frontal
      faces.push({
        id: 'front_top',
        name: 'Topo Frontal',
        printable: true,
        quad: {
          p0: { x: X_ridge_left, y: Y_top },
          p1: { x: X_ridge_right, y: Y_top },
          p2: { x: X_seam, y: Y_shoulder },
          p3: { x: X_start, y: Y_shoulder },
        },
        textureSlice: {
          startX: 0.0,
          endX: seamPoint,
          startY: 0.0,
          endY: 0.25,
        },
        gradientShade: {
          start: { x: X_ridge_left, y: Y_top },
          end: { x: X_seam, y: Y_shoulder },
          startColor: 'rgba(255,255,255,0.15)',
          endColor: 'rgba(0,0,0,0.03)',
        }
      });

      // 2. Topo Lateral
      faces.push({
        id: 'side_top',
        name: 'Topo Lateral',
        printable: true,
        quad: {
          p0: { x: X_ridge_right, y: Y_top },
          p1: { x: X_end - Math.round(W_side * 0.15), y: Y_top - Y_side_tilt },
          p2: { x: X_end, y: Y_shoulder - Y_side_tilt },
          p3: { x: X_seam, y: Y_shoulder },
        },
        textureSlice: {
          startX: seamPoint,
          endX: 1.0,
          startY: 0.0,
          endY: 0.25,
        },
        shadingColor: 'rgba(0, 0, 0, 0.22)',
        gradientShade: {
          start: { x: X_ridge_right, y: Y_top },
          end: { x: X_end, y: Y_shoulder - Y_side_tilt },
          startColor: 'rgba(0,0,0,0.12)',
          endColor: 'rgba(0,0,0,0.28)',
        }
      });

      // 3. Frente Principal
      faces.push({
        id: 'front_body',
        name: 'Frente',
        printable: true,
        quad: {
          p0: { x: X_start, y: Y_shoulder },
          p1: { x: X_seam, y: Y_shoulder },
          p2: { x: X_seam, y: Y_bot },
          p3: { x: X_start, y: Y_bot },
        },
        textureSlice: {
          startX: 0.0,
          endX: seamPoint,
          startY: 0.25,
          endY: 1.0,
        },
        shadingColor: 'rgba(255, 255, 255, 0.04)',
        gradientShade: {
          start: { x: X_start, y: Y_shoulder },
          end: { x: X_seam, y: Y_bot },
          startColor: 'rgba(255,255,255,0.06)',
          endColor: 'rgba(0,0,0,0.06)',
        }
      });

      // 4. Lateral Principal
      faces.push({
        id: 'side_body',
        name: 'Lateral',
        printable: true,
        quad: {
          p0: { x: X_seam, y: Y_shoulder },
          p1: { x: X_end, y: Y_shoulder - Y_side_tilt },
          p2: { x: X_end, y: Y_bot - Y_side_tilt },
          p3: { x: X_seam, y: Y_bot },
        },
        textureSlice: {
          startX: seamPoint,
          endX: 1.0,
          startY: 0.25,
          endY: 1.0,
        },
        shadingColor: 'rgba(0, 0, 0, 0.20)',
        gradientShade: {
          start: { x: X_seam, y: Y_shoulder },
          end: { x: X_end, y: Y_bot - Y_side_tilt },
          startColor: 'rgba(0,0,0,0.08)',
          endColor: 'rgba(0,0,0,0.28)',
        }
      });
    } else {
      // 2 Faces: Frente + Lateral Contínuas
      faces.push({
        id: 'front',
        name: 'Frente',
        printable: true,
        quad: {
          p0: { x: X_start, y: Y_top },
          p1: { x: X_seam, y: Y_top },
          p2: { x: X_seam, y: Y_bot },
          p3: { x: X_start, y: Y_bot },
        },
        textureSlice: {
          startX: 0.0,
          endX: seamPoint,
          startY: 0.0,
          endY: 1.0,
        },
        shadingColor: 'rgba(255, 255, 255, 0.04)',
        gradientShade: {
          start: { x: X_start, y: Y_top },
          end: { x: X_seam, y: Y_bot },
          startColor: 'rgba(255,255,255,0.06)',
          endColor: 'rgba(0,0,0,0.06)',
        }
      });

      faces.push({
        id: 'side_right',
        name: 'Lateral',
        printable: true,
        quad: {
          p0: { x: X_seam, y: Y_top },
          p1: { x: X_end, y: Y_top - Y_side_tilt },
          p2: { x: X_end, y: Y_bot - Y_side_tilt },
          p3: { x: X_seam, y: Y_bot },
        },
        textureSlice: {
          startX: seamPoint,
          endX: 1.0,
          startY: 0.0,
          endY: 1.0,
        },
        shadingColor: 'rgba(0, 0, 0, 0.20)',
        gradientShade: {
          start: { x: X_seam, y: Y_top },
          end: { x: X_end, y: Y_bot - Y_side_tilt },
          startColor: 'rgba(0,0,0,0.08)',
          endColor: 'rgba(0,0,0,0.28)',
        }
      });
    }

    const H_roof = hasTopRoof ? Math.round(H * 0.25) : 0;
    const Y_shoulder = Y_bot - (H - H_roof);

    const creases = hasTopRoof
      ? [
          { p1: { x: X_seam, y: Y_shoulder }, p2: { x: X_seam, y: Y_bot }, color: 'rgba(0,0,0,0.32)', width: 1.5, type: 'inner_shadow' as const },
          { p1: { x: X_seam + 1, y: Y_shoulder }, p2: { x: X_seam + 1, y: Y_bot }, color: 'rgba(255,255,255,0.4)', width: 1, type: 'outer_highlight' as const },
          { p1: { x: X_start, y: Y_shoulder }, p2: { x: X_seam, y: Y_shoulder }, color: 'rgba(0,0,0,0.22)', width: 1.2, type: 'inner_shadow' as const },
          { p1: { x: X_seam, y: Y_shoulder }, p2: { x: X_end, y: Y_shoulder - Y_side_tilt }, color: 'rgba(0,0,0,0.28)', width: 1.2, type: 'inner_shadow' as const },
        ]
      : [
          { p1: { x: X_seam, y: Y_top }, p2: { x: X_seam, y: Y_bot }, color: 'rgba(0,0,0,0.32)', width: 1.5, type: 'inner_shadow' as const },
          { p1: { x: X_seam + 1, y: Y_top }, p2: { x: X_seam + 1, y: Y_bot }, color: 'rgba(255,255,255,0.4)', width: 1, type: 'outer_highlight' as const }
        ];

    const isSacolinha = category === 'sacolinhas' || name.toLowerCase().includes('sacol');
    const isPyramid = name.toLowerCase().includes('piramide') || name.toLowerCase().includes('cone') || (
      frontSurface?.quad ? (
        (frontSurface.quad.p1.x - frontSurface.quad.p0.x) < (frontSurface.quad.p2.x - frontSurface.quad.p3.x) * 0.45
      ) : false
    );

    const focalStrategy: ArtFocalStrategy = isPyramid
      ? 'pyramid-balanced'
      : hasTopRoof
      ? 'upper-center'
      : 'center';

    const safeMargins: SafeMargins = isSacolinha
      ? { top: 0.10, bottom: 0.03, left: 0.03, right: 0.03 }
      : isPyramid
      ? { top: 0.16, bottom: 0.03, left: 0.04, right: 0.04 }
      : hasTopRoof
      ? { top: 0.04, bottom: 0.02, left: 0.02, right: 0.02 }
      : { top: 0.03, bottom: 0.03, left: 0.03, right: 0.03 };

    const artPlacementConfig: ArtPlacementConfig = {
      fitMode: 'smart-cover',
      focalStrategy,
      safeMargins,
      bleed: 0.015
    };

    return {
      id: idOrSlug,
      name,
      slug: idOrSlug,
      category,
      description: `Modelo personalizado com ${facesSummary.join(' e ')} contínuas.`,
      facesSummary,
      artPlacementConfig,
      seamConfig,
      canvasSize: { width: 1000, height: 1000 },
      active: true,
      isCustomModel: true,
      userId,
      frontImageUrl,
      sideImageUrl,
      baseImageUrl: frontImageUrl,
      shadows: [
        {
          type: 'floor_soft',
          bounds: { x: X_start - 30, y: Y_bot - 20, width: W + 60, height: 90, blur: 26, opacity: 0.30 },
          ellipse: { cx: X_start + Math.round(W / 2), cy: Y_bot + 15, rx: Math.round(W * 0.48), ry: 40, blur: 24, opacity: 0.28 }
        },
        {
          type: 'floor_contact',
          bounds: { x: X_start, y: Y_bot - 10, width: W, height: 35, blur: 8, opacity: 0.45 },
          ellipse: { cx: X_start + Math.round(W / 2), cy: Y_bot + 5, rx: Math.round(W * 0.40), ry: 15, blur: 6, opacity: 0.45 }
        }
      ],
      faces,
      creases
    };
  } else {
    // Modelo Plano / Face Única (Tags, Adesivos, Convites, Ziplock)
    const isTagCategory = category === 'tags' || category === 'papelaria';
    const isSquareOrRound = Math.abs(frontAspect - 1.0) < 0.25;

    let H = 540;
    let W = Math.round(H * frontAspect);
    if (W > 720) {
      W = 720;
      H = Math.round(W / frontAspect);
    }

    const X_start = Math.round((1000 - W) / 2);
    const Y_start = Math.round((1000 - H) / 2);
    const X_end = X_start + W;
    const Y_end = Y_start + H;

    faces.push({
      id: 'front',
      name: 'Frente',
      printable: true,
      quad: {
        p0: { x: X_start, y: Y_start },
        p1: { x: X_end, y: Y_start },
        p2: { x: X_end, y: Y_end },
        p3: { x: X_start, y: Y_end },
      },
      textureSlice: {
        startX: 0.0,
        endX: 1.0,
        startY: 0.0,
        endY: 1.0,
      },
      clipPolygon: isTagCategory && isSquareOrRound
        ? Array.from({ length: 36 }, (_, i) => {
            const angle = (i / 36) * Math.PI * 2;
            const rx = W / 2;
            const ry = H / 2;
            return {
              x: 500 + Math.cos(angle) * rx,
              y: 500 + Math.sin(angle) * ry
            };
          })
        : undefined
    });

    const safeMargins: SafeMargins = isTagCategory
      ? { top: 0.08, bottom: 0.08, left: 0.08, right: 0.08 }
      : { top: 0.05, bottom: 0.04, left: 0.04, right: 0.04 };

    const artPlacementConfig: ArtPlacementConfig = {
      fitMode: 'smart-cover',
      focalStrategy: 'center',
      safeMargins,
      bleed: 0.015
    };

    return {
      id: idOrSlug,
      name,
      slug: idOrSlug,
      category,
      description: `Modelo plano personalizado de face frontal única.`,
      facesSummary: ['Frente'],
      artPlacementConfig,
      canvasSize: { width: 1000, height: 1000 },
      active: true,
      isCustomModel: true,
      userId,
      frontImageUrl,
      baseImageUrl: frontImageUrl,
      shadows: [
        {
          type: 'floor_soft',
          bounds: { x: X_start - 20, y: Y_end - 20, width: W + 40, height: 80, blur: 24, opacity: 0.25 },
          ellipse: { cx: 500, cy: Y_end + 10, rx: Math.round(W * 0.46), ry: 35, blur: 20, opacity: 0.25 }
        }
      ],
      faces
    };
  }
}

/**
 * Analisador Automático de Modelos Particulares
 * Processa as fotos da Frente e da Lateral, detecta a superfície útil,
 * calcula as proporções físicas reais desdobradas e define a costura contínua FRENTE → LATERAL.
 */
export async function analyzeCustomProductModel(
  name: string,
  category: MockupCategory,
  frontFile: File,
  sideFile: File | null,
  hasSide: boolean
): Promise<ModelAnalysisResult> {
  const frontImg = await loadImageFromFile(frontFile);
  const sideImg = hasSide && sideFile ? await loadImageFromFile(sideFile) : null;

  // 1. Detecta as superfícies reais e retificadas de cada foto
  const frontSurface = detectProductSurface(frontImg);
  const sideSurface = sideImg ? detectProductSurface(sideImg) : undefined;

  let confidence = frontSurface.confidence;

  const slug = `user-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

  if (hasSide && sideSurface) {
    confidence = Math.min(frontSurface.confidence, sideSurface.confidence);

    const frontAspect = frontSurface.aspectRatio || 0.75;
    const sideAspect = sideSurface.aspectRatio || 0.38;

    // 2. Validação Geométrica entre Frente e Lateral
    const aspectRelation = sideAspect / frontAspect;
    if (aspectRelation < 0.15 || aspectRelation > 1.8) {
      confidence = Math.min(confidence, 0.35);
    }

    const frontHeightNorm = Math.abs(frontSurface.quad.p3.y - frontSurface.quad.p0.y);
    const sideHeightNorm = Math.abs(sideSurface.quad.p3.y - sideSurface.quad.p0.y);
    const heightRatio = sideHeightNorm > 0 && frontHeightNorm > 0 ? sideHeightNorm / frontHeightNorm : 1;

    if (heightRatio < 0.35 || heightRatio > 2.8) {
      confidence = Math.min(confidence, 0.30);
    }
  }

  // Constrói o template completo baseado na geometria detectada
  const template = buildCustomTemplateFromConfig(
    name,
    category,
    slug,
    frontSurface,
    sideSurface,
    undefined,
    hasSide
  );

  return {
    name,
    category,
    hasSide,
    facesSummary: template.facesSummary || (hasSide ? ['Frente', 'Lateral'] : ['Frente']),
    frontSurfaceConfig: frontSurface,
    sideSurfaceConfig: sideSurface,
    seamConfig: template.seamConfig,
    confidence: Number(confidence.toFixed(2)),
    template
  };
}
