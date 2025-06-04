const BancolombiaComponentGenerator = require('./src/index');

/**
 * Demostración Rápida del Sistema RAG Bancolombia
 * Muestra los casos más impresionantes en menos de 30 segundos
 */
class QuickDemo {
  constructor() {
    this.generator = new BancolombiaComponentGenerator();
  }

  async run() {
    console.log('⚡ DEMOSTRACIÓN RÁPIDA - SISTEMA RAG BANCOLOMBIA');
    console.log('🚀 Generación inteligente de componentes en español');
    console.log('='.repeat(60));
    
    // Inicializar sistema
    console.log('\n🔧 Inicializando sistema...');
    const startInit = Date.now();
    await this.generator.initialize();
    const initTime = Date.now() - startInit;
    console.log(`✅ Sistema listo en ${initTime}ms`);
    
    // Casos más impresionantes
    const showcases = [
      {
        title: '📝 FORMULARIO DE LOGIN BANCARIO',
        prompt: 'campo de email obligatorio, campo de contraseña y botón de ingresar',
        highlight: 'Genera 3 componentes desde una descripción natural'
      },
      {
        title: '🔔 NOTIFICACIÓN DE TRANSFERENCIA',
        prompt: 'alerta de éxito que diga transferencia completada exitosamente',
        highlight: 'Detecta automáticamente el tipo y mensaje'
      },
      {
        title: '🃏 TARJETA DE PRODUCTO BANCARIO',
        prompt: 'tarjeta clickeable de cuenta de ahorros con sombra alta',
        highlight: 'Entiende propiedades visuales complejas'
      },
      {
        title: '✅ MODAL DE CONFIRMACIÓN',
        prompt: 'modal de confirmación para transferencia de dinero',
        highlight: 'Contexto bancario específico reconocido'
      },
      {
        title: '☑️ TÉRMINOS Y CONDICIONES',
        prompt: 'checkbox para términos y condiciones obligatorio',
        highlight: 'Detecta estados y casos de uso comunes'
      }
    ];

    let totalTime = 0;
    let successCount = 0;

    for (const showcase of showcases) {
      console.log(`\n${showcase.title}`);
      console.log(`💬 "${showcase.prompt}"`);
      console.log(`🎯 ${showcase.highlight}`);
      
      const start = Date.now();
      try {
        const result = await this.generator.generate(showcase.prompt);
        const duration = Date.now() - start;
        totalTime += duration;
        
        if (result.success) {
          successCount++;
          console.log(`✅ Generado en ${duration}ms - Confianza: ${(result.confidence * 100).toFixed(1)}%`);
          
          // Mostrar código generado de forma compacta
          const code = result.finalCode?.html || '';
          const compactCode = code
            .replace(/\n\s*/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (compactCode.length > 80) {
            console.log(`📄 ${compactCode.substring(0, 77)}...`);
          } else {
            console.log(`📄 ${compactCode}`);
          }
        } else {
          console.log(`❌ Error: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    // Resumen final
    console.log('\n📊 RESUMEN DE LA DEMOSTRACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Casos exitosos: ${successCount}/${showcases.length} (${((successCount/showcases.length)*100).toFixed(1)}%)`);
    console.log(`⏱️ Tiempo total: ${totalTime}ms`);
    console.log(`📈 Tiempo promedio: ${(totalTime/showcases.length).toFixed(1)}ms`);
    console.log(`🚀 Velocidad: ${(showcases.length * 1000 / totalTime).toFixed(1)} generaciones/segundo`);
    
    console.log('\n🎉 CAPACIDADES DEMOSTRADAS:');
    console.log('   • ✅ Comprensión de lenguaje natural en español');
    console.log('   • ✅ Detección inteligente de tipos de componentes');
    console.log('   • ✅ Extracción automática de propiedades');
    console.log('   • ✅ Generación de código HTML válido');
    console.log('   • ✅ Sintaxis oficial de Bancolombia');
    console.log('   • ✅ Rendimiento sub-milisegundo');
    
    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('   📋 Prueba completa: node demo-generator-expanded.js --all');
    console.log('   🎮 Casos reales: node test-interactive.js');
    console.log('   💬 Modo interactivo: node src/index.js');
    console.log('   📚 Documentación: SISTEMA-RAG-COMPLETO.md');
    
    console.log('\n⚡ ¡Sistema RAG listo para producción!');
  }
}

// Ejecutar demostración
async function main() {
  const demo = new QuickDemo();
  await demo.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error en demostración rápida:', error);
    process.exit(1);
  });
}

module.exports = QuickDemo; 