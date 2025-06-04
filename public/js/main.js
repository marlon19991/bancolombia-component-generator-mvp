/**
 * Main Application - Coordinador principal de la aplicación
 * Bancolombia Component Generator v2.0
 */

class BancolombiaRAGApp {
    constructor() {
        this.currentSection = 'generator';
        this.isInitialized = false;
        this.modules = {};
    }

    /**
     * Inicializar la aplicación
     */
    async init() {
        try {
            console.log('🚀 Inicializando Bancolombia RAG App...');
            
            // Mostrar loading inicial
            this.showInitialLoading();
            
            // Configurar utilidades UI
            this.setupUIUtils();
            
            // Configurar navegación
            this.setupNavigation();
            
            // Inicializar módulos en paralelo
            await this.initializeModules();
            
            // Configurar eventos globales
            this.setupGlobalEvents();
            
            // Verificar estado del sistema
            await this.checkSystemHealth();
            
            // Ocultar loading inicial
            this.hideInitialLoading();
            
            this.isInitialized = true;
            console.log('✅ Aplicación inicializada correctamente');
            
            // Mostrar mensaje de bienvenida
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ Error inicializando aplicación:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * Mostrar loading inicial
     */
    showInitialLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    /**
     * Ocultar loading inicial
     */
    hideInitialLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }

    /**
     * Configurar utilidades de UI
     */
    setupUIUtils() {
        window.UIUtils = {
            /**
             * Mostrar overlay de carga
             */
            showLoading() {
                const overlay = document.getElementById('loadingOverlay');
                if (overlay) {
                    overlay.classList.add('active');
                }
            },

            /**
             * Ocultar overlay de carga
             */
            hideLoading() {
                const overlay = document.getElementById('loadingOverlay');
                if (overlay) {
                    overlay.classList.remove('active');
                }
            },

            /**
             * Mostrar notificación toast
             */
            showToast(message, type = 'info', duration = 5000) {
                const container = document.getElementById('toastContainer');
                if (!container) return;

                const toast = document.createElement('div');
                toast.className = `toast ${type}`;
                toast.innerHTML = `
                    <div class="toast-content">
                        <i class="fas ${this.getToastIcon(type)}"></i>
                        <span>${message}</span>
                    </div>
                    <button class="toast-close" onclick="this.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                container.appendChild(toast);

                // Auto-remove después del tiempo especificado
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, duration);
            },

            /**
             * Obtener icono para toast
             */
            getToastIcon(type) {
                const icons = {
                    success: 'fa-check-circle',
                    error: 'fa-exclamation-circle',
                    warning: 'fa-exclamation-triangle',
                    info: 'fa-info-circle'
                };
                return icons[type] || icons.info;
            },

            /**
             * Confirmar acción
             */
            async confirm(message, title = 'Confirmar') {
                return new Promise((resolve) => {
                    const modal = document.createElement('div');
                    modal.className = 'modal-overlay';
                    modal.innerHTML = `
                        <div class="modal-content confirm-modal">
                            <div class="modal-header">
                                <h3>${title}</h3>
                            </div>
                            <div class="modal-body">
                                <p>${message}</p>
                            </div>
                            <div class="modal-footer">
                                <button class="btn-secondary cancel-btn">Cancelar</button>
                                <button class="btn-primary confirm-btn">Confirmar</button>
                            </div>
                        </div>
                    `;

                    document.body.appendChild(modal);

                    // Event listeners
                    modal.querySelector('.cancel-btn').addEventListener('click', () => {
                        modal.remove();
                        resolve(false);
                    });

                    modal.querySelector('.confirm-btn').addEventListener('click', () => {
                        modal.remove();
                        resolve(true);
                    });

                    // Cerrar con ESC
                    const handleEsc = (e) => {
                        if (e.key === 'Escape') {
                            modal.remove();
                            resolve(false);
                            document.removeEventListener('keydown', handleEsc);
                        }
                    };
                    document.addEventListener('keydown', handleEsc);
                });
            },

            /**
             * Scroll suave a elemento
             */
            scrollTo(elementId, offset = 0) {
                const element = document.getElementById(elementId);
                if (element) {
                    const top = element.offsetTop - offset;
                    window.scrollTo({
                        top,
                        behavior: 'smooth'
                    });
                }
            }
        };
    }

    /**
     * Configurar navegación
     */
    setupNavigation() {
        // Navegación principal
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.navigateToSection(section);
            }
        });

        // Navegación con teclado
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.navigateToSection('generator');
                        break;
                    case '2':
                        e.preventDefault();
                        this.navigateToSection('search');
                        break;
                    case '3':
                        e.preventDefault();
                        this.navigateToSection('components');
                        break;
                    case '4':
                        e.preventDefault();
                        this.navigateToSection('docs');
                        break;
                }
            }
        });

        // Health check button
        const healthCheckBtn = document.getElementById('healthCheck');
        if (healthCheckBtn) {
            healthCheckBtn.addEventListener('click', () => this.performHealthCheck());
        }
    }

    /**
     * Navegar a sección
     */
    navigateToSection(section) {
        // Actualizar navegación activa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${section}`) {
                link.classList.add('active');
            }
        });

        // Scroll a la sección
        window.UIUtils.scrollTo(section, 80);
        
        this.currentSection = section;

        // Actualizar URL sin recargar
        if (history.pushState) {
            history.pushState(null, null, `#${section}`);
        }
    }

