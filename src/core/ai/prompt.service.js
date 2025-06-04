/**
 * Servicio de Análisis de Prompts
 * Interpreta solicitudes en lenguaje natural y las convierte en parámetros de componentes
 */

const ComponentValidatorService = require('../validation/component-validator.service');

class PromptService {
  constructor() {
    this.patterns = this.initializePatterns();
    this.synonyms = this.initializeSynonyms();
    this.validator = new ComponentValidatorService();
  }

  /**
   * Inicializa patrones de reconocimiento para componentes
   */
  initializePatterns() {
    return {
      // Patrones para botones
      button: {
        triggers: ['botón', 'button', 'btn', 'boton'],
        types: {
          primary: ['primario', 'principal', 'primary', 'main'],
          secondary: ['secundario', 'secondary', 'segundo'],
          tertiary: ['terciario', 'tertiary', 'tercero'],
          background: ['fondo', 'background', 'bg'],
          ghost: ['fantasma', 'ghost', 'transparente']
        },
        sizes: {
          default: ['normal', 'default', 'medio', 'estándar'],
          small: ['pequeño', 'small', 'chico', 'mini'],
          puffy: ['grande', 'puffy', 'gordo', 'inflado']
        },
        widths: {
          fill: ['completo', 'fill', 'ancho', 'full', 'todo el ancho'],
          hug: ['ajustado', 'hug', 'contenido', 'auto']
        }
      },

      // Patrones para alertas
      alert: {
        triggers: ['alerta', 'alert', 'mensaje', 'notificación', 'aviso'],
        types: {
          error: ['error', 'fallo', 'problema', 'incorrecto'],
          success: ['éxito', 'success', 'correcto', 'exitoso', 'bien'],
          info: ['información', 'info', 'informativo', 'datos'],
          warning: ['advertencia', 'warning', 'cuidado', 'atención'],
          inactive: ['inactivo', 'inactive', 'deshabilitado']
        },
        modes: {
          inline: ['inline', 'en línea', 'insertado', 'dentro'],
          popup: ['popup', 'flotante', 'modal', 'encima']
        }
      },

      // Patrones para inputs
      input: {
        triggers: ['input', 'campo', 'entrada', 'formulario', 'campo de texto', 'caja de texto'],
        types: {
          text: ['texto', 'text', 'normal'],
          password: ['contraseña', 'password', 'clave', 'pass'],
          email: ['email', 'correo', 'correo electrónico', 'e-mail'],
          number: ['número', 'number', 'numérico', 'cifra'],
          tel: ['teléfono', 'tel', 'phone', 'celular']
        },
        states: {
          required: ['obligatorio', 'required', 'requerido', 'necesario'],
          disabled: ['deshabilitado', 'disabled', 'inactivo'],
          readonly: ['solo lectura', 'readonly', 'no editable']
        }
      },

      // Patrones para cards
      card: {
        triggers: ['tarjeta', 'card', 'contenedor', 'panel', 'caja'],
        types: {
          default: ['básica', 'simple', 'normal', 'default'],
          image: ['imagen', 'image', 'con imagen', 'foto'],
          rounded: ['redondeada', 'rounded', 'bordes redondeados'],
          'rounded-header': ['redondeada con header', 'rounded-header', 'header redondeado'],
          'rounded-horizontal': ['redondeada horizontal', 'rounded-horizontal'],
          'rounded-header-horizontal': ['redondeada header horizontal', 'rounded-header-horizontal'],
          horizontal: ['horizontal', 'lado a lado', 'en fila'],
          'header-horizontal': ['header horizontal', 'header-horizontal'],
          header: ['con header', 'header', 'encabezado', 'título arriba']
        },
        backgroundColors: {
          default: ['normal', 'default', 'blanco', 'estándar'],
          warning: ['advertencia', 'warning', 'amarillo', 'cuidado', 'atención'],
          info: ['información', 'info', 'azul', 'informativo'],
          error: ['error', 'rojo', 'fallo', 'problema', 'incorrecto'],
          success: ['éxito', 'success', 'verde', 'correcto', 'exitoso', 'bien']
        },
        states: {
          clickable: ['clickeable', 'clickable', 'interactiva', 'presionable'],
          disabled: ['deshabilitada', 'disabled', 'inactiva']
        }
      },

      // Patrones para modals
      modal: {
        triggers: ['modal', 'ventana modal', 'popup', 'diálogo', 'ventana emergente', 'overlay'],
        sizes: {
          small: ['pequeño', 'small', 'chico'],
          medium: ['mediano', 'medium', 'normal'],
          large: ['grande', 'large', 'amplio'],
          fullscreen: ['pantalla completa', 'fullscreen', 'completo']
        },
        types: {
          info: ['información', 'info', 'informativo'],
          warning: ['advertencia', 'warning', 'cuidado'],
          error: ['error', 'fallo', 'problema'],
          success: ['éxito', 'success', 'correcto'],
          confirmation: ['confirmación', 'confirmation', 'confirmar']
        }
      },

      // Patrones para checkbox
      checkbox: {
        triggers: ['checkbox', 'casilla', 'casilla de verificación', 'check', 'marcar', 'seleccionar'],
        states: {
          checked: ['marcado', 'checked', 'seleccionado', 'activado'],
          required: ['obligatorio', 'required', 'requerido'],
          disabled: ['deshabilitado', 'disabled', 'inactivo'],
          indeterminate: ['indeterminado', 'indeterminate', 'parcial']
        },
        common: {
          terms: ['términos', 'condiciones', 'acepto', 'políticas'],
          notifications: ['notificaciones', 'avisos', 'alertas'],
          privacy: ['privacidad', 'datos', 'información personal']
        }
      },

      // Patrones para radio buttons
      radio: {
        triggers: ['radio', 'radio button', 'opción única', 'selección única', 'botón de radio', 'grupo de opciones', 'seleccionar uno', 'opción exclusiva'],
        states: {
          checked: ['marcado', 'checked', 'seleccionado', 'activado'],
          enabled: ['habilitado', 'enabled', 'activo'],
          disabled: ['deshabilitado', 'disabled', 'inactivo']
        },
        common: {
          gender: ['género', 'sexo', 'masculino', 'femenino'],
          payment: ['pago', 'método de pago', 'tarjeta', 'efectivo'],
          options: ['opción', 'alternativa', 'elección']
        }
      },

      // Patrones para input-select
      inputSelect: {
        triggers: ['select', 'dropdown', 'lista desplegable', 'seleccionar opción', 'menú desplegable', 'campo de selección', 'opciones', 'elegir'],
        types: {
          single: ['único', 'single', 'una opción'],
          multiple: ['múltiple', 'multiple', 'varias opciones', 'selección múltiple']
        },
        states: {
          enabled: ['habilitado', 'enabled', 'activo'],
          disabled: ['deshabilitado', 'disabled', 'inactivo'],
          error: ['error', 'incorrecto', 'inválido']
        },
        features: {
          filter: ['filtrar', 'filter', 'buscar', 'filtrable'],
          icons: ['iconos', 'icons', 'con iconos']
        }
      },

      // Patrones para accordion
      accordion: {
        triggers: ['acordeón', 'accordion', 'expandir', 'colapsar', 'mostrar ocultar', 'desplegable', 'contenido expandible', 'sección colapsable', 'panel expandible'],
        types: {
          basic: ['básico', 'basic', 'simple'],
          info: ['información', 'info', 'informativo'],
          advance: ['avanzado', 'advance', 'completo'],
          column: ['columna', 'column', 'columnas'],
          minimal: ['mínimo', 'minimal', 'simple'],
          'minimal-unbordered': ['mínimo sin borde', 'minimal-unbordered', 'sin bordes']
        },
        states: {
          active: ['activo', 'active', 'expandido', 'abierto'],
          disabled: ['deshabilitado', 'disabled', 'inactivo'],
          single: ['único', 'single', 'uno a la vez']
        }
      },

      // Patrones para tabs-group
      tabsGroup: {
        triggers: ['pestañas', 'tabs', 'tabulador', 'navegación por pestañas', 'contenido tabulado', 'secciones', 'organizar contenido', 'tabs group'],
        orientations: {
          horizontal: ['horizontal', 'en fila', 'lado a lado'],
          vertical: ['vertical', 'en columna', 'arriba abajo']
        },
        themes: {
          light: ['claro', 'light', 'blanco'],
          dark: ['oscuro', 'dark', 'negro']
        },
        features: {
          icons: ['iconos', 'icons', 'con iconos'],
          animation: ['animación', 'animation', 'animado']
        }
      },

      // Patrones para breadcrumb
      breadcrumb: {
        triggers: ['breadcrumb', 'navegación', 'ruta de navegación', 'migas de pan', 'path', 'ubicación', 'navegación jerárquica', 'ruta actual'],
        features: {
          home: ['inicio', 'home', 'casa'],
          separator: ['separador', 'separator', 'divisor'],
          maxItems: ['límite', 'máximo', 'max', 'limitado']
        },
        separators: {
          slash: ['/', 'barra', 'slash'],
          arrow: ['>', 'flecha', 'arrow'],
          dot: ['.', 'punto', 'dot']
        }
      },

      // Patrones para acciones
      actions: {
        show: ['mostrar', 'show', 'enseñar', 'display'],
        hide: ['ocultar', 'hide', 'esconder'],
        click: ['click', 'clic', 'presionar', 'tocar'],
        close: ['cerrar', 'close', 'dismiss'],
        open: ['abrir', 'open', 'mostrar'],
        submit: ['enviar', 'submit', 'guardar', 'confirmar']
      },

      // Patrones para interacciones
      interactions: {
        'que muestre': 'show',
        'que abra': 'open',
        'que cierre': 'close',
        'al hacer clic': 'click',
        'cuando se presione': 'click',
        'al enviar': 'submit'
      }
    };
  }

