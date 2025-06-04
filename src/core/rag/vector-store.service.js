/**
 * Servicio de Base de Datos Vectorial
 * Soporta Pinecone y ChromaDB para almacenamiento y búsqueda de embeddings
 */

const { Pinecone } = require('@pinecone-database/pinecone');
const { ChromaClient } = require('chromadb');
const EmbeddingsService = require('./embeddings.service');

class VectorStoreService {
  constructor() {
    this.provider = process.env.VECTOR_STORE_PROVIDER || 'chroma';
    this.pinecone = null;
    this.pineconeIndex = null;
    this.chroma = null;
    this.chromaCollection = null;
    this.embeddingsService = new EmbeddingsService();
    this.isInitialized = false;
    
    this.config = {
      pinecone: {
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
        indexName: process.env.PINECONE_INDEX_NAME || 'bancolombia-components'
      },
      chroma: {
        host: process.env.CHROMA_HOST || 'localhost',
        port: parseInt(process.env.CHROMA_PORT) || 8000,
        collection: process.env.CHROMA_COLLECTION || 'bancolombia_components'
      }
    };
  }

  /**
   * Inicializa la base de datos vectorial
   */
  async initialize() {
    try {
      console.log(`🚀 Inicializando vector store: ${this.provider}`);

      switch (this.provider) {
        case 'pinecone':
          await this.initializePinecone();
          break;
        case 'chroma':
          await this.initializeChroma();
          break;
        default:
          throw new Error(`Proveedor no soportado: ${this.provider}`);
      }

      this.isInitialized = true;
      console.log(`✅ Vector store ${this.provider} inicializado correctamente`);
    } catch (error) {
      console.error(`❌ Error inicializando vector store:`, error.message);
      
      // Fallback a ChromaDB local si Pinecone falla
      if (this.provider === 'pinecone') {
        console.log('🔄 Fallback a ChromaDB local...');
        this.provider = 'chroma';
        await this.initializeChroma();
        this.isInitialized = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * Inicializa Pinecone
   */
  async initializePinecone() {
    if (!this.config.pinecone.apiKey) {
      throw new Error('PINECONE_API_KEY no está configurado');
    }

    this.pinecone = new Pinecone({
      apiKey: this.config.pinecone.apiKey
    });

    // Verificar si el índice existe
    const indexList = await this.pinecone.listIndexes();
    const indexExists = indexList.indexes?.some(
      index => index.name === this.config.pinecone.indexName
    );

    if (!indexExists) {
      console.log(`📝 Creando índice Pinecone: ${this.config.pinecone.indexName}`);
      await this.pinecone.createIndex({
        name: this.config.pinecone.indexName,
        dimension: this.embeddingsService.dimensions,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-west-2'
          }
        }
      });

      // Esperar a que el índice esté listo
      await this.waitForIndexReady();
    }

    this.pineconeIndex = this.pinecone.index(this.config.pinecone.indexName);
    console.log('✅ Pinecone conectado correctamente');
  }

  /**
   * Inicializa ChromaDB
   */
  async initializeChroma() {
    try {
      this.chroma = new ChromaClient({
        path: `http://${this.config.chroma.host}:${this.config.chroma.port}`
      });

      // Verificar conexión
      await this.chroma.heartbeat();

      // Obtener o crear colección
      try {
        this.chromaCollection = await this.chroma.getCollection({
          name: this.config.chroma.collection
        });
        console.log(`✅ Colección ChromaDB existente: ${this.config.chroma.collection}`);
      } catch (error) {
        console.log(`📝 Creando colección ChromaDB: ${this.config.chroma.collection}`);
        this.chromaCollection = await this.chroma.createCollection({
          name: this.config.chroma.collection,
          metadata: {
            description: 'Componentes del Design System de Bancolombia',
            version: '2.0.0'
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ ChromaDB no disponible, usando almacenamiento en memoria');
      this.provider = 'memory';
      this.memoryStore = new Map();
    }
  }

  /**
   * Espera a que el índice de Pinecone esté listo
   */
  async waitForIndexReady() {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const indexStats = await this.pinecone.describeIndex(this.config.pinecone.indexName);
        if (indexStats.status?.ready) {
          console.log('✅ Índice Pinecone listo');
          return;
        }
      } catch (error) {
        // Continuar esperando
      }

      attempts++;
      console.log(`⏳ Esperando índice Pinecone... (${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Timeout esperando que el índice Pinecone esté listo');
  }

  /**
   * Almacena un documento con su embedding
   */
  async upsert(id, text, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const embedding = await this.embeddingsService.generateEmbedding(text);
      
      switch (this.provider) {
        case 'pinecone':
          return await this.upsertPinecone(id, embedding, metadata);
        case 'chroma':
          return await this.upsertChroma(id, text, embedding, metadata);
        case 'memory':
          return await this.upsertMemory(id, text, embedding, metadata);
        default:
          throw new Error(`Proveedor no soportado: ${this.provider}`);
      }
    } catch (error) {
      console.error(`❌ Error en upsert:`, error.message);
      throw error;
    }
  }

  /**
   * Almacena en Pinecone
   */
  async upsertPinecone(id, embedding, metadata) {
    await this.pineconeIndex.upsert([{
      id: id,
      values: embedding,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    }]);

    return { success: true, id, provider: 'pinecone' };
  }

  /**
   * Almacena en ChromaDB
   */
  async upsertChroma(id, text, embedding, metadata) {
    await this.chromaCollection.upsert({
      ids: [id],
      documents: [text],
      embeddings: [embedding],
      metadatas: [{
        ...metadata,
        timestamp: Date.now()
      }]
    });

    return { success: true, id, provider: 'chroma' };
  }

  /**
   * Almacena en memoria
   */
  async upsertMemory(id, text, embedding, metadata) {
    this.memoryStore.set(id, {
      text,
      embedding,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    });

    return { success: true, id, provider: 'memory' };
  }

  /**
   * Busca documentos similares
   */
  async search(query, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      topK = parseInt(process.env.MAX_RESULTS) || 5,
      threshold = parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.7,
      filter = {}
    } = options;

    try {
      const queryEmbedding = await this.embeddingsService.generateEmbedding(query);
      
      switch (this.provider) {
        case 'pinecone':
          return await this.searchPinecone(queryEmbedding, topK, threshold, filter);
        case 'chroma':
          return await this.searchChroma(queryEmbedding, topK, threshold, filter);
        case 'memory':
          return await this.searchMemory(queryEmbedding, topK, threshold, filter);
        default:
          throw new Error(`Proveedor no soportado: ${this.provider}`);
      }
    } catch (error) {
      console.error(`❌ Error en búsqueda:`, error.message);
      throw error;
    }
  }

  /**
   * Busca en Pinecone
   */
  async searchPinecone(queryEmbedding, topK, threshold, filter) {
    const response = await this.pineconeIndex.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined
    });

    return response.matches
      .filter(match => match.score >= threshold)
      .map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata
      }));
  }

  /**
   * Busca en ChromaDB
   */
  async searchChroma(queryEmbedding, topK, threshold, filter) {
    const response = await this.chromaCollection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: Object.keys(filter).length > 0 ? filter : undefined
    });

    const results = [];
    if (response.ids && response.ids[0]) {
      for (let i = 0; i < response.ids[0].length; i++) {
        const score = 1 - (response.distances[0][i] || 0); // Convertir distancia a similitud
        if (score >= threshold) {
          results.push({
            id: response.ids[0][i],
            score: score,
            document: response.documents[0][i],
            metadata: response.metadatas[0][i]
          });
        }
      }
    }

    return results;
  }

  /**
   * Busca en memoria
   */
  async searchMemory(queryEmbedding, topK, threshold, filter) {
    const results = [];

    for (const [id, data] of this.memoryStore.entries()) {
      // Aplicar filtros
      if (Object.keys(filter).length > 0) {
        const matchesFilter = Object.entries(filter).every(([key, value]) => 
          data.metadata[key] === value
        );
        if (!matchesFilter) continue;
      }

      const similarity = this.embeddingsService.cosineSimilarity(
        queryEmbedding, 
        data.embedding
      );

      if (similarity >= threshold) {
        results.push({
          id,
          score: similarity,
          document: data.text,
          metadata: data.metadata
        });
      }
    }

    // Ordenar por similitud y limitar resultados
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Almacena múltiples documentos en lote
   */
  async batchUpsert(documents) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results = [];
    const batchSize = 100;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchPromises = batch.map(doc => 
        this.upsert(doc.id, doc.text, doc.metadata)
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        console.log(`📦 Lote ${Math.floor(i/batchSize) + 1} procesado: ${batch.length} documentos`);
        
        // Pausa para evitar rate limiting
        if (i + batchSize < documents.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`❌ Error en lote ${i}-${i + batchSize}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Elimina un documento
   */
  async delete(id) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      switch (this.provider) {
        case 'pinecone':
          await this.pineconeIndex.deleteOne(id);
          break;
        case 'chroma':
          await this.chromaCollection.delete({ ids: [id] });
          break;
        case 'memory':
          this.memoryStore.delete(id);
          break;
      }

      return { success: true, id, provider: this.provider };
    } catch (error) {
      console.error(`❌ Error eliminando documento ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  async getStats() {
    if (!this.isInitialized) {
      return { initialized: false };
    }

    try {
      let stats = {
        provider: this.provider,
        initialized: this.isInitialized
      };

      switch (this.provider) {
        case 'pinecone':
          const indexStats = await this.pinecone.describeIndex(this.config.pinecone.indexName);
          stats.totalVectors = indexStats.status?.vectorCount || 0;
          stats.dimension = indexStats.dimension;
          break;
        case 'chroma':
          const count = await this.chromaCollection.count();
          stats.totalVectors = count;
          stats.dimension = this.embeddingsService.dimensions;
          break;
        case 'memory':
          stats.totalVectors = this.memoryStore.size;
          stats.dimension = this.embeddingsService.dimensions;
          break;
      }

      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Limpia toda la base de datos
   */
  async clear() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      switch (this.provider) {
        case 'pinecone':
          await this.pineconeIndex.deleteAll();
          break;
        case 'chroma':
          await this.chroma.deleteCollection({ name: this.config.chroma.collection });
          await this.initializeChroma(); // Recrear colección
          break;
        case 'memory':
          this.memoryStore.clear();
          break;
      }

      console.log(`🧹 Base de datos vectorial ${this.provider} limpiada`);
      return { success: true, provider: this.provider };
    } catch (error) {
      console.error('❌ Error limpiando base de datos:', error.message);
      throw error;
    }
  }

  /**
   * Cambia el proveedor de base de datos vectorial
   */
  async setProvider(provider) {
    if (!['pinecone', 'chroma', 'memory'].includes(provider)) {
      throw new Error(`Proveedor no válido: ${provider}`);
    }

    this.provider = provider;
    this.isInitialized = false;
    
    console.log(`🔄 Proveedor de vector store cambiado a: ${provider}`);
    await this.initialize();
  }

  /**
   * Verifica la salud de la conexión
   */
  async healthCheck() {
    try {
      switch (this.provider) {
        case 'pinecone':
          await this.pinecone.listIndexes();
          return { status: 'healthy', provider: 'pinecone' };
        case 'chroma':
          await this.chroma.heartbeat();
          return { status: 'healthy', provider: 'chroma' };
        case 'memory':
          return { status: 'healthy', provider: 'memory' };
        default:
          return { status: 'unknown', provider: this.provider };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        provider: this.provider, 
        error: error.message 
      };
    }
  }
}

module.exports = VectorStoreService; 