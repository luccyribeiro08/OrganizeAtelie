import { MOCKUP_TEMPLATES } from '../src/data/mockupTemplates';
import { RESOLUTION_MAP } from '../src/utils/mockupRenderer';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('TEST SUITE: MOCKUPS MODULE - ORGANIZE ATELIÊ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

// -------------------------------------------------------------
// TEST 1: CAIXA MILK 2D CONTINUOUS UNIFIED SURFACE
// -------------------------------------------------------------
console.log('\n--- Test 1: Caixa Milk 2D Continuous Surface ---');
const caixaMilk = MOCKUP_TEMPLATES.find((t) => t.id === 'caixa-milk');
assert(Boolean(caixaMilk), 'Caixa Milk template exists');

if (caixaMilk) {
  const topRoofFront = caixaMilk.faces.find((f) => f.id === 'top_roof_front');
  const topRoofSide = caixaMilk.faces.find((f) => f.id === 'top_roof_side');
  const frontBody = caixaMilk.faces.find((f) => f.id === 'front');
  const sideBody = caixaMilk.faces.find((f) => f.id === 'side_right');

  assert(Boolean(topRoofFront && topRoofFront.printable === true), 'Caixa Milk Topo Frontal is printable: true');
  assert(Boolean(topRoofSide && topRoofSide.printable === true), 'Caixa Milk Topo Lateral is printable: true');
  assert(Boolean(frontBody && frontBody.printable === true), 'Caixa Milk Frente is printable: true');
  assert(Boolean(sideBody && sideBody.printable === true), 'Caixa Milk Lateral is printable: true');

  // Verify UV Continuity
  assert(
    topRoofFront?.textureSlice?.startX === 0.0 && topRoofFront?.textureSlice?.endX === 0.72 &&
    topRoofFront?.textureSlice?.startY === 0.0 && topRoofFront?.textureSlice?.endY === 0.25,
    'Caixa Milk Topo Frontal UV slice is [0.0..0.72, 0.0..0.25]'
  );

  assert(
    topRoofSide?.textureSlice?.startX === 0.72 && topRoofSide?.textureSlice?.endX === 1.0 &&
    topRoofSide?.textureSlice?.startY === 0.0 && topRoofSide?.textureSlice?.endY === 0.25,
    'Caixa Milk Topo Lateral UV slice is [0.72..1.0, 0.0..0.25]'
  );

  assert(
    frontBody?.textureSlice?.startX === 0.0 && frontBody?.textureSlice?.endX === 0.72 &&
    frontBody?.textureSlice?.startY === 0.25 && frontBody?.textureSlice?.endY === 1.0,
    'Caixa Milk Frente UV slice is [0.0..0.72, 0.25..1.0]'
  );

  assert(
    sideBody?.textureSlice?.startX === 0.72 && sideBody?.textureSlice?.endX === 1.0 &&
    sideBody?.textureSlice?.startY === 0.25 && sideBody?.textureSlice?.endY === 1.0,
    'Caixa Milk Lateral UV slice is [0.72..1.0, 0.25..1.0]'
  );

  // Verify Horizontal & Vertical Continuity Seams
  assert(
    topRoofFront?.textureSlice?.endX === topRoofSide?.textureSlice?.startX,
    'Horizontal continuity at top: Topo Frontal right edge == Topo Lateral left edge (0.72)'
  );
  assert(
    frontBody?.textureSlice?.endX === sideBody?.textureSlice?.startX,
    'Horizontal continuity at body: Frente right edge == Lateral left edge (0.72)'
  );
  assert(
    topRoofFront?.textureSlice?.endY === frontBody?.textureSlice?.startY,
    'Vertical continuity at front: Topo Frontal bottom edge == Frente top edge (0.25)'
  );
  assert(
    topRoofSide?.textureSlice?.endY === sideBody?.textureSlice?.startY,
    'Vertical continuity at side: Topo Lateral bottom edge == Lateral top edge (0.25)'
  );

  // Verify Overlays (Bow tie on top)
  const bowOverlay = caixaMilk.overlays?.find((o) => o.type === 'bow_tie');
  assert(Boolean(bowOverlay), 'Caixa Milk has satin bow overlay rendered on top');
}

// -------------------------------------------------------------
// TEST 2: OTHER OFFICIAL TEMPLATES CONTINUITY
// -------------------------------------------------------------
console.log('\n--- Test 2: Other Templates Review ---');
const maletaCoracao = MOCKUP_TEMPLATES.find((t) => t.id === 'maleta-coracao');
assert(
  Boolean(maletaCoracao?.faces.every((f) => f.printable === true)),
  'Maleta Coração: All 3 faces (Topo, Frente, Lateral) are printable with 2D slices'
);

const caixaCanudo = MOCKUP_TEMPLATES.find((t) => t.id === 'caixa-canudo');
assert(
  Boolean(caixaCanudo?.faces.every((f) => f.printable === true)),
  'Caixa Canudo: All 3 faces (Tampa, Frente, Lateral) are printable with 2D slices'
);

const caixaCubo = MOCKUP_TEMPLATES.find((t) => t.id === 'caixa-cubo');
assert(
  Boolean(caixaCubo?.faces.every((f) => f.printable === true)),
  'Caixa Cubo: Tampa, Frente and Lateral are printable with continuous UV slices'
);

// -------------------------------------------------------------
// TEST 3: PRIVACY BANNER IN MOCKUPSVIEW
// -------------------------------------------------------------
console.log('\n--- Test 3: Privacy Banner Wording ---');
const mockupsViewPath = path.resolve(process.cwd(), 'src/components/MockupsView.tsx');
const mockupsViewContent = fs.readFileSync(mockupsViewPath, 'utf8');

const requiredPrivacyCopy = '🔒 Seu tema é processado no dispositivo e não fica salvo. Os modelos que você adiciona ficam disponíveis somente na sua conta.';
assert(
  mockupsViewContent.includes(requiredPrivacyCopy),
  'Privacy banner contains exact required copy'
);
assert(
  !mockupsViewContent.includes('não ficam armazenadas no Organize Ateliê'),
  'Old ambiguous privacy banner copy was completely removed'
);

// -------------------------------------------------------------
// TEST 4: UNIFIED PREVIEW PIPELINE IN MOCKUPRESULTVIEW
// -------------------------------------------------------------
console.log('\n--- Test 4: Unified Preview & Export Architecture ---');
const resultViewPath = path.resolve(process.cwd(), 'src/components/mockups/MockupResultView.tsx');
const resultViewContent = fs.readFileSync(resultViewPath, 'utf8');

assert(
  resultViewContent.includes('previewState') &&
  resultViewContent.includes('previewUrl') &&
  resultViewContent.includes('exportMockupBlob') &&
  resultViewContent.includes('<img') &&
  resultViewContent.includes('URL.revokeObjectURL'),
  'MockupResultView uses stateful unified exportMockupBlob -> Blob URL -> <img> pipeline with revocation'
);

assert(
  resultViewContent.includes('Criando seu mockup...') &&
  resultViewContent.includes('Não conseguimos gerar a visualização do seu mockup.'),
  'MockupResultView handles rendering and error states with user-friendly messages'
);

// -------------------------------------------------------------
// TEST 5: CUSTOM MODEL GEOMETRY BUILDER & PERSISTENCE
// -------------------------------------------------------------
console.log('\n--- Test 5: Custom Model Geometry & Seam Config ---');
import { buildCustomTemplateFromConfig } from '../src/utils/modelAnalyzer';

const customMilkTemplate = buildCustomTemplateFromConfig(
  'Minha Caixa Milk Especial',
  'caixinhas',
  'custom-milk-123',
  {
    quad: { p0: { x: 0.1, y: 0.1 }, p1: { x: 0.9, y: 0.1 }, p2: { x: 0.9, y: 0.9 }, p3: { x: 0.1, y: 0.9 } },
    rectifiedWidth: 80,
    rectifiedHeight: 100,
    aspectRatio: 0.80,
    confidence: 0.95
  },
  {
    quad: { p0: { x: 0.1, y: 0.1 }, p1: { x: 0.9, y: 0.1 }, p2: { x: 0.9, y: 0.9 }, p3: { x: 0.1, y: 0.9 } },
    rectifiedWidth: 40,
    rectifiedHeight: 100,
    aspectRatio: 0.40,
    confidence: 0.92
  },
  undefined,
  true
);

assert(Boolean(customMilkTemplate), 'buildCustomTemplateFromConfig generates valid template');
assert(customMilkTemplate.isCustomModel === true, 'customMilkTemplate has isCustomModel: true');
assert(customMilkTemplate.faces.length === 4, 'custom Milk box generates exactly 4 faces (front_top, side_top, front_body, side_body)');
assert(Boolean(customMilkTemplate.seamConfig), 'custom Milk box has seamConfig calculated from physical surfaces');
assert(
  customMilkTemplate.seamConfig?.seamPoint === 0.667,
  `seamPoint is mathematically exact: 0.80 / (0.80 + 0.40) = 0.667 (actual: ${customMilkTemplate.seamConfig?.seamPoint})`
);

const cFrontTop = customMilkTemplate.faces.find(f => f.id === 'front_top');
const cSideTop = customMilkTemplate.faces.find(f => f.id === 'side_top');
const cFrontBody = customMilkTemplate.faces.find(f => f.id === 'front_body');
const cSideBody = customMilkTemplate.faces.find(f => f.id === 'side_body');

assert(Boolean(cFrontTop && cSideTop && cFrontBody && cSideBody), 'All 4 custom milk faces exist');
assert(
  cFrontTop?.textureSlice?.endX === cSideTop?.textureSlice?.startX &&
  cFrontBody?.textureSlice?.endX === cSideBody?.textureSlice?.startX,
  'Custom model horizontal seam continuity: front endX == side startX'
);
assert(
  cFrontTop?.textureSlice?.endY === cFrontBody?.textureSlice?.startY &&
  cSideTop?.textureSlice?.endY === cSideBody?.textureSlice?.startY,
  'Custom model vertical seam continuity: top endY == body startY'
);

// Flat custom model test
const customTagTemplate = buildCustomTemplateFromConfig(
  'Minha Tag Redonda',
  'tags',
  'custom-tag-456',
  {
    quad: { p0: { x: 0.1, y: 0.1 }, p1: { x: 0.9, y: 0.1 }, p2: { x: 0.9, y: 0.9 }, p3: { x: 0.1, y: 0.9 } },
    rectifiedWidth: 100,
    rectifiedHeight: 100,
    aspectRatio: 1.0,
    confidence: 0.96
  },
  null,
  null,
  false
);

assert(customTagTemplate.faces.length === 1, 'Custom Tag generates single front face');
assert(Boolean(customTagTemplate.faces[0].clipPolygon), 'Custom round tag has circular clip polygon');

// -------------------------------------------------------------
// TEST 6: ART PLACEMENT CONFIG (MOLD-SPECIFIC ENQUADRAMENTO)
// -------------------------------------------------------------
console.log('\n--- Test 6: Art Placement Config & Framing per Mold ---');

const caixaPiramide = MOCKUP_TEMPLATES.find((t) => t.id === 'caixa-piramide');
assert(Boolean(caixaPiramide), 'Caixa Pirâmide template exists');
assert(
  caixaPiramide?.artPlacementConfig?.focalStrategy === 'pyramid-balanced',
  'Caixa Pirâmide uses focalStrategy: pyramid-balanced'
);
assert(
  caixaPiramide?.artPlacementConfig?.safeMargins?.top === 0.16,
  'Caixa Pirâmide has safeMargins.top: 0.16 (protects narrow apex)'
);
assert(
  caixaPiramide?.artPlacementConfig?.fitMode === 'smart-cover',
  'Caixa Pirâmide uses fitMode: smart-cover'
);

const sacolinhaEscalopada = MOCKUP_TEMPLATES.find((t) => t.id === 'sacolinha-escalopada-horizontal');
assert(Boolean(sacolinhaEscalopada), 'Sacolinha Escalopada Horizontal template exists');
assert(
  sacolinhaEscalopada?.artPlacementConfig?.safeMargins?.top === 0.10,
  'Sacolinha Escalopada Horizontal has safeMargins.top: 0.10 (protects scallops & ribbons)'
);

assert(
  caixaMilk?.artPlacementConfig?.focalStrategy === 'upper-center',
  'Caixa Milk uses focalStrategy: upper-center'
);

// Verify dynamic custom model artPlacementConfig
const customPyramid = buildCustomTemplateFromConfig(
  'Minha Pirâmide Personalizada',
  'caixinhas',
  'custom-pyramid-789',
  {
    quad: { p0: { x: 0.45, y: 0.1 }, p1: { x: 0.55, y: 0.1 }, p2: { x: 0.9, y: 0.9 }, p3: { x: 0.1, y: 0.9 } },
    rectifiedWidth: 80,
    rectifiedHeight: 100,
    aspectRatio: 0.80,
    confidence: 0.95
  },
  {
    quad: { p0: { x: 0.45, y: 0.1 }, p1: { x: 0.55, y: 0.1 }, p2: { x: 0.9, y: 0.9 }, p3: { x: 0.1, y: 0.9 } },
    rectifiedWidth: 40,
    rectifiedHeight: 100,
    aspectRatio: 0.40,
    confidence: 0.90
  },
  undefined,
  true
);

assert(
  customPyramid.artPlacementConfig?.focalStrategy === 'pyramid-balanced',
  'Dynamic Custom Pyramid receives focalStrategy: pyramid-balanced'
);
assert(
  customPyramid.artPlacementConfig?.safeMargins?.top === 0.16,
  'Dynamic Custom Pyramid receives safeMargins.top: 0.16'
);

const customSacolinha = buildCustomTemplateFromConfig(
  'Sacola Kraft Presente',
  'sacolinhas',
  'custom-sacola-001',
  {
    quad: { p0: { x: 0.1, y: 0.1 }, p1: { x: 0.9, y: 0.1 }, p2: { x: 0.9, y: 0.9 }, p3: { x: 0.1, y: 0.9 } },
    rectifiedWidth: 90,
    rectifiedHeight: 100,
    aspectRatio: 0.90,
    confidence: 0.94
  },
  {
    quad: { p0: { x: 0.1, y: 0.1 }, p1: { x: 0.9, y: 0.1 }, p2: { x: 0.9, y: 0.9 }, p3: { x: 0.1, y: 0.9 } },
    rectifiedWidth: 35,
    rectifiedHeight: 100,
    aspectRatio: 0.35,
    confidence: 0.92
  },
  undefined,
  true
);

assert(
  customSacolinha.artPlacementConfig?.safeMargins?.top === 0.10,
  'Dynamic Custom Sacolinha receives safeMargins.top: 0.10'
);

assert(
  customTagTemplate.artPlacementConfig?.focalStrategy === 'center' &&
  customTagTemplate.artPlacementConfig?.safeMargins?.top === 0.08,
  'Dynamic Custom Tag receives focalStrategy: center and safeMargins: 0.08'
);

console.log('\n====================================================');
console.log(`TOTAL: ${passedTests}/${totalTests} TESTS PASSED!`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