  /**
   * Inicializa sinónimos y variaciones
   */
  initializeSynonyms() {
    return {
      colors: {
        'azul': 'primary',
        'verde': 'success',
        'rojo': 'error',
        'amarillo': 'warning',
        'gris': 'inactive'
      },
      actions: {
        'aceptar': 'Aceptar',
        'cancelar': 'Cancelar',
        'continuar': 'Continuar',
        'guardar': 'Guardar',
        'enviar': 'Enviar',
        'confirmar': 'Confirmar',
        'cerrar': 'Cerrar',
        'abrir': 'Abrir',
        'ver más': 'Ver más',
        'detalles': 'Ver detalles'
      },
      placeholders: {
        'nombre': 'Ingresa tu nombre',
        'email': 'ejemplo@bancolombia.com.co',
        'contraseña': 'Ingresa tu contraseña',
        'teléfono': 'Número de teléfono',
        'documento': 'Número de documento'
      }
    };
  }

  /**
   * Analiza un prompt y extrae información de componentes
   * MEJORADO: Incluye validación de componentes válidos
   */
  analyzePrompt(prompt) {
    console.log(`🧠 Analizando prompt: "${prompt}"`);
    
    // 1. Validación inicial del prompt
    const promptValidation = this.validator.validatePrompt(prompt);
    
    if (!promptValidation.isValid) {
      console.log(`⚠️ Prompt contiene componentes no válidos`);
      return {
        success: false,
        confidence: 0.1,
        error: 'Componentes solicitados no están disponibles en la librería',
        suggestions: this.generateValidSuggestions(prompt),
        validation: promptValidation
      };
    }

    // 2. Detectar componentes usando el validador mejorado
    const detectedComponents = promptValidation.detectedComponents;
    
    if (detectedComponents.length === 0) {
      console.log(`⚠️ No se detectaron componentes válidos en el prompt`);
      return {
        success: false,
        confidence: 0.2,
        error: 'No se pudo identificar qué componente necesitas',
        suggestions: this.generateGenericSuggestions(),
        validation: promptValidation
      };
    }

    // 3. Analizar cada componente detectado
    const analyzedComponents = [];
    
    for (const componentType of detectedComponents) {
      const componentAnalysis = this.analyzeSpecificComponent(componentType, prompt);
      
      // Validar propiedades del componente
      const propertyValidation = this.validator.validateComponentProperties(
        componentType, 
        componentAnalysis.properties
      );
      
      if (propertyValidation.isValid) {
        analyzedComponents.push({
          ...componentAnalysis,
          validation: propertyValidation
        });
      } else {
        console.log(`⚠️ Propiedades inválidas para ${componentType}:`, propertyValidation.errors);
        // Intentar corrección automática
        const correctedComponent = this.autoCorrectProperties(componentType, componentAnalysis.properties);
        analyzedComponents.push({
          ...componentAnalysis,
          properties: correctedComponent.properties,
          validation: correctedComponent.validation,
          corrected: true
        });
      }
    }

    // 4. Calcular confianza mejorada
    const confidence = this.calculateEnhancedConfidence(prompt, analyzedComponents, promptValidation);
    
    console.log(`📊 Análisis completado - Confianza: ${(confidence * 100).toFixed(1)}%`);
    
    return {
      success: true,
      prompt: prompt,
      components: analyzedComponents,
      interactions: this.detectInteractions(prompt),
      confidence: confidence,
      validation: promptValidation
    };
  }

