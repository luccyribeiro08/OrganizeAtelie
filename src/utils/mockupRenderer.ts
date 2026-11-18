import {
  MockupRenderOptions,
  Point2D,
  Quad2D,
  MockupTemplate,
  MockupBackgroundType,
  MockupOutputRatio
} from '../types/mockupTypes';

export const RESOLUTION_MAP: Record<MockupOutputRatio, { width: number; height: number }> = {
  feed: { width: 1080, height: 1350 },     // Padrão: Feed / Retrato (4:5)
  square: { width: 1080, height: 1080 },   // Quadrado (1:1)
  stories: { width: 1080, height: 1920 }   // Stories / Reels (9:16)
};

/**
 * Carrega com segurança um arquivo Blob/File de imagem para um elemento HTMLImageElement
 */
export async function loadImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível carregar o arquivo de imagem'));
    };
    img.src = objectUrl;
  });
}

/**
 * Carrega com segurança uma imagem a partir de uma URL (dataUrl, blobUrl, etc.)
 */
export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem da URL'));
    img.src = url;
  });
}

/**
 * Mapeamento afim de triângulo: desenha um triângulo de origem da imagem para um triângulo de destino no Canvas
 * Derivação exata de Cramer para a matriz [a c e; b d f; 0 0 1]
 */
function drawTriangleAffine(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  sx0: number, sy0: number,
  sx1: number, sy1: number,
  sx2: number, sy2: number,
  dx0: number, dy0: number,
  dx1: number, dy1: number,
  dx2: number, dy2: number
) {
  const det = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1);
  if (Math.abs(det) < 0.000001) return;

  const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / det;
  const c = (sx0 * (dx1 - dx2) + sx1 * (dx2 - dx0) + sx2 * (dx0 - dx1)) / det;
  const e = (sx0 * (sy1 * dx2 - sy2 * dx1) + sx1 * (sy2 * dx0 - sy0 * dx2) + sx2 * (sy0 * dx1 - sy1 * dx0)) / det;

  const b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / det;
  const d = (sx0 * (dy1 - dy2) + sx1 * (dy2 - dy0) + sx2 * (dy0 - dy1)) / det;
  const f = (sx0 * (sy1 * dy2 - sy2 * dy1) + sx1 * (sy2 * dy0 - sy0 * dy2) + sx2 * (sy0 * dy1 - sy1 * dy0)) / det;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dx0, dy0);
  ctx.lineTo(dx1, dy1);
  ctx.lineTo(dx2, dy2);
  ctx.closePath();
  ctx.clip();

  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/**
 * Mapeamento em malha de perspectiva (Mesh Quad Warp)
 * Divide o quadrilátero de destino em sub-triângulos para garantir interpolação contínua e suave
 */
function drawQuadWarp(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  srcX: number,
  srcY: number,
  srcW: number,
  srcH: number,
  dstQuad: Quad2D,
  subdivisions: number = 8
) {
  const { p0, p1, p2, p3 } = dstQuad;

  // Interpolação bilinear de pontos no quadrilátero de destino
  const getDstPoint = (u: number, v: number): Point2D => {
    const topX = p0.x + (p1.x - p0.x) * u;
    const topY = p0.y + (p1.y - p0.y) * u;
    const botX = p3.x + (p2.x - p3.x) * u;
    const botY = p3.y + (p2.y - p3.y) * u;
    return {
      x: topX + (botX - topX) * v,
      y: topY + (botY - topY) * v,
    };
  };

  const step = 1 / subdivisions;

  for (let i = 0; i < subdivisions; i++) {
    const u0 = i * step;
    const u1 = (i + 1) * step;
    const su0 = srcX + u0 * srcW;
    const su1 = srcX + u1 * srcW;

    for (let j = 0; j < subdivisions; j++) {
      const v0 = j * step;
      const v1 = (j + 1) * step;
      const sv0 = srcY + v0 * srcH;
      const sv1 = srcY + v1 * srcH;

      const d00 = getDstPoint(u0, v0);
      const d10 = getDstPoint(u1, v0);
      const d11 = getDstPoint(u1, v1);
      const d01 = getDstPoint(u0, v1);

      // Triângulo 1 (Top-Left)
      drawTriangleAffine(
        ctx, img,
        su0, sv0,
        su1, sv0,
        su0, sv1,
        d00.x, d00.y,
        d10.x, d10.y,
        d01.x, d01.y
      );

      // Triângulo 2 (Bottom-Right)
      drawTriangleAffine(
        ctx, img,
        su1, sv0,
        su1, sv1,
        su0, sv1,
        d10.x, d10.y,
        d11.x, d11.y,
        d01.x, d01.y
      );
    }
  }
}

