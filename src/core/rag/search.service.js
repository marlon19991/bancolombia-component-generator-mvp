/**
 * Servicio de Búsqueda RAG Avanzado
 * Utiliza embeddings vectoriales y base de datos vectorial para búsqueda semántica de alta precisión
 */

const VectorStoreService = require('./vector-store.service');
const EmbeddingsService = require('./embeddings.service');
const fs = require('fs').promises;
const path = require('path');

class SearchService {
  constructor() {
    this.vectorStore = new VectorStoreService();
    this.embeddingsService = new EmbeddingsService();
    this.isInitialized = false;
    this.componentsIndex = new Map();
    this.searchHistory = [];
    this.maxHistorySize = 100;
    
    // Configuración de búsqueda
    this.config = {
      similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.7,
      maxResults: parseInt(process.env.MAX_RESULTS) || 5,
      enableReranking: process.env.ENABLE_RERANKING !== 'false',
      enableQueryExpansion: process.env.ENABLE_QUERY_EXPANSION !== 'false',
      enableFeedback: process.env.ENABLE_FEEDBACK !== 'false'
    };
  }

  /**
   * Inicializa el servicio de búsqueda
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando servicio de búsqueda RAG...');

      // Inicializar vector store
      await this.vectorStore.initialize();

      // Cargar componentes en el índice
      await this.indexComponents();

      this.isInitialized = true;
      console.log('✅ Servicio de búsqueda RAG inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando servicio de búsqueda:', error.message);
      throw error;
    }
  }

  /**
   * Indexa todos los componentes en la base de datos vectorial
   */
  async indexComponents() {
    try {
      console.log('📚 Indexando componentes...');

      const componentsDir = path.join(__dirname, '../../data/component-definitions');
      const files = await fs.readdir(componentsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const documents = [];

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(componentsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const component = JSON.parse(content);

          // Crear documento indexable
          const document = this.createIndexableDocument(component);
          documents.push(document);

          // Guardar en índice local para acceso rápido
          this.componentsIndex.set(component.name, component);

          console.log(`📦 Componente indexado: ${component.name}`);
        } catch (error) {
          console.error(`❌ Error indexando ${file}:`, error.message);
        }
      }

      // Indexar en lote en la base de datos vectorial
      if (documents.length > 0) {
        await this.vectorStore.batchUpsert(documents);
        console.log(`✅ ${documents.length} componentes indexados en vector store`);
      }

    } catch (error) {
      console.error('❌ Error en indexación:', error.message);
      throw error;
    }
  }

  /**
   * Crea un documento indexable a partir de un componente
   */
  createIndexableDocument(component) {
    // Crear texto rico para embeddings
    const searchableText = [
      component.name,
      component.description,
      component.category,
      component.type,
      ...(component.prompts || []),
      ...Object.keys(component.properties || {}),
      ...Object.values(component.properties || {}).map(prop => prop.description).filter(Boolean),
      ...(component.examples || []).map(ex => `${ex.name} ${ex.description}`).filter(Boolean)
    ].join(' ');

    return {
      id: component.name,
      text: searchableText,
      metadata: {
        name: component.name,
        description: component.description,
        category: component.category,
        type: component.type,
        module: component.module,
        import: component.import,
        prompts: component.prompts || [],
        propertiesCount: Object.keys(component.properties || {}).length,
        examplesCount: (component.examples || []).length,
        indexed_at: Date.now()
      }
    };
  }

  /**
   * Busca componentes usando RAG
   */
  async search(query, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    try {
      console.log(`🔍 Búsqueda RAG: "${query}"`);

      // Expandir consulta si está habilitado
      const expandedQuery = this.config.enableQueryExpansion ? 
        await this.expandQuery(query) : query;

      // Búsqueda vectorial
      const vectorResults = await this.vectorStore.search(expandedQuery, {
        topK: options.maxResults || this.config.maxResults * 2, // Obtener más para reranking
        threshold: options.threshold || this.config.similarityThreshold,
        filter: options.filter || {}
      });

      // Enriquecer resultados con datos completos
      let enrichedResults = await this.enrichResults(vectorResults);

      // Reranking si está habilitado
      if (this.config.enableReranking && enrichedResults.length > 1) {
        enrichedResults = await this.rerankResults(query, enrichedResults);
      }

      // Limitar resultados finales
      const finalResults = enrichedResults.slice(0, options.maxResults || this.config.maxResults);

      // Guardar en historial
      this.addToHistory(query, finalResults, Date.now() - startTime);

      console.log(`✅ Búsqueda completada: ${finalResults.length} resultados en ${Date.now() - startTime}ms`);

      return {
        query: query,
        expandedQuery: expandedQuery !== query ? expandedQuery : undefined,
        results: finalResults,
        totalFound: vectorResults.length,
        searchTime: Date.now() - startTime,
        provider: this.vectorStore.provider
      };

    } catch (error) {
      console.error('❌ Error en búsqueda RAG:', error.message);
      throw error;
    }
  }

