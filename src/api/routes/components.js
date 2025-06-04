/**
 * Rutas de la API REST para el Sistema RAG de Componentes
 * Proporciona endpoints para integración empresarial
 */

const express = require('express');
const Joi = require('joi');
const rateLimit = require('rate-limiter-flexible');
const ComponentService = require('../../core/generator/component.service');
const SearchService = require('../../core/rag/search.service');

const router = express.Router();

// Inicializar servicios
const componentService = new ComponentService();
const searchService = new SearchService();

// Rate limiting
const rateLimiter = new rateLimit.RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
});

// Middleware de rate limiting
const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
};

// Esquemas de validación
const generateSchema = Joi.object({
  prompt: Joi.string().required().min(3).max(500),
  context: Joi.string().allow('').optional().max(200),
  options: Joi.object({
    maxResults: Joi.number().integer().min(1).max(10).default(5),
    threshold: Joi.number().min(0).max(1).default(0.7),
    includeCode: Joi.boolean().default(true),
    includeTypeScript: Joi.boolean().default(true),
    format: Joi.string().valid('html', 'angular', 'react').default('html')
  }).optional()
});

const searchSchema = Joi.object({
  query: Joi.string().required().min(1).max(200),
  options: Joi.object({
    maxResults: Joi.number().integer().min(1).max(20).default(5),
    threshold: Joi.number().min(0).max(1).default(0.7),
    category: Joi.string().valid('atoms', 'molecules', 'organisms').optional(),
    type: Joi.string().valid('component', 'directive', 'service').optional()
  }).optional()
});

// Middleware de validación
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }
    req.validatedBody = value;
    next();
  };
};

// Middleware de inicialización de servicios
const ensureInitialized = async (req, res, next) => {
  try {
    if (!componentService.isInitialized) {
      await componentService.initialize();
    }
    if (!searchService.isInitialized) {
      await searchService.initialize();
    }
    next();
  } catch (error) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Services are initializing. Please try again in a moment.',
      details: error.message
    });
  }
};

/**
 * POST /api/v2/components/generate
 * Genera componentes a partir de un prompt en lenguaje natural
 */
router.post('/generate', 
  rateLimitMiddleware,
  validate(generateSchema),
  ensureInitialized,
  async (req, res) => {
    try {
      const { prompt, context, options = {} } = req.validatedBody;
      
      console.log(`🎯 API Request - Generate: "${prompt}"`);
      
      const result = await componentService.generateFromPrompt(prompt, {
        context,
        ...options
      });

      if (result.success) {
        res.json({
          success: true,
          data: {
            prompt: prompt,
            context: context,
            confidence: result.confidence,
            components: result.components.map(component => ({
              type: component.type,
              name: component.name || component.type,
              properties: component.properties,
              html: options.includeCode !== false ? component.html : undefined,
              typescript: options.includeTypeScript !== false ? component.typescript : undefined,
              template: component.template,
              confidence: component.confidence
            })),
            suggestions: result.suggestions,
            metadata: {
              generatedAt: new Date().toISOString(),
              processingTime: result.processingTime,
              version: process.env.API_VERSION || 'v2'
            }
          }
        });
      } else {
        res.status(422).json({
          success: false,
          error: 'Generation Failed',
          message: result.error,
          suggestions: result.suggestions
        });
      }
    } catch (error) {
      console.error('❌ Error en /generate:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while generating components'
      });
    }
  }
);

/**
 * POST /api/v2/components/search
 * Busca componentes usando RAG
 */
router.post('/search',
  rateLimitMiddleware,
  validate(searchSchema),
  ensureInitialized,
  async (req, res) => {
    try {
      const { query, options = {} } = req.validatedBody;
      
      console.log(`🔍 API Request - Search: "${query}"`);
      
      const result = await searchService.search(query, options);

      res.json({
        success: true,
        data: {
          query: result.query,
          expandedQuery: result.expandedQuery,
          results: result.results.map(item => ({
            id: item.id,
            component: {
              name: item.component.name,
              description: item.component.description,
              category: item.component.category,
              type: item.component.type,
              module: item.component.module,
              import: item.component.import,
              properties: item.component.properties,
              examples: item.component.examples
            },
            relevanceScore: item.relevanceScore,
            rerankScore: item.rerankScore,
            matchedPrompts: item.matchedPrompts,
            matchedProperties: item.matchedProperties
          })),
          metadata: {
            totalFound: result.totalFound,
            searchTime: result.searchTime,
            provider: result.provider,
            searchedAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('❌ Error en /search:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while searching components'
      });
    }
  }
);

/**
 * GET /api/v2/components
 * Lista todos los componentes disponibles
 */
router.get('/',
  rateLimitMiddleware,
  ensureInitialized,
  async (req, res) => {
    try {
      const { category, type, limit = 50, offset = 0 } = req.query;
      
      const searchOptions = {
        maxResults: Math.min(parseInt(limit), 100),
        filter: {}
      };

      if (category) searchOptions.filter.category = category;
      if (type) searchOptions.filter.type = type;

      const result = await searchService.search('', searchOptions);
      
      // Aplicar paginación manual
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const paginatedResults = result.results.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          components: paginatedResults.map(item => ({
            name: item.component.name,
            description: item.component.description,
            category: item.component.category,
            type: item.component.type,
            module: item.component.module,
            import: item.component.import,
            propertiesCount: Object.keys(item.component.properties || {}).length,
            examplesCount: (item.component.examples || []).length
          })),
          pagination: {
            total: result.totalFound,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: endIndex < result.totalFound
          }
        }
      });
    } catch (error) {
      console.error('❌ Error en /components:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while fetching components'
      });
    }
  }
);