const imageCache = new Map<string, HTMLImageElement>();

/**
 * Carrega ou recupera do cache uma imagem HTMLImageElement a partir de uma URL/Blob
 */
export async function getOrLoadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    const cached = imageCache.get(url)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return cached;
    }
  }
  const img = await loadImageFromUrl(url);
  imageCache.set(url, img);
  return img;
}

/**
 * Renderiza o Cenário de Fundo (Camada 1)
 */
function renderBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgType: MockupBackgroundType,
  customBg?: HTMLImageElement | null
) {
  if (bgType === 'transparent') {
    ctx.clearRect(0, 0, width, height);
    return;
  }

  if (bgType === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Vignette sutil de estúdio
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.85);
    vignette.addColorStop(0, 'rgba(255,255,255,0)');
    vignette.addColorStop(1, 'rgba(240, 235, 238, 0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (bgType === 'custom' && customBg) {
    // Desenha foto da usuária em cover centralizado
    const srcAspect = customBg.width / customBg.height;
    const dstAspect = width / height;
    let sx = 0, sy = 0, sw = customBg.width, sh = customBg.height;

    if (srcAspect > dstAspect) {
      sw = customBg.height * dstAspect;
      sx = (customBg.width - sw) / 2;
    } else {
      sh = customBg.width / dstAspect;
      sy = (customBg.height - sh) / 2;
    }
    ctx.drawImage(customBg, sx, sy, sw, sh, 0, 0, width, height);

    // Overlay de iluminação suave para harmonizar com o produto
    const softLight = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.7);
    softLight.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
    softLight.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
    ctx.fillStyle = softLight;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  // Fundo Oficial: Organize Ateliê (Cenário Estúdio Rosa & Pérola)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#fdfbfb');
  bgGrad.addColorStop(0.5, '#fbf5f7');
  bgGrad.addColorStop(1, '#f6e7ee');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Piso do estúdio com brilho suave
  const floorGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.82,
    width * 0.05,
    width / 2,
    height * 0.82,
    width * 0.65
  );
  floorGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  floorGrad.addColorStop(0.5, 'rgba(255, 240, 245, 0.35)');
  floorGrad.addColorStop(1, 'rgba(255, 209, 220, 0)');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, height * 0.45, width, height * 0.55);

  // Padrão delicado de luz e brilho nas bordas
  const topLight = ctx.createLinearGradient(width / 2, 0, width / 2, height * 0.35);
  topLight.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  topLight.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = topLight;
  ctx.fillRect(0, 0, width, height * 0.35);

  // Logo discreta e elegante do Organize Ateliê no canto inferior
  ctx.save();
  ctx.font = '600 24px Montserrat, Inter, sans-serif';
  ctx.fillStyle = 'rgba(172, 36, 113, 0.35)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Organize Ateliê', width - 40, height - 35);

  ctx.font = '400 16px "Dancing Script", cursive, sans-serif';
  ctx.fillStyle = 'rgba(172, 36, 113, 0.28)';
  ctx.fillText('Papelaria Afetiva', width - 40, height - 16);
  ctx.restore();
}

/**
 * Renderiza as sombras projetadas no piso (Camada 2)
 */
