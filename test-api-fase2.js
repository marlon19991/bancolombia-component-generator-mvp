/**
 * Script de Pruebas para la API REST - Fase 2
 * Prueba todos los endpoints de la nueva API
 */

const axios = require('axios');

class APITester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.apiVersion = 'v2';
    this.apiBase = `${baseUrl}/api/${this.apiVersion}`;
    this.results = [];
  }

  /**
   * Ejecuta una prueba y registra el resultado
   */
  async runTest(name, testFunction) {
    console.log(`\n🧪 Ejecutando: ${name}`);
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        status: 'PASS',
        duration,
        result
      });
      
      console.log(`✅ ${name} - PASS (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        status: 'FAIL',
        duration,
        error: error.message
      });
      
      console.log(`❌ ${name} - FAIL (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      return null;
    }
  }

  /**
   * Prueba la ruta raíz
   */
  async testRootEndpoint() {
    return await this.runTest('Root Endpoint', async () => {
      const response = await axios.get(this.baseUrl);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.name || !response.data.version) {
        throw new Error('Missing required fields in response');
      }
      
      console.log(`   📊 Version: ${response.data.version}`);
      console.log(`   🎯 Features: ${response.data.features.length} características`);
      
      return response.data;
    });
  }

  /**
   * Prueba la documentación de la API
   */
  async testDocsEndpoint() {
    return await this.runTest('API Documentation', async () => {
      const response = await axios.get(`${this.baseUrl}/docs`);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.endpoints || !Array.isArray(response.data.endpoints)) {
        throw new Error('Missing or invalid endpoints in documentation');
      }
      
      console.log(`   📚 Endpoints documentados: ${response.data.endpoints.length}`);
      
      return response.data;
    });
  }

  /**
   * Prueba el health check
   */
  async testHealthCheck() {
    return await this.runTest('Health Check', async () => {
      const response = await axios.get(`${this.apiBase}/components/health`);
      
      if (response.status !== 200 && response.status !== 503) {
        throw new Error(`Unexpected status ${response.status}`);
      }
      
      if (!response.data.status) {
        throw new Error('Missing status in health check response');
      }
      
      console.log(`   ❤️ Status: ${response.data.status}`);
      console.log(`   🔧 Services: ${Object.keys(response.data.services || {}).length}`);
      
      return response.data;
    });
  }

  /**
   * Prueba listar componentes
   */
  async testListComponents() {
    return await this.runTest('List Components', async () => {
      const response = await axios.get(`${this.apiBase}/components`);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.success || !response.data.data.components) {
        throw new Error('Invalid response structure');
      }
      
      const components = response.data.data.components;
      console.log(`   📦 Componentes encontrados: ${components.length}`);
      
      if (components.length > 0) {
        console.log(`   🏷️ Primer componente: ${components[0].name}`);
      }
      
      return response.data;
    });
  }

  /**
   * Prueba obtener detalles de un componente específico
   */
  async testGetComponentDetails() {
    return await this.runTest('Get Component Details', async () => {
      const componentName = 'bc-button';
      const response = await axios.get(`${this.apiBase}/components/${componentName}`);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.success || !response.data.data.name) {
        throw new Error('Invalid response structure');
      }
      
      const component = response.data.data;
      console.log(`   📦 Componente: ${component.name}`);
      console.log(`   📝 Descripción: ${component.description}`);
      console.log(`   🏷️ Categoría: ${component.category}`);
      console.log(`   ⚙️ Propiedades: ${Object.keys(component.properties || {}).length}`);
      
      return response.data;
    });
  }

  /**
   * Prueba buscar componentes similares
   */
  async testFindSimilarComponents() {
    return await this.runTest('Find Similar Components', async () => {
      const componentName = 'bc-button';
      const response = await axios.get(`${this.apiBase}/components/${componentName}/similar`);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.success || !response.data.data.similar) {
        throw new Error('Invalid response structure');
      }
      
      const similar = response.data.data.similar;
      console.log(`   🔗 Componentes similares: ${similar.length}`);
      
      if (similar.length > 0) {
        console.log(`   🎯 Más similar: ${similar[0].name} (score: ${similar[0].relevanceScore})`);
      }
      
      return response.data;
    });
  }

  /**
   * Prueba buscar por categoría
   */
  async testSearchByCategory() {
    return await this.runTest('Search by Category', async () => {
      const category = 'atoms';
      const response = await axios.get(`${this.apiBase}/components/categories/${category}`);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.success || !response.data.data.components) {
        throw new Error('Invalid response structure');
      }
      
      const components = response.data.data.components;
      console.log(`   🏷️ Categoría: ${category}`);
      console.log(`   📦 Componentes: ${components.length}`);
      
      return response.data;
    });
  }

  /**
   * Prueba búsqueda semántica
   */
  async testSemanticSearch() {
    return await this.runTest('Semantic Search', async () => {
      const searchData = {
        query: 'botón primario',
        options: {
          maxResults: 3,
          threshold: 0.5
        }
      };
      
      const response = await axios.post(`${this.apiBase}/components/search`, searchData);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.success || !response.data.data.results) {
        throw new Error('Invalid response structure');
      }
      
      const results = response.data.data.results;
      console.log(`   🔍 Query: "${searchData.query}"`);
      console.log(`   📊 Resultados: ${results.length}`);
      console.log(`   ⏱️ Tiempo: ${response.data.data.metadata.searchTime}ms`);
      
      if (results.length > 0) {
        console.log(`   🎯 Mejor match: ${results[0].component.name} (score: ${results[0].relevanceScore})`);
      }
      
      return response.data;
    });
  }

  /**
   * Prueba generación de componentes
   */
  async testComponentGeneration() {
    return await this.runTest('Component Generation', async () => {
      const generateData = {
        prompt: 'botón secundario que diga Cancelar',
        context: 'formulario de contacto',
        options: {
          maxResults: 1,
          threshold: 0.7,
          includeCode: true,
          includeTypeScript: true,
          format: 'html'
        }
      };
      
      const response = await axios.post(`${this.apiBase}/components/generate`, generateData);
      
      if (response.status !== 200 && response.status !== 422) {
        throw new Error(`Unexpected status ${response.status}`);
      }
      
      if (response.status === 200) {
        if (!response.data.success || !response.data.data.components) {
          throw new Error('Invalid success response structure');
        }
        
        const components = response.data.data.components;
        console.log(`   🎯 Prompt: "${generateData.prompt}"`);
        console.log(`   📊 Confianza: ${response.data.data.confidence}%`);
        console.log(`   📦 Componentes generados: ${components.length}`);
        
        if (components.length > 0) {
          console.log(`   🏷️ Tipo: ${components[0].type}`);
          console.log(`   💻 HTML incluido: ${!!components[0].html}`);
          console.log(`   📝 TypeScript incluido: ${!!components[0].typescript}`);
        }
      } else {
        console.log(`   ⚠️ Generación falló: ${response.data.message}`);
        if (response.data.suggestions) {
          console.log(`   💡 Sugerencias: ${response.data.suggestions.length}`);
        }
      }
      
      return response.data;
    });
  }

  /**
   * Prueba obtener estadísticas
   */
  async testGetStats() {
    return await this.runTest('Get Statistics', async () => {
      const response = await axios.get(`${this.apiBase}/components/stats`);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid response structure');
      }
      
      const stats = response.data.data;
      console.log(`   📊 Búsquedas totales: ${stats.totalSearches || 0}`);
      console.log(`   ⏱️ Tiempo promedio: ${stats.avgSearchTime || 0}ms`);
      console.log(`   📦 Componentes indexados: ${stats.componentsIndexed || 0}`);
      console.log(`   🔧 API Version: ${stats.api?.version || 'unknown'}`);
      
      return response.data;
    });
  }

  /**
   * Prueba manejo de errores 404
   */
  async testNotFoundError() {
    return await this.runTest('404 Error Handling', async () => {
      try {
        await axios.get(`${this.apiBase}/components/nonexistent-component`);
        throw new Error('Expected 404 error but request succeeded');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`   ✅ 404 manejado correctamente`);
          console.log(`   📝 Mensaje: ${error.response.data.message}`);
          return error.response.data;
        } else {
          throw error;
        }
      }
    });
  }

  /**
   * Prueba validación de parámetros
   */
  async testValidationError() {
    return await this.runTest('Validation Error Handling', async () => {
      try {
        await axios.post(`${this.apiBase}/components/search`, {
          // query faltante - debería fallar validación
          options: { maxResults: 5 }
        });
        throw new Error('Expected validation error but request succeeded');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log(`   ✅ Validación funcionando correctamente`);
          console.log(`   📝 Error: ${error.response.data.message}`);
          return error.response.data;
        } else {
          throw error;
        }
      }
    });
  }

  /**
   * Ejecuta todas las pruebas
   */
  async runAllTests() {
    console.log('🚀 Iniciando pruebas de la API REST - Fase 2');
    console.log(`📍 Base URL: ${this.baseUrl}`);
    console.log(`📊 API Version: ${this.apiVersion}`);
    
    const startTime = Date.now();
    
    // Pruebas básicas
    await this.testRootEndpoint();
    await this.testDocsEndpoint();
    await this.testHealthCheck();
    
    // Pruebas de componentes
    await this.testListComponents();
    await this.testGetComponentDetails();
    await this.testFindSimilarComponents();
    await this.testSearchByCategory();
    
    // Pruebas de funcionalidad RAG
    await this.testSemanticSearch();
    await this.testComponentGeneration();
    
    // Pruebas de estadísticas
    await this.testGetStats();
    
    // Pruebas de manejo de errores
    await this.testNotFoundError();
    await this.testValidationError();
    
    const totalTime = Date.now() - startTime;
    
    // Resumen de resultados
    this.printSummary(totalTime);
  }

  /**
   * Imprime resumen de resultados
   */
  printSummary(totalTime) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS - API REST FASE 2');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`\n✅ Pruebas exitosas: ${passed}/${total}`);
    console.log(`❌ Pruebas fallidas: ${failed}/${total}`);
    console.log(`⏱️ Tiempo total: ${totalTime}ms`);
    console.log(`📊 Tasa de éxito: ${Math.round((passed/total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n❌ PRUEBAS FALLIDAS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   • ${result.name}: ${result.error}`);
        });
    }
    
    console.log('\n⏱️ TIEMPOS DE RESPUESTA:');
    this.results
      .filter(r => r.status === 'PASS')
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .forEach(result => {
        console.log(`   • ${result.name}: ${result.duration}ms`);
      });
    
    const avgTime = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    console.log(`   📊 Tiempo promedio: ${Math.round(avgTime)}ms`);
    
    console.log('\n🎯 RECOMENDACIONES:');
    
    if (passed === total) {
      console.log('   ✅ Todas las pruebas pasaron. API lista para producción.');
    } else {
      console.log('   ⚠️ Hay pruebas fallidas. Revisar antes de desplegar.');
    }
    
    if (avgTime > 1000) {
      console.log('   ⚠️ Tiempos de respuesta altos. Considerar optimización.');
    } else if (avgTime < 200) {
      console.log('   ✅ Excelentes tiempos de respuesta.');
    }
    
    console.log('\n🚀 API REST Fase 2 - Pruebas completadas');
    console.log('='.repeat(60));
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  const tester = new APITester();
  
  tester.runAllTests().catch(error => {
    console.error('❌ Error ejecutando pruebas:', error.message);
    process.exit(1);
  });
}

module.exports = APITester; 