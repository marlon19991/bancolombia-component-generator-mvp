/**
 * Script de Prueba para bc-card
 * Verifica que el nuevo componente funciona correctamente con el sistema RAG
 */

const ComponentService = require('./src/core/generator/component.service');

async function testBcCard() {
  console.log('🧪 Iniciando pruebas de bc-card...\n');

  const componentService = new ComponentService();
  await componentService.initialize();

  // Casos de prueba para bc-card
  const testCases = [
    'tarjeta básica',
    'card redondeada',
    'tarjeta con header',
    'card horizontal',
    'tarjeta de éxito',
    'card de error verde',
    'contenedor de advertencia',
    'panel de información',
    'caja redondeada con header',
    'tarjeta horizontal de error'
  ];

  console.log('📋 Casos de prueba:');
  for (let i = 0; i < testCases.length; i++) {
    const prompt = testCases[i];
    console.log(`\n${i + 1}. Prompt: "${prompt}"`);
    
    try {
      const result = await componentService.generateFromPrompt(prompt);
      
      if (result.success && result.finalCode) {
        console.log('   ✅ Generación exitosa');
        console.log(`   🎯 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   📦 Componentes detectados: ${result.components.length}`);
        
        if (result.finalCode.html) {
          console.log('   📄 HTML generado:');
          console.log('   ' + result.finalCode.html.split('\n').join('\n   '));
        }
        
        if (result.finalCode.typescript) {
          console.log('   📄 TypeScript generado:');
          console.log('   ' + result.finalCode.typescript.split('\n').join('\n   '));
        }
        
        if (result.finalCode.imports && result.finalCode.imports.length > 0) {
          console.log('   📦 Imports necesarios:');
          result.finalCode.imports.forEach(imp => {
            console.log(`   import { ${imp.module} } from '${imp.from}';`);
          });
        }

        // Mostrar detalles del componente bc-card si fue detectado
        const cardComponent = result.components.find(c => c.type === 'bc-card');
        if (cardComponent) {
          console.log('   🎴 Propiedades de bc-card:');
          console.log(`      Tipo: ${cardComponent.properties.type || 'default'}`);
          if (cardComponent.properties.backgroundColor) {
            console.log(`      Color de fondo: ${cardComponent.properties.backgroundColor}`);
          }
          if (cardComponent.properties.content) {
            console.log(`      Contenido: ${cardComponent.properties.content}`);
          }
        }
      } else {
        console.log('   ❌ Error en la generación');
        if (result.error) {
          console.log(`   💥 Error: ${result.error}`);
        }
        if (result.suggestions && result.suggestions.length > 0) {
          console.log('   💡 Sugerencias:');
          result.suggestions.forEach(suggestion => {
            console.log(`      - ${suggestion.message}`);
          });
        }
      }
    } catch (error) {
      console.log(`   💥 Excepción: ${error.message}`);
    }
  }

  // Prueba de búsqueda RAG específica para bc-card
  console.log('\n🔍 Prueba de búsqueda RAG para bc-card:');
  try {
    const searchResults = await componentService.searchComponents('tarjeta contenedor panel');
    console.log(`🔍 Buscando: "tarjeta contenedor panel"`);
    console.log(`📋 Encontrados ${searchResults.length} componentes relevantes`);
    console.log(`   📊 Resultados encontrados: ${searchResults.length}`);
    
    searchResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.name} (similitud: ${(result.similarity * 100).toFixed(1)}%)`);
      console.log(`      ${result.description.substring(0, 100)}...`);
    });
  } catch (error) {
    console.log(`   💥 Error en búsqueda RAG: ${error.message}`);
  }

  // Estadísticas del sistema
  console.log('\n📈 Estadísticas del sistema:');
  try {
    const stats = componentService.getSystemStats();
    console.log('   📊 Sistema inicializado:', stats.initialized);
    console.log('   📦 Componentes indexados:', stats.indexer.totalComponents);
    console.log('   📄 Templates cargados:', stats.templates.totalTemplates);
    console.log('   🧠 Patrones de prompts:', stats.prompts.totalPatterns);
    console.log('   🎴 Patrones de card:', stats.prompts.cardPatterns);
  } catch (error) {
    console.log(`   💥 Error obteniendo estadísticas: ${error.message}`);
  }

  console.log('\n✅ Pruebas de bc-card completadas');
}

// Ejecutar pruebas
if (require.main === module) {
  testBcCard().catch(console.error);
}

module.exports = testBcCard; 