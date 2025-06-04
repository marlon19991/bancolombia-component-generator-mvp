/**
 * Servicio de Embeddings Vectoriales Avanzado
 * Soporta OpenAI y Cohere para búsqueda semántica de alta precisión
 */

const OpenAI = require('openai');
const { CohereClient } = require('cohere-ai');
const natural = require('natural');
const compromise = require('compromise');

class EmbeddingsService {
  constructor() {
    this.openai = null;
    this.cohere = null;
    this.provider = process.env.EMBEDDING_PROVIDER || 'openai';
    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    this.dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS) || 1536;
    this.cache = new Map();
    this.maxCacheSize = parseInt(process.env.CACHE_MAX_SIZE) || 1000;
    this.cacheTTL = parseInt(process.env.CACHE_TTL) || 3600000; // 1 hora
    
    this.initializeProviders();
  }

  /**
   * Inicializa los proveedores de embeddings
   */
  initializeProviders() {
    try {
      // Inicializar OpenAI
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('✅ OpenAI embeddings inicializado');
      }

      // Inicializar Cohere
      if (process.env.COHERE_API_KEY) {
        this.cohere = new CohereClient({
          token: process.env.COHERE_API_KEY
        });
        console.log('✅ Cohere embeddings inicializado');
      }

      if (!this.openai && !this.cohere) {
        console.warn('⚠️ No se encontraron API keys para embeddings. Usando embeddings locales.');
        this.provider = 'local';
      }
    } catch (error) {
      console.error('❌ Error inicializando proveedores de embeddings:', error.message);
      this.provider = 'local';
    }
  }

  /**
   * Genera embeddings para un texto
   */
  async generateEmbedding(text, options = {}) {
    const cacheKey = `${this.provider}-${this.model}-${text}`;
    
    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.embedding;
      }
      this.cache.delete(cacheKey);
    }

    try {
      let embedding;

      switch (this.provider) {
        case 'openai':
          embedding = await this.generateOpenAIEmbedding(text, options);
          break;
        case 'cohere':
          embedding = await this.generateCohereEmbedding(text, options);
          break;
        default:
          embedding = await this.generateLocalEmbedding(text, options);
      }

      // Guardar en cache
      this.cacheEmbedding(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      console.error(`❌ Error generando embedding con ${this.provider}:`, error.message);
      
      // Fallback a embeddings locales
      if (this.provider !== 'local') {
        console.log('🔄 Fallback a embeddings locales...');
        return await this.generateLocalEmbedding(text, options);
      }
      
      throw error;
    }
  }

  /**
   * Genera embeddings usando OpenAI
   */
  async generateOpenAIEmbedding(text, options = {}) {
    if (!this.openai) {
      throw new Error('OpenAI no está configurado');
    }

    const preprocessedText = this.preprocessText(text);
    
    const response = await this.openai.embeddings.create({
      model: options.model || this.model,
      input: preprocessedText,
      dimensions: options.dimensions || this.dimensions
    });

    return response.data[0].embedding;
  }

  /**
   * Genera embeddings usando Cohere
   */
  async generateCohereEmbedding(text, options = {}) {
    if (!this.cohere) {
      throw new Error('Cohere no está configurado');
    }

    const preprocessedText = this.preprocessText(text);
    
    const response = await this.cohere.embed({
      texts: [preprocessedText],
      model: options.model || 'embed-multilingual-v3.0',
      inputType: 'search_query'
    });

    return response.embeddings[0];
  }

  /**
   * Genera embeddings locales usando TF-IDF y procesamiento de lenguaje natural
   */
  async generateLocalEmbedding(text, options = {}) {
    const preprocessedText = this.preprocessText(text);
    
    // Análisis con Compromise (NLP en español)
    const doc = compromise(preprocessedText);
    
    // Extraer características semánticas
    const features = {
      // Entidades nombradas
      people: doc.people().out('array'),
      places: doc.places().out('array'),
      organizations: doc.organizations().out('array'),
      
      // Tipos de palabras
      nouns: doc.nouns().out('array'),
      verbs: doc.verbs().out('array'),
      adjectives: doc.adjectives().out('array'),
      
      // Sentimiento y tono
      sentiment: this.analyzeSentiment(preprocessedText),
      
      // Características técnicas
      hasNumbers: /\d+/.test(preprocessedText),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(preprocessedText),
      length: preprocessedText.length,
      wordCount: preprocessedText.split(/\s+/).length
    };

    // Generar vector de características
    const embedding = this.featuresToVector(features, preprocessedText);
    
    return embedding;
  }

  /**
   * Preprocesa el texto para mejorar la calidad de los embeddings
   */
  preprocessText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .toLowerCase()
      .trim()
      // Normalizar espacios
      .replace(/\s+/g, ' ')
      // Expandir contracciones comunes en español
      .replace(/\bq\b/g, 'que')
      .replace(/\bd\b/g, 'de')
      .replace(/\bp\b/g, 'para')
      // Normalizar caracteres especiales
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n');
  }

  /**
   * Analiza el sentimiento del texto
   */
  analyzeSentiment(text) {
    const analyzer = new natural.SentimentAnalyzer('Spanish', 
      natural.PorterStemmerEs, ['negation']);
    
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text);
    
    if (!tokens || tokens.length === 0) {
      return 0;
    }

    const score = analyzer.getSentiment(tokens);
    return score;
  }

  /**
   * Convierte características en vector numérico
   */
  featuresToVector(features, text) {
    const vector = new Array(this.dimensions).fill(0);
    
    // Características básicas (primeras 50 dimensiones)
    vector[0] = features.sentiment;
    vector[1] = features.hasNumbers ? 1 : 0;
    vector[2] = features.hasSpecialChars ? 1 : 0;
    vector[3] = Math.min(features.length / 100, 1); // Normalizar longitud
    vector[4] = Math.min(features.wordCount / 20, 1); // Normalizar conteo de palabras

    // TF-IDF para palabras clave (dimensiones 50-200)
    const words = text.split(/\s+/);
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    let index = 50;
    Object.entries(wordFreq).slice(0, 150).forEach(([word, freq]) => {
      if (index < 200) {
        vector[index] = freq / words.length; // TF normalizado
        index++;
      }
    });

    // Características semánticas (dimensiones 200-300)
    index = 200;
    ['nouns', 'verbs', 'adjectives'].forEach(type => {
      const items = features[type] || [];
      items.slice(0, 30).forEach(item => {
        if (index < 300) {
          vector[index] = this.hashToFloat(item);
          index++;
        }
      });
    });

    // Rellenar el resto con ruido controlado para mantener dimensionalidad
    for (let i = 300; i < this.dimensions; i++) {
      vector[i] = (Math.random() - 0.5) * 0.1; // Ruido pequeño
    }

    // Normalizar vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  }

  /**
   * Convierte string a float determinístico
   */
  hashToFloat(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    return (hash % 1000) / 1000; // Normalizar a [0, 1]
  }

  /**
   * Calcula similitud coseno entre dos vectores
   */
  cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Los vectores deben tener la misma dimensión');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Genera embeddings para múltiples textos en lote
   */
  async generateBatchEmbeddings(texts, options = {}) {
    const embeddings = [];
    const batchSize = options.batchSize || 10;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text, options));
      
      try {
        const batchEmbeddings = await Promise.all(batchPromises);
        embeddings.push(...batchEmbeddings);
        
        // Pequeña pausa para evitar rate limiting
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error en lote ${i}-${i + batchSize}:`, error.message);
        // Continuar con el siguiente lote
      }
    }

    return embeddings;
  }

  /**
   * Guarda embedding en cache
   */
  cacheEmbedding(key, embedding) {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      embedding,
      timestamp: Date.now()
    });
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache de embeddings limpiado');
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    return {
      provider: this.provider,
      model: this.model,
      dimensions: this.dimensions,
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      cacheTTL: this.cacheTTL,
      isConfigured: {
        openai: !!this.openai,
        cohere: !!this.cohere
      }
    };
  }

  /**
   * Cambia el proveedor de embeddings
   */
  setProvider(provider) {
    if (['openai', 'cohere', 'local'].includes(provider)) {
      this.provider = provider;
      console.log(`🔄 Proveedor de embeddings cambiado a: ${provider}`);
    } else {
      throw new Error(`Proveedor no válido: ${provider}`);
    }
  }
}

module.exports = EmbeddingsService; 