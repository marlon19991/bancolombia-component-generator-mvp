/**
 * API Service - Manejo de comunicaciones con el backend RAG
 * Bancolombia Component Generator v2.0
 */

class APIService {
    constructor() {
        this.baseURL = window.location.origin;
        this.apiVersion = 'v2';
        this.apiBase = `${this.baseURL}/api/${this.apiVersion}`;
        this.timeout = 30000; // 30 segundos
    }

    /**
     * Realizar petición HTTP genérica
     */
    async request(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const config = {
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('La petición ha excedido el tiempo límite');
            }
            throw error;
        }
    }

    /**
     * Generar componentes desde prompt
     */
    async generateComponent(prompt, context = '', options = {}) {
        const payload = {
            prompt,
            context,
            options: {
                maxResults: options.maxResults || 3,
                threshold: options.threshold || 0.7,
                includeCode: options.includeCode !== false,
                includeTypeScript: options.includeTypeScript !== false,
                format: options.format || 'html',
                ...options
            }
        };

        return await this.request('/components/generate', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    /**
     * Búsqueda semántica de componentes
     */
    async searchComponents(query, options = {}) {
        const payload = {
            query,
            options: {
                maxResults: options.maxResults || 10,
                threshold: options.threshold || 0.7,
                category: options.category || '',
                type: options.type || '',
                ...options
            }
        };

        return await this.request('/components/search', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    /**
     * Listar todos los componentes
     */
    async listComponents(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.category) params.append('category', filters.category);
        if (filters.type) params.append('type', filters.type);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);

        const queryString = params.toString();
        const endpoint = `/components${queryString ? `?${queryString}` : ''}`;

        return await this.request(endpoint);
    }

    /**
     * Obtener detalles de un componente específico
     */
    async getComponent(name) {
        return await this.request(`/components/${encodeURIComponent(name)}`);
    }

    /**
     * Obtener componentes similares
     */
    async getSimilarComponents(name, limit = 5) {
        const params = new URLSearchParams({ limit: limit.toString() });
        return await this.request(`/components/${encodeURIComponent(name)}/similar?${params}`);
    }

    /**
     * Obtener componentes por categoría
     */
    async getComponentsByCategory(category, limit = 20) {
        const params = new URLSearchParams({ limit: limit.toString() });
        return await this.request(`/components/categories/${encodeURIComponent(category)}?${params}`);
    }

    /**
     * Health check del sistema
     */
    async healthCheck() {
        return await this.request('/components/health');
    }

    /**
     * Obtener estadísticas del sistema
     */
    async getStats() {
        return await this.request('/components/stats');
    }

    /**
     * Obtener documentación de la API
     */
    async getDocs() {
        return await fetch('/docs', {
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        });
    }

    /**
     * Obtener información del sistema
     */
    async getSystemInfo() {
        return await fetch('/', {
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        });
    }

    /**
     * Obtiene componentes disponibles
     */
    async getAvailableComponents() {
        try {
            const response = await fetch(`${this.baseURL}/components/available`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error obteniendo componentes disponibles');
            }
            
            return data.data.components;
        } catch (error) {
            console.error('Error en getAvailableComponents:', error);
            throw error;
        }
    }

    /**
     * Busca componentes por query
     */
    async searchComponentsByQuery(query, options = {}) {
        const payload = {
            query,
            options: {
                maxResults: options.maxResults || 10,
                threshold: options.threshold || 0.7,
                category: options.category || '',
                type: options.type || '',
                ...options
            }
        };

        return await this.request('/components/search', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
}

// Crear instancia global del servicio API
window.apiService = new APIService();

// Utilidades para manejo de errores
window.APIUtils = {
    /**
     * Formatear errores para mostrar al usuario
     */
    formatError(error) {
        if (error.message) {
            return error.message;
        }
        
        if (typeof error === 'string') {
            return error;
        }
        
        return 'Ha ocurrido un error inesperado';
    },

    /**
     * Validar respuesta de la API
     */
    validateResponse(response) {
        if (!response) {
            throw new Error('Respuesta vacía del servidor');
        }

        if (response.error) {
            throw new Error(response.error);
        }

        return response;
    },

    /**
     * Retry automático para peticiones fallidas
     */
    async retry(fn, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            }
        }
        
        throw lastError;
    },

    /**
     * Debounce para búsquedas
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Interceptor global para manejo de errores de red
window.addEventListener('online', () => {
    console.log('Conexión restaurada');
    window.dispatchEvent(new CustomEvent('network-restored'));
});

window.addEventListener('offline', () => {
    console.log('Conexión perdida');
    window.dispatchEvent(new CustomEvent('network-lost'));
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIService, APIUtils };
} 