  /**
   * Analiza un componente específico basado en su tipo
   */
  analyzeSpecificComponent(componentType, prompt) {
    switch (componentType) {
      case 'bc-button':
        return this.analyzeButton(prompt);
      case 'bc-alert':
        return this.analyzeAlert(prompt);
      case 'bc-input':
        return this.analyzeInput(prompt);
      case 'bc-card':
        return this.analyzeCard(prompt);
      case 'bc-modal':
        return this.analyzeModal(prompt);
      case 'bc-checkbox':
        return this.analyzeCheckbox(prompt);
      case 'bc-radio':
        return this.analyzeRadio(prompt);
      case 'bc-input-select':
        return this.analyzeInputSelect(prompt);
      case 'bc-accordion':
        return this.analyzeAccordion(prompt);
      case 'bc-tabs-group':
        return this.analyzeTabsGroup(prompt);
      case 'bc-breadcrumb':
        return this.analyzeBreadcrumb(prompt);
      default:
        throw new Error(`Componente no soportado: ${componentType}`);
    }
  }

  /**
   * Corrige automáticamente propiedades inválidas
   */
  autoCorrectProperties(componentType, properties) {
    const correctedProperties = { ...properties };
    const rules = this.validator.validationRules[componentType];
    
    if (!rules) {
      return { properties: correctedProperties, validation: { isValid: true, errors: [], warnings: [] } };
    }

    // Aplicar valores por defecto para propiedades requeridas faltantes
    if (rules.requiredProperties) {
      for (const requiredProp of rules.requiredProperties) {
        if (!correctedProperties.hasOwnProperty(requiredProp)) {
          correctedProperties[requiredProp] = this.getDefaultValue(componentType, requiredProp);
        }
      }
    }

    // Corregir tipos inválidos
    if (rules.validTypes && correctedProperties.type && !rules.validTypes.includes(correctedProperties.type)) {
      correctedProperties.type = rules.validTypes[0]; // Usar el primer tipo válido
    }

    // Corregir tamaños inválidos
    if (rules.validSizes && correctedProperties.size && !rules.validSizes.includes(correctedProperties.size)) {
      correctedProperties.size = rules.validSizes[0]; // Usar el primer tamaño válido
    }

    // Validar propiedades corregidas
    const validation = this.validator.validateComponentProperties(componentType, correctedProperties);
    
    return { properties: correctedProperties, validation };
  }

  /**
   * Obtiene valor por defecto para una propiedad
   */
  getDefaultValue(componentType, propertyName) {
    const defaults = {
      'bc-button': {
        'typeButton': 'primary',
        'sizeButton': 'default',
        'widthButton': 'hug',
        'text': 'Botón'
      },
      'bc-alert': {
        'type': 'info',
        'text': 'Mensaje de alerta',
        'title': 'Información'
      },
      'bc-input': {
        'type': 'text',
        'label': 'Campo de entrada',
        'placeholder': 'Ingrese texto'
      },
      'bc-card': {
        'type': 'default',
        'title': 'Título de tarjeta',
        'content': 'Contenido de la tarjeta'
      },
      'bc-modal': {
        'size': 'medium',
        'title': 'Modal',
        'content': 'Contenido del modal'
      },
      'bc-checkbox': {
        'label': 'Opción de selección'
      },
      'bc-radio': {
        'label': 'Opción única',
        'name': 'radioGroup'
      },
      'bc-input-select': {
        'options': ['Opción 1', 'Opción 2', 'Opción 3'],
        'placeholder': 'Seleccione una opción'
      },
      'bc-accordion': {
        'title': 'Título del acordeón',
        'content': 'Contenido expandible'
      },
      'bc-tabs-group': {
        'tabs': [
          { label: 'Pestaña 1', content: 'Contenido 1' },
          { label: 'Pestaña 2', content: 'Contenido 2' }
        ]
      },
      'bc-breadcrumb': {
        'items': [
          { label: 'Inicio', url: '/' },
          { label: 'Sección', url: '/seccion' },
          { label: 'Página actual' }
        ]
      }
    };

    return defaults[componentType]?.[propertyName] || '';
  }

