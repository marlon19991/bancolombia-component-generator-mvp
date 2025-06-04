/**
 * Servicio de Validación de Componentes
 * Asegura que solo se generen componentes válidos de la librería de diseño Bancolombia
 */
class ComponentValidatorService {
  constructor() {
    this.validComponents = this.initializeValidComponents();
    this.componentAliases = this.initializeComponentAliases();
    this.validationRules = this.initializeValidationRules();
  }

  /**
   * Define los componentes válidos de la librería Bancolombia
   */
  initializeValidComponents() {
    return new Set([
      'bc-button',
      'bc-alert', 
      'bc-input',
      'bc-card',
      'bc-modal',
      'bc-checkbox',
      'bc-radio',
      'bc-input-select',
      'bc-accordion',
      'bc-tabs-group',
      'bc-breadcrumb'
    ]);
  }

  /**
   * Mapea términos comunes a componentes válidos
   */
  initializeComponentAliases() {
    return {
      // Botones
      'botón': 'bc-button',
      'button': 'bc-button',
      'btn': 'bc-button',
      'boton': 'bc-button',
      'presionar': 'bc-button',
      'hacer clic': 'bc-button',
      'enviar': 'bc-button',
      'guardar': 'bc-button',
      'cancelar': 'bc-button',
      'confirmar': 'bc-button',
      'aceptar': 'bc-button',

      // Alertas
      'alerta': 'bc-alert',
      'alert': 'bc-alert',
      'mensaje': 'bc-alert',
      'notificación': 'bc-alert',
      'aviso': 'bc-alert',
      'error': 'bc-alert',
      'éxito': 'bc-alert',
      'advertencia': 'bc-alert',
      'información': 'bc-alert',

      // Inputs
      'input': 'bc-input',
      'campo': 'bc-input',
      'entrada': 'bc-input',
      'formulario': 'bc-input',
      'campo de texto': 'bc-input',
      'caja de texto': 'bc-input',
      'texto': 'bc-input',
      'email': 'bc-input',
      'contraseña': 'bc-input',
      'teléfono': 'bc-input',
      'número': 'bc-input',

      // Cards
      'tarjeta': 'bc-card',
      'card': 'bc-card',
      'contenedor': 'bc-card',
      'panel': 'bc-card',
      'caja': 'bc-card',

      // Modals
      'modal': 'bc-modal',
      'ventana modal': 'bc-modal',
      'popup': 'bc-modal',
      'diálogo': 'bc-modal',
      'ventana emergente': 'bc-modal',
      'overlay': 'bc-modal',

      // Checkbox
      'checkbox': 'bc-checkbox',
      'casilla': 'bc-checkbox',
      'casilla de verificación': 'bc-checkbox',
      'check': 'bc-checkbox',
      'marcar': 'bc-checkbox',
      'seleccionar': 'bc-checkbox',
      'términos': 'bc-checkbox',
      'condiciones': 'bc-checkbox',
      'acepto': 'bc-checkbox',

      // Radio
      'radio': 'bc-radio',
      'radio button': 'bc-radio',
      'opción única': 'bc-radio',
      'selección única': 'bc-radio',
      'botón de radio': 'bc-radio',
      'grupo de opciones': 'bc-radio',

      // Select
      'select': 'bc-input-select',
      'dropdown': 'bc-input-select',
      'lista desplegable': 'bc-input-select',
      'seleccionar opción': 'bc-input-select',
      'menú desplegable': 'bc-input-select',
      'opciones': 'bc-input-select',
      'elegir': 'bc-input-select',

      // Accordion
      'acordeón': 'bc-accordion',
      'accordion': 'bc-accordion',
      'expandir': 'bc-accordion',
      'colapsar': 'bc-accordion',
      'mostrar ocultar': 'bc-accordion',
      'desplegable': 'bc-accordion',
      'contenido expandible': 'bc-accordion',

      // Tabs
      'pestañas': 'bc-tabs-group',
      'tabs': 'bc-tabs-group',
      'tabulador': 'bc-tabs-group',
      'navegación por pestañas': 'bc-tabs-group',
      'contenido tabulado': 'bc-tabs-group',
      'secciones': 'bc-tabs-group',

      // Breadcrumb
      'breadcrumb': 'bc-breadcrumb',
      'migas de pan': 'bc-breadcrumb',
      'navegación': 'bc-breadcrumb',
      'ruta': 'bc-breadcrumb',
      'ubicación': 'bc-breadcrumb'
    };
  }

