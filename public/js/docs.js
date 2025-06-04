/**
 * Documentation Module - Documentación de la API
 * Bancolombia Component Generator v2.0
 */

class DocsManager {
    constructor() {
        this.currentSection = 'endpoints';
        this.apiDocs = null;
        this.systemInfo = null;
    }

    /**
     * Inicializar el gestor de documentación
     */
    async init() {
        this.setupEventListeners();
        await this.loadDocumentation();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Navegación de documentación
        document.addEventListener('click', (e) => {
            if (e.target.matches('.docs-link')) {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.showSection(section);
            }
        });

        // Copiar ejemplos de código
        document.addEventListener('click', (e) => {
            if (e.target.matches('.copy-example-btn')) {
                const codeBlock = e.target.closest('.code-example').querySelector('code');
                if (codeBlock) {
                    this.copyToClipboard(codeBlock.textContent);
                }
            }
        });
    }

    /**
     * Cargar documentación desde la API
     */
    async loadDocumentation() {
        try {
            // Cargar información del sistema y documentación en paralelo
            const [systemInfo, apiDocs] = await Promise.all([
                window.apiService.getSystemInfo(),
                window.apiService.getDocs().catch(() => null) // La documentación puede no estar disponible
            ]);

            this.systemInfo = systemInfo;
            this.apiDocs = apiDocs;

            this.renderDocumentation();
        } catch (error) {
            console.error('Error cargando documentación:', error);
            this.showDocumentationError(window.APIUtils.formatError(error));
        }
    }

    /**
     * Renderizar documentación completa
     */
    renderDocumentation() {
        this.showSection(this.currentSection);
    }

