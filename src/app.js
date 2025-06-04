/**
 * Servidor Principal del Sistema RAG de Bancolombia
 * Fase 2: Optimización y Escalabilidad
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const path = require('path');

// Importar rutas
const componentsRoutes = require('./api/routes/components');

// Configurar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bancolombia-rag' },
  transports: [
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || 'logs/combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v2';

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configurado para desarrollo y producción
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://bancolombia.com.co', 'https://design-system.bancolombia.com.co']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

// Servir archivos estáticos
app.use('/static', express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../public')));

// Servir archivos estáticos directamente desde la raíz para la interfaz web
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de la API
app.use(`/api/${API_VERSION}/components`, componentsRoutes);

// Ruta para servir la interfaz web
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta para servir la interfaz web desde /web
app.get('/web', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta raíz con información del sistema y enlace a la interfaz
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.json({
    name: 'Bancolombia RAG Component Generator',
    version: API_VERSION,
    description: 'Sistema inteligente de generación de componentes del Design System de Bancolombia',
    phase: 'Fase 2: Optimización y Escalabilidad',
    webInterface: {
      url: `${baseUrl}/app`,
      alternativeUrl: `${baseUrl}/web`,
      description: 'Interfaz web interactiva para generar y explorar componentes'
    },
    features: [
      'Embeddings vectoriales reales (OpenAI/Cohere)',
      'Base de datos vectorial (Pinecone/ChromaDB)',
      'API REST para integración empresarial',
      'Interfaz web moderna y responsive',
      'Búsqueda semántica avanzada',
      'Rate limiting y seguridad',
      '11 componentes soportados'
    ],
    endpoints: {
      webApp: `GET ${baseUrl}/app`,
      generate: `POST /api/${API_VERSION}/components/generate`,
      search: `POST /api/${API_VERSION}/components/search`,
      list: `GET /api/${API_VERSION}/components`,
      details: `GET /api/${API_VERSION}/components/:name`,
      similar: `GET /api/${API_VERSION}/components/:name/similar`,
      categories: `GET /api/${API_VERSION}/components/categories/:category`,
      health: `GET /api/${API_VERSION}/components/health`,
      stats: `GET /api/${API_VERSION}/components/stats`
    },
    documentation: `https://docs.bancolombia.com.co/design-system/rag-api/${API_VERSION}`,
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Ruta de documentación de la API
app.get('/docs', (req, res) => {
  res.json({
    title: 'Bancolombia RAG API Documentation',
    version: API_VERSION,
    baseUrl: `${req.protocol}://${req.get('host')}/api/${API_VERSION}`,
    endpoints: [
      {
        method: 'POST',
        path: '/components/generate',
        description: 'Genera componentes a partir de un prompt en lenguaje natural',
        parameters: {
          prompt: 'string (required) - Descripción del componente deseado',
          context: 'string (optional) - Contexto adicional',
          options: {
            maxResults: 'number (1-10) - Máximo número de componentes a generar',
            threshold: 'number (0-1) - Umbral de confianza mínimo',
            includeCode: 'boolean - Incluir código HTML',
            includeTypeScript: 'boolean - Incluir código TypeScript',
            format: 'string (html|angular|react) - Formato de salida'
          }
        },
        example: {
          prompt: 'botón primario que diga Guardar',
          context: 'formulario de registro',
          options: {
            maxResults: 1,
            threshold: 0.8,
            includeCode: true,
            includeTypeScript: true,
            format: 'html'
          }
        }
      },
      {
        method: 'POST',
        path: '/components/search',
        description: 'Busca componentes usando búsqueda semántica',
        parameters: {
          query: 'string (required) - Consulta de búsqueda',
          options: {
            maxResults: 'number (1-20) - Máximo número de resultados',
            threshold: 'number (0-1) - Umbral de similitud mínimo',
            category: 'string (atoms|molecules|organisms) - Filtrar por categoría',
            type: 'string (component|directive|service) - Filtrar por tipo'
          }
        },
        example: {
          query: 'botón de confirmación',
          options: {
            maxResults: 5,
            threshold: 0.7,
            category: 'atoms'
          }
        }
      },
      {
        method: 'GET',
        path: '/components',
        description: 'Lista todos los componentes disponibles',
        parameters: {
          category: 'string (optional) - Filtrar por categoría',
          type: 'string (optional) - Filtrar por tipo',
          limit: 'number (optional, max 100) - Número de resultados por página',
          offset: 'number (optional) - Desplazamiento para paginación'
        }
      },
      {
        method: 'GET',
        path: '/components/:name',
        description: 'Obtiene detalles de un componente específico',
        parameters: {
          name: 'string (required) - Nombre del componente',
          includeExamples: 'boolean (optional) - Incluir ejemplos',
          includeSimilar: 'boolean (optional) - Incluir componentes similares'
        }
      },
      {
        method: 'GET',
        path: '/components/:name/similar',
        description: 'Obtiene componentes similares a uno específico',
        parameters: {
          name: 'string (required) - Nombre del componente base',
          limit: 'number (optional, max 10) - Número de resultados'
        }
      },
      {
        method: 'GET',
        path: '/components/categories/:category',
        description: 'Obtiene componentes por categoría',
        parameters: {
          category: 'string (required) - atoms, molecules, o organisms',
          limit: 'number (optional, max 50) - Número de resultados'
        }
      },
      {
        method: 'GET',
        path: '/components/health',
        description: 'Verifica la salud del sistema'
      },
      {
        method: 'GET',
        path: '/components/stats',
        description: 'Obtiene estadísticas del sistema'
      }
    ],
    authentication: 'No requerida en desarrollo. En producción se requiere API Key.',
    rateLimit: {
      requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      window: '15 minutos'
    },
    errors: {
      400: 'Bad Request - Parámetros inválidos',
      404: 'Not Found - Recurso no encontrado',
      422: 'Unprocessable Entity - Error en generación',
      429: 'Too Many Requests - Rate limit excedido',
      500: 'Internal Server Error - Error interno del servidor',
      503: 'Service Unavailable - Servicio no disponible'
    }
  });
});

// Middleware de manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      `GET /`,
      `GET /docs`,
      `POST /api/${API_VERSION}/components/generate`,
      `POST /api/${API_VERSION}/components/search`,
      `GET /api/${API_VERSION}/components`,
      `GET /api/${API_VERSION}/components/:name`,
      `GET /api/${API_VERSION}/components/:name/similar`,
      `GET /api/${API_VERSION}/components/categories/:category`,
      `GET /api/${API_VERSION}/components/health`,
      `GET /api/${API_VERSION}/components/stats`
    ]
  });
});

// Middleware de manejo de errores globales
app.use((error, req, res, next) => {
  logger.error({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // No exponer detalles del error en producción
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    success: false,
    error: error.name || 'Internal Server Error',
    message: isDevelopment ? error.message : 'An internal error occurred',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido. Cerrando servidor gracefully...');
  server.close(() => {
    logger.info('Servidor cerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido. Cerrando servidor gracefully...');
  server.close(() => {
    logger.info('Servidor cerrado.');
    process.exit(0);
  });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor Bancolombia RAG iniciado`);
  logger.info(`📍 URL: http://localhost:${PORT}`);
  logger.info(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 API Version: ${API_VERSION}`);
  logger.info(`📚 Documentación: http://localhost:${PORT}/docs`);
  logger.info(`❤️ Health Check: http://localhost:${PORT}/api/${API_VERSION}/components/health`);
  
  // Mostrar configuración de embeddings
  if (process.env.OPENAI_API_KEY) {
    logger.info(`🤖 OpenAI embeddings configurado`);
  }
  if (process.env.COHERE_API_KEY) {
    logger.info(`🧠 Cohere embeddings configurado`);
  }
  if (process.env.PINECONE_API_KEY) {
    logger.info(`🌲 Pinecone vector store configurado`);
  }
  
  logger.info(`✅ Sistema listo para recibir requests`);
});

module.exports = app; 