  /**
   * Define reglas de validación específicas por componente
   */
  initializeValidationRules() {
    return {
      'bc-button': {
        requiredProperties: ['typeButton', 'sizeButton'],
        validTypes: ['primary', 'secondary', 'tertiary', 'background', 'ghost'],
        validSizes: ['default', 'small', 'puffy'],
        validWidths: ['fill', 'hug']
      },
      'bc-alert': {
        requiredProperties: ['type'],
        validTypes: ['error', 'success', 'info', 'warning', 'inactive'],
        validModes: ['inline', 'popup']
      },
      'bc-input': {
        requiredProperties: ['type'],
        validTypes: ['text', 'password', 'email', 'number', 'tel'],
        validStates: ['enabled', 'disabled', 'required', 'readonly']
      },
      'bc-card': {
        requiredProperties: ['type'],
        validTypes: ['default', 'image', 'rounded', 'rounded-header', 'rounded-horizontal', 'rounded-header-horizontal', 'horizontal', 'header-horizontal', 'header'],
        validBackgroundColors: ['default', 'warning', 'info', 'error', 'success']
      },
      'bc-modal': {
        requiredProperties: ['size'],
        validSizes: ['small', 'medium', 'large', 'fullscreen'],
        validTypes: ['info', 'warning', 'error', 'success', 'confirmation']
      },
      'bc-checkbox': {
        requiredProperties: ['label'],
        validStates: ['checked', 'unchecked', 'indeterminate', 'disabled']
      },
      'bc-radio': {
        requiredProperties: ['label', 'name'],
        validStates: ['checked', 'unchecked', 'disabled']
      },
      'bc-input-select': {
        requiredProperties: ['options'],
        validTypes: ['single', 'multiple'],
        validStates: ['enabled', 'disabled', 'error']
      },
      'bc-accordion': {
        requiredProperties: ['title', 'content'],
        validTypes: ['basic', 'info', 'advance', 'column', 'minimal', 'minimal-unbordered'],
        validStates: ['active', 'inactive', 'disabled']
      },
      'bc-tabs-group': {
        requiredProperties: ['tabs'],
        validOrientations: ['horizontal', 'vertical'],
        validThemes: ['light', 'dark']
      },
      'bc-breadcrumb': {
        requiredProperties: ['items'],
        validSeparators: ['arrow', 'slash', 'chevron']
      }
    };
  }

  /**
   * Valida si un prompt solicita componentes válidos
   */
  validatePrompt(prompt) {
    const normalizedPrompt = prompt.toLowerCase().trim();
    
    // Detectar componentes mencionados en el prompt
    const detectedComponents = this.detectComponentsInPrompt(normalizedPrompt);
    
    // Validar que todos los componentes detectados sean válidos
    const validationResults = detectedComponents.map(component => ({
      component,
      isValid: this.isValidComponent(component),
      suggestions: this.isValidComponent(component) ? [] : this.getSuggestions(component)
    }));

    const allValid = validationResults.every(result => result.isValid);
    
    return {
      isValid: allValid,
      detectedComponents,
      validationResults,
      confidence: this.calculatePromptConfidence(normalizedPrompt, detectedComponents)
    };
  }

  /**
   * Detecta componentes mencionados en el prompt
   */
  detectComponentsInPrompt(prompt) {
    const detectedComponents = new Set();
    
    // Buscar aliases directos
    for (const [alias, component] of Object.entries(this.componentAliases)) {
      if (prompt.includes(alias)) {
        detectedComponents.add(component);
      }
    }

    // Si no se detectó nada, intentar detección por contexto
    if (detectedComponents.size === 0) {
      const contextualComponent = this.detectByContext(prompt);
      if (contextualComponent) {
        detectedComponents.add(contextualComponent);
      }
    }

    return Array.from(detectedComponents);
  }

  /**
   * Detecta componente por contexto cuando no hay coincidencias directas
   */
  detectByContext(prompt) {
    // Patrones contextuales
    const contextPatterns = {
      'bc-button': /\b(hacer|presionar|enviar|guardar|cancelar|confirmar|aceptar|rechazar|continuar|siguiente|anterior|finalizar)\b/,
      'bc-alert': /\b(mostrar|mensaje|notificar|avisar|informar|advertir|error|éxito|problema|correcto)\b/,
      'bc-input': /\b(escribir|ingresar|introducir|capturar|llenar|completar|formulario|datos|información)\b/,
      'bc-card': /\b(mostrar información|presentar datos|contenido|información de|datos de|perfil|resumen)\b/,
      'bc-modal': /\b(ventana|mostrar encima|confirmar|pregunta|diálogo|emergente)\b/,
      'bc-checkbox': /\b(marcar|desmarcar|activar|desactivar|acepto|términos|condiciones|políticas)\b/,
      'bc-radio': /\b(elegir|seleccionar uno|opción única|alternativa|método|tipo de)\b/,
      'bc-input-select': /\b(elegir de|seleccionar de|lista de|opciones de|menú de)\b/,
      'bc-accordion': /\b(expandir|contraer|mostrar más|ver más|detalles|información adicional)\b/,
      'bc-tabs-group': /\b(organizar|secciones|categorías|pestañas|navegación entre)\b/,
      'bc-breadcrumb': /\b(navegación|ruta|ubicación|donde estoy|camino|jerarquía)\b/
    };

    for (const [component, pattern] of Object.entries(contextPatterns)) {
      if (pattern.test(prompt)) {
        return component;
      }
    }

    return null;
  }

  /**
   * Verifica si un componente es válido
   */
  isValidComponent(componentName) {
    return this.validComponents.has(componentName);
  }