    /**
     * Inicializar módulos
     */
    async initializeModules() {
        const initPromises = [];

        // Inicializar ComponentGenerator
        if (window.ComponentGenerator) {
            initPromises.push(
                Promise.resolve(window.ComponentGenerator.init())
                    .then(() => {
                        this.modules.generator = window.ComponentGenerator;
                        console.log('✅ ComponentGenerator inicializado');
                    })
                    .catch(error => console.warn('⚠️ Error inicializando ComponentGenerator:', error))
            );
        }

        // Inicializar SearchManager
        if (window.SearchManager) {
            initPromises.push(
                Promise.resolve(window.SearchManager.init())
                    .then(() => {
                        this.modules.search = window.SearchManager;
                        console.log('✅ SearchManager inicializado');
                    })
                    .catch(error => console.warn('⚠️ Error inicializando SearchManager:', error))
            );
        }

        // Inicializar ComponentsManager
        if (window.ComponentsManager) {
            initPromises.push(
                window.ComponentsManager.init()
                    .then(() => {
                        this.modules.components = window.ComponentsManager;
                        console.log('✅ ComponentsManager inicializado');
                    })
                    .catch(error => console.warn('⚠️ Error inicializando ComponentsManager:', error))
            );
        }

        // Inicializar DocsManager
        if (window.DocsManager) {
            initPromises.push(
                window.DocsManager.init()
                    .then(() => {
                        this.modules.docs = window.DocsManager;
                        console.log('✅ DocsManager inicializado');
                    })
                    .catch(error => console.warn('⚠️ Error inicializando DocsManager:', error))
            );
        }

        // Esperar a que todos los módulos se inicialicen
        await Promise.allSettled(initPromises);
    }