  /**
   * Calcula confianza mejorada considerando validación
   */
  calculateEnhancedConfidence(prompt, components, validation) {
    let baseConfidence = validation.confidence || 0.5;
    
    // Bonus por componentes válidos detectados
    if (components.length > 0) {
      baseConfidence += 0.2;
    }

    // Bonus por propiedades válidas
    const validComponents = components.filter(c => c.validation.isValid);
    const validityRatio = validComponents.length / components.length;
    baseConfidence += validityRatio * 0.2;

    // Bonus por especificidad del prompt
    const specificityScore = this.calculateSpecificityScore(prompt);
    baseConfidence += specificityScore * 0.1;

    // Penalty por correcciones automáticas
    const correctedComponents = components.filter(c => c.corrected);
    if (correctedComponents.length > 0) {
      baseConfidence -= (correctedComponents.length / components.length) * 0.1;
    }

    return Math.max(0.1, Math.min(1.0, baseConfidence));
  }

  /**
   * Calcula puntuación de especificidad del prompt
   */
  calculateSpecificityScore(prompt) {
    const specificKeywords = [
      'primario', 'secundario', 'terciario',
      'éxito', 'error', 'advertencia', 'información',
      'grande', 'pequeño', 'mediano',
      'obligatorio', 'requerido', 'opcional',
      'deshabilitado', 'activo', 'inactivo',
      'horizontal', 'vertical',
      'con imagen', 'sin imagen',
      'expandible', 'colapsable'
    ];

    const foundKeywords = specificKeywords.filter(keyword => 
      prompt.toLowerCase().includes(keyword)
    );

    return Math.min(foundKeywords.length / 5, 1.0); // Máximo 1.0
  }

  /**
   * Genera sugerencias válidas basadas en el prompt
   */
  generateValidSuggestions(prompt) {
    const suggestions = [];
    const validComponents = Array.from(this.validator.validComponents);
    
    // Sugerencias basadas en palabras clave del prompt
    const promptWords = prompt.toLowerCase().split(/\s+/);
    
    for (const component of validComponents) {
      const componentWords = component.replace('bc-', '').split('-');
      const hasMatch = componentWords.some(word => 
        promptWords.some(promptWord => promptWord.includes(word) || word.includes(promptWord))
      );
      
      if (hasMatch) {
        suggestions.push({
          component,
          reason: `Detectamos que podrías necesitar un ${component.replace('bc-', '')}`
        });
      }
    }

    // Si no hay coincidencias, dar sugerencias generales
    if (suggestions.length === 0) {
      suggestions.push(
        { component: 'bc-button', reason: 'Para acciones e interacciones' },
        { component: 'bc-input', reason: 'Para capturar información del usuario' },
        { component: 'bc-card', reason: 'Para mostrar contenido organizado' }
      );
    }

    return suggestions.slice(0, 3); // Máximo 3 sugerencias
  }

  /**
   * Genera sugerencias genéricas cuando no se detecta nada
   */
  generateGenericSuggestions() {
    return [
      {
        component: 'bc-button',
        example: 'botón primario que diga "Guardar"',
        reason: 'Para crear botones de acción'
      },
      {
        component: 'bc-alert',
        example: 'alerta de éxito con mensaje',
        reason: 'Para mostrar notificaciones'
      },
      {
        component: 'bc-input',
        example: 'campo de texto para email',
        reason: 'Para formularios y entrada de datos'
      },
      {
        component: 'bc-card',
        example: 'tarjeta con información de usuario',
        reason: 'Para mostrar contenido estructurado'
      }
    ];
  }

  /**
   * Analiza parámetros específicos de botón
   */
  analyzeButton(prompt) {
    const button = {
      type: 'bc-button',
      template: 'bc-button',
      properties: {
        typeButton: 'primary',
        sizeButton: 'default',
        buttonText: 'Botón'
      },
      confidence: 0.8
    };

    // Detectar tipo de botón
    for (const [type, keywords] of Object.entries(this.patterns.button.types)) {
      if (this.containsAny(prompt, keywords)) {
        button.properties.typeButton = type;
        button.confidence += 0.1;
        break;
      }
    }

    // Detectar tamaño
    for (const [size, keywords] of Object.entries(this.patterns.button.sizes)) {
      if (this.containsAny(prompt, keywords)) {
        button.properties.sizeButton = size;
        button.confidence += 0.05;
        break;
      }
    }

    // Detectar ancho
    for (const [width, keywords] of Object.entries(this.patterns.button.widths)) {
      if (this.containsAny(prompt, keywords)) {
        button.properties.width = width;
        button.confidence += 0.05;
        break;
      }
    }

    // Detectar texto del botón
    const buttonText = this.extractButtonText(prompt);
    if (buttonText) {
      button.properties.buttonText = buttonText;
      button.confidence += 0.1;
    }

    return button;
  }