/**
 * GET /api/v2/components/health
 * Verifica la salud del sistema
 */
router.get('/health', async (req, res) => {
  try {
    const searchHealth = await searchService.healthCheck();
    const componentHealth = componentService.getStats ? 
      await componentService.getStats() : { status: 'unknown' };

    const overallStatus = searchHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v2',
      services: {
        search: searchHealth,
        components: componentHealth
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /api/v2/components/stats
 * Obtiene estadísticas del sistema
 */
router.get('/stats',
  rateLimitMiddleware,
  ensureInitialized,
  async (req, res) => {
    try {
      const searchStats = await searchService.getSearchStats();
      
      res.json({
        success: true,
        data: {
          ...searchStats,
          api: {
            version: process.env.API_VERSION || 'v2',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error en /stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while fetching statistics'
      });
    }
  }
);

/**
 * GET /api/v2/components/categories/:category
 * Obtiene componentes por categoría
 */
router.get('/categories/:category',
  rateLimitMiddleware,
  ensureInitialized,
  async (req, res) => {
    try {
      const { category } = req.params;
      const { limit = 20 } = req.query;
      
      if (!['atoms', 'molecules', 'organisms'].includes(category)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Category',
          message: 'Category must be one of: atoms, molecules, organisms'
        });
      }

      const result = await searchService.searchByCategory(category, { 
        maxResults: Math.min(parseInt(limit), 50) 
      });

      res.json({
        success: true,
        data: {
          category: category,
          components: result.results.map(item => ({
            name: item.component.name,
            description: item.component.description,
            type: item.component.type,
            module: item.component.module,
            propertiesCount: Object.keys(item.component.properties || {}).length
          })),
          total: result.totalFound
        }
      });
    } catch (error) {
      console.error(`❌ Error en /categories/${req.params.category}:`, error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while fetching components by category'
      });
    }
  }
);

/**
 * GET /api/v2/components/:name
 * Obtiene detalles de un componente específico
 */
router.get('/:name',
  rateLimitMiddleware,
  ensureInitialized,
  async (req, res) => {
    try {
      const { name } = req.params;
      const { includeExamples = true, includeSimilar = false } = req.query;
      
      const result = await searchService.search(name, { maxResults: 1 });
      
      if (result.results.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Component Not Found',
          message: `Component '${name}' not found`
        });
      }

      const component = result.results[0].component;
      const responseData = {
        name: component.name,
        description: component.description,
        category: component.category,
        type: component.type,
        module: component.module,
        import: component.import,
        properties: component.properties,
        prompts: component.prompts
      };

      if (includeExamples === 'true') {
        responseData.examples = component.examples;
      }

      if (includeSimilar === 'true') {
        const similarComponents = await searchService.findSimilar(name, { maxResults: 3 });
        responseData.similar = similarComponents.results.map(item => ({
          name: item.component.name,
          description: item.component.description,
          relevanceScore: item.relevanceScore
        }));
      }

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error(`❌ Error en /components/${req.params.name}:`, error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while fetching component details'
      });
    }
  }
);

/**
 * GET /api/v2/components/:name/similar
 * Obtiene componentes similares a uno específico
 */
router.get('/:name/similar',
  rateLimitMiddleware,
  ensureInitialized,
  async (req, res) => {
    try {
      const { name } = req.params;
      const { limit = 5 } = req.query;
      
      const result = await searchService.findSimilar(name, { 
        maxResults: Math.min(parseInt(limit), 10) 
      });

      res.json({
        success: true,
        data: {
          baseComponent: name,
          similar: result.results.map(item => ({
            name: item.component.name,
            description: item.component.description,
            category: item.component.category,
            relevanceScore: item.relevanceScore,
            matchedPrompts: item.matchedPrompts
          }))
        }
      });
    } catch (error) {
      console.error(`❌ Error en /components/${req.params.name}/similar:`, error);
      
      if (error.message.includes('no encontrado')) {
        res.status(404).json({
          success: false,
          error: 'Component Not Found',
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'An error occurred while finding similar components'
        });
      }
    }
  }
);

/**
 * GET /api/v2/components/available
 * Obtiene la lista de componentes disponibles con ejemplos
 */
router.get('/available', async (req, res) => {
  try {
    const componentService = req.app.get('componentService');
    
    if (!componentService || !componentService.validator) {
      return res.status(500).json({
        success: false,
        error: 'Servicio de componentes no disponible'
      });
    }

    const validatorStats = componentService.validator.getStats();
    const availableComponents = validatorStats.validComponents.map(component => ({
      name: componentService.generateComponentName(component),
      component: component,
      description: componentService.getComponentDescription(component),
      example: componentService.getComponentExample(component)
    }));

    res.json({
      success: true,
      data: {
        components: availableComponents,
        count: availableComponents.length,
        aliases: validatorStats.aliasesCount,
        validationRules: validatorStats.validationRulesCount
      }
    });

  } catch (error) {
    console.error('Error obteniendo componentes disponibles:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router; 