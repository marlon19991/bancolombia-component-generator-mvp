/**
 * Search Module - Búsqueda semántica de componentes
 * Bancolombia Component Generator v2.0
 */

class SearchManager {
    constructor() {
        this.isSearching = false;
        this.currentResults = [];
        this.searchHistory = [];
        this.filters = {
            category: '',
            type: '',
            threshold: 0.7
        };
    }

    /**
     * Inicializar el gestor de búsqueda
     */
    init() {
        this.setupEventListeners();
        this.loadSearchHistory();
        this.setupSearchSuggestions();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        const searchBtn = document.getElementById('searchBtn');
        const searchQuery = document.getElementById('searchQuery');
        const categoryFilter = document.getElementById('categoryFilter');
        const typeFilter = document.getElementById('typeFilter');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }

        if (searchQuery) {
            // Búsqueda al presionar Enter
            searchQuery.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });

            // Búsqueda en tiempo real con debounce
            searchQuery.addEventListener('input', 
                window.APIUtils.debounce(() => {
                    const query = searchQuery.value.trim();
                    if (query.length >= 3) {
                        this.performSearch(true); // Auto-search
                    } else if (query.length === 0) {
                        this.clearResults();
                    }
                }, 500)
            );

            // Mostrar sugerencias al hacer focus
            searchQuery.addEventListener('focus', () => {
                this.showSearchSuggestions();
            });
        }

        // Filtros
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filters.category = categoryFilter.value;
                if (this.currentResults.length > 0) {
                    this.applyFilters();
                }
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filters.type = typeFilter.value;
                if (this.currentResults.length > 0) {
                    this.applyFilters();
                }
            });
        }
    }

    /**
     * Realizar búsqueda principal
     */
    async performSearch(isAutoSearch = false) {
        if (this.isSearching) return;

        const query = document.getElementById('searchQuery')?.value?.trim();
        if (!query) {
            if (!isAutoSearch) {
                window.UIUtils.showToast('Por favor, ingresa un término de búsqueda', 'warning');
            }
            return;
        }

        try {
            this.setSearching(true);

            const options = {
                maxResults: 20,
                threshold: this.filters.threshold,
                category: this.filters.category,
                type: this.filters.type
            };

            console.log('Realizando búsqueda:', { query, options });

            const response = await window.apiService.searchComponents(query, options);
            
            this.currentResults = response.components || response.results || [];
            this.renderResults(this.currentResults);
            
            // Guardar en historial solo si no es auto-búsqueda
            if (!isAutoSearch) {
                this.addToSearchHistory(query, this.currentResults.length);
                window.UIUtils.showToast(`Se encontraron ${this.currentResults.length} componente(s)`, 'success');
            }

        } catch (error) {
            console.error('Error en búsqueda:', error);
            this.showSearchError(window.APIUtils.formatError(error));
            if (!isAutoSearch) {
                window.UIUtils.showToast('Error al realizar la búsqueda', 'error');
            }
        } finally {
            this.setSearching(false);
        }
    }

    /**
     * Renderizar resultados de búsqueda
     */
    renderResults(results) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (!results || results.length === 0) {
            resultsContainer.innerHTML = this.renderNoResults();
            return;
        }

        const resultsHTML = `
            <div class="search-results-header">
                <h4>Resultados de búsqueda (${results.length})</h4>
                <div class="search-actions">
                    <button class="btn-secondary btn-sm" onclick="SearchManager.exportResults()">
                        <i class="fas fa-download"></i>
                        Exportar
                    </button>
                    <button class="btn-secondary btn-sm" onclick="SearchManager.clearResults()">
                        <i class="fas fa-times"></i>
                        Limpiar
                    </button>
                </div>
            </div>
            <div class="search-results-list">
                ${results.map((result, index) => this.renderSearchResult(result, index)).join('')}
            </div>
        `;

        resultsContainer.innerHTML = resultsHTML;
        this.attachSearchEvents();
    }

    /**
     * Renderizar resultado individual de búsqueda
     */
    renderSearchResult(result, index) {
        const similarity = result.similarity || result.score || 0;
        const similarityPercent = Math.round(similarity * 100);
        const similarityClass = similarity >= 0.8 ? 'high' : similarity >= 0.6 ? 'medium' : 'low';
        
        const icon = this.getComponentIcon(result.name);
        const category = result.category || 'atoms';
        const tags = result.tags || [];

        return `
            <div class="search-result-item" data-index="${index}">
                <div class="result-main">
                    <div class="result-icon">
                        <i class="${icon}"></i>
                    </div>
                    
                    <div class="result-content">
                        <div class="result-header">
                            <h5 class="result-title">${result.name}</h5>
                            <span class="result-category">${this.formatCategory(category)}</span>
                            <div class="result-similarity ${similarityClass}">
                                <span class="similarity-value">${similarityPercent}%</span>
                                <div class="similarity-bar">
                                    <div class="similarity-fill" style="width: ${similarityPercent}%"></div>
                                </div>
                            </div>
                        </div>
                        
                        <p class="result-description">
                            ${result.description || 'Sin descripción disponible'}
                        </p>
                        
                        ${tags.length > 0 ? `
                            <div class="result-tags">
                                ${tags.map(tag => `<span class="result-tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                        
                        ${result.matchedTerms && result.matchedTerms.length > 0 ? `
                            <div class="matched-terms">
                                <strong>Términos coincidentes:</strong>
                                ${result.matchedTerms.map(term => `<span class="matched-term">${term}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="result-actions">
                    <button class="btn-primary btn-sm" onclick="SearchManager.viewComponent('${result.name}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="btn-secondary btn-sm" onclick="SearchManager.generateFromResult('${result.name}')">
                        <i class="fas fa-magic"></i>
                        Generar Similar
                    </button>
                    <button class="btn-secondary btn-sm" onclick="SearchManager.addToComparison(${index})">
                        <i class="fas fa-plus"></i>
                        Comparar
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar estado sin resultados
     */
    renderNoResults() {
        const query = document.getElementById('searchQuery')?.value || '';
        
        return `
            <div class="no-search-results">
                <i class="fas fa-search"></i>
                <h4>No se encontraron resultados</h4>
                <p>No se encontraron componentes que coincidan con "${query}"</p>
                
                <div class="search-suggestions">
                    <h5>Sugerencias:</h5>
                    <ul>
                        <li>Verifica la ortografía de los términos de búsqueda</li>
                        <li>Intenta con términos más generales</li>
                        <li>Reduce el umbral de similitud</li>
                        <li>Elimina los filtros aplicados</li>
                    </ul>
                </div>
                
                <div class="alternative-searches">
                    <h5>Búsquedas relacionadas:</h5>
                    <div class="related-searches">
                        ${this.getRelatedSearches(query).map(search => `
                            <button class="related-search-btn" onclick="SearchManager.performRelatedSearch('${search}')">
                                ${search}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Mostrar error de búsqueda
     */
    showSearchError(message) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="search-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error en la búsqueda</h4>
                <p>${message}</p>
                <button class="btn-primary" onclick="SearchManager.retrySearch()">
                    <i class="fas fa-refresh"></i>
                    Reintentar
                </button>
            </div>
        `;
    }

    /**
     * Configurar estado de búsqueda
     */
    setSearching(searching) {
        this.isSearching = searching;
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchBtn) {
            searchBtn.disabled = searching;
            searchBtn.innerHTML = searching 
                ? '<i class="fas fa-spinner fa-spin"></i> Buscando...'
                : '<i class="fas fa-search"></i> Buscar';
        }

        if (searching) {
            const resultsContainer = document.getElementById('searchResults');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="search-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Buscando componentes...</p>
                    </div>
                `;
            }
        }
    }

    /**
     * Aplicar filtros a resultados existentes
     */
    applyFilters() {
        let filteredResults = [...this.currentResults];

        if (this.filters.category) {
            filteredResults = filteredResults.filter(result => 
                result.category === this.filters.category
            );
        }

        if (this.filters.type) {
            filteredResults = filteredResults.filter(result => 
                result.type === this.filters.type
            );
        }

        this.renderResults(filteredResults);
    }

    /**
     * Configurar sugerencias de búsqueda
     */
    setupSearchSuggestions() {
        const suggestions = [
            'botón',
            'alerta',
            'input',
            'tarjeta',
            'modal',
            'checkbox',
            'radio',
            'select',
            'acordeón',
            'pestañas',
            'breadcrumb'
        ];

        this.searchSuggestions = suggestions;
    }

    /**
     * Mostrar sugerencias de búsqueda
     */
    showSearchSuggestions() {
        const searchQuery = document.getElementById('searchQuery');
        if (!searchQuery) return;

        // Crear dropdown de sugerencias si no existe
        let suggestionsDropdown = document.getElementById('searchSuggestions');
        if (!suggestionsDropdown) {
            suggestionsDropdown = document.createElement('div');
            suggestionsDropdown.id = 'searchSuggestions';
            suggestionsDropdown.className = 'search-suggestions-dropdown';
            searchQuery.parentNode.appendChild(suggestionsDropdown);
        }

        const currentValue = searchQuery.value.toLowerCase();
        const filteredSuggestions = this.searchSuggestions.filter(suggestion =>
            suggestion.toLowerCase().includes(currentValue) && suggestion !== currentValue
        );

        if (filteredSuggestions.length > 0) {
            suggestionsDropdown.innerHTML = filteredSuggestions.map(suggestion => `
                <div class="suggestion-item" onclick="SearchManager.selectSuggestion('${suggestion}')">
                    ${suggestion}
                </div>
            `).join('');
            suggestionsDropdown.style.display = 'block';
        } else {
            suggestionsDropdown.style.display = 'none';
        }

        // Ocultar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!searchQuery.contains(e.target) && !suggestionsDropdown.contains(e.target)) {
                suggestionsDropdown.style.display = 'none';
            }
        });
    }

    /**
     * Obtener búsquedas relacionadas
     */
    getRelatedSearches(query) {
        const related = {
            'botón': ['button', 'btn', 'click', 'acción'],
            'alerta': ['alert', 'notificación', 'mensaje', 'aviso'],
            'input': ['campo', 'texto', 'formulario', 'entrada'],
            'tarjeta': ['card', 'panel', 'contenedor'],
            'modal': ['popup', 'ventana', 'diálogo']
        };

        const queryLower = query.toLowerCase();
        for (const [key, values] of Object.entries(related)) {
            if (queryLower.includes(key) || values.some(v => queryLower.includes(v))) {
                return values.slice(0, 3);
            }
        }

        return ['botón', 'alerta', 'input'];
    }

    /**
     * Obtener icono del componente
     */
    getComponentIcon(componentName) {
        const iconMap = {
            'bc-button': 'fas fa-hand-pointer',
            'bc-alert': 'fas fa-exclamation-triangle',
            'bc-input': 'fas fa-edit',
            'bc-card': 'fas fa-id-card',
            'bc-modal': 'fas fa-window-restore',
            'bc-checkbox': 'fas fa-check-square',
            'bc-radio': 'fas fa-dot-circle',
            'bc-input-select': 'fas fa-list',
            'bc-accordion': 'fas fa-bars',
            'bc-tabs-group': 'fas fa-folder-open',
            'bc-breadcrumb': 'fas fa-route'
        };

        return iconMap[componentName] || 'fas fa-cube';
    }

    /**
     * Formatear categoría
     */
    formatCategory(category) {
        const categoryMap = {
            'atoms': 'Átomos',
            'molecules': 'Moléculas',
            'organisms': 'Organismos',
            'templates': 'Plantillas',
            'pages': 'Páginas'
        };

        return categoryMap[category] || category;
    }

    /**
     * Agregar al historial de búsqueda
     */
    addToSearchHistory(query, resultsCount) {
        const entry = {
            query,
            resultsCount,
            timestamp: new Date().toISOString()
        };

        this.searchHistory.unshift(entry);
        
        // Mantener solo las últimas 10 búsquedas
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }

        // Guardar en localStorage
        try {
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('No se pudo guardar el historial de búsqueda:', error);
        }
    }

    /**
     * Cargar historial de búsqueda
     */
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('searchHistory');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('No se pudo cargar el historial de búsqueda:', error);
        }
    }

    /**
     * Adjuntar eventos a resultados de búsqueda
     */
    attachSearchEvents() {
        // Eventos de hover para resultados
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateX(4px)';
            });

            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateX(0)';
            });
        });
    }

    /**
     * Limpiar resultados
     */
    clearResults() {
        this.currentResults = [];
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="results-placeholder">
                    <i class="fas fa-search"></i>
                    <p>Los resultados de búsqueda aparecerán aquí</p>
                </div>
            `;
        }
    }

    // Métodos estáticos para eventos globales

    /**
     * Seleccionar sugerencia
     */
    static selectSuggestion(suggestion) {
        const searchQuery = document.getElementById('searchQuery');
        if (searchQuery) {
            searchQuery.value = suggestion;
            searchQuery.focus();
            
            // Ocultar dropdown
            const dropdown = document.getElementById('searchSuggestions');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
    }

    /**
     * Realizar búsqueda relacionada
     */
    static performRelatedSearch(query) {
        const searchQuery = document.getElementById('searchQuery');
        if (searchQuery) {
            searchQuery.value = query;
            window.SearchManager.performSearch();
        }
    }

    /**
     * Ver componente desde resultado de búsqueda
     */
    static async viewComponent(componentName) {
        try {
            window.UIUtils.showLoading();
            const component = await window.apiService.getComponent(componentName);
            
            // Reutilizar modal de ComponentsManager
            window.ComponentsManager.showComponentModal(component);
        } catch (error) {
            console.error('Error obteniendo detalles del componente:', error);
            window.UIUtils.showToast('Error al cargar los detalles del componente', 'error');
        } finally {
            window.UIUtils.hideLoading();
        }
    }

    /**
     * Generar componente similar desde resultado
     */
    static generateFromResult(componentName) {
        const promptInput = document.getElementById('promptInput');
        if (promptInput) {
            promptInput.value = `Genera un componente similar a ${componentName}`;
            
            // Cambiar a la pestaña del generador
            const generatorTab = document.querySelector('a[href="#generator"]');
            if (generatorTab) {
                generatorTab.click();
            }
            
            // Hacer scroll al generador
            const generatorSection = document.getElementById('generator');
            if (generatorSection) {
                generatorSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    /**
     * Agregar a comparación
     */
    static addToComparison(index) {
        const searchManager = window.SearchManager;
        const result = searchManager.currentResults[index];
        
        if (!result) return;

        // Implementar lógica de comparación
        window.UIUtils.showToast(`${result.name} agregado a comparación`, 'success');
    }

    /**
     * Exportar resultados de búsqueda
     */
    static exportResults() {
        const searchManager = window.SearchManager;
        
        if (!searchManager.currentResults || searchManager.currentResults.length === 0) {
            window.UIUtils.showToast('No hay resultados para exportar', 'warning');
            return;
        }

        const exportData = {
            timestamp: new Date().toISOString(),
            query: document.getElementById('searchQuery')?.value || '',
            filters: searchManager.filters,
            results: searchManager.currentResults
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `busqueda-componentes-${Date.now()}.json`;
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
        window.SearchManager.clearResults();
    }

    /**
     * Reintentar búsqueda
     */
    static retrySearch() {
        window.SearchManager.performSearch();
    }
}

// Crear instancia global
window.SearchManager = new SearchManager(); 