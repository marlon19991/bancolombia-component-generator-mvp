/**
 * Prueba rápida de generación con nuevos componentes
 */

const ComponentService = require('./src/core/generator/component.service');

async function testNewComponentGeneration() {
  console.log('🧪 Probando generación con nuevos componentes...\n');

  const componentService = new ComponentService();
  await componentService.initialize();

  const testPrompts = [
    'radio button para género',
    'dropdown de países',
    'acordeón básico de información',
    'pestañas horizontales',
    'breadcrumb de navegación'
  ];

  for (const prompt of testPrompts) {
    console.log(`🔍 Prompt: "${prompt}"`);
    try {
      const result = await componentService.generateFromPrompt(prompt);
      
      if (result.success) {
        console.log(`📊 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`📦 Componentes generados: ${result.components.length}`);
        
        result.components.forEach((component, index) => {
          console.log(`\n🏷️ Componente ${index + 1}: ${component.type}`);
          console.log(`Código HTML:`);
          console.log(component.html);
          
          if (component.typescript) {
            console.log(`\nCódigo TypeScript:`);
            console.log(component.typescript);
          }
        });
      } else {
        console.log(`💥 Error: ${result.error}`);
        if (result.suggestions) {
          console.log(`💡 Sugerencias:`, result.suggestions);
        }
      }
      
      console.log('----------------------------------------\n');
    } catch (error) {
      console.log(`💥 Error: ${error.message}\n`);
    }
  }

  console.log('✅ Prueba completada');
}

testNewComponentGeneration(); 