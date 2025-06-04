/**
 * Generator Module - Generación de componentes por prompts
 * Bancolombia Component Generator v2.0
 */

class ComponentGenerator {
    constructor() {
        this.isGenerating = false;
        this.currentResults = [];
        this.generationHistory = [];
    }

    /**
     * Inicializar el generador
     */
    init() {
        this.setupEventListeners();
        this.loadExamples();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        const promptInput = document.getElementById('promptInput');

        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateComponent());
        }

        if (promptInput) {
            // Generar al presionar Enter (con Ctrl/Cmd)
            promptInput.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.generateComponent();
                }
            });

            // Auto-resize del textarea
            promptInput.addEventListener('input', () => {
                this.autoResizeTextarea(promptInput);
            });
        }

        // Ejemplos rápidos
        this.setupQuickExamples();
    }

    /**
     * Configurar ejemplos rápidos
     */
    setupQuickExamples() {
        const examples = [
            'botón primario que diga "Guardar"',
            'alerta de éxito con mensaje',
            'campo de texto para email',
            'tarjeta con información de usuario',
            'checkbox para términos y condiciones'
        ];

        // Crear botones de ejemplo si no existen
        const examplesContainer = document.querySelector('.examples-container');
        if (!examplesContainer) {
            const container = document.createElement('div');
            container.className = 'examples-container';
            container.innerHTML = `
                <div class="examples-header">
                    <h4>Ejemplos rápidos:</h4>
                </div>
                <div class="examples-buttons">
                    ${examples.map(example => `
                        <button class="example-btn" data-example="${example}">
                            ${example}
                        </button>
                    `).join('')}
                </div>
            `;

            const promptInput = document.getElementById('promptInput');
            if (promptInput && promptInput.parentNode) {
                promptInput.parentNode.insertBefore(container, promptInput.nextSibling);
            }
        }

        // Event listeners para ejemplos
        document.addEventListener('click', (e) => {
            if (e.target.matches('.example-btn')) {
                const example = e.target.dataset.example;
                const promptInput = document.getElementById('promptInput');
                if (promptInput) {
                    promptInput.value = example;
                    promptInput.focus();
                }
            }
        });
    }

    /**
     * Auto-resize del textarea
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    /**
     * Generar componente principal
     * MEJORADO: Manejo de validación y errores mejorado
     */
    async generateComponent() {
        if (this.isGenerating) return;

        const prompt = document.getElementById('promptInput')?.value?.trim();
        if (!prompt) {
            window.UIUtils.showToast('Por favor, describe el componente que necesitas', 'warning');
            return;
        }

        try {
            this.setGenerating(true);
            
            const options = this.getGenerationOptions();
            const context = document.getElementById('contextInput')?.value?.trim() || '';

            console.log('Generando componente:', { prompt, context, options });

            const response = await window.apiService.generateComponent(prompt, context, options);
            
            console.log('Respuesta de la API:', response);
            
            // Verificar si la generación fue exitosa
            if (!response.success) {
                this.showValidationError(response);
                return;
            }
            
            // Corregir acceso a los datos de la respuesta
            let components = [];
            if (response.success && response.data && response.data.components) {
                components = response.data.components;
            } else if (response.components) {
                components = response.components;
            } else if (response.results) {
                components = response.results;
            }
            
            this.currentResults = components;
            this.renderResults(this.currentResults);
            
            // Guardar en historial
            this.addToHistory({ prompt, context, options, results: this.currentResults });
            
            // Mostrar información de validación si está disponible
            if (response.validation) {
                this.showValidationInfo(response.validation);
            }
            
            window.UIUtils.showToast(`Se generaron ${this.currentResults.length} componente(s)`, 'success');

        } catch (error) {
            console.error('Error generando componente:', error);
            this.showGenerationError(window.APIUtils.formatError(error));
            window.UIUtils.showToast('Error al generar el componente', 'error');
        } finally {
            this.setGenerating(false);
        }
    }

    /**
     * Obtener opciones de generación desde la UI
     */
    getGenerationOptions() {
        return {
            maxResults: parseInt(document.getElementById('maxResults')?.value) || 3,
            threshold: parseFloat(document.getElementById('threshold')?.value) || 0.7,
            format: document.getElementById('format')?.value || 'html',
            includeCode: document.getElementById('includeCode')?.checked !== false,
            includeTypeScript: document.getElementById('includeTypeScript')?.checked !== false
        };
    }

    /**
     * Renderizar resultados de generación
     */
    renderResults(results) {
        const outputContainer = document.getElementById('generatorOutput');
        if (!outputContainer) return;

        if (!results || results.length === 0) {
            outputContainer.innerHTML = this.renderNoResults();
            return;
        }

        const resultsHTML = results.map((result, index) => 
            this.renderComponentResult(result, index)
        ).join('');

        outputContainer.innerHTML = `
            <div class="results-header">
                <h4>Componentes generados (${results.length})</h4>
                <div class="results-actions">
                    <button class="btn-secondary btn-sm" onclick="ComponentGenerator.exportResults()">
                        <i class="fas fa-download"></i>
                        Exportar
                    </button>
                    <button class="btn-secondary btn-sm" onclick="ComponentGenerator.clearResults()">
                        <i class="fas fa-trash"></i>
                        Limpiar
                    </button>
                </div>
            </div>
            <div class="results-list">
                ${resultsHTML}
            </div>
        `;

        this.attachResultEvents();
    }

    /**
     * Renderizar resultado individual
     * MEJORADO: Incluye información de validación
     */
    renderComponentResult(result, index) {
        const confidence = result.confidence || result.score || 0;
        const confidencePercent = Math.round(confidence * 100);
        const confidenceClass = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';

        // Información de validación
        const validationInfo = result.validation ? `
            <div class="validation-info">
                <div class="validation-status ${result.validation.isFullyValid ? 'valid' : 'warning'}">
                    <i class="fas fa-shield-alt"></i>
                    <span>${result.validation.isFullyValid ? 'Totalmente válido' : 'Válido con correcciones'}</span>
                </div>
                ${result.corrected ? `
                    <div class="correction-notice">
                        <i class="fas fa-tools"></i>
                        <span>Correcciones automáticas aplicadas</span>
                    </div>
                ` : ''}
            </div>
        ` : '';

        return `
            <div class="result-item" data-index="${index}">
                <div class="result-header">
                    <div class="result-info">
                        <h5>${result.name || `Componente ${index + 1}`}</h5>
                        <span class="result-type">${result.type || 'component'}</span>
                        ${validationInfo}
                    </div>
                    <div class="result-confidence ${confidenceClass}">
                        <span class="confidence-label">Confianza:</span>
                        <span class="confidence-value">${confidencePercent}%</span>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
                        </div>
                    </div>
                </div>

                ${result.description ? `
                    <div class="result-description">
                        <p>${result.description}</p>
                    </div>
                ` : ''}

                <div class="result-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="preview-${index}">
                            <i class="fas fa-eye"></i>
                            Vista Previa
                        </button>
                        ${result.html ? `
                            <button class="tab-btn" data-tab="html-${index}">
                                <i class="fab fa-html5"></i>
                                HTML
                            </button>
                        ` : ''}
                        ${result.typescript ? `
                            <button class="tab-btn" data-tab="typescript-${index}">
                                <i class="fab fa-js"></i>
                                TypeScript
                            </button>
                        ` : ''}
                        ${result.properties ? `
                            <button class="tab-btn" data-tab="props-${index}">
                                <i class="fas fa-cog"></i>
                                Propiedades
                            </button>
                        ` : ''}
                        ${result.validation ? `
                            <button class="tab-btn" data-tab="validation-${index}">
                                <i class="fas fa-shield-alt"></i>
                                Validación
                            </button>
                        ` : ''}
                    </div>

                    <div class="tab-content">
                        <div class="tab-pane active" id="preview-${index}">
                            ${this.renderPreview(result)}
                        </div>
                        
                        ${result.html ? `
                            <div class="tab-pane" id="html-${index}">
                                <div class="code-block">
                                    <div class="code-header">
                                        <span>HTML</span>
                                        <button class="copy-btn" onclick="ComponentGenerator.copyCode('${index}', 'html')">
                                            <i class="fas fa-copy"></i>
                                            Copiar
                                        </button>
                                    </div>
                                    <pre><code class="language-html">${this.escapeHtml(result.html)}</code></pre>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${result.typescript ? `
                            <div class="tab-pane" id="typescript-${index}">
                                <div class="code-block">
                                    <div class="code-header">
                                        <span>TypeScript</span>
                                        <button class="copy-btn" onclick="ComponentGenerator.copyCode('${index}', 'typescript')">
                                            <i class="fas fa-copy"></i>
                                            Copiar
                                        </button>
                                    </div>
                                    <pre><code class="language-typescript">${this.escapeHtml(result.typescript)}</code></pre>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${result.properties ? `
                            <div class="tab-pane" id="props-${index}">
                                ${this.renderProperties(result.properties)}
                            </div>
                        ` : ''}

                        ${result.validation ? `
                            <div class="tab-pane" id="validation-${index}">
                                ${this.renderValidationDetails(result.validation)}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="result-actions">
                    <button class="btn-primary btn-sm" onclick="ComponentGenerator.useComponent(${index})">
                        <i class="fas fa-check"></i>
                        Usar Componente
                    </button>
                    <button class="btn-secondary btn-sm" onclick="ComponentGenerator.refineComponent(${index})">
                        <i class="fas fa-edit"></i>
                        Refinar
                    </button>
                    <button class="btn-secondary btn-sm" onclick="ComponentGenerator.findSimilar('${result.name}')">
                        <i class="fas fa-search"></i>
                        Similares
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar vista previa del componente
     */
    renderPreview(result) {
        if (result.html) {
            return `
                <div class="component-preview">
                    <div class="preview-container">
                        ${result.html}
                    </div>
                    <div class="preview-info">
                        <small>Vista previa del componente generado</small>
                    </div>
                </div>
            `;
        }

        return `
            <div class="preview-placeholder">
                <i class="fas fa-cube"></i>
                <p>Vista previa no disponible</p>
            </div>
        `;
    }

    /**
     * Renderizar propiedades del componente
     */
    renderProperties(properties) {
        if (!properties || (typeof properties === 'object' && Object.keys(properties).length === 0)) {
            return '<p>No hay propiedades definidas</p>';
        }

        // Si properties es un array (formato antiguo)
        if (Array.isArray(properties)) {
            return `
                <div class="properties-table">
                    <div class="properties-header">
                        <span>Propiedad</span>
                        <span>Tipo</span>
                        <span>Descripción</span>
                        <span>Requerido</span>
                    </div>
                    ${properties.map(prop => `
                        <div class="property-row">
                            <span class="prop-name">${prop.name}</span>
                            <span class="prop-type">${prop.type}</span>
                            <span class="prop-description">${prop.description || '-'}</span>
                            <span class="prop-required">${prop.required ? 'Sí' : 'No'}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Si properties es un objeto (formato actual)
        const propertyEntries = Object.entries(properties);
        return `
            <div class="properties-table">
                <div class="properties-header">
                    <span>Propiedad</span>
                    <span>Valor</span>
                    <span>Tipo</span>
                </div>
                ${propertyEntries.map(([key, value]) => `
                    <div class="property-row">
                        <span class="prop-name">${key}</span>
                        <span class="prop-value">${value}</span>
                        <span class="prop-type">${typeof value}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Renderizar estado sin resultados
     */
    renderNoResults() {
        return `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h4>No se encontraron componentes</h4>
                <p>Intenta con una descripción más específica o ajusta los parámetros de búsqueda.</p>
                <div class="suggestions">
                    <h5>Sugerencias:</h5>
                    <ul>
                        <li>Usa términos más específicos (ej: "botón primario" en lugar de "botón")</li>
                        <li>Incluye el contexto de uso</li>
                        <li>Reduce el umbral de confianza</li>
                        <li>Aumenta el número máximo de resultados</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Mostrar error de generación
     */
    showGenerationError(message) {
        const outputContainer = document.getElementById('generatorOutput');
        if (!outputContainer) return;

        outputContainer.innerHTML = `
            <div class="generation-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error en la generación</h4>
                <p>${message}</p>
                <button class="btn-primary" onclick="ComponentGenerator.retryGeneration()">
                    <i class="fas fa-refresh"></i>
                    Reintentar
                </button>
            </div>
        `;
    }

    /**
     * Configurar estado de generación
     */
    setGenerating(generating) {
        this.isGenerating = generating;
        const generateBtn = document.getElementById('generateBtn');
        
        if (generateBtn) {
            generateBtn.disabled = generating;
            generateBtn.innerHTML = generating 
                ? '<i class="fas fa-spinner fa-spin"></i> Generando...'
                : '<i class="fas fa-cogs"></i> Generar Componente';
        }

        if (generating) {
            window.UIUtils.showLoading();
        } else {
            window.UIUtils.hideLoading();
        }
    }

    /**
     * Adjuntar eventos a resultados
     */
    attachResultEvents() {
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                const resultItem = e.target.closest('.result-item');
                
                // Activar tab
                resultItem.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Mostrar contenido
                resultItem.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                resultItem.querySelector(`#${tabId}`).classList.add('active');
            });
        });
    }

    /**
     * Escapar HTML para mostrar código
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Agregar al historial
     */
    addToHistory(entry) {
        entry.timestamp = new Date().toISOString();
        this.generationHistory.unshift(entry);
        
        // Mantener solo los últimos 10
        if (this.generationHistory.length > 10) {
            this.generationHistory = this.generationHistory.slice(0, 10);
        }

        // Guardar en localStorage
        try {
            localStorage.setItem('generationHistory', JSON.stringify(this.generationHistory));
        } catch (error) {
            console.warn('No se pudo guardar el historial:', error);
        }
    }

    /**
     * Cargar ejemplos y historial
     */
    loadExamples() {
        try {
            const saved = localStorage.getItem('generationHistory');
            if (saved) {
                this.generationHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('No se pudo cargar el historial:', error);
        }
    }

    // Métodos estáticos para eventos globales

    /**
     * Copiar código al portapapeles
     */
    static async copyCode(index, type) {
        const generator = window.ComponentGenerator;
        const result = generator.currentResults[index];
        
        if (!result) return;

        const code = type === 'html' ? result.html : result.typescript;
        
        try {
            await navigator.clipboard.writeText(code);
            window.UIUtils.showToast('Código copiado al portapapeles', 'success');
        } catch (error) {
            console.error('Error copiando código:', error);
            window.UIUtils.showToast('Error al copiar el código', 'error');
        }
    }

    /**
     * Usar componente
     */
    static useComponent(index) {
        const generator = window.ComponentGenerator;
        const result = generator.currentResults[index];
        
        if (!result) return;

        // Aquí podrías implementar la lógica para "usar" el componente
        // Por ejemplo, copiarlo al portapapeles o enviarlo a otra herramienta
        
        window.UIUtils.showToast(`Componente ${result.name} seleccionado`, 'success');
    }

    /**
     * Refinar componente
     */
    static refineComponent(index) {
        const generator = window.ComponentGenerator;
        const result = generator.currentResults[index];
        
        if (!result) return;

        // Prellenar el prompt con información del componente para refinarlo
        const promptInput = document.getElementById('promptInput');
        if (promptInput) {
            promptInput.value = `Refina este componente: ${result.name}. ${result.description || ''}`;
            promptInput.focus();
        }
    }

    /**
     * Buscar componentes similares
     */
    static async findSimilar(componentName) {
        try {
            window.UIUtils.showLoading();
            const similar = await window.apiService.getSimilarComponents(componentName);
            
            // Mostrar resultados similares (reutilizar modal de ComponentsManager)
            window.ComponentsManager.showSimilarComponents(componentName, similar);
        } catch (error) {
            console.error('Error buscando similares:', error);
            window.UIUtils.showToast('Error al buscar componentes similares', 'error');
        } finally {
            window.UIUtils.hideLoading();
        }
    }

    /**
     * Exportar resultados
     */
    static exportResults() {
        const generator = window.ComponentGenerator;
        
        if (!generator.currentResults || generator.currentResults.length === 0) {
            window.UIUtils.showToast('No hay resultados para exportar', 'warning');
            return;
        }

        const exportData = {
            timestamp: new Date().toISOString(),
            results: generator.currentResults
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `componentes-generados-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.UIUtils.showToast('Resultados exportados', 'success');
    }

    /**
     * Limpiar resultados
     */
    static clearResults() {
        const generator = window.ComponentGenerator;
        generator.currentResults = [];
        
        const outputContainer = document.getElementById('generatorOutput');
        if (outputContainer) {
            outputContainer.innerHTML = `
                <div class="output-placeholder">
                    <i class="fas fa-lightbulb"></i>
                    <p>Los componentes generados aparecerán aquí</p>
                </div>
            `;
        }
    }

    /**
     * Reintentar generación
     */
    static retryGeneration() {
        const generator = window.ComponentGenerator;
        generator.generateComponent();
    }

    /**
     * Muestra errores de validación con sugerencias
     */
    showValidationError(response) {
        const outputContainer = document.getElementById('generatorOutput');
        if (!outputContainer) return;

        const suggestions = response.suggestions || [];
        const suggestionsHtml = suggestions.length > 0 ? `
            <div class="validation-suggestions">
                <h5>💡 Sugerencias:</h5>
                <div class="suggestions-list">
                    ${suggestions.map(suggestion => `
                        <div class="suggestion-item">
                            <div class="suggestion-content">
                                <strong>${suggestion.component || 'Sugerencia'}:</strong>
                                <p>${suggestion.reason || suggestion.message || suggestion.example}</p>
                                ${suggestion.example ? `<code class="suggestion-example">${suggestion.example}</code>` : ''}
                            </div>
                            ${suggestion.component ? `
                                <button class="btn-secondary btn-sm use-suggestion" 
                                        data-suggestion="${suggestion.example || suggestion.component}">
                                    Usar
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        outputContainer.innerHTML = `
            <div class="validation-error">
                <div class="error-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Componente no disponible</h4>
                </div>
                <div class="error-content">
                    <p class="error-message">${response.error}</p>
                    ${suggestionsHtml}
                </div>
                <div class="error-actions">
                    <button class="btn-primary" onclick="ComponentGenerator.showAvailableComponents()">
                        <i class="fas fa-list"></i>
                        Ver componentes disponibles
                    </button>
                    <button class="btn-secondary" onclick="ComponentGenerator.clearResults()">
                        <i class="fas fa-refresh"></i>
                        Intentar de nuevo
                    </button>
                </div>
            </div>
        `;

        // Agregar event listeners para sugerencias
        outputContainer.querySelectorAll('.use-suggestion').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const suggestion = e.target.dataset.suggestion;
                const promptInput = document.getElementById('promptInput');
                if (promptInput) {
                    promptInput.value = suggestion;
                    promptInput.focus();
                }
            });
        });
    }

    /**
     * Muestra información de validación exitosa
     */
    showValidationInfo(validation) {
        if (!validation.allValid) {
            console.warn('Validación con advertencias:', validation);
            window.UIUtils.showToast('Componente generado con correcciones automáticas', 'warning');
        }
    }

    /**
     * Renderiza detalles de validación
     */
    renderValidationDetails(validation) {
        if (!validation) return '<p>No hay información de validación disponible</p>';

        return `
            <div class="validation-details">
                <div class="validation-section">
                    <h6><i class="fas fa-check-circle"></i> Estado General</h6>
                    <div class="validation-status ${validation.isFullyValid ? 'success' : 'warning'}">
                        ${validation.isFullyValid ? 
                            '<i class="fas fa-check"></i> Componente totalmente válido' : 
                            '<i class="fas fa-exclamation-triangle"></i> Válido con correcciones'
                        }
                    </div>
                </div>

                ${validation.propertyValidation ? `
                    <div class="validation-section">
                        <h6><i class="fas fa-cogs"></i> Validación de Propiedades</h6>
                        <div class="property-validation ${validation.propertyValidation.isValid ? 'success' : 'error'}">
                            ${validation.propertyValidation.isValid ? 
                                '<i class="fas fa-check"></i> Todas las propiedades son válidas' : 
                                `<i class="fas fa-times"></i> Errores: ${validation.propertyValidation.errors.join(', ')}`
                            }
                        </div>
                        ${validation.propertyValidation.warnings && validation.propertyValidation.warnings.length > 0 ? `
                            <div class="property-warnings">
                                <i class="fas fa-exclamation-triangle"></i> 
                                Advertencias: ${validation.propertyValidation.warnings.join(', ')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                ${validation.corrections ? `
                    <div class="validation-section">
                        <h6><i class="fas fa-tools"></i> Correcciones Aplicadas</h6>
                        <div class="corrections-list">
                            ${validation.corrections.map(correction => `
                                <div class="correction-item">
                                    <strong>${correction.type}:</strong> ${correction.description}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${validation.templateValidation ? `
                    <div class="validation-section">
                        <h6><i class="fas fa-file-code"></i> Validación de Template</h6>
                        <div class="template-validation ${validation.templateValidation.valid ? 'success' : 'error'}">
                            ${validation.templateValidation.valid ? 
                                '<i class="fas fa-check"></i> Template válido' : 
                                `<i class="fas fa-times"></i> Errores de template: ${validation.templateValidation.errors.join(', ')}`
                            }
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Métodos estáticos mejorados

    /**
     * Muestra componentes disponibles
     */
    static async showAvailableComponents() {
        try {
            window.UIUtils.showLoading();
            
            // Obtener lista de componentes disponibles
            const components = await window.apiService.getAvailableComponents();
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Componentes Disponibles</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="components-grid">
                            ${components.map(comp => `
                                <div class="component-card" onclick="ComponentGenerator.useComponentExample('${comp.example}')">
                                    <div class="component-icon">
                                        <i class="fas fa-cube"></i>
                                    </div>
                                    <h4>${comp.name}</h4>
                                    <p>${comp.description}</p>
                                    <code class="component-example">${comp.example}</code>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('Error obteniendo componentes:', error);
            window.UIUtils.showToast('Error al cargar componentes disponibles', 'error');
        } finally {
            window.UIUtils.hideLoading();
        }
    }

    /**
     * Usa un ejemplo de componente
     */
    static useComponentExample(example) {
        const promptInput = document.getElementById('promptInput');
        if (promptInput) {
            promptInput.value = example;
            promptInput.focus();
        }
        
        // Cerrar modal
        document.querySelector('.modal-overlay')?.remove();
    }
}

// Crear instancia global
window.ComponentGenerator = new ComponentGenerator(); 