  /**
   * Expande la consulta con sinónimos y términos relacionados
   */
  async expandQuery(query) {
    const expansions = {
      // Sinónimos de componentes
      'botón': 'button btn boton',
      'alerta': 'alert mensaje notificación aviso',
      'campo': 'input entrada formulario',
      'tarjeta': 'card contenedor panel caja',
      'modal': 'ventana popup diálogo overlay',
      'checkbox': 'casilla verificación marcar',
      'radio': 'opción única selección',
      'select': 'dropdown lista desplegable opciones',
      'acordeón': 'accordion expandir colapsar',
      'pestañas': 'tabs tabulador navegación',
      'breadcrumb': 'navegación ruta migas path',
      
      // Sinónimos de propiedades
      'primario': 'primary principal',
      'secundario': 'secondary segundo',
      'pequeño': 'small chico mini',
      'grande': 'large big amplio',
      'error': 'fallo problema incorrecto',
      'éxito': 'success correcto exitoso',
      'información': 'info informativo datos',
      'advertencia': 'warning cuidado atención'
    };

    let expandedQuery = query.toLowerCase();

    // Aplicar expansiones
    Object.entries(expansions).forEach(([term, expansion]) => {
      if (expandedQuery.includes(term)) {
        expandedQuery += ` ${expansion}`;
      }
    });

    return expandedQuery;
  }

  /**
   * Enriquece los resultados con datos completos del componente
   */
  async enrichResults(vectorResults) {
    const enrichedResults = [];

    for (const result of vectorResults) {
      const componentName = result.metadata?.name || result.id;
      const fullComponent = this.componentsIndex.get(componentName);

      if (fullComponent) {
        enrichedResults.push({
          ...result,
          component: fullComponent,
          relevanceScore: result.score,
          matchedPrompts: this.findMatchedPrompts(fullComponent, result.query),
          matchedProperties: this.findMatchedProperties(fullComponent, result.query)
        });
      }
    }

    return enrichedResults;
  }