function renderFloorShadows(
  ctx: CanvasRenderingContext2D,
  template: MockupTemplate,
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number
) {
  if (!template.shadows || template.shadows.length === 0) return;

  ctx.save();
  for (const shadow of template.shadows) {
    if (shadow.ellipse) {
      const cx = shadow.ellipse.cx * scaleX + offsetX;
      const cy = shadow.ellipse.cy * scaleY + offsetY;
      const rx = shadow.ellipse.rx * scaleX;
      const ry = shadow.ellipse.ry * scaleY;

      const grad = ctx.createRadialGradient(cx, cy, rx * 0.05, cx, cy, rx);
      grad.addColorStop(0, `rgba(40, 15, 25, ${shadow.ellipse.opacity})`);
      grad.addColorStop(0.5, `rgba(60, 20, 35, ${shadow.ellipse.opacity * 0.4})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Renderiza a base sólida do produto (Camada 3)
 * Para modelos particulares, desenha a fotografia base do produto com sua forma física,
 * mantendo sombras e acabamentos reais.
 */
function renderProductBase(
  ctx: CanvasRenderingContext2D,
  template: MockupTemplate,
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number,
  _baseProductImage?: HTMLImageElement | null
) {
  ctx.save();

  // Renderiza as faces sólidas da base do produto em papel offset/papelaria
  for (const face of template.faces) {
    const q = {
      p0: { x: face.quad.p0.x * scaleX + offsetX, y: face.quad.p0.y * scaleY + offsetY },
      p1: { x: face.quad.p1.x * scaleX + offsetX, y: face.quad.p1.y * scaleY + offsetY },
      p2: { x: face.quad.p2.x * scaleX + offsetX, y: face.quad.p2.y * scaleY + offsetY },
      p3: { x: face.quad.p3.x * scaleX + offsetX, y: face.quad.p3.y * scaleY + offsetY },
    };

    ctx.beginPath();
    if (face.clipPolygon && face.clipPolygon.length > 0) {
      const first = face.clipPolygon[0];
      ctx.moveTo(first.x * scaleX + offsetX, first.y * scaleY + offsetY);
      for (let i = 1; i < face.clipPolygon.length; i++) {
        const pt = face.clipPolygon[i];
        ctx.lineTo(pt.x * scaleX + offsetX, pt.y * scaleY + offsetY);
      }
    } else {
      ctx.moveTo(q.p0.x, q.p0.y);
      ctx.lineTo(q.p1.x, q.p1.y);
      ctx.lineTo(q.p2.x, q.p2.y);
      ctx.lineTo(q.p3.x, q.p3.y);
    }
    ctx.closePath();

    // Papel offset branco com acabamento suave ou cor base física
    ctx.fillStyle = face.baseColor || template.baseColor || '#fafafb';
    ctx.fill();

    // Sombra de profundidade estrutural da face
    if (face.shadingColor) {
      ctx.fillStyle = face.shadingColor;
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Renderiza a arte da usuária aplicada em cada face do template (Camada 4)
 * Utiliza o conceito de ESTAMPA CONTÍNUA 2D (Unfolded 2D Surface):
 * - A arte completa da usuária é enquadrada UMA ÚNICA VEZ na superfície virtual desdobrada (horizontal + vertical).
 * - Cada face recebe seu recorte UV proporcional exato.
 * - Continuidade Horizontal: Frente -> Lateral.
 * - Continuidade Vertical: Topo -> Corpo.
 * - Sem repetições indesejadas em topo ou laterais.
 */
function renderProductArt(
  ctx: CanvasRenderingContext2D,
  template: MockupTemplate,
  userArt: HTMLImageElement,
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number
) {
  const printableFaces = template.faces.filter((f) => f.printable !== false);
  if (printableFaces.length === 0) return;

  const templatePlacement = template.artPlacementConfig;
  const fitMode = templatePlacement?.fitMode || 'smart-cover';
  const focalStrategy = templatePlacement?.focalStrategy || 'center';

  // PASSO 1: Cálculo da Superfície Virtual Desdobrada 2D (Unfolded 2D Surface)
  // Determina a proporção de aspecto (Largura / Altura) real da superfície desdobrada
  let virtualAspect: number;

  const frontBodyFace = printableFaces.find(f => f.id === 'front' || f.id === 'front_body') || printableFaces[0];
  const seamPoint = template.seamConfig?.seamPoint ||
    (printableFaces.some(f => (f.textureSlice?.startX ?? 0) > 0.4)
      ? (printableFaces.find(f => (f.textureSlice?.startX ?? 0) > 0.4)?.textureSlice?.startX || 0.65)
      : 1.0);

  // Calcula a largura e altura da face frontal
  const frontQuadW = Math.hypot(frontBodyFace.quad.p1.x - frontBodyFace.quad.p0.x, frontBodyFace.quad.p1.y - frontBodyFace.quad.p0.y);
  const frontQuadH = Math.hypot(frontBodyFace.quad.p3.x - frontBodyFace.quad.p0.x, frontBodyFace.quad.p3.y - frontBodyFace.quad.p0.y);
  const frontAspect = frontQuadH > 0 ? frontQuadW / frontQuadH : 1.0;

  // Verifica se há topo/telhado vertical
  const hasVerticalRoof = printableFaces.some(f => (f.textureSlice?.endY ?? 1) <= 0.35);
  const seamY = hasVerticalRoof ? (templatePlacement?.optionalTopRegions?.heightRatio || 0.25) : 0.0;

  if (seamPoint < 1.0 && seamPoint > 0.1) {
    // Modelo com Frente + Lateral:
    // Proporção virtual desdobrada = (Largura Total Desdobrada) / (Altura Total Desdobrada)
    virtualAspect = (frontAspect / seamPoint) * (1.0 - seamY);
  } else {
    // Modelo plano de face única
    virtualAspect = frontAspect;
  }

  if (!virtualAspect || isNaN(virtualAspect) || virtualAspect <= 0) {
    virtualAspect = 1.0;
  }

  const artAspect = userArt.width / userArt.height;

  // PASSO 2: Enquadramento global único com suporte a Focal Strategy e Fit Mode
  let globalCropX = 0;
  let globalCropY = 0;
  let globalCropW = userArt.width;
  let globalCropH = userArt.height;

  if (fitMode === 'contain') {
    if (artAspect > virtualAspect) {
      globalCropW = userArt.width;
      globalCropH = userArt.width / virtualAspect;
      globalCropX = 0;
      globalCropY = (userArt.height - globalCropH) / 2;
    } else {
      globalCropH = userArt.height;
      globalCropW = userArt.height * virtualAspect;
      globalCropY = 0;
      globalCropX = (userArt.width - globalCropW) / 2;
    }
  } else {
    // 'cover' / 'smart-cover'
    if (artAspect > virtualAspect) {
      // A arte é mais larga que a superfície virtual: corta proporcionalmente nas laterais
      globalCropW = userArt.height * virtualAspect;
      globalCropH = userArt.height;
      globalCropY = 0;
      globalCropX = (userArt.width - globalCropW) / 2;
    } else {
      // A arte é mais alta que a superfície virtual: corta proporcionalmente no topo/fundo
      globalCropH = userArt.width / virtualAspect;
      globalCropW = userArt.width;
      globalCropX = 0;

      const excessHeight = Math.max(0, userArt.height - globalCropH);
      if (focalStrategy === 'upper-center') {
        // Enquadramento no terço superior: ideal para destacar rostos e personagens
        globalCropY = excessHeight * 0.20;
      } else if (focalStrategy === 'lower-center') {
        // Enquadramento no terço inferior
        globalCropY = excessHeight * 0.75;
      } else if (focalStrategy === 'pyramid-balanced') {
        // Formato piramidal: posiciona a arte na área média-inferior onde o molde é mais largo
        globalCropY = excessHeight * 0.55;
      } else {
        // 'center'
        globalCropY = excessHeight * 0.50;
      }
    }
  }

  // PASSO 3: Slicing proporcional nos UV rects e projeção em perspectiva (Quad Warp)
  for (const face of printableFaces) {
    ctx.save();

    // 1. Clipping Path específico da face (se houver polígono recortado como círculo ou triângulo)
    if (face.clipPolygon && face.clipPolygon.length > 0) {
      ctx.beginPath();
      const first = face.clipPolygon[0];
      ctx.moveTo(first.x * scaleX + offsetX, first.y * scaleY + offsetY);
      for (let i = 1; i < face.clipPolygon.length; i++) {
        const pt = face.clipPolygon[i];
        ctx.lineTo(pt.x * scaleX + offsetX, pt.y * scaleY + offsetY);
      }
      ctx.closePath();
      ctx.clip();
    }

    // 2. Destino escalado para a resolução atual
    const dstQuad: Quad2D = {
      p0: { x: face.quad.p0.x * scaleX + offsetX, y: face.quad.p0.y * scaleY + offsetY },
      p1: { x: face.quad.p1.x * scaleX + offsetX, y: face.quad.p1.y * scaleY + offsetY },
      p2: { x: face.quad.p2.x * scaleX + offsetX, y: face.quad.p2.y * scaleY + offsetY },
      p3: { x: face.quad.p3.x * scaleX + offsetX, y: face.quad.p3.y * scaleY + offsetY },
    };

    // 3. Extração da fatia 2D correspondente da arte com Safe Margins e Bleed
    const slice = face.textureSlice || { startX: 0, endX: 1, startY: 0, endY: 1 };
    const sliceStartX = slice.startX ?? 0;
    const sliceEndX = slice.endX ?? 1;
    const sliceStartY = slice.startY ?? 0;
    const sliceEndY = slice.endY ?? 1;

    const facePlacement = face.artPlacementConfig || templatePlacement;
    const safeMargins = facePlacement?.safeMargins;
    const bleed = facePlacement?.bleed ?? 0;

    let effStartX = sliceStartX;
    let effEndX = sliceEndX;
    let effStartY = sliceStartY;
    let effEndY = sliceEndY;

    if (safeMargins) {
      const spanX = sliceEndX - sliceStartX;
      const spanY = sliceEndY - sliceStartY;
      effStartX = sliceStartX + spanX * (safeMargins.left || 0);
      effEndX = sliceEndX - spanX * (safeMargins.right || 0);
      effStartY = sliceStartY + spanY * (safeMargins.top || 0);
      effEndY = sliceEndY - spanY * (safeMargins.bottom || 0);
    }

    if (bleed > 0) {
      effStartX = Math.max(0, effStartX - bleed);
      effEndX = Math.min(1, effEndX + bleed);
      effStartY = Math.max(0, effStartY - bleed);
      effEndY = Math.min(1, effEndY + bleed);
    }

    let sx = globalCropX + globalCropW * effStartX;
    let sw = globalCropW * (effEndX - effStartX);
    let sy = globalCropY + globalCropH * effStartY;
    let sh = globalCropH * (effEndY - effStartY);

    if (face.sourceSubRect) {
      sx = globalCropX + face.sourceSubRect.x * globalCropW;
      sy = globalCropY + face.sourceSubRect.y * globalCropH;
      sw = face.sourceSubRect.width * globalCropW;
      sh = face.sourceSubRect.height * globalCropH;
    }

    // 4. Executa o Quad Warp de perspectiva da fatia da arte
    drawQuadWarp(ctx, userArt, sx, sy, sw, sh, dstQuad, 10);

    // 5. Sombreamento e profundidade 3D da face
    if (face.gradientShade || face.shadingColor) {
      ctx.beginPath();
      if (face.clipPolygon && face.clipPolygon.length > 0) {
        const first = face.clipPolygon[0];
        ctx.moveTo(first.x * scaleX + offsetX, first.y * scaleY + offsetY);
        for (let i = 1; i < face.clipPolygon.length; i++) {
          const pt = face.clipPolygon[i];
          ctx.lineTo(pt.x * scaleX + offsetX, pt.y * scaleY + offsetY);
        }
      } else {
        ctx.moveTo(dstQuad.p0.x, dstQuad.p0.y);
        ctx.lineTo(dstQuad.p1.x, dstQuad.p1.y);
        ctx.lineTo(dstQuad.p2.x, dstQuad.p2.y);
        ctx.lineTo(dstQuad.p3.x, dstQuad.p3.y);
      }
      ctx.closePath();

      if (face.gradientShade) {
        const g = ctx.createLinearGradient(
          face.gradientShade.start.x * scaleX + offsetX,
          face.gradientShade.start.y * scaleY + offsetY,
          face.gradientShade.end.x * scaleX + offsetX,
          face.gradientShade.end.y * scaleY + offsetY
        );
        g.addColorStop(0, face.gradientShade.startColor);
        g.addColorStop(1, face.gradientShade.endColor);
        ctx.fillStyle = g;
        ctx.fill();
      } else if (face.shadingColor) {
        ctx.fillStyle = face.shadingColor;
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

/**
 * Renderiza Vincos e Linhas de Dobra (Camada 5)
 */
function renderCreases(
  ctx: CanvasRenderingContext2D,
  template: MockupTemplate,
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number
) {
  if (!template.creases || template.creases.length === 0) return;

  ctx.save();
  for (const crease of template.creases) {
    const x1 = crease.p1.x * scaleX + offsetX;
    const y1 = crease.p1.y * scaleY + offsetY;
    const x2 = crease.p2.x * scaleX + offsetX;
    const y2 = crease.p2.y * scaleY + offsetY;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = crease.color || 'rgba(0,0,0,0.25)';
    ctx.lineWidth = (crease.width || 1.5) * Math.min(scaleX, scaleY);
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renderiza Elementos Superiores (Camada 8): Alças, laços, fechos ziplock, furos
 */
function renderOverlays(
  ctx: CanvasRenderingContext2D,
  template: MockupTemplate,
  scaleX: number,
  scaleY: number,
  offsetX: number,
  offsetY: number
) {
  if (!template.overlays || template.overlays.length === 0) return;

  ctx.save();
  for (const overlay of template.overlays) {
    if (overlay.type === 'bow_tie' && overlay.points && overlay.points.length >= 4) {
      // Laço de Cetim Superior
      const c = overlay.points[0];
      const l = overlay.points[1];
      const r = overlay.points[2];
      const b = overlay.points[3];

      const cx = c.x * scaleX + offsetX;
      const cy = c.y * scaleY + offsetY;
      const lx = l.x * scaleX + offsetX;
      const ly = l.y * scaleY + offsetY;
      const rx = r.x * scaleX + offsetX;
      const ry = r.y * scaleY + offsetY;
      const bx = b.x * scaleX + offsetX;
      const by = b.y * scaleY + offsetY;

      // Asa esquerda
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(lx - 20, ly - 30, lx - 40, cy + 20, cx, cy);
      ctx.fillStyle = overlay.color || '#ffd1dc';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.stroke();

      // Asa direita
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(rx + 20, ry - 30, rx + 40, cy + 20, cx, cy);
      ctx.fillStyle = overlay.color || '#ffd1dc';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.stroke();

      // Pontas caídas da fita
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.quadraticCurveTo(cx - 25, by - 20, cx - 35, by);
      ctx.lineTo(cx - 20, by - 10);
      ctx.lineTo(cx - 5, by);
      ctx.closePath();
      ctx.fillStyle = overlay.color || '#ffd1dc';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx + 10, cy);
      ctx.quadraticCurveTo(cx + 25, by - 20, cx + 35, by);
      ctx.lineTo(cx + 20, by - 10);
      ctx.lineTo(cx + 5, by);
      ctx.closePath();
      ctx.fillStyle = overlay.color || '#ffd1dc';
      ctx.fill();

      // Nó central
      ctx.beginPath();
      ctx.ellipse(cx, cy, 14 * scaleX, 10 * scaleY, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f8b4c8';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.stroke();
    } else if (overlay.type === 'handle_ribbon' && overlay.points && overlay.points.length >= 4) {
      // Alça de Fita de Cetim Larga
      const p0 = overlay.points[0];
      const p1 = overlay.points[1];
      const p2 = overlay.points[2];
      const p3 = overlay.points[3];

      const x0 = p0.x * scaleX + offsetX;
      const y0 = p0.y * scaleY + offsetY;
      const x1 = p1.x * scaleX + offsetX;
      const y1 = p1.y * scaleY + offsetY;
      const x2 = p2.x * scaleX + offsetX;
      const y2 = p2.y * scaleY + offsetY;
      const x3 = p3.x * scaleX + offsetX;
      const y3 = p3.y * scaleY + offsetY;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      ctx.strokeStyle = overlay.color || '#ffb6c1';
      ctx.lineWidth = 26 * scaleX;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Brilho do cetim
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 8 * scaleX;
      ctx.stroke();
    } else if (overlay.type === 'handle_cord' && overlay.points && overlay.points.length >= 4) {
      // Cordão Torcido com Ilhós
      const p0 = overlay.points[0];
      const p1 = overlay.points[1];
      const p2 = overlay.points[2];
      const p3 = overlay.points[3];

      const x0 = p0.x * scaleX + offsetX;
      const y0 = p0.y * scaleY + offsetY;
      const x1 = p1.x * scaleX + offsetX;
      const y1 = p1.y * scaleY + offsetY;
      const x2 = p2.x * scaleX + offsetX;
      const y2 = p2.y * scaleY + offsetY;
      const x3 = p3.x * scaleX + offsetX;
      const y3 = p3.y * scaleY + offsetY;

      // Cordão
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      ctx.strokeStyle = overlay.color || '#e2e8f0';
      ctx.lineWidth = 14 * scaleX;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Ilhós metálico esquerdo
      ctx.beginPath();
      ctx.arc(x0, y0, 10 * scaleX, 0, Math.PI * 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ilhós metálico direito
      ctx.beginPath();
      ctx.arc(x3, y3, 10 * scaleX, 0, Math.PI * 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (overlay.type === 'hole_punch' && overlay.points && overlay.points.length >= 1) {
      // Furo Circular de Tag
      const pt = overlay.points[0];
      const hx = pt.x * scaleX + offsetX;
      const hy = pt.y * scaleY + offsetY;

      ctx.beginPath();
      ctx.arc(hx, hy, 16 * scaleX, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sombra interna do furo
      ctx.beginPath();
      ctx.arc(hx, hy, 14 * scaleX, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.stroke();
    } else if (overlay.type === 'ziplock_seal' && overlay.points && overlay.points.length >= 4) {
      // Fecho Superior Ziplock Metálico
      const p0 = overlay.points[0];
      const p1 = overlay.points[1];
      const p2 = overlay.points[2];
      const p3 = overlay.points[3];

      const x0 = p0.x * scaleX + offsetX;
      const y0 = p0.y * scaleY + offsetY;
      const x1 = p1.x * scaleX + offsetX;
      const y1 = p1.y * scaleY + offsetY;
      const x2 = p2.x * scaleX + offsetX;
      const y2 = p2.y * scaleY + offsetY;
      const x3 = p3.x * scaleX + offsetX;
      const y3 = p3.y * scaleY + offsetY;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();

      const zipGrad = ctx.createLinearGradient(x0, y0, x0, y3);
      zipGrad.addColorStop(0, '#e2e8f0');
      zipGrad.addColorStop(0.5, '#f8fafc');
      zipGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = zipGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.stroke();

      // Ranhuras do fecho
      for (let i = 1; i <= 3; i++) {
        const lineY = y0 + ((y3 - y0) * (i / 4));
        ctx.beginPath();
        ctx.moveTo(x0 + 10, lineY);
        ctx.lineTo(x1 - 10, lineY);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

/**
 * Função Mestra de Renderização do Mockup
 * Processa tudo 100% no Canvas 2D local da usuária
 */
export function renderMockupToCanvas(
  targetCanvas: HTMLCanvasElement,
  options: MockupRenderOptions
): boolean {
  const { template, userArtImage, backgroundType, customBgImage, outputRatio, quality } = options;
  const resolution = RESOLUTION_MAP[outputRatio] || RESOLUTION_MAP.feed;

  // Validação: se há arte definida, verificar se está pronta
  if (userArtImage && (!userArtImage.complete || userArtImage.naturalWidth === 0 || userArtImage.naturalHeight === 0)) {
    console.error('Arte do tema inválida ou ainda não carregada');
    return false;
  }

  // Multiplicador de qualidade
  const scaleMult = quality === 'high' ? 1.25 : 1.0;
  const canvasWidth = Math.round(resolution.width * scaleMult);
  const canvasHeight = Math.round(resolution.height * scaleMult);

  targetCanvas.width = canvasWidth;
  targetCanvas.height = canvasHeight;

  const ctx = targetCanvas.getContext('2d', { alpha: true, willReadFrequently: false });
  if (!ctx) return false;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Renderiza Fundo (Camada 1)
  renderBackground(ctx, canvasWidth, canvasHeight, backgroundType, customBgImage);

  // 2. Calcula Escala e Posicionamento do Produto
  // Encaixa os 1000x1000 pontos do template mantendo a proporção no canvas de destino
  const productPadding = 0.12; // 12% de margem ao redor
  const availWidth = canvasWidth * (1 - productPadding * 2);
  const availHeight = canvasHeight * (1 - productPadding * 2);

  const scale = Math.min(availWidth / template.canvasSize.width, availHeight / template.canvasSize.height);
  const scaleX = scale;
  const scaleY = scale;

  const offsetX = (canvasWidth - template.canvasSize.width * scaleX) / 2;
  // Leve ajuste vertical para acomodar sombra no chão
  const offsetY = (canvasHeight - template.canvasSize.height * scaleY) / 2 - (canvasHeight * 0.02);

  // 3. Renderiza Sombras no Chão (Camada 2)
  renderFloorShadows(ctx, template, scaleX, scaleY, offsetX, offsetY);

  // 4. Renderiza Base do Produto (Camada 3)
  renderProductBase(ctx, template, scaleX, scaleY, offsetX, offsetY, options.baseProductImage);

  // 5. Aplica Arte da usuária nas faces (Camada 4)
  if (userArtImage && userArtImage.complete && userArtImage.naturalWidth > 0) {
    renderProductArt(ctx, template, userArtImage, scaleX, scaleY, offsetX, offsetY);
  }

  // 6. Renderiza Vincos e Linhas de Dobra (Camada 5)
  renderCreases(ctx, template, scaleX, scaleY, offsetX, offsetY);

  // 7. Renderiza Detalhes Superiores: Laços, Alças, Fechos (Camada 8)
  renderOverlays(ctx, template, scaleX, scaleY, offsetX, offsetY);

  return true;
}

/**
 * Renderiza o mockup de forma assíncrona, garantindo carregamento de imagens necessárias
 */
export async function renderMockupAsync(
  targetCanvas: HTMLCanvasElement,
  options: MockupRenderOptions
): Promise<boolean> {
  let baseImg = options.baseProductImage;
  const tpl = options.template;

  if (!baseImg && tpl.isCustomModel && (tpl.frontImageUrl || tpl.baseImageUrl)) {
    const url = tpl.frontImageUrl || tpl.baseImageUrl;
    if (url) {
      try {
        baseImg = await getOrLoadImage(url);
      } catch (err) {
        console.warn('Não foi possível carregar foto base do modelo particular:', err);
      }
    }
  }

  return renderMockupToCanvas(targetCanvas, {
    ...options,
    baseProductImage: baseImg
  });
}

/**
 * Exporta o mockup diretamente para Blob (PNG ou JPEG) através de uma única fonte de renderização
 */
export async function exportMockupBlob(
  options: MockupRenderOptions,
  format: 'png' | 'jpeg' = 'png',
  qualityFactor: number = 0.95
): Promise<Blob> {
  // Validação estrita: se uma arte era esperada mas não é válida, rejeitar
  if (options.userArtImage && (!options.userArtImage.complete || options.userArtImage.naturalWidth === 0)) {
    throw new Error('Não foi possível aplicar sua arte ao mockup. Tente novamente.');
  }

  // Se for modelo particular e ainda não tiver a imagem base carregada, recupera via cache/URL
  let baseImg = options.baseProductImage;
  const tpl = options.template;

  if (!baseImg && tpl.isCustomModel && (tpl.frontImageUrl || tpl.baseImageUrl)) {
    const url = tpl.frontImageUrl || tpl.baseImageUrl;
    if (url) {
      try {
        baseImg = await getOrLoadImage(url);
      } catch (err) {
        console.warn('Não foi possível carregar imagem base do modelo particular:', err);
      }
    }
  }

  const canvas = document.createElement('canvas');
  const rendered = renderMockupToCanvas(canvas, {
    ...options,
    baseProductImage: baseImg
  });

  if (!rendered) {
    throw new Error('Não foi possível aplicar sua arte ao mockup. Tente novamente.');
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Falha ao gerar arquivo de imagem'));
        }
      },
      format === 'png' || options.backgroundType === 'transparent' ? 'image/png' : 'image/jpeg',
      qualityFactor
    );
  });
}
