/**
 * Script de Prueba para Análisis de Prompts
 * Verifica que el PromptService detecta correctamente los componentes
 */

const PromptService = require('./src/core/ai/prompt.service');

function testPromptAnalysis() {
  console.log('🧪 Iniciando pruebas de análisis de prompts...\n');

  const promptService = new PromptService();

  // Casos de prueba específicos para bc-card
  const testCases = [
    'tarjeta básica',
    'card redondeada',
    'tarjeta con header',
    'card horizontal',
    'tarjeta de éxito',
    'contenedor de advertencia',
    'panel de información',
    'caja redondeada'
  ];

  console.log('📋 Casos de prueba para bc-card:');
  for (let i = 0; i < testCases.length; i++) {
    const prompt = testCases[i];
    console.log(`\n${i + 1}. Prompt: "${prompt}"`);
    
    try {
      const analysis = promptService.analyzePrompt(prompt);
      
      console.log(`   🎯 Confianza general: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`   📦 Componentes detectados: ${analysis.components.length}`);
      
      analysis.components.forEach((component, index) => {
        console.log(`   ${index + 1}. ${component.type} (confianza: ${(component.confidence * 100).toFixed(1)}%)`);
        console.log(`      Template: ${component.template}`);
        console.log(`      Propiedades:`, JSON.stringify(component.properties, null, 8));
      });
      
      if (analysis.interactions.length > 0) {
        console.log(`   🔗 Interacciones: ${analysis.interactions.length}`);
        analysis.interactions.forEach((interaction, index) => {
          console.log(`   ${index + 1}. ${interaction.trigger} → ${interaction.action}`);
        });
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }

  // Prueba de patrones específicos
  console.log('\n🔍 Prueba de patrones específicos:');
  
  const specificTests = [
    { prompt: 'tarjeta', expected: 'bc-card' },
    { prompt: 'card', expected: 'bc-card' },
    { prompt: 'contenedor', expected: 'bc-card' },
    { prompt: 'panel', expected: 'bc-card' },
    { prompt: 'caja', expected: 'bc-card' }
  ];
  
  specificTests.forEach((test, index) => {
    console.log(`\n${index + 1}. Trigger: "${test.prompt}"`);
    
    const detected = promptService.containsAny(test.prompt, promptService.patterns.card.triggers);
    console.log(`   ✅ Detectado: ${detected ? 'SÍ' : 'NO'}`);
    
    if (detected) {
      const cardAnalysis = promptService.analyzeCard(test.prompt);
      console.log(`   📝 Tipo: ${cardAnalysis.properties.type}`);
      console.log(`   🎯 Confianza: ${(cardAnalysis.confidence * 100).toFixed(1)}%`);
    }
  });

  console.log('\n✅ Pruebas de análisis de prompts completadas');
}

// Ejecutar pruebas
if (require.main === module) {
  testPromptAnalysis();
}

module.exports = testPromptAnalysis; 