  /**
   * Analiza parámetros específicos de alerta
   */
  analyzeAlert(prompt) {
    const alert = {
      type: 'bc-alert',
      template: 'bc-alert',
      properties: {
        componentId: `alert-${Date.now()}`,
        type: 'info',
        text: 'Mensaje de información',
        inline: false,
        dismissible: true
      },
      confidence: 0.8
    };

    // Detectar tipo de alerta
    for (const [type, keywords] of Object.entries(this.patterns.alert.types)) {
      if (this.containsAny(prompt, keywords)) {
        alert.properties.type = type;
        alert.confidence += 0.1;
        break;
      }
    }

    // Detectar modo (inline vs popup)
    if (this.containsAny(prompt, this.patterns.alert.modes.inline)) {
      alert.properties.inline = true;
      alert.confidence += 0.05;
    }

    // Detectar si es temporal
    if (this.containsAny(prompt, ['temporal', 'automático', 'auto', 'tiempo'])) {
      alert.properties.timeOut = 5000;
      alert.confidence += 0.05;
    }

    // Extraer texto del mensaje
    const alertText = this.extractAlertText(prompt);
    if (alertText) {
      alert.properties.text = alertText;
      alert.confidence += 0.1;
    }

    return alert;
  }

  /**
   * Analiza parámetros específicos de input
   */
  analyzeInput(prompt) {
    const input = {
      type: 'bc-input',
      template: 'bc-input',
      properties: {
        componentId: `input-${Date.now()}`,
        type: 'text',
        label: 'Campo de texto',
        placeholder: 'Ingresa el texto'
      },
      confidence: 0.8
    };

    // Detectar tipo de input
    for (const [type, keywords] of Object.entries(this.patterns.input.types)) {
      if (this.containsAny(prompt, keywords)) {
        input.properties.type = type;
        input.confidence += 0.1;
        
        // Ajustar placeholder según el tipo
        if (type === 'email') {
          input.properties.placeholder = this.synonyms.placeholders.email;
          input.properties.label = 'Correo electrónico';
        } else if (type === 'password') {
          input.properties.placeholder = this.synonyms.placeholders.contraseña;
          input.properties.label = 'Contraseña';
        }
        break;
      }
    }

    // Detectar estados
    for (const [state, keywords] of Object.entries(this.patterns.input.states)) {
      if (this.containsAny(prompt, keywords)) {
        input.properties[state] = true;
        input.confidence += 0.05;
      }
    }

    // Extraer label
    const label = this.extractInputLabel(prompt);
    if (label) {
      input.properties.label = label;
      input.confidence += 0.1;
    }

    return input;
  }

  /**
   * Analiza parámetros específicos de card
   */
  analyzeCard(prompt) {
    const card = {
      type: 'bc-card',
      template: 'bc-card',
      properties: {
        componentId: `card-${Date.now()}`,
        type: 'default'
      },
      confidence: 0.8
    };

    // Detectar tipo de card
    for (const [type, keywords] of Object.entries(this.patterns.card.types)) {
      if (this.containsAny(prompt, keywords)) {
        card.properties.type = type;
        card.confidence += 0.1;
        break;
      }
    }

    // Detectar color de fondo
    for (const [color, keywords] of Object.entries(this.patterns.card.backgroundColors)) {
      if (this.containsAny(prompt, keywords)) {
        card.properties.backgroundColor = color;
        card.confidence += 0.1;
        break;
      }
    }

    // Extraer contenido
    const content = this.extractCardContent(prompt);
    if (content) {
      card.properties.content = content;
      card.confidence += 0.1;
    }

    return card;
  }

  /**
   * Analiza parámetros específicos de modal
   */
  analyzeModal(prompt) {
    const modal = {
      type: 'bc-modal',
      template: 'bc-modal',
      properties: {
        componentId: `modal-${Date.now()}`,
        size: 'medium',
        type: 'info'
      },
      confidence: 0.8
    };

    // Detectar tamaño
    for (const [size, keywords] of Object.entries(this.patterns.modal.sizes)) {
      if (this.containsAny(prompt, keywords)) {
        modal.properties.size = size;
        modal.confidence += 0.05;
        break;
      }
    }

    // Detectar tipo
    for (const [type, keywords] of Object.entries(this.patterns.modal.types)) {
      if (this.containsAny(prompt, keywords)) {
        modal.properties.type = type;
        modal.confidence += 0.1;
        break;
      }
    }

    // Extraer título y contenido
    const title = this.extractModalTitle(prompt);
    if (title) {
      modal.properties.title = title;
      modal.confidence += 0.1;
    }

    const content = this.extractModalContent(prompt);
    if (content) {
      modal.properties.content = content;
      modal.confidence += 0.1;
    }

    return modal;
  }

  /**
   * Analiza parámetros específicos de checkbox
   */
  analyzeCheckbox(prompt) {
    const checkbox = {
      type: 'bc-checkbox',
      template: 'bc-checkbox',
      properties: {
        componentId: `checkbox-${Date.now()}`,
        checked: false
      },
      confidence: 0.8
    };

    // Detectar estados
    for (const [state, keywords] of Object.entries(this.patterns.checkbox.states)) {
      if (this.containsAny(prompt, keywords)) {
        checkbox.properties[state] = true;
        checkbox.confidence += 0.05;
      }
    }

    // Detectar tipos comunes
    if (this.containsAny(prompt, this.patterns.checkbox.common.terms)) {
      checkbox.properties.label = 'Acepto los términos y condiciones';
      checkbox.confidence += 0.1;
    } else if (this.containsAny(prompt, this.patterns.checkbox.common.notifications)) {
      checkbox.properties.label = 'Recibir notificaciones';
      checkbox.confidence += 0.1;
    } else if (this.containsAny(prompt, this.patterns.checkbox.common.privacy)) {
      checkbox.properties.label = 'Acepto las políticas de privacidad';
      checkbox.confidence += 0.1;
    }

    // Extraer label personalizado
    const label = this.extractCheckboxLabel(prompt);
    if (label) {
      checkbox.properties.label = label;
      checkbox.confidence += 0.1;
    }

    return checkbox;
  }