  /**
   * Valida las propiedades de un componente específico
   */
  validateComponentProperties(componentName, properties) {
    if (!this.isValidComponent(componentName)) {
      return {
        isValid: false,
        errors: [`Componente '${componentName}' no es válido`],
        suggestions: this.getSuggestions(componentName)
      };
    }

    const rules = this.validationRules[componentName];
    if (!rules) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const errors = [];
    const warnings = [];

    // Validar propiedades requeridas
    if (rules.requiredProperties) {
      for (const requiredProp of rules.requiredProperties) {
        if (!properties.hasOwnProperty(requiredProp)) {
          errors.push(`Propiedad requerida '${requiredProp}' faltante`);
        }
      }
    }

    // Validar tipos válidos
    if (rules.validTypes && properties.type) {
      if (!rules.validTypes.includes(properties.type)) {
        errors.push(`Tipo '${properties.type}' no válido. Tipos válidos: ${rules.validTypes.join(', ')}`);
      }
    }

    // Validar tamaños válidos
    if (rules.validSizes && properties.size) {
      if (!rules.validSizes.includes(properties.size)) {
        errors.push(`Tamaño '${properties.size}' no válido. Tamaños válidos: ${rules.validSizes.join(', ')}`);
      }
    }

    // Validaciones específicas por componente
    this.validateSpecificRules(componentName, properties, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validaciones específicas por tipo de componente
   */
  validateSpecificRules(componentName, properties, errors, warnings) {
    switch (componentName) {
      case 'bc-button':
        if (properties.typeButton && !['primary', 'secondary', 'tertiary', 'background', 'ghost'].includes(properties.typeButton)) {
          errors.push(`Tipo de botón '${properties.typeButton}' no válido`);
        }
        if (properties.sizeButton && !['default', 'small', 'puffy'].includes(properties.sizeButton)) {
          errors.push(`Tamaño de botón '${properties.sizeButton}' no válido`);
        }
        break;

      case 'bc-alert':
        if (properties.type && !['error', 'success', 'info', 'warning', 'inactive'].includes(properties.type)) {
          errors.push(`Tipo de alerta '${properties.type}' no válido`);
        }
        break;

      case 'bc-input':
        if (properties.type && !['text', 'password', 'email', 'number', 'tel'].includes(properties.type)) {
          errors.push(`Tipo de input '${properties.type}' no válido`);
        }
        break;

      case 'bc-input-select':
        if (!properties.options || !Array.isArray(properties.options)) {
          errors.push('Propiedad options debe ser un array');
        } else if (properties.options.length === 0) {
          warnings.push('Lista de opciones está vacía');
        }
        break;

      case 'bc-tabs-group':
        if (!properties.tabs || !Array.isArray(properties.tabs)) {
          errors.push('Propiedad tabs debe ser un array');
        } else if (properties.tabs.length === 0) {
          errors.push('Debe tener al menos una pestaña');
        }
        break;

      case 'bc-breadcrumb':
        if (!properties.items || !Array.isArray(properties.items)) {
          errors.push('Propiedad items debe ser un array');
        } else if (properties.items.length === 0) {
          errors.push('Debe tener al menos un elemento');
        }
        break;
    }
  }

  /**
   * Calcula la confianza del prompt basado en claridad y especificidad
   */
  calculatePromptConfidence(prompt, detectedComponents) {
    let confidence = 0.5; // Base

    // Bonus por componentes detectados
    if (detectedComponents.length > 0) {
      confidence += 0.3;
    }

    // Bonus por especificidad
    const specificityKeywords = ['primario', 'secundario', 'éxito', 'error', 'grande', 'pequeño', 'obligatorio', 'deshabilitado'];
    const specificityCount = specificityKeywords.filter(keyword => prompt.includes(keyword)).length;
    confidence += Math.min(specificityCount * 0.05, 0.2);

    // Penalty por ambigüedad
    const ambiguousWords = ['cosa', 'elemento', 'algo', 'componente genérico'];
    const ambiguityCount = ambiguousWords.filter(word => prompt.includes(word)).length;
    confidence -= ambiguityCount * 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Obtiene sugerencias para componentes no válidos
   */
  getSuggestions(invalidComponent) {
    const suggestions = [];
    
    // Buscar componentes similares
    for (const validComponent of this.validComponents) {
      if (this.calculateStringSimilarity(invalidComponent, validComponent) > 0.6) {
        suggestions.push(validComponent);
      }
    }

    // Si no hay sugerencias similares, dar sugerencias generales
    if (suggestions.length === 0) {
      suggestions.push(...Array.from(this.validComponents).slice(0, 3));
    }

    return suggestions;
  }

  /**
   * Calcula similitud entre strings
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcula distancia de Levenshtein
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Obtiene estadísticas del validador
   */
  getStats() {
    return {
      validComponentsCount: this.validComponents.size,
      aliasesCount: Object.keys(this.componentAliases).length,
      validationRulesCount: Object.keys(this.validationRules).length,
      validComponents: Array.from(this.validComponents),
      supportedAliases: Object.keys(this.componentAliases)
    };
  }
}

module.exports = ComponentValidatorService; 