    /**
     * Mostrar sección específica
     */
    showSection(section) {
        this.currentSection = section;
        
        // Actualizar navegación activa
        document.querySelectorAll('.docs-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${section}`) {
                link.classList.add('active');
            }
        });

        // Renderizar contenido de la sección
        const content = this.renderSectionContent(section);
        const docsContent = document.getElementById('docsContent');
        if (docsContent) {
            docsContent.innerHTML = content;
        }
    }

    /**
     * Renderizar contenido de sección específica
     */
    renderSectionContent(section) {
        switch (section) {
            case 'endpoints':
                return this.renderEndpoints();
            case 'examples':
                return this.renderExamples();
            case 'schemas':
                return this.renderSchemas();
            default:
                return this.renderEndpoints();
        }
    }

    /**
     * Renderizar documentación de endpoints
     */
    renderEndpoints() {
        if (!this.systemInfo) {
            return '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Cargando endpoints...</p></div>';
        }

        const endpoints = this.systemInfo.endpoints || {};
        
        return `
            <div class="endpoints-documentation">
                <div class="docs-header">
                    <h3>Endpoints de la API</h3>
                    <p>Documentación completa de todos los endpoints disponibles</p>
                </div>

                <div class="api-info">
                    <div class="api-version">
                        <strong>Versión:</strong> ${this.systemInfo.version || 'v2'}
                    </div>
                    <div class="api-base-url">
                        <strong>URL Base:</strong> 
                        <code>${window.location.origin}/api/${this.systemInfo.version || 'v2'}</code>
                    </div>
                </div>

                <div class="endpoints-list">
                    ${this.renderEndpointItem('POST', '/components/generate', 'Generar Componentes', 
                        'Genera componentes a partir de un prompt en lenguaje natural', {
                            prompt: 'string (required) - Descripción del componente deseado',
                            context: 'string (optional) - Contexto adicional',
                            options: {
                                maxResults: 'number (1-10) - Máximo número de componentes',
                                threshold: 'number (0-1) - Umbral de confianza mínimo',
                                includeCode: 'boolean - Incluir código HTML',
                                includeTypeScript: 'boolean - Incluir código TypeScript',
                                format: 'string (html|angular|react) - Formato de salida'
                            }
                        })}

                    ${this.renderEndpointItem('POST', '/components/search', 'Búsqueda Semántica', 
                        'Busca componentes usando búsqueda semántica avanzada', {
                            query: 'string (required) - Consulta de búsqueda',
                            options: {
                                maxResults: 'number (1-20) - Máximo número de resultados',
                                threshold: 'number (0-1) - Umbral de similitud mínimo',
                                category: 'string (atoms|molecules|organisms) - Filtrar por categoría',
                                type: 'string (component|directive|service) - Filtrar por tipo'
                            }
                        })}

                    ${this.renderEndpointItem('GET', '/components', 'Listar Componentes', 
                        'Lista todos los componentes disponibles con paginación', {
                            category: 'string (optional) - Filtrar por categoría',
                            type: 'string (optional) - Filtrar por tipo',
                            limit: 'number (optional, max 100) - Número de resultados por página',
                            offset: 'number (optional) - Desplazamiento para paginación'
                        })}

                    ${this.renderEndpointItem('GET', '/components/:name', 'Detalles de Componente', 
                        'Obtiene los detalles completos de un componente específico', {
                            name: 'string (path parameter) - Nombre del componente'
                        })}

                    ${this.renderEndpointItem('GET', '/components/:name/similar', 'Componentes Similares', 
                        'Encuentra componentes similares al especificado', {
                            name: 'string (path parameter) - Nombre del componente',
                            limit: 'number (optional) - Número máximo de resultados similares'
                        })}

                    ${this.renderEndpointItem('GET', '/components/categories/:category', 'Por Categoría', 
                        'Obtiene componentes filtrados por categoría específica', {
                            category: 'string (path parameter) - Categoría (atoms, molecules, organisms)',
                            limit: 'number (optional) - Número máximo de resultados'
                        })}

                    ${this.renderEndpointItem('GET', '/components/health', 'Health Check', 
                        'Verifica el estado de salud del sistema RAG', {})}

                    ${this.renderEndpointItem('GET', '/components/stats', 'Estadísticas', 
                        'Obtiene estadísticas de uso y rendimiento del sistema', {})}
                </div>
            </div>
        `;
    }

    /**
     * Renderizar item de endpoint individual
     */
    renderEndpointItem(method, path, title, description, parameters) {
        const methodClass = method.toLowerCase();
        const hasParameters = Object.keys(parameters).length > 0;

        return `
            <div class="endpoint-item">
                <div class="endpoint-header">
                    <div class="endpoint-method ${methodClass}">${method}</div>
                    <div class="endpoint-path"><code>${path}</code></div>
                    <div class="endpoint-title">${title}</div>
                </div>
                
                <div class="endpoint-description">
                    <p>${description}</p>
                </div>

                ${hasParameters ? `
                    <div class="endpoint-parameters">
                        <h5>Parámetros:</h5>
                        <div class="parameters-list">
                            ${this.renderParameters(parameters)}
                        </div>
                    </div>
                ` : ''}

                <div class="endpoint-example">
                    <button class="btn-secondary btn-sm toggle-example" onclick="DocsManager.toggleExample(this)">
                        <i class="fas fa-code"></i>
                        Ver Ejemplo
                    </button>
                    <div class="example-content" style="display: none;">
                        ${this.renderEndpointExample(method, path, parameters)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar parámetros de endpoint
     */
    renderParameters(parameters) {
        return Object.entries(parameters).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                return `
                    <div class="parameter-group">
                        <div class="parameter-name">${key}</div>
                        <div class="parameter-type">object</div>
                        <div class="parameter-nested">
                            ${Object.entries(value).map(([nestedKey, nestedValue]) => `
                                <div class="nested-parameter">
                                    <span class="nested-name">${nestedKey}:</span>
                                    <span class="nested-type">${nestedValue}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="parameter-item">
                        <div class="parameter-name">${key}</div>
                        <div class="parameter-type">${value}</div>
                    </div>
                `;
            }
        }).join('');
    }

    /**
     * Renderizar ejemplo de endpoint
     */
    renderEndpointExample(method, path, parameters) {
        const baseUrl = `${window.location.origin}/api/v2`;
        let example = '';

        if (method === 'GET') {
            example = `curl -X GET "${baseUrl}${path}"`;
        } else if (method === 'POST') {
            const sampleBody = this.generateSampleBody(path, parameters);
            example = `curl -X POST "${baseUrl}${path}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sampleBody, null, 2)}'`;
        }

        return `
            <div class="code-example">
                <div class="code-header">
                    <span>Ejemplo cURL</span>
                    <button class="copy-example-btn">
                        <i class="fas fa-copy"></i>
                        Copiar
                    </button>
                </div>
                <pre><code>${example}</code></pre>
            </div>
        `;
    }

    /**
     * Generar cuerpo de ejemplo para POST
     */
    generateSampleBody(path, parameters) {
        if (path.includes('/generate')) {
            return {
                prompt: "botón primario que diga 'Guardar'",
                context: "formulario de registro",
                options: {
                    maxResults: 3,
                    threshold: 0.7,
                    includeCode: true,
                    includeTypeScript: true,
                    format: "html"
                }
            };
        } else if (path.includes('/search')) {
            return {
                query: "botón de confirmación",
                options: {
                    maxResults: 10,
                    threshold: 0.7,
                    category: "atoms"
                }
            };
        }
        return {};
    }

    /**
     * Renderizar ejemplos de uso
     */
    renderExamples() {
        return `
            <div class="examples-documentation">
                <div class="docs-header">
                    <h3>Ejemplos de Uso</h3>
                    <p>Ejemplos prácticos de cómo usar la API</p>
                </div>

                <div class="examples-grid">
                    ${this.renderExampleCard('Generación Básica', 
                        'Generar un botón simple', 
                        this.getBasicGenerationExample())}

                    ${this.renderExampleCard('Generación Avanzada', 
                        'Generar componente con opciones específicas', 
                        this.getAdvancedGenerationExample())}

                    ${this.renderExampleCard('Búsqueda Simple', 
                        'Buscar componentes por término', 
                        this.getSimpleSearchExample())}

                    ${this.renderExampleCard('Búsqueda con Filtros', 
                        'Búsqueda con filtros y opciones', 
                        this.getFilteredSearchExample())}

                    ${this.renderExampleCard('JavaScript/Fetch', 
                        'Uso desde JavaScript con fetch', 
                        this.getJavaScriptExample())}

                    ${this.renderExampleCard('Manejo de Errores', 
                        'Cómo manejar errores de la API', 
                        this.getErrorHandlingExample())}
                </div>
            </div>
        `;
    }

    /**
     * Renderizar tarjeta de ejemplo
     */
    renderExampleCard(title, description, code) {
        return `
            <div class="example-card">
                <div class="example-header">
                    <h4>${title}</h4>
                    <p>${description}</p>
                </div>
                <div class="code-example">
                    <div class="code-header">
                        <span>Código</span>
                        <button class="copy-example-btn">
                            <i class="fas fa-copy"></i>
                            Copiar
                        </button>
                    </div>
                    <pre><code>${code}</code></pre>
                </div>
            </div>
        `;
    }

    /**
     * Obtener ejemplos de código
     */
    getBasicGenerationExample() {
        return `curl -X POST "${window.location.origin}/api/v2/components/generate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "botón primario que diga Guardar",
    "options": {
      "maxResults": 1,
      "includeCode": true
    }
  }'`;
    }

    getAdvancedGenerationExample() {
        return `curl -X POST "${window.location.origin}/api/v2/components/generate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "alerta de error con icono y botón de cerrar",
    "context": "formulario de validación",
    "options": {
      "maxResults": 3,
      "threshold": 0.8,
      "includeCode": true,
      "includeTypeScript": true,
      "format": "angular"
    }
  }'`;
    }

    getSimpleSearchExample() {
        return `curl -X POST "${window.location.origin}/api/v2/components/search" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "botón de confirmación"
  }'`;
    }

    getFilteredSearchExample() {
        return `curl -X POST "${window.location.origin}/api/v2/components/search" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "campo de entrada",
    "options": {
      "maxResults": 5,
      "threshold": 0.7,
      "category": "atoms",
      "type": "component"
    }
  }'`;
    }

    getJavaScriptExample() {
        return `// Ejemplo usando fetch en JavaScript
async function generateComponent(prompt) {
  try {
    const response = await fetch('/api/v2/components/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        options: {
          maxResults: 3,
          includeCode: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }

    const data = await response.json();
    console.log('Componentes generados:', data.components);
    return data.components;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Uso
generateComponent('botón secundario pequeño')
  .then(components => {
    components.forEach(component => {
      console.log(\`Componente: \${component.name}\`);
      console.log(\`Código: \${component.code}\`);
    });
  });`;
    }

    getErrorHandlingExample() {
        return `# Ejemplo de respuesta de error
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Prompt requerido",
  "message": "El campo 'prompt' es obligatorio",
  "code": "MISSING_PROMPT",
  "timestamp": "2024-01-15T10:30:00Z"
}

# Códigos de error comunes:
# 400 - Bad Request: Parámetros inválidos
# 404 - Not Found: Componente no encontrado
# 429 - Too Many Requests: Rate limit excedido
# 500 - Internal Server Error: Error del servidor`;
    }

    /**
     * Renderizar esquemas de datos
     */
    renderSchemas() {
        return `
            <div class="schemas-documentation">
                <div class="docs-header">
                    <h3>Esquemas de Datos</h3>
                    <p>Estructura de datos de entrada y salida</p>
                </div>

                <div class="schemas-list">
                    ${this.renderSchemaItem('GenerateRequest', 'Solicitud de generación', {
                        prompt: 'string (required) - Descripción del componente',
                        context: 'string (optional) - Contexto adicional',
                        options: {
                            maxResults: 'number - Máximo resultados (1-10)',
                            threshold: 'number - Umbral confianza (0-1)',
                            includeCode: 'boolean - Incluir código HTML',
                            includeTypeScript: 'boolean - Incluir TypeScript',
                            format: 'string - Formato (html|angular|react)'
                        }
                    })}

                    ${this.renderSchemaItem('SearchRequest', 'Solicitud de búsqueda', {
                        query: 'string (required) - Consulta de búsqueda',
                        options: {
                            maxResults: 'number - Máximo resultados (1-20)',
                            threshold: 'number - Umbral similitud (0-1)',
                            category: 'string - Categoría del componente',
                            type: 'string - Tipo del componente'
                        }
                    })}

                    ${this.renderSchemaItem('Component', 'Estructura de componente', {
                        name: 'string - Nombre del componente',
                        description: 'string - Descripción del componente',
                        category: 'string - Categoría (atoms|molecules|organisms)',
                        type: 'string - Tipo (component|directive|service)',
                        code: 'string - Código HTML del componente',
                        typescript: 'string - Código TypeScript',
                        properties: 'Property[] - Lista de propiedades',
                        tags: 'string[] - Etiquetas del componente',
                        confidence: 'number - Nivel de confianza (0-1)',
                        similarity: 'number - Similitud en búsquedas (0-1)'
                    })}

                    ${this.renderSchemaItem('Property', 'Propiedad de componente', {
                        name: 'string - Nombre de la propiedad',
                        type: 'string - Tipo de dato',
                        description: 'string - Descripción de la propiedad',
                        required: 'boolean - Si es requerida',
                        defaultValue: 'any - Valor por defecto'
                    })}

                    ${this.renderSchemaItem('GenerateResponse', 'Respuesta de generación', {
                        success: 'boolean - Si la operación fue exitosa',
                        components: 'Component[] - Lista de componentes generados',
                        metadata: {
                            totalResults: 'number - Total de resultados',
                            processingTime: 'number - Tiempo de procesamiento (ms)',
                            model: 'string - Modelo utilizado',
                            version: 'string - Versión de la API'
                        }
                    })}

                    ${this.renderSchemaItem('ErrorResponse', 'Respuesta de error', {
                        error: 'string - Mensaje de error',
                        message: 'string - Descripción detallada',
                        code: 'string - Código de error',
                        timestamp: 'string - Timestamp ISO 8601',
                        details: 'object - Detalles adicionales del error'
                    })}
                </div>
            </div>
        `;
    }

    /**
     * Renderizar item de esquema
     */
    renderSchemaItem(name, description, schema) {
        return `
            <div class="schema-item">
                <div class="schema-header">
                    <h4>${name}</h4>
                    <p>${description}</p>
                </div>
                <div class="schema-content">
                    <pre><code class="language-json">${JSON.stringify(schema, null, 2)}</code></pre>
                </div>
            </div>
        `;
    }

    /**
     * Mostrar error de documentación
     */
    showDocumentationError(message) {
        const docsContent = document.getElementById('docsContent');
        if (docsContent) {
            docsContent.innerHTML = `
                <div class="docs-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error cargando documentación</h3>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="DocsManager.reloadDocs()">
                        <i class="fas fa-refresh"></i>
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Copiar al portapapeles
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            window.UIUtils.showToast('Código copiado al portapapeles', 'success');
        } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            window.UIUtils.showToast('Error al copiar el código', 'error');
        }
    }

    // Métodos estáticos para eventos globales

    /**
     * Alternar ejemplo
     */
    static toggleExample(button) {
        const exampleContent = button.nextElementSibling;
        const isVisible = exampleContent.style.display !== 'none';
        
        exampleContent.style.display = isVisible ? 'none' : 'block';
        button.innerHTML = isVisible 
            ? '<i class="fas fa-code"></i> Ver Ejemplo'
            : '<i class="fas fa-eye-slash"></i> Ocultar Ejemplo';
    }

    /**
     * Recargar documentación
     */
    static async reloadDocs() {
        await window.DocsManager.loadDocumentation();
    }
}

// Crear instancia global
window.DocsManager = new DocsManager(); 