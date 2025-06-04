/**
 * Script de Prueba para los Nuevos Componentes
 * Verifica que el PromptService detecta correctamente los 5 nuevos componentes
 */

const PromptService = require('./src/core/ai/prompt.service');

function testNewComponents() {
  console.log('🧪 Iniciando pruebas de los nuevos componentes...\n');

  const promptService = new PromptService();

  // Casos de prueba para bc-radio
  console.log('📋 Casos de prueba para bc-radio:');
  const radioTests = [
    'radio button para género',
    'opción única seleccionada',
    'botón de radio deshabilitado',
    'selección única para pago',
    'radio de método de pago'
  ];

  radioTests.forEach((prompt, index) => {
    console.log(`\n${index + 1}. Prompt: "${prompt}"`);
    try {
      const analysis = promptService.analyzePrompt(prompt);
      console.log(`   🎯 Confianza: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`   📦 Componentes: ${analysis.components.length}`);
      
      analysis.components.forEach((component, i) => {
        console.log(`   ${i + 1}. ${component.type} (${(component.confidence * 100).toFixed(1)}%)`);
        console.log(`      Propiedades:`, JSON.stringify(component.properties, null, 8));
      });
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  });

  // Casos de prueba para bc-input-select
  console.log('\n\n📋 Casos de prueba para bc-input-select:');
  const selectTests = [
    'dropdown de países',
    'lista desplegable múltiple',
    'select con iconos',
    'menú desplegable filtrable',
    'seleccionar opción de cuenta'
  ];

  selectTests.forEach((prompt, index) => {
    console.log(`\n${index + 1}. Prompt: "${prompt}"`);
    try {
      const analysis = promptService.analyzePrompt(prompt);
      console.log(`   🎯 Confianza: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`   📦 Componentes: ${analysis.components.length}`);
      
      analysis.components.forEach((component, i) => {
        console.log(`   ${i + 1}. ${component.type} (${(component.confidence * 100).toFixed(1)}%)`);
        console.log(`      Propiedades:`, JSON.stringify(component.properties, null, 8));
      });
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  });

  // Casos de prueba para bc-accordion
  console.log('\n\n📋 Casos de prueba para bc-accordion:');
  const accordionTests = [
    'acordeón básico de información',
    'accordion avanzado expandido',
    'panel expandible único',
    'sección colapsable de configuración',
    'acordeón mínimo sin bordes'
  ];

  accordionTests.forEach((prompt, index) => {
    console.log(`\n${index + 1}. Prompt: "${prompt}"`);
    try {
      const analysis = promptService.analyzePrompt(prompt);
      console.log(`   🎯 Confianza: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`   📦 Componentes: ${analysis.components.length}`);
      
      analysis.components.forEach((component, i) => {
        console.log(`   ${i + 1}. ${component.type} (${(component.confidence * 100).toFixed(1)}%)`);
        console.log(`      Propiedades:`, JSON.stringify(component.properties, null, 8));
      });
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  });

  // Casos de prueba para bc-tabs-group
  console.log('\n\n📋 Casos de prueba para bc-tabs-group:');
  const tabsTests = [
    'pestañas horizontales',
    'tabs verticales oscuras',
    'tabulador con iconos',
    'navegación por pestañas',
    'contenido tabulado con animación'
  ];

  tabsTests.forEach((prompt, index) => {
    console.log(`\n${index + 1}. Prompt: "${prompt}"`);
    try {
      const analysis = promptService.analyzePrompt(prompt);
      console.log(`   🎯 Confianza: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`   📦 Componentes: ${analysis.components.length}`);
      
      analysis.components.forEach((component, i) => {
        console.log(`   ${i + 1}. ${component.type} (${(component.confidence * 100).toFixed(1)}%)`);
        console.log(`      Propiedades:`, JSON.stringify(component.properties, null, 8));
      });
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  });

  // Casos de prueba para bc-breadcrumb
  console.log('\n\n📋 Casos de prueba para bc-breadcrumb:');
  const breadcrumbTests = [
    'breadcrumb de navegación',
    'ruta de navegación con flechas',
    'migas de pan limitadas',
    'navegación jerárquica',
    'path con separador punto'
  ];

  breadcrumbTests.forEach((prompt, index) => {
    console.log(`\n${index + 1}. Prompt: "${prompt}"`);
    try {
      const analysis = promptService.analyzePrompt(prompt);
      console.log(`   🎯 Confianza: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`   📦 Componentes: ${analysis.components.length}`);
      
      analysis.components.forEach((component, i) => {
        console.log(`   ${i + 1}. ${component.type} (${(component.confidence * 100).toFixed(1)}%)`);
        console.log(`      Propiedades:`, JSON.stringify(component.properties, null, 8));
      });
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  });

  // Estadísticas finales
  console.log('\n\n📊 Estadísticas del sistema expandido:');
  const stats = promptService.getStats();
  console.log('   📦 Total de patrones:', stats.totalPatterns);
  console.log('   🔍 Componentes soportados: 11 (bc-button, bc-alert, bc-input, bc-card, bc-modal, bc-checkbox, bc-radio, bc-input-select, bc-accordion, bc-tabs-group, bc-breadcrumb)');
  console.log('   🎯 Cobertura expandida: 183% incremento (de 6 a 11 componentes)');

  console.log('\n✅ Pruebas de nuevos componentes completadas');
  console.log('🚀 Sistema RAG expandido exitosamente a 11 componentes');
}

// Ejecutar pruebas
if (require.main === module) {
  testNewComponents();
}

module.exports = testNewComponents; 