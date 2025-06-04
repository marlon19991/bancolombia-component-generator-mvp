const ComponentService = require('./core/generator/component.service');

/**
 * API Principal del Generador de Componentes Bancolombia
 * Punto de entrada para todas las funcionalidades del sistema RAG
 */
class BancolombiaComponentGenerator {
  constructor() {
    this.componentService = new ComponentService();
    this.isReady = false;
  }

  /**
   * Inicializa el generador
   */
  async initialize() {
    console.log('🚀 Inicializando Bancolombia Component Generator...');
    
    try {
      const stats = await this.componentService.initialize();
      this.isReady = true;
      
      console.log('✅ Generador inicializado correctamente');
      console.log('📊 Estadísticas del sistema:', stats);
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error inicializando generador:', error);
      throw error;
    }
  }

  /**
   * Genera componente desde prompt en lenguaje natural
   */
  async generate(prompt, options = {}) {
    if (!this.isReady) {
      console.log('⚠️ Inicializando automáticamente...');
      await this.initialize();
    }

    console.log(`\n🎯 GENERANDO COMPONENTE`);
    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`⚙️ Opciones:`, options);
    
    const result = await this.componentService.generateFromPrompt(prompt, options);
    
    if (result.success) {
      console.log(`✅ Generación exitosa - Confianza: ${(result.confidence * 100).toFixed(1)}%`);
      this.printGeneratedCode(result);
    } else {
      console.log(`❌ Error en generación: ${result.error}`);
      if (result.suggestions) {
        console.log(`💡 Sugerencias:`, result.suggestions);
      }
    }
    
    return result;
  }

  /**
   * Busca componentes usando RAG
   */
  async search(query, limit = 5) {
    if (!this.isReady) {
      await this.initialize();
    }

    console.log(`\n🔍 BUSCANDO COMPONENTES`);
    console.log(`📝 Query: "${query}"`);
    
    const results = await this.componentService.searchComponents(query, limit);
    
    console.log(`📋 Encontrados ${results.length} componentes relevantes:`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name} (${(result.similarity * 100).toFixed(1)}% similitud)`);
    });
    
    return results;
  }

  /**
   * Genera variantes de un componente
   */
  async generateVariants(componentName, baseProperties = {}) {
    if (!this.isReady) {
      await this.initialize();
    }

    console.log(`\n🎨 GENERANDO VARIANTES`);
    console.log(`📦 Componente: ${componentName}`);
    console.log(`⚙️ Propiedades base:`, baseProperties);
    
    const variants = await this.componentService.generateVariants(componentName, baseProperties);
    
    console.log(`✅ ${variants.length} variantes generadas`);
    
    return variants;
  }

  /**
   * Obtiene información de un componente específico
   */
  getComponent(name) {
    return this.componentService.getComponent(name);
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats() {
    return this.componentService.getSystemStats();
  }

  /**
   * Imprime el código generado de forma legible
   */
  printGeneratedCode(result) {
    console.log(`\n📄 CÓDIGO GENERADO:`);
    console.log(`${'='.repeat(50)}`);
    
    if (result.finalCode.html) {
      console.log(`\n🏷️ HTML:`);
      console.log(result.finalCode.html);
    }
    
    if (result.finalCode.typescript) {
      console.log(`\n📜 TypeScript:`);
      console.log(result.finalCode.typescript);
    }
    
    if (result.finalCode.imports && result.finalCode.imports.length > 0) {
      console.log(`\n📦 Imports:`);
      result.finalCode.imports.forEach(imp => {
        console.log(`import { ${imp.module} } from '${imp.from}';`);
      });
    }
    
    console.log(`${'='.repeat(50)}`);
  }

  /**
   * Modo interactivo para pruebas
   */
  async interactive() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🎮 MODO INTERACTIVO ACTIVADO');
    console.log('Escribe prompts para generar componentes (escribe "exit" para salir)');
    console.log('Ejemplos:');
    console.log('- "botón primario que diga Guardar"');
    console.log('- "alerta de éxito"');
    console.log('- "botón que muestre alerta de error"');
    console.log('');

    const askQuestion = () => {
      rl.question('💬 Prompt: ', async (prompt) => {
        if (prompt.toLowerCase() === 'exit') {
          console.log('👋 ¡Hasta luego!');
          rl.close();
          return;
        }

        if (prompt.trim()) {
          try {
            await this.generate(prompt);
          } catch (error) {
            console.error('❌ Error:', error.message);
          }
        }

        console.log(''); // Línea en blanco
        askQuestion();
      });
    };

    if (!this.isReady) {
      await this.initialize();
    }

    askQuestion();
  }
}

// Exportar la clase principal
module.exports = BancolombiaComponentGenerator;

// Si se ejecuta directamente, iniciar modo interactivo
if (require.main === module) {
  const generator = new BancolombiaComponentGenerator();
  
  // Verificar si está en modo web (servidor)
  if (process.env.WEB_MODE === 'true' || process.env.INTERACTIVE_MODE === 'false') {
    // Modo servidor web - solo inicializar sin modo interactivo
    console.log('🌐 Modo servidor web detectado - iniciando servidor Express...');
    
    // Importar y iniciar el servidor Express
    const app = require('./app');
    const PORT = process.env.PORT || 3000;
    
    // Inicializar el generador en segundo plano
    generator.initialize().then(() => {
      console.log('✅ Sistema RAG inicializado correctamente');
      
      // Iniciar servidor Express
      app.listen(PORT, () => {
        console.log(`🌐 Servidor iniciado correctamente:`);
        console.log('');
        console.log('   📊 API REST:');
        console.log(`      http://localhost:${PORT}/`);
        console.log(`      http://localhost:${PORT}/docs`);
        console.log('');
        console.log('   🎨 Interfaz Web:');
        console.log(`      http://localhost:${PORT}/app`);
        console.log(`      http://localhost:${PORT}/web`);
        console.log('');
        console.log('   🔧 Endpoints principales:');
        console.log(`      POST http://localhost:${PORT}/api/v2/components/generate`);
        console.log(`      POST http://localhost:${PORT}/api/v2/components/search`);
        console.log(`      GET  http://localhost:${PORT}/api/v2/components`);
        console.log('');
        console.log('💡 Presiona Ctrl+C para detener el servidor');
        console.log('');
      });
    }).catch(error => {
      console.error('❌ Error inicializando sistema RAG:', error);
      process.exit(1);
    });
    
    return;
  }
  
  // Verificar argumentos de línea de comandos
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Modo comando directo
    const prompt = args.join(' ');
    generator.generate(prompt).then(() => {
      process.exit(0);
    }).catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
  } else {
    // Modo interactivo
    generator.interactive().catch(error => {
      console.error('❌ Error en modo interactivo:', error);
      process.exit(1);
    });
  }
} 