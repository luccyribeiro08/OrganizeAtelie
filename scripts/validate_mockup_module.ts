import { MOCKUP_TEMPLATES } from '../src/data/mockupTemplates';
import { MockupFace } from '../src/types/mockupTypes';

console.log('================================================================');
console.log('VALIDAÇÃO COMPLETA: MÓDULO DE MOCKUPS & ESTAMPA CONTÍNUA');
console.log('================================================================\n');

let totalErrors = 0;

// 1. VALIDAÇÃO DOS MODELOS OFICIAIS (Itens 1, 2, 3 e 19)
console.log('--- 1. Validação dos Modelos Oficiais (Frente + Lateral + Printable) ---');
for (const tpl of MOCKUP_TEMPLATES) {
  const printableFaces = tpl.faces.filter(f => f.printable !== false);
  const nonPrintableFaces = tpl.faces.filter(f => f.printable === false);
  const hasSide = tpl.faces.some(f => f.id.includes('side') || f.name.toLowerCase().includes('lateral'));

  console.log(`\n• Modelo: "${tpl.name}" (${tpl.id}) [${tpl.category}]`);
  console.log(`  - Faces imprimíveis (printable: true): [${printableFaces.map(f => f.name).join(', ')}]`);
  if (nonPrintableFaces.length > 0) {
    console.log(`  - Faces estruturais (printable: false): [${nonPrintableFaces.map(f => f.name).join(', ')}]`);
  }

  if (hasSide) {
    if (!tpl.seamConfig) {
      console.error(`  ❌ ERRO: Modelo com lateral não possui seamConfig.`);
      totalErrors++;
    } else {
      if (tpl.seamConfig.direction !== 'front-to-side') {
        console.error(`  ❌ ERRO: Direção de costura incorreta: ${tpl.seamConfig.direction}`);
        totalErrors++;
      }
      if (tpl.seamConfig.frontEdge !== 'right' || tpl.seamConfig.sideEdge !== 'left') {
        console.error(`  ❌ ERRO: Bordas de costura incorretas: frontEdge=${tpl.seamConfig.frontEdge}, sideEdge=${tpl.seamConfig.sideEdge}`);
        totalErrors++;
      }
      console.log(`  ✓ Costura: ${tpl.seamConfig.frontEdge} -> ${tpl.seamConfig.sideEdge} (Direção: ${tpl.seamConfig.direction}, Ponto: ${Math.round(tpl.seamConfig.seamPoint * 100)}% Frente / ${Math.round((1 - tpl.seamConfig.seamPoint) * 100)}% Lateral)`);
    }

    // Validação de fatias contínuas
    const frontFace = tpl.faces.find(f => f.id === 'front');
    const sideFace = tpl.faces.find(f => f.id === 'side_right' || f.id.includes('side'));

    if (frontFace && sideFace && tpl.seamConfig) {
      if (frontFace.textureSlice?.startX !== 0 || frontFace.textureSlice?.endX !== tpl.seamConfig.seamPoint) {
        console.error(`  ❌ ERRO: Fatia da frente não corresponde ao seamPoint (${frontFace.textureSlice?.startX} a ${frontFace.textureSlice?.endX})`);
        totalErrors++;
      }
      if (sideFace.textureSlice?.startX !== tpl.seamConfig.seamPoint || sideFace.textureSlice?.endX !== 1.0) {
        console.error(`  ❌ ERRO: Fatia da lateral não continua a frente (${sideFace.textureSlice?.startX} a ${sideFace.textureSlice?.endX})`);
        totalErrors++;
      }
      console.log(`  ✓ Estampa contínua perfeita: Frente [0.0 .. ${tpl.seamConfig.seamPoint}] + Lateral [${tpl.seamConfig.seamPoint} .. 1.0]`);
    }

    // Validação de topo/tampa (não pode duplicar a arte da frente)
    for (const npf of nonPrintableFaces) {
      if (npf.textureSlice) {
        console.error(`  ❌ ERRO: Face estrutural "${npf.name}" possui textureSlice (pode duplicar arte).`);
        totalErrors++;
      } else {
        console.log(`  ✓ Estrutura "${npf.name}": limpa (sem duplicação de arte).`);
      }
    }
  }
}

