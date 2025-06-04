const fs = require('fs');
const path = require('path');

/**
 * Servicio Indexador de Componentes Bancolombia
 * Procesa las definiciones de componentes y crea índices para búsqueda RAG
 */
class ComponentIndexer {
  constructor() {
    this.components = new Map();
    this.embeddings = new Map();
    this.searchIndex = [];
    this.definitionsPath = path.join(__dirname, '../../data/component-definitions');
  }

  /**
   * Indexa todos los componentes disponibles
   */
  async indexAllComponents() {
    console.log('🔍 Iniciando indexación de componentes Bancolombia...');
    
    try {
      const definitionFiles = this.getDefinitionFiles();
      
      for (const file of definitionFiles) {
        await this.indexComponent(file);
      }
      
      console.log(`✅ Indexación completada: ${this.components.size} componentes procesados`);
      return this.generateSearchIndex();
      
    } catch (error) {
      console.error('❌ Error en indexación:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los archivos de definición de componentes
   */
  getDefinitionFiles() {
    if (!fs.existsSync(this.definitionsPath)) {
      throw new Error(`Directorio de definiciones no encontrado: ${this.definitionsPath}`);
    }

    return fs.readdirSync(this.definitionsPath)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(this.definitionsPath, file));
  }

  /**
   * Indexa un componente específico
   */
  async indexComponent(filePath) {
    try {
      const componentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const componentName = componentData.name;

      console.log(`📦 Indexando componente: ${componentName}`);

      // Crear documento de búsqueda
      const searchDocument = this.createSearchDocument(componentData);
      
      // Almacenar componente
      this.components.set(componentName, componentData);
      
      // Crear embedding (simulado por ahora)
      const embedding = await this.createEmbedding(searchDocument);
      this.embeddings.set(componentName, embedding);

      return searchDocument;

    } catch (error) {
      console.error(`❌ Error indexando ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Crea un documento de búsqueda optimizado para RAG
   */
  createSearchDocument(componentData) {
    const {
      name,
      description,
      category,
      type,
      properties,
      prompts,
      examples
    } = componentData;

    // Extraer información de propiedades
    const propertyDescriptions = Object.entries(properties || {})
      .map(([key, prop]) => `${key}: ${prop.description || ''} (${prop.type})`)
      .join('. ');

    // Combinar prompts
    const promptText = (prompts || []).join(', ');

    // Extraer ejemplos
    const exampleDescriptions = (examples || [])
      .map(ex => `${ex.name}: ${ex.description}`)
      .join('. ');

    return {
      id: name,
      name,
      category,
      type,
      content: `${description}. ${propertyDescriptions}`,
      prompts: promptText,
      examples: exampleDescriptions,
      searchText: `${name} ${description} ${propertyDescriptions} ${promptText} ${exampleDescriptions}`.toLowerCase(),
      metadata: {
        category,
        type,
        propertyCount: Object.keys(properties || {}).length,
        exampleCount: (examples || []).length
      }
    };
  }

  /**
   * Crea embedding para un documento (simulado)
   * En producción, usar OpenAI Embeddings o similar
   */
  async createEmbedding(document) {
    // Simulación de embedding basado en características del texto
    const text = document.searchText;
    const words = text.split(' ');
    
    // Crear vector simple basado en características
    const features = {
      length: text.length,
      wordCount: words.length,
      hasButton: text.includes('button') || text.includes('botón') ? 1 : 0,
      hasAlert: text.includes('alert') || text.includes('alerta') ? 1 : 0,
      hasInput: text.includes('input') || text.includes('entrada') || text.includes('campo') ? 1 : 0,
      hasCard: text.includes('card') || text.includes('tarjeta') ? 1 : 0,
      hasModal: text.includes('modal') || text.includes('ventana') ? 1 : 0,
      hasCheckbox: text.includes('checkbox') || text.includes('casilla') ? 1 : 0,
      isPrimary: text.includes('primary') || text.includes('primario') ? 1 : 0,
      isSecondary: text.includes('secondary') || text.includes('secundario') ? 1 : 0,
      isError: text.includes('error') ? 1 : 0,
      isSuccess: text.includes('success') || text.includes('éxito') ? 1 : 0,
      isWarning: text.includes('warning') || text.includes('advertencia') ? 1 : 0,
      isInfo: text.includes('info') || text.includes('información') ? 1 : 0,
      hasForm: text.includes('form') || text.includes('formulario') ? 1 : 0,
      hasText: text.includes('text') || text.includes('texto') ? 1 : 0,
      hasPassword: text.includes('password') || text.includes('contraseña') ? 1 : 0,
      hasEmail: text.includes('email') || text.includes('correo') ? 1 : 0,
      hasRequired: text.includes('required') || text.includes('obligatorio') ? 1 : 0,
      hasDisabled: text.includes('disabled') || text.includes('deshabilitado') ? 1 : 0,
      hasClickable: text.includes('clickable') || text.includes('clickeable') ? 1 : 0,
      hasElevation: text.includes('elevation') || text.includes('sombra') ? 1 : 0,
      hasConfirmation: text.includes('confirmation') || text.includes('confirmación') ? 1 : 0,
      hasTerms: text.includes('terms') || text.includes('términos') ? 1 : 0,
      hasPrivacy: text.includes('privacy') || text.includes('privacidad') ? 1 : 0
    };

    // Convertir a vector normalizado
    const vector = Object.values(features);
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  /**
   * Genera índice de búsqueda optimizado
   */
  generateSearchIndex() {
    this.searchIndex = Array.from(this.components.values()).map(component => {
      const document = this.createSearchDocument(component);
      return {
        ...document,
        embedding: this.embeddings.get(component.name)
      };
    });

    console.log(`📊 Índice de búsqueda generado: ${this.searchIndex.length} documentos`);
    return this.searchIndex;
  }

  /**
   * Busca componentes por similitud
   */
  async searchComponents(query, limit = 5) {
    console.log(`🔍 Buscando: "${query}"`);
    
    // Crear embedding de la consulta
    const queryEmbedding = await this.createEmbedding({ searchText: query.toLowerCase() });
    
    // Calcular similitudes
    const similarities = this.searchIndex.map(doc => ({
      ...doc,
      similarity: this.calculateSimilarity(queryEmbedding, doc.embedding)
    }));

    // Ordenar por similitud y filtrar
    const results = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .filter(result => result.similarity > 0.1); // Umbral mínimo

    console.log(`📋 Encontrados ${results.length} componentes relevantes`);
    return results;
  }

  /**
   * Calcula similitud coseno entre dos vectores
   */
  calculateSimilarity(vector1, vector2) {
    if (!vector1 || !vector2 || vector1.length !== vector2.length) {
      return 0;
    }

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Obtiene un componente por nombre
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Obtiene estadísticas del índice
   */
  getStats() {
    const categories = {};
    const types = {};

    this.searchIndex.forEach(doc => {
      categories[doc.category] = (categories[doc.category] || 0) + 1;
      types[doc.type] = (types[doc.type] || 0) + 1;
    });

    return {
      totalComponents: this.components.size,
      categories,
      types,
      indexSize: this.searchIndex.length
    };
  }
}

module.exports = ComponentIndexer; 