  /**
   * Analiza parámetros específicos de radio button
   */
  analyzeRadio(prompt) {
    const radio = {
      type: 'bc-radio',
      template: 'bc-radio',
      properties: {
        componentId: `radio-${Date.now()}`,
        name: 'radioGroup',
        value: '1',
        label: 'Opción',
        enabled: true,
        checked: false,
        changeHandler: 'onRadioChange'
      },
      confidence: 0.8
    };

    // Detectar estado
    for (const [state, keywords] of Object.entries(this.patterns.radio.states)) {
      if (this.containsAny(prompt, keywords)) {
        if (state === 'checked') {
          radio.properties.checked = true;
        } else if (state === 'disabled') {
          radio.properties.enabled = false;
        }
        radio.confidence += 0.1;
      }
    }

    // Detectar contexto común
    for (const [context, keywords] of Object.entries(this.patterns.radio.common)) {
      if (this.containsAny(prompt, keywords)) {
        radio.properties.name = context;
        radio.confidence += 0.05;
      }
    }

    // Extraer label
    const label = this.extractRadioLabel(prompt);
    if (label) {
      radio.properties.label = label;
      radio.confidence += 0.1;
    }

    return radio;
  }

  /**
   * Analiza parámetros específicos de input-select
   */
  analyzeInputSelect(prompt) {
    const inputSelect = {
      type: 'bc-input-select',
      template: 'bc-input-select',
      properties: {
        componentId: `select-${Date.now()}`,
        placeholder: 'Selecciona una opción',
        values: [
          { text: 'Opción 1', value: '1' },
          { text: 'Opción 2', value: '2' }
        ],
        valuesArray: 'selectOptions',
        status: 'enabled',
        multiple: false,
        filter: false,
        iconLeft: false,
        changeHandler: 'onSelectChange'
      },
      confidence: 0.8
    };

    // Detectar tipo
    for (const [type, keywords] of Object.entries(this.patterns.inputSelect.types)) {
      if (this.containsAny(prompt, keywords)) {
        if (type === 'multiple') {
          inputSelect.properties.multiple = true;
        }
        inputSelect.confidence += 0.1;
      }
    }

    // Detectar estado
    for (const [state, keywords] of Object.entries(this.patterns.inputSelect.states)) {
      if (this.containsAny(prompt, keywords)) {
        inputSelect.properties.status = state;
        inputSelect.confidence += 0.05;
      }
    }

    // Detectar características
    for (const [feature, keywords] of Object.entries(this.patterns.inputSelect.features)) {
      if (this.containsAny(prompt, keywords)) {
        if (feature === 'filter') {
          inputSelect.properties.filter = true;
        } else if (feature === 'icons') {
          inputSelect.properties.iconLeft = true;
        }
        inputSelect.confidence += 0.05;
      }
    }

    // Extraer placeholder
    const placeholder = this.extractSelectPlaceholder(prompt);
    if (placeholder) {
      inputSelect.properties.placeholder = placeholder;
      inputSelect.confidence += 0.1;
    }

    return inputSelect;
  }

  /**
   * Analiza parámetros específicos de accordion
   */
  analyzeAccordion(prompt) {
    const accordion = {
      type: 'bc-accordion',
      template: 'bc-accordion',
      properties: {
        componentId: `accordion-${Date.now()}`,
        type: 'basic',
        title: 'Título del Acordeón',
        content: 'Contenido del acordeón',
        active: false,
        disabled: false,
        single: false,
        selectHandler: 'onAccordionSelect'
      },
      confidence: 0.8
    };

    // Detectar tipo
    for (const [type, keywords] of Object.entries(this.patterns.accordion.types)) {
      if (this.containsAny(prompt, keywords)) {
        accordion.properties.type = type;
        accordion.confidence += 0.1;
        break;
      }
    }

    // Detectar estado
    for (const [state, keywords] of Object.entries(this.patterns.accordion.states)) {
      if (this.containsAny(prompt, keywords)) {
        if (state === 'active') {
          accordion.properties.active = true;
        } else if (state === 'disabled') {
          accordion.properties.disabled = true;
        } else if (state === 'single') {
          accordion.properties.single = true;
        }
        accordion.confidence += 0.05;
      }
    }

    // Extraer título
    const title = this.extractAccordionTitle(prompt);
    if (title) {
      accordion.properties.title = title;
      accordion.confidence += 0.1;
    }

    // Extraer contenido
    const content = this.extractAccordionContent(prompt);
    if (content) {
      accordion.properties.content = content;
      accordion.confidence += 0.05;
    }

    return accordion;
  }