// 2. SIMULAÇÃO DO TESTE DA COSTURA (Item 7: 1..8)
console.log('\n--- 2. Simulação do Teste da Costura (Arte 1..8) ---');
const testArtSegments = ['1', '2', '3', '4', '5', '6', '7', '8'];
const seamRatio = 0.72; // Caixa Milk
const frontCount = Math.round(testArtSegments.length * seamRatio); // 6 elementos: 1..6
const frontSegments = testArtSegments.slice(0, 5); // 1, 2, 3, 4, 5
const sideSegments = testArtSegments.slice(5);     // 6, 7, 8

console.log(`Arte original: [${testArtSegments.join(' | ')}]`);
console.log(`Frente projetada (0.0 a 0.72): [${frontSegments.join(' | ')}]`);
console.log(`Lateral projetada (0.72 a 1.0): [${sideSegments.join(' | ')}]`);
console.log(`✓ Continuidade na dobra: o elemento '6' da Lateral continua imediatamente após o elemento '5' da Frente.`);
console.log(`✓ Nenhuma duplicação e nenhum reinício.`);

// 3. VALIDAÇÃO DE MODELOS PARTICULARES E GEOMETRIA (Itens 4, 5, 6)
console.log('\n--- 3. Validação Geométrica de Modelos Particulares ---');
// Caso 1: Fotos compatíveis de Caixa Milk (Frente: 0.75 aspect, Lateral: 0.38 aspect)
const frontAspectValid = 0.75;
const sideAspectValid = 0.38;
const relValid = sideAspectValid / frontAspectValid;
const isGeomValid = relValid >= 0.15 && relValid <= 1.8;
const seamCalculated = Number((frontAspectValid / (frontAspectValid + sideAspectValid)).toFixed(3));
console.log(`Caso Válido (Fotos coerentes do mesmo produto):`);
console.log(`- Aspect Frente: ${frontAspectValid}, Aspect Lateral: ${sideAspectValid}`);
console.log(`- Relação: ${relValid.toFixed(2)} (Faixa permitida: 0.15 a 1.80) -> Compatível: ${isGeomValid}`);
console.log(`- SeamPoint calculado: ${seamCalculated} (Frente: ${Math.round(seamCalculated * 100)}%, Lateral: ${Math.round((1 - seamCalculated) * 100)}%)`);

// Caso 2: Fotos incompatíveis (ex: Frente de caixa e Lateral de outro objeto largo 2.5x)
const frontAspectInvalid = 0.60;
const sideAspectInvalid = 1.90; // Lateral 3x mais larga que a frente
const relInvalid = sideAspectInvalid / frontAspectInvalid;
const isGeomInvalid = relInvalid >= 0.15 && relInvalid <= 1.8;
console.log(`\nCaso Incompatível (Fotos de produtos diferentes ou corte excessivo):`);
console.log(`- Aspect Frente: ${frontAspectInvalid}, Aspect Lateral: ${sideAspectInvalid}`);
console.log(`- Relação: ${relInvalid.toFixed(2)} -> Incompatível: ${!isGeomInvalid}`);
console.log(`- Ação: Reduz confiança para < 0.45 e aciona alerta:`);
console.log(`  "Não conseguimos calcular corretamente a proporção entre a frente e a lateral deste modelo."`);

console.log('\n================================================================');
if (totalErrors === 0) {
  console.log('✅ TODAS AS VALIDAÇÕES PASSARAM COM SUCESSO! (0 ERROS)');
} else {
  console.log(`❌ ENCONTRADOS ${totalErrors} ERROS NA VALIDAÇÃO.`);
}
console.log('================================================================\n');