  /**
   * Encuentra prompts que coinciden con la consulta
   */
  findMatchedPrompts(component, query) {
    if (!component.prompts || !query) return [];

    const queryLower = query.toLowerCase();
    return component.prompts.filter(prompt => 
      queryLower.includes(prompt.toLowerCase()) || 
      prompt.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Encuentra propiedades que coinciden con la consulta
   */
  findMatchedProperties(component, query) {
    if (!component.properties || !query) return [];

    const queryLower = query.toLowerCase();
    const matchedProps = [];

    Object.entries(component.properties).forEach(([propName, propDef]) => {
      if (queryLower.includes(propName.toLowerCase()) ||
          (propDef.description && queryLower.includes(propDef.description.toLowerCase()))) {
        matchedProps.push({
          name: propName,
          definition: propDef
        });
      }
    });

    return matchedProps;
  }

  /**
   * Reordena los resultados usando múltiples factores
   */
  async rerankResults(query, results) {
    const queryLower = query.toLowerCase();

    return results.map(result => {
      let rerankScore = result.relevanceScore;

      // Bonus por coincidencia exacta en nombre
      if (result.component.name.toLowerCase().includes(queryLower)) {
        rerankScore += 0.2;
      }

      // Bonus por coincidencia en prompts
      if (result.matchedPrompts.length > 0) {
        rerankScore += 0.1 * result.matchedPrompts.length;
      }

      // Bonus por coincidencia en propiedades
      if (result.matchedProperties.length > 0) {
        rerankScore += 0.05 * result.matchedProperties.length;
      }

      // Bonus por categoría (átomos son más básicos)
      if (result.component.category === 'atoms') {
        rerankScore += 0.05;
      }

      // Penalty por componentes complejos si la consulta es simple
      if (queryLower.split(' ').length <= 2 && result.component.category === 'organisms') {
        rerankScore -= 0.1;
      }

      return {
        ...result,
        rerankScore: Math.min(rerankScore, 1.0) // Limitar a 1.0
      };
    }).sort((a, b) => b.rerankScore - a.rerankScore);
  }

  /**
   * Busca componentes por categoría
   */
  async searchByCategory(category, options = {}) {
    return await this.search('', {
      ...options,
      filter: { category: category }
    });
  }

  /**
   * Busca componentes por tipo
   */
  async searchByType(type, options = {}) {
    return await this.search('', {
      ...options,
      filter: { type: type }
    });
  }

  /**
   * Obtiene componentes similares a uno dado
   */
  async findSimilar(componentName, options = {}) {
    const component = this.componentsIndex.get(componentName);
    if (!component) {
      throw new Error(`Componente no encontrado: ${componentName}`);
    }

    // Usar la descripción del componente como consulta
    const query = `${component.description} ${component.prompts?.join(' ') || ''}`;
    
    const results = await this.search(query, {
      ...options,
      filter: { name: { $ne: componentName } } // Excluir el componente original
    });

    return results;
  }

  /**
   * Agrega una búsqueda al historial
   */
  addToHistory(query, results, searchTime) {
    this.searchHistory.unshift({
      query,
      resultsCount: results.length,
      searchTime,
      timestamp: Date.now(),
      topResult: results[0]?.component?.name || null
    });

    // Limitar tamaño del historial
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Obtiene el historial de búsquedas
   */
  getSearchHistory(limit = 10) {
    return this.searchHistory.slice(0, limit);
  }

  /**
   * Obtiene estadísticas de búsqueda
   */
  async getSearchStats() {
    if (this.searchHistory.length === 0) {
      return { totalSearches: 0 };
    }

    const avgSearchTime = this.searchHistory.reduce((sum, search) => 
      sum + search.searchTime, 0) / this.searchHistory.length;

    const topQueries = this.searchHistory
      .reduce((acc, search) => {
        acc[search.query] = (acc[search.query] || 0) + 1;
        return acc;
      }, {});

    const vectorStoreStats = await this.vectorStore.getStats();

    return {
      totalSearches: this.searchHistory.length,
      avgSearchTime: Math.round(avgSearchTime),
      topQueries: Object.entries(topQueries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([query, count]) => ({ query, count })),
      componentsIndexed: this.componentsIndex.size,
      vectorStoreStats: vectorStoreStats
    };
  }

  /**
   * Reindexar un componente específico
   */
  async reindexComponent(componentName) {
    try {
      const component = this.componentsIndex.get(componentName);
      if (!component) {
        throw new Error(`Componente no encontrado: ${componentName}`);
      }

      const document = this.createIndexableDocument(component);
      await this.vectorStore.upsert(document.id, document.text, document.metadata);

      console.log(`✅ Componente reindexado: ${componentName}`);
      return { success: true, component: componentName };
    } catch (error) {
      console.error(`❌ Error reindexando ${componentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Limpia el índice y lo reconstruye
   */
  async rebuildIndex() {
    try {
      console.log('🔄 Reconstruyendo índice...');
      
      await this.vectorStore.clear();
      this.componentsIndex.clear();
      this.searchHistory = [];
      
      await this.indexComponents();
      
      console.log('✅ Índice reconstruido correctamente');
      return { success: true };
    } catch (error) {
      console.error('❌ Error reconstruyendo índice:', error.message);
      throw error;
    }
  }

  /**
   * Verifica la salud del servicio
   */
  async healthCheck() {
    try {
      const vectorStoreHealth = await this.vectorStore.healthCheck();
      const embeddingsStats = this.embeddingsService.getStats();

      return {
        status: 'healthy',
        initialized: this.isInitialized,
        componentsIndexed: this.componentsIndex.size,
        searchHistory: this.searchHistory.length,
        vectorStore: vectorStoreHealth,
        embeddings: embeddingsStats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = SearchService; 