  /**
   * Analiza parámetros específicos de tabs-group
   */
  analyzeTabsGroup(prompt) {
    const tabsGroup = {
      type: 'bc-tabs-group',
      template: 'bc-tabs-group',
      properties: {
        componentId: `tabs-${Date.now()}`,
        typeTheme: 'light',
        orientation: 'horizontal',
        selectedIndex: 0,
        tabs: [
          { label: 'Pestaña 1', content: 'Contenido de la primera pestaña' },
          { label: 'Pestaña 2', content: 'Contenido de la segunda pestaña' }
        ],
        animation: false,
        hiddenArrows: false,
        changeHandler: 'onTabChange'
      },
      confidence: 0.8
    };

    // Detectar orientación
    for (const [orientation, keywords] of Object.entries(this.patterns.tabsGroup.orientations)) {
      if (this.containsAny(prompt, keywords)) {
        tabsGroup.properties.orientation = orientation;
        tabsGroup.confidence += 0.1;
        break;
      }
    }

    // Detectar tema
    for (const [theme, keywords] of Object.entries(this.patterns.tabsGroup.themes)) {
      if (this.containsAny(prompt, keywords)) {
        tabsGroup.properties.typeTheme = theme;
        tabsGroup.confidence += 0.05;
        break;
      }
    }

    // Detectar características
    for (const [feature, keywords] of Object.entries(this.patterns.tabsGroup.features)) {
      if (this.containsAny(prompt, keywords)) {
        if (feature === 'animation') {
          tabsGroup.properties.animation = true;
        } else if (feature === 'icons') {
          // Agregar iconos a las pestañas
          tabsGroup.properties.tabs = [
            { label: 'Inicio', content: 'Contenido de inicio', icon: 'home' },
            { label: 'Configuración', content: 'Panel de configuración', icon: 'settings' }
          ];
        }
        tabsGroup.confidence += 0.05;
      }
    }

    return tabsGroup;
  }

  /**
   * Analiza parámetros específicos de breadcrumb
   */
  analyzeBreadcrumb(prompt) {
    const breadcrumb = {
      type: 'bc-breadcrumb',
      template: 'bc-breadcrumb',
      properties: {
        componentId: `breadcrumb-${Date.now()}`,
        items: [
          { label: 'Inicio', url: '/' },
          { label: 'Productos', url: '/productos' },
          { label: 'Actual', active: true }
        ],
        itemsArray: 'breadcrumbItems',
        separator: '/',
        showHome: true,
        clickHandler: 'onBreadcrumbClick'
      },
      confidence: 0.8
    };

    // Detectar separador
    for (const [sep, keywords] of Object.entries(this.patterns.breadcrumb.separators)) {
      if (this.containsAny(prompt, keywords)) {
        breadcrumb.properties.separator = sep;
        breadcrumb.confidence += 0.05;
        break;
      }
    }

    // Detectar características
    for (const [feature, keywords] of Object.entries(this.patterns.breadcrumb.features)) {
      if (this.containsAny(prompt, keywords)) {
        if (feature === 'home') {
          breadcrumb.properties.showHome = true;
        } else if (feature === 'maxItems') {
          breadcrumb.properties.maxItems = 3;
        }
        breadcrumb.confidence += 0.05;
      }
    }

    return breadcrumb;
  }

  /**
   * Detecta interacciones entre componentes
   */
  detectInteractions(prompt) {
    const interactions = [];

    // Buscar patrones de interacción
    for (const [pattern, action] of Object.entries(this.patterns.interactions)) {
      if (prompt.includes(pattern)) {
        interactions.push({
          trigger: 'click',
          action: action,
          pattern: pattern,
          confidence: 0.9
        });
      }
    }

    return interactions;
  }

