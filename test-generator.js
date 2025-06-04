const BancolombiaComponentGenerator = require('./src/index');

/**
 * Script de Prueba del Generador de Componentes Bancolombia
 * Valida todas las funcionalidades del sistema RAG
 */
async function runTests() {
  console.log('🧪 INICIANDO PRUEBAS DEL GENERADOR BANCOLOMBIA');
  console.log('='.repeat(60));

  const generator = new BancolombiaComponentGenerator();

  try {
    // Test 1: Inicialización
    console.log('\n📋 TEST 1: Inicialización del sistema');
    const stats = await generator.initialize();
    console.log('✅ Sistema inicializado correctamente');
    console.log('📊 Estadísticas:', JSON.stringify(stats, null, 2));

    // Test 2: Generación de botón simple
    console.log('\n📋 TEST 2: Botón primario simple');
    const buttonResult = await generator.generate('botón primario que diga Guardar');
    console.log('✅ Botón generado:', buttonResult.success ? 'ÉXITO' : 'FALLO');

    // Test 3: Generación de alerta
    console.log('\n📋 TEST 3: Alerta de éxito');
    const alertResult = await generator.generate('alerta de éxito que diga "Operación completada"');
    console.log('✅ Alerta generada:', alertResult.success ? 'ÉXITO' : 'FALLO');

    // Test 4: Interacción compleja
    console.log('\n📋 TEST 4: Botón con alerta (interacción)');
    const interactionResult = await generator.generate('botón secundario que muestre alerta de error');
    console.log('✅ Interacción generada:', interactionResult.success ? 'ÉXITO' : 'FALLO');

    // Test 5: Búsqueda RAG
    console.log('\n📋 TEST 5: Búsqueda de componentes');
    const searchResults = await generator.search('botón');
    console.log('✅ Búsqueda completada:', searchResults.length > 0 ? 'ÉXITO' : 'FALLO');

    // Test 6: Variantes
    console.log('\n📋 TEST 6: Generación de variantes');
    const variants = await generator.generateVariants('bc-button', { buttonText: 'Test' });
    console.log('✅ Variantes generadas:', variants.length > 0 ? 'ÉXITO' : 'FALLO');

    // Test 7: Prompts en español
    console.log('\n📋 TEST 7: Prompts en español');
    const spanishTests = [
      'botón pequeño de cancelar',
      'alerta de advertencia temporal',
      'botón ancho completo primario'
    ];

    for (const prompt of spanishTests) {
      const result = await generator.generate(prompt);
      console.log(`  - "${prompt}": ${result.success ? '✅' : '❌'}`);
    }

    // Test 8: Casos edge
    console.log('\n📋 TEST 8: Casos edge y errores');
    const edgeTests = [
      'componente inexistente',
      '',
      'botón con propiedades inválidas'
    ];

    for (const prompt of edgeTests) {
      const result = await generator.generate(prompt);
      console.log(`  - "${prompt}": ${result.success ? '⚠️ Inesperado' : '✅ Error manejado'}`);
    }

    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Función para pruebas específicas
async function testSpecificPrompts() {
  console.log('\n🎯 PRUEBAS ESPECÍFICAS DE PROMPTS');
  console.log('='.repeat(40));

  const generator = new BancolombiaComponentGenerator();
  await generator.initialize();

  const testPrompts = [
    // Botones básicos
    'botón primario',
    'botón secundario pequeño',
    'botón que diga Aceptar',
    'botón ancho completo',
    
    // Alertas básicas
    'alerta de éxito',
    'alerta de error con título',
    'mensaje de información',
    'alerta temporal',
    
    // Interacciones
    'botón que muestre alerta',
    'botón de guardar que muestre confirmación',
    
    // Casos complejos
    'botón primario grande que diga "Continuar" y muestre alerta de éxito'
  ];

  for (const prompt of testPrompts) {
    console.log(`\n🔍 Probando: "${prompt}"`);
    const result = await generator.generate(prompt);
    
    if (result.success) {
      console.log(`✅ Confianza: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`📦 Componentes: ${result.components.length}`);
    } else {
      console.log(`❌ Error: ${result.error}`);
      if (result.suggestions) {
        console.log(`💡 Sugerencias: ${result.suggestions.length}`);
      }
    }
  }
}

// Función para benchmark de rendimiento
async function benchmarkPerformance() {
  console.log('\n⚡ BENCHMARK DE RENDIMIENTO');
  console.log('='.repeat(40));

  const generator = new BancolombiaComponentGenerator();
  
  // Medir tiempo de inicialización
  const initStart = Date.now();
  await generator.initialize();
  const initTime = Date.now() - initStart;
  console.log(`⏱️ Inicialización: ${initTime}ms`);

  // Medir tiempo de generación
  const prompts = [
    'botón primario',
    'alerta de éxito',
    'botón que muestre alerta'
  ];

  for (const prompt of prompts) {
    const start = Date.now();
    await generator.generate(prompt);
    const time = Date.now() - start;
    console.log(`⏱️ "${prompt}": ${time}ms`);
  }

  // Medir búsqueda RAG
  const searchStart = Date.now();
  await generator.search('botón');
  const searchTime = Date.now() - searchStart;
  console.log(`⏱️ Búsqueda RAG: ${searchTime}ms`);
}

// Ejecutar según argumentos
const args = process.argv.slice(2);

if (args.includes('--specific')) {
  testSpecificPrompts();
} else if (args.includes('--benchmark')) {
  benchmarkPerformance();
} else if (args.includes('--all')) {
  runTests()
    .then(() => testSpecificPrompts())
    .then(() => benchmarkPerformance());
} else {
  runTests();
} 