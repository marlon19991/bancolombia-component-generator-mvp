require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Importar el generador de componentes
const BancolombiaComponentGenerator = require('../src/index');

/**
 * Servidor Web Interactivo para Sistema RAG Bancolombia
 * Proporciona interfaz web moderna para generación de componentes
 */
class WebServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.port = process.env.PORT || 3000;
    this.generator = new BancolombiaComponentGenerator();
    this.isGeneratorReady = false;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
  }

  /**
   * Configura middleware del servidor
   */
  setupMiddleware() {
    // Seguridad y optimización
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }));
    this.app.use(compression());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Servir archivos estáticos
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  /**
   * Configura rutas de la API
   */
  setupRoutes() {
    // Ruta principal
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // API de estado del sistema
    this.app.get('/api/status', async (req, res) => {
      try {
        if (!this.isGeneratorReady) {
          await this.initializeGenerator();
        }
        
        const stats = this.generator.getStats();
        res.json({
          success: true,
          status: 'ready',
          stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // API de generación de componentes
    this.app.post('/api/generate', async (req, res) => {
      try {
        const { prompt, options = {} } = req.body;
        
        if (!prompt) {
          return res.status(400).json({
            success: false,
            error: 'Prompt es requerido'
          });
        }

        if (!this.isGeneratorReady) {
          await this.initializeGenerator();
        }

        console.log(`🌐 Generación web: "${prompt}"`);
        const result = await this.generator.generate(prompt, options);
        
        res.json({
          success: true,
          result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error en generación web:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // API de búsqueda de componentes
    this.app.post('/api/search', async (req, res) => {
      try {
        const { query, limit = 5 } = req.body;
        
        if (!query) {
          return res.status(400).json({
            success: false,
            error: 'Query es requerido'
          });
        }

        if (!this.isGeneratorReady) {
          await this.initializeGenerator();
        }

        console.log(`🔍 Búsqueda web: "${query}"`);
        const results = await this.generator.search(query, limit);
        
        res.json({
          success: true,
          results,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Error en búsqueda web:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // API de componentes disponibles
    this.app.get('/api/components', async (req, res) => {
      try {
        if (!this.isGeneratorReady) {
          await this.initializeGenerator();
        }

        const stats = this.generator.getStats();
        const components = Object.keys(stats.categories || {}).map(category => ({
          category,
          count: stats.categories[category]
        }));

        res.json({
          success: true,
          components,
          total: stats.totalComponents || 0,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // API de configuración OpenAI
    this.app.get('/api/openai-status', (req, res) => {
      const hasApiKey = !!process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
      
      res.json({
        success: true,
        openai: {
          configured: hasApiKey,
          model: hasApiKey ? model : 'simulado',
          status: hasApiKey ? 'activo' : 'usando embeddings simulados'
        }
      });
    });

    // API de ejemplos predefinidos
    this.app.get('/api/examples', (req, res) => {
      const examples = [
        {
          category: 'Botones',
          prompts: [
            'botón primario que diga Guardar',
            'botón secundario pequeño',
            'botón de peligro para eliminar',
            'botón deshabilitado'
          ]
        },
        {
          category: 'Alertas',
          prompts: [
            'alerta de éxito temporal',
            'alerta de error con icono',
            'notificación informativa',
            'alerta de advertencia'
          ]
        },
        {
          category: 'Formularios',
          prompts: [
            'campo de email obligatorio',
            'campo de contraseña con validación',
            'campo de texto largo',
            'checkbox para términos y condiciones'
          ]
        },
        {
          category: 'Contenedores',
          prompts: [
            'tarjeta clickeable con sombra',
            'modal de confirmación mediano',
            'tarjeta de información',
            'ventana modal grande'
          ]
        }
      ];

      res.json({
        success: true,
        examples
      });
    });

    // Manejo de errores 404
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado'
      });
    });
  }

  /**
   * Configura WebSocket para comunicación en tiempo real
   */
  setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);

      // Enviar estado inicial
      socket.emit('status', {
        connected: true,
        generatorReady: this.isGeneratorReady,
        timestamp: new Date().toISOString()
      });

      // Manejar generación en tiempo real
      socket.on('generate-realtime', async (data) => {
        try {
          const { prompt, options = {} } = data;
          
          if (!this.isGeneratorReady) {
            await this.initializeGenerator();
          }

          // Emitir progreso
          socket.emit('generation-progress', { 
            status: 'analyzing', 
            message: 'Analizando prompt...' 
          });

          const result = await this.generator.generate(prompt, options);

          socket.emit('generation-progress', { 
            status: 'completed', 
            message: 'Generación completada' 
          });

          socket.emit('generation-result', {
            success: true,
            result,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          socket.emit('generation-result', {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Manejar búsqueda en tiempo real
      socket.on('search-realtime', async (data) => {
        try {
          const { query, limit = 5 } = data;
          
          if (!this.isGeneratorReady) {
            await this.initializeGenerator();
          }

          const results = await this.generator.search(query, limit);

          socket.emit('search-result', {
            success: true,
            results,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          socket.emit('search-result', {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
      });
    });
  }

  /**
   * Inicializa el generador de componentes
   */
  async initializeGenerator() {
    if (this.isGeneratorReady) return;

    console.log('🚀 Inicializando generador para interfaz web...');
    
    try {
      await this.generator.initialize();
      this.isGeneratorReady = true;
      
      // Notificar a todos los clientes conectados
      this.io.emit('generator-ready', {
        ready: true,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Generador listo para interfaz web');
      
    } catch (error) {
      console.error('❌ Error inicializando generador:', error);
      throw error;
    }
  }

  /**
   * Inicia el servidor
   */
  async start() {
    try {
      // Inicializar generador en background
      this.initializeGenerator().catch(console.error);

      this.server.listen(this.port, () => {
        console.log('\n🌐 SERVIDOR WEB INICIADO');
        console.log('='.repeat(50));
        console.log(`🚀 URL: http://localhost:${this.port}`);
        console.log(`📊 API: http://localhost:${this.port}/api/status`);
        console.log(`🔌 WebSocket: Habilitado`);
        console.log(`🧠 OpenAI: ${process.env.OPENAI_API_KEY ? 'Configurado' : 'Simulado'}`);
        console.log('='.repeat(50));
        console.log('💡 Presiona Ctrl+C para detener el servidor');
      });

    } catch (error) {
      console.error('❌ Error iniciando servidor:', error);
      process.exit(1);
    }
  }

  /**
   * Detiene el servidor gracefully
   */
  stop() {
    console.log('\n🛑 Deteniendo servidor...');
    this.server.close(() => {
      console.log('✅ Servidor detenido correctamente');
      process.exit(0);
    });
  }
}

// Crear y iniciar servidor
const webServer = new WebServer();

// Manejar señales de cierre
process.on('SIGINT', () => webServer.stop());
process.on('SIGTERM', () => webServer.stop());

// Iniciar servidor
webServer.start();

module.exports = WebServer; 