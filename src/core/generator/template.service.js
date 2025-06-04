const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

/**
 * Servicio de Templates para Generación de Código
 * Procesa plantillas Handlebars para generar código de componentes Bancolombia
 */
class TemplateService {
  constructor() {
    this.templates = new Map();
    this.templatesPath = path.join(__dirname, '../../data/templates');
    this.registerHelpers();
  }

  /**
   * Registra helpers personalizados de Handlebars
   */
  registerHelpers() {
    // Helper para capitalizar texto
    Handlebars.registerHelper('capitalize', function(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Helper para convertir a JSON
    Handlebars.registerHelper('json', function(obj) {
      return JSON.stringify(obj);
    });

    // Helper para generar IDs únicos
    Handlebars.registerHelper('generateId', function(prefix = 'component') {
      return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    });

    // Helper para formatear booleanos
    Handlebars.registerHelper('boolean', function(value) {
      return value ? 'true' : 'false';
    });

    // Helper condicional para propiedades opcionales
    Handlebars.registerHelper('ifProperty', function(value, options) {
      if (value !== undefined && value !== null && value !== '') {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Helper para generar nombres de métodos
    Handlebars.registerHelper('methodName', function(action, type) {
      return `${action}${this.capitalize(type)}`;
    });

    console.log('✅ Helpers de Handlebars registrados');
  }

  /**
   * Carga todos los templates disponibles
   */
  async loadTemplates() {
    console.log('📂 Cargando templates...');
    
    try {
      if (!fs.existsSync(this.templatesPath)) {
        throw new Error(`Directorio de templates no encontrado: ${this.templatesPath}`);
      }

      const templateFiles = fs.readdirSync(this.templatesPath)
        .filter(file => file.endsWith('.hbs'));

      for (const file of templateFiles) {
        await this.loadTemplate(file);
      }

      console.log(`✅ Templates cargados: ${this.templates.size}`);
      return Array.from(this.templates.keys());

    } catch (error) {
      console.error('❌ Error cargando templates:', error);
      throw error;
    }
  }

  /**
   * Carga un template específico
   */
  async loadTemplate(filename) {
    try {
      const filePath = path.join(this.templatesPath, filename);
      const templateContent = fs.readFileSync(filePath, 'utf8');
      const templateName = path.basename(filename, '.hbs');

      // Compilar template
      const compiledTemplate = Handlebars.compile(templateContent);
      
      this.templates.set(templateName, {
        name: templateName,
        content: templateContent,
        compiled: compiledTemplate,
        path: filePath
      });

      console.log(`📄 Template cargado: ${templateName}`);
      return templateName;

    } catch (error) {
      console.error(`❌ Error cargando template ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Genera código usando un template específico
   */
  generateCode(templateName, data) {
    console.log(`🔧 Generando código con template: ${templateName}`);
    
    if (!this.templates.has(templateName)) {
      throw new Error(`Template no encontrado: ${templateName}`);
    }

    try {
      const template = this.templates.get(templateName);
      
      // Preparar datos con valores por defecto
      const templateData = this.prepareTemplateData(data);
      
      // Generar código
      const generatedCode = template.compiled(templateData);
      
      console.log(`✅ Código generado exitosamente`);
      return {
        template: templateName,
        code: generatedCode,
        data: templateData
      };

    } catch (error) {
      console.error(`❌ Error generando código:`, error);
      throw error;
    }
  }

  /**
   * Prepara los datos para el template con valores por defecto
   */
  prepareTemplateData(data) {
    const defaults = {
      componentId: `component-${Date.now()}`,
      buttonText: 'Botón',
      typeButton: 'primary',
      sizeButton: 'default',
      type: 'info',
      text: 'Mensaje de información',
      inline: false,
      dismissible: true,
      clickHandler: 'onClick',
      closeHandler: 'onClose'
    };

    const mergedData = {
      ...defaults,
      ...data,
      // Asegurar que los booleanos se manejen correctamente
      inline: data.inline === true || data.inline === 'true',
      dismissible: data.dismissible !== false && data.dismissible !== 'false'
    };

    // CORRECCIÓN CRÍTICA: Construir clases CSS para bc-button
    if (data.templateName === 'bc-button' || this.isButtonTemplate(mergedData)) {
      mergedData.cssClasses = this.buildButtonCssClasses(mergedData);
    }

    // CORRECCIÓN CRÍTICA: Preparar datos específicos para bc-alert
    if (data.templateName === 'bc-alert' || this.isAlertTemplate(mergedData)) {
      this.prepareAlertData(mergedData);
    }

    return mergedData;
  }

  /**
   * Determina si es un template de botón
   */
  isButtonTemplate(data) {
    return data.typeButton || data.sizeButton || data.width;
  }

  /**
   * Construye las clases CSS correctas para bc-button
   */
  buildButtonCssClasses(data) {
    const classes = [];
    
    // Clase de tipo (obligatoria)
    if (data.typeButton) {
      classes.push(`bc-button-${data.typeButton}`);
    }
    
    // Clase de tamaño (por defecto: default)
    const size = data.sizeButton || 'default';
    classes.push(`bc-button-${size}`);
    
    // Clase de ancho (opcional)
    if (data.width) {
      classes.push(`bc-button-${data.width}`);
    }
    
    return classes.join(' ');
  }

  /**
   * Determina si es un template de alerta
   */
  isAlertTemplate(data) {
    return data.type && ['error', 'success', 'info', 'warning', 'inactive'].includes(data.type);
  }

  /**
   * Prepara datos específicos para bc-alert
   */
  prepareAlertData(data) {
    // Generar nombre de función específico basado en el contexto
    data.functionName = this.generateAlertFunctionName(data);
    
    // Mejorar el mensaje si es genérico
    if (data.text === 'Mensaje de información' || !data.text || data.text.trim() === '') {
      data.text = this.generateSpecificMessage(data);
    }
    
    // Generar componentId específico si no existe
    if (!data.componentId || data.componentId.startsWith('component-')) {
      data.componentId = this.generateAlertComponentId(data);
    }
  }

  /**
   * Genera nombre de función específico para la alerta
   */
  generateAlertFunctionName(data) {
    // Mapear tipos a acciones específicas
    const actionMap = {
      'success': 'Success',
      'error': 'Error', 
      'warning': 'Warning',
      'info': 'Info'
    };
    
    // Detectar contexto del prompt o datos
    const context = this.detectAlertContext(data);
    
    if (context) {
      return `${context}${actionMap[data.type] || 'Alert'}`;
    }
    
    return actionMap[data.type] || 'Alert';
  }

  /**
   * Detecta el contexto de la alerta basado en el prompt o datos
   */
  detectAlertContext(data) {
    const prompt = (data.originalPrompt || '').toLowerCase();
    const text = (data.text || '').toLowerCase();
    const combined = `${prompt} ${text}`;
    
    // Mapear palabras clave a contextos
    const contextMap = {
      'guardar': 'Save',
      'guardado': 'Save',
      'save': 'Save',
      'eliminar': 'Delete',
      'borrar': 'Delete',
      'delete': 'Delete',
      'actualizar': 'Update',
      'update': 'Update',
      'enviar': 'Send',
      'send': 'Send',
      'validar': 'Validation',
      'validación': 'Validation',
      'validation': 'Validation',
      'conexión': 'Network',
      'network': 'Network',
      'permisos': 'Permission',
      'permission': 'Permission',
      'sesión': 'Session',
      'session': 'Session',
      'carga': 'Loading',
      'loading': 'Loading',
      'mantenimiento': 'Maintenance',
      'maintenance': 'Maintenance'
    };
    
    for (const [keyword, context] of Object.entries(contextMap)) {
      if (combined.includes(keyword)) {
        return context;
      }
    }
    
    return null;
  }

  /**
   * Genera mensaje específico basado en el tipo y contexto
   */
  generateSpecificMessage(data) {
    const context = this.detectAlertContext(data);
    
    // Templates de mensajes específicos
    const messageTemplates = {
      success: {
        Save: 'Los datos se han guardado correctamente',
        Update: 'La información se ha actualizado exitosamente',
        Delete: 'El elemento se ha eliminado correctamente',
        Send: 'El mensaje se ha enviado exitosamente',
        default: 'La operación se ha completado exitosamente'
      },
      error: {
        Validation: 'Por favor verifica que todos los campos obligatorios estén completos',
        Network: 'Error de conexión. Por favor intenta nuevamente',
        Permission: 'No tienes permisos para realizar esta acción',
        default: 'Ha ocurrido un error inesperado. Por favor intenta nuevamente'
      },
      warning: {
        Delete: 'Esta acción no se puede deshacer. ¿Estás seguro de continuar?',
        Session: 'La sesión expirará en 5 minutos',
        default: 'Por favor revisa la información antes de continuar'
      },
      info: {
        Loading: 'Cargando información...',
        Update: 'La información se ha actualizado automáticamente',
        Maintenance: 'El sistema estará en mantenimiento el próximo domingo',
        default: 'Información importante para el usuario'
      }
    };
    
    const typeTemplates = messageTemplates[data.type] || messageTemplates.info;
    return typeTemplates[context] || typeTemplates.default;
  }

  /**
   * Genera componentId específico para la alerta
   */
  generateAlertComponentId(data) {
    const context = this.detectAlertContext(data);
    const type = data.type || 'info';
    const timestamp = Date.now();
    
    if (context) {
      return `${context.toLowerCase()}-${type}-alert-${timestamp}`;
    }
    
    return `${type}-alert-${timestamp}`;
  }

  /**
   * Genera múltiples variantes de un componente
   */
  generateVariants(templateName, baseData, variants) {
    console.log(`🎨 Generando variantes para: ${templateName}`);
    
    const results = [];
    
    for (const variant of variants) {
      const variantData = { ...baseData, ...variant };
      const result = this.generateCode(templateName, variantData);
      
      results.push({
        name: variant.name || `Variante ${results.length + 1}`,
        description: variant.description || '',
        ...result
      });
    }

    console.log(`✅ ${results.length} variantes generadas`);
    return results;
  }

  /**
   * Valida los datos requeridos para un template
   */
  validateTemplateData(templateName, data) {
    const validationRules = {
      'bc-button': {
        required: ['buttonText'],
        optional: ['typeButton', 'sizeButton', 'width', 'clickHandler']
      },
      'bc-alert': {
        required: ['componentId', 'type', 'text'],
        optional: ['title', 'inline', 'dismissible', 'timeOut', 'closeHandler']
      },
      'bc-input': {
        required: ['componentId'],
        optional: ['label', 'placeholder', 'type', 'disabled', 'required', 'maxLength', 'errorMessage', 'helperText']
      },
      'bc-card': {
        required: ['componentId'],
        optional: ['title', 'subtitle', 'content', 'image', 'elevation', 'clickable', 'disabled', 'actions', 'icon']
      },
      'bc-modal': {
        required: ['componentId'],
        optional: ['title', 'content', 'size', 'closable', 'backdrop', 'primaryAction', 'secondaryAction', 'type', 'icon']
      },
      'bc-checkbox': {
        required: ['componentId'],
        optional: ['label', 'checked', 'disabled', 'required', 'indeterminate', 'value', 'name']
      }
    };

    const rules = validationRules[templateName];
    if (!rules) {
      console.warn(`⚠️ No hay reglas de validación para: ${templateName}`);
      return { valid: true, errors: [] };
    }

    const errors = [];
    
    // Validar campos requeridos
    for (const field of rules.required) {
      if (!data[field]) {
        errors.push(`Campo requerido faltante: ${field}`);
      }
    }

    // Validar tipos específicos
    if (templateName === 'bc-button' && data.typeButton) {
      const validTypes = ['primary', 'secondary', 'tertiary', 'background', 'ghost'];
      if (!validTypes.includes(data.typeButton)) {
        errors.push(`Tipo de botón inválido: ${data.typeButton}`);
      }
    }

    if (templateName === 'bc-alert' && data.type) {
      const validTypes = ['error', 'success', 'info', 'warning', 'inactive'];
      if (!validTypes.includes(data.type)) {
        errors.push(`Tipo de alerta inválido: ${data.type}`);
      }
    }

    if (templateName === 'bc-input' && data.type) {
      const validTypes = ['text', 'password', 'email', 'number', 'tel'];
      if (!validTypes.includes(data.type)) {
        errors.push(`Tipo de input inválido: ${data.type}`);
      }
    }

    if (templateName === 'bc-card' && data.elevation) {
      const validElevations = ['none', 'low', 'medium', 'high'];
      if (!validElevations.includes(data.elevation)) {
        errors.push(`Elevación de card inválida: ${data.elevation}`);
      }
    }

    if (templateName === 'bc-modal') {
      if (data.size) {
        const validSizes = ['small', 'medium', 'large', 'fullscreen'];
        if (!validSizes.includes(data.size)) {
          errors.push(`Tamaño de modal inválido: ${data.size}`);
        }
      }
      
      if (data.type) {
        const validTypes = ['info', 'warning', 'error', 'success', 'confirmation'];
        if (!validTypes.includes(data.type)) {
          errors.push(`Tipo de modal inválido: ${data.type}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtiene información sobre un template
   */
  getTemplateInfo(templateName) {
    if (!this.templates.has(templateName)) {
      return null;
    }

    const template = this.templates.get(templateName);
    return {
      name: template.name,
      path: template.path,
      size: template.content.length,
      hasHelpers: template.content.includes('{{#'),
      hasConditionals: template.content.includes('{{#if')
    };
  }

  /**
   * Lista todos los templates disponibles
   */
  listTemplates() {
    return Array.from(this.templates.keys()).map(name => ({
      name,
      info: this.getTemplateInfo(name)
    }));
  }

  /**
   * Recarga un template específico
   */
  async reloadTemplate(templateName) {
    console.log(`🔄 Recargando template: ${templateName}`);
    
    const filename = `${templateName}.hbs`;
    await this.loadTemplate(filename);
    
    console.log(`✅ Template recargado: ${templateName}`);
  }

  /**
   * Obtiene estadísticas de uso de templates
   */
  getStats() {
    return {
      totalTemplates: this.templates.size,
      templates: this.listTemplates(),
      helpersRegistered: Object.keys(Handlebars.helpers).length
    };
  }

  /**
   * Verifica si existe un template específico
   */
  hasTemplate(templateName) {
    return this.templates.has(templateName);
  }

  /**
   * Obtiene la lista de templates disponibles
   */
  getAvailableTemplates() {
    return Array.from(this.templates.keys());
  }
}

module.exports = TemplateService; 