    /**
     * Configurar eventos globales
     */
    setupGlobalEvents() {
        // Manejo de errores globales
        window.addEventListener('error', (e) => {
            console.error('Error global:', e.error);
            window.UIUtils.showToast('Ha ocurrido un error inesperado', 'error');
        });

        // Manejo de promesas rechazadas
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Promesa rechazada:', e.reason);
            window.UIUtils.showToast('Error en operación asíncrona', 'error');
        });

        // Estado de conexión
        window.addEventListener('network-restored', () => {
            window.UIUtils.showToast('Conexión restaurada', 'success');
        });

        window.addEventListener('network-lost', () => {
            window.UIUtils.showToast('Conexión perdida. Algunas funciones pueden no estar disponibles.', 'warning', 10000);
        });

        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K para búsqueda rápida
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.navigateToSection('search');
                setTimeout(() => {
                    const searchInput = document.getElementById('searchQuery');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, 100);
            }

            // Ctrl/Cmd + G para generador
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                this.navigateToSection('generator');
                setTimeout(() => {
                    const promptInput = document.getElementById('promptInput');
                    if (promptInput) {
                        promptInput.focus();
                    }
                }, 100);
            }
        });

        // Navegación con hash
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash && ['generator', 'search', 'components', 'docs'].includes(hash)) {
                this.navigateToSection(hash);
            }
        });

        // Cargar sección inicial desde URL
        const initialHash = window.location.hash.substring(1);
        if (initialHash && ['generator', 'search', 'components', 'docs'].includes(initialHash)) {
            this.currentSection = initialHash;
        }
    }

    /**
     * Verificar estado del sistema
     */
    async performHealthCheck() {
        try {
            window.UIUtils.showLoading();
            const health = await window.apiService.healthCheck();
            
            const status = health.status || 'unknown';
            const message = health.message || 'Estado del sistema verificado';
            
            if (status === 'healthy' || status === 'ok') {
                window.UIUtils.showToast(`✅ Sistema saludable: ${message}`, 'success');
            } else {
                window.UIUtils.showToast(`⚠️ ${message}`, 'warning');
            }
            
            // Actualizar estadísticas si están disponibles
            if (health.stats) {
                this.updateSystemStats(health.stats);
            }
            
        } catch (error) {
            console.error('Error en health check:', error);
            window.UIUtils.showToast('❌ Error verificando estado del sistema', 'error');
        } finally {
            window.UIUtils.hideLoading();
        }
    }

    /**
     * Verificar estado del sistema al inicializar
     */
    async checkSystemHealth() {
        try {
            const health = await window.apiService.healthCheck();
            console.log('🏥 Estado del sistema:', health);
            
            if (health.status !== 'healthy' && health.status !== 'ok') {
                console.warn('⚠️ El sistema no está completamente saludable:', health);
            }
        } catch (error) {
            console.warn('⚠️ No se pudo verificar el estado del sistema:', error);
        }
    }

    /**
     * Actualizar estadísticas del sistema
     */
    updateSystemStats(stats) {
        // Actualizar estadísticas en el hero si están disponibles
        if (stats.totalComponents) {
            const componentsStat = document.querySelector('.stat-number');
            if (componentsStat) {
                componentsStat.textContent = stats.totalComponents;
            }
        }

        if (stats.averageAccuracy) {
            const accuracyStat = document.querySelectorAll('.stat-number')[1];
            if (accuracyStat) {
                accuracyStat.textContent = Math.round(stats.averageAccuracy * 100) + '%';
            }
        }

        if (stats.averageResponseTime) {
            const responseStat = document.querySelectorAll('.stat-number')[2];
            if (responseStat) {
                responseStat.textContent = Math.round(stats.averageResponseTime) + 'ms';
            }
        }
    }

    /**
     * Mostrar mensaje de bienvenida
     */
    showWelcomeMessage() {
        // Solo mostrar en la primera visita
        const hasVisited = localStorage.getItem('bancolombia-rag-visited');
        if (!hasVisited) {
            setTimeout(() => {
                window.UIUtils.showToast(
                    '¡Bienvenido al Generador RAG de Bancolombia! Usa Alt+1-4 para navegar rápidamente.',
                    'info',
                    8000
                );
                localStorage.setItem('bancolombia-rag-visited', 'true');
            }, 1000);
        }
    }

    /**
     * Mostrar error de inicialización
     */
    showInitializationError(error) {
        this.hideInitialLoading();
        
        const errorMessage = `
            <div class="initialization-error">
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error de Inicialización</h2>
                    <p>No se pudo inicializar la aplicación correctamente.</p>
                    <details>
                        <summary>Detalles del error</summary>
                        <pre>${error.message || error}</pre>
                    </details>
                    <button class="btn-primary" onclick="location.reload()">
                        <i class="fas fa-refresh"></i>
                        Recargar Aplicación
                    </button>
                </div>
            </div>
        `;

        document.body.innerHTML = errorMessage;
    }

    /**
     * Obtener información de la aplicación
     */
    getAppInfo() {
        return {
            name: 'Bancolombia RAG Component Generator',
            version: '2.0',
            initialized: this.isInitialized,
            currentSection: this.currentSection,
            modules: Object.keys(this.modules),
            features: [
                'Generación de componentes por IA',
                'Búsqueda semántica avanzada',
                'Catálogo de componentes',
                'Documentación interactiva',
                'API REST completa'
            ]
        };
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    // Crear instancia global de la aplicación
    window.BancolombiaRAGApp = new BancolombiaRAGApp();
    
    // Inicializar
    await window.BancolombiaRAGApp.init();
});

// Exponer información de la app en consola para debugging
console.log(`
🏦 Bancolombia RAG Component Generator v2.0
🚀 Sistema inteligente de generación de componentes
📚 Documentación: ${window.location.origin}/#docs
🔧 API: ${window.location.origin}/api/v2
⌨️  Atajos: Alt+1-4 para navegar, Ctrl/Cmd+K para buscar, Ctrl/Cmd+G para generar
`);

// Hacer disponible globalmente para debugging
window.getAppInfo = () => window.BancolombiaRAGApp?.getAppInfo() || 'App no inicializada'; 