  /**
   * Extrae el texto del botón del prompt
   */
  extractButtonText(prompt) {
    // Patrones para extraer texto de botón
    const patterns = [
      /botón (?:de |que diga |con texto |"([^"]+)"|'([^']+)'|([a-záéíóúñ]+))/i,
      /botón "([^"]+)"/i,
      /botón '([^']+)'/i,
      /botón ([a-záéíóúñ]+)/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2] || match[3];
        if (text && text.length > 0) {
          return this.capitalizeFirst(text);
        }
      }
    }

    // Buscar acciones comunes
    for (const [key, value] of Object.entries(this.synonyms.actions)) {
      if (prompt.includes(key)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Extrae el texto de la alerta del prompt
   */
  extractAlertText(prompt) {
    // Patrones para extraer texto de alerta
    const patterns = [
      /(?:alerta|mensaje) (?:que diga |con texto |"([^"]+)"|'([^']+)')/i,
      /(?:alerta|mensaje) "([^"]+)"/i,
      /(?:alerta|mensaje) '([^']+)'/i,
      /"([^"]+)"/i,
      /'([^']+)'/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2];
        if (text && text.length > 0) {
          return this.capitalizeFirst(text);
        }
      }
    }

    return null;
  }

  /**
   * Extrae el label del input del prompt
   */
  extractInputLabel(prompt) {
    const patterns = [
      /(?:campo|input) (?:de |para |"([^"]+)"|'([^']+)'|([a-záéíóúñ\s]+))/i,
      /(?:campo|input) "([^"]+)"/i,
      /(?:campo|input) '([^']+)'/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2] || match[3];
        if (text && text.length > 0 && !this.patterns.input.types[text.toLowerCase()]) {
          return this.capitalizeFirst(text);
        }
      }
    }

    return null;
  }

  /**
   * Extrae el título de la card del prompt
   */
  extractCardTitle(prompt) {
    const patterns = [
      /(?:tarjeta|card) (?:de |con título |"([^"]+)"|'([^']+)'|([a-záéíóúñ\s]+))/i,
      /(?:tarjeta|card) "([^"]+)"/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2] || match[3];
        if (text && text.length > 0) {
          return this.capitalizeFirst(text);
        }
      }
    }

    return null;
  }

  /**
   * Extrae el contenido de la card del prompt
   */
  extractCardContent(prompt) {
    const patterns = [
      /(?:con contenido |contenido |"([^"]+)"|'([^']+)')/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2];
        if (text && text.length > 0) {
          return this.capitalizeFirst(text);
        }
      }
    }

    return null;
  }

  /**
   * Extrae el título del modal del prompt
   */
  extractModalTitle(prompt) {
    const patterns = [
      /(?:modal|ventana) (?:de |con título |"([^"]+)"|'([^']+)'|([a-záéíóúñ\s]+))/i,
      /(?:modal|ventana) "([^"]+)"/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2] || match[3];
        if (text && text.length > 0) {
          return this.capitalizeFirst(text);
        }
      }
    }

    return null;
  }

  /**
   * Extrae el contenido del modal del prompt
   */
  extractModalContent(prompt) {
    return this.extractCardContent(prompt);
  }

  /**
   * Extrae el label del checkbox del prompt
   */
  extractCheckboxLabel(prompt) {
    const patterns = [
      /(?:checkbox|casilla) (?:de |para |"([^"]+)"|'([^']+)'|([a-záéíóúñ\s]+))/i,
      /(?:checkbox|casilla) "([^"]+)"/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2] || match[3];
        if (text && text.length > 0) {
          return this.capitalizeFirst(text);
        }
      }
    }

    return null;
  }

  /**
   * Extrae el label del radio button del prompt
   */
  extractRadioLabel(prompt) {
    const patterns = [
      /(?:radio|opción) (?:de |para |"([^"]+)"|'([^']+)'|([a-záéíóúñ\s]+))/i,
      /(?:radio|opción) "([^"]+)"/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2] || match[3];
        if (text && text.length > 0) {
          return this.capitalizeFirst(text);
        }
      }
    }

    return null;
  }

  /**
   * Extrae el placeholder del select del prompt
   */
  extractSelectPlaceholder(prompt) {
    const patterns = [
      /(?:select|dropdown) (?:de |para |"([^"]+)"|'([^']+)'|([a-záéíóúñ\s]+))/i,
      /(?:seleccionar|elegir) (?:de |para |"([^"]+)"|'([^']+)'|([a-záéíóúñ\s]+))/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2] || match[3];
        if (text && text.length > 0) {
          return `Selecciona ${text.toLowerCase()}`;
        }
      }
    }

    return null;
  }

  /**
   * Extrae el título del acordeón del prompt
   */
  extractAccordionTitle(prompt) {
    const patterns = [
      /(?:acordeón|accordion) (?:de |con título |"([^"]+)"|'([^']+)'|([a-záéíóúñ\s]+))/i,
      /(?:acordeón|accordion) "([^"]+)"/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2] || match[3];
        if (text && text.length > 0) {
          return this.capitalizeFirst(text);
        }
      }
    }

    return null;
  }

  /**
   * Extrae el contenido del acordeón del prompt
   */
  extractAccordionContent(prompt) {
    const patterns = [
      /(?:con contenido |contenido |"([^"]+)"|'([^']+)')/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        const text = match[1] || match[2];
        if (text && text.length > 0) {
          return this.capitalizeFirst(text);
        }
      }
    }

    return null;
  }

  /**
   * Verifica si el prompt contiene alguna de las palabras clave
   */
  containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * Capitaliza la primera letra
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Genera sugerencias basadas en el prompt
   */
  generateSuggestions(prompt) {
    const analysis = this.analyzePrompt(prompt);
    const suggestions = [];

    if (analysis.confidence < 0.5) {
      suggestions.push({
        type: 'improvement',
        message: 'Intenta ser más específico. Por ejemplo: "botón primario que diga Aceptar" o "campo de email obligatorio"'
      });
    }

    if (analysis.components.length === 0) {
      suggestions.push({
        type: 'component',
        message: 'No se detectaron componentes. Prueba con: "botón", "alerta", "input", "tarjeta", "modal", "checkbox"'
      });
    }

    // Sugerencias específicas por componente
    analysis.components.forEach(component => {
      if (component.type === 'bc-button' && !component.properties.buttonText) {
        suggestions.push({
          type: 'property',
          message: 'Especifica el texto del botón: "botón que diga Guardar"'
        });
      }
      
      if (component.type === 'bc-input' && !component.properties.label) {
        suggestions.push({
          type: 'property',
          message: 'Especifica el propósito del campo: "campo de nombre" o "input de email"'
        });
      }
    });

    return suggestions;
  }

  /**
   * Obtiene estadísticas del analizador
   */
  getStats() {
    return {
      totalPatterns: this.patterns ? Object.keys(this.patterns).length : 0,
      buttonPatterns: this.patterns?.button?.types ? Object.keys(this.patterns.button.types).length : 0,
      alertPatterns: this.patterns?.alert?.types ? Object.keys(this.patterns.alert.types).length : 0,
      inputPatterns: this.patterns?.input?.types ? Object.keys(this.patterns.input.types).length : 0,
      cardPatterns: this.patterns?.card?.types ? Object.keys(this.patterns.card.types).length : 0,
      modalPatterns: this.patterns?.modal?.types ? Object.keys(this.patterns.modal.types).length : 0,
      checkboxPatterns: this.patterns?.checkbox?.states ? Object.keys(this.patterns.checkbox.states).length : 0,
      synonyms: this.synonyms ? Object.keys(this.synonyms).length : 0
    };
  }
}

module.exports = PromptService; 