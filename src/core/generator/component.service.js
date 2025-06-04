const ComponentIndexer = require('../rag/indexer.service');
const TemplateService = require('./template.service');
const PromptService = require('../ai/prompt.service');
const ErrorPreventionService = require('../validation/error-prevention.service');
const ComponentValidatorService = require('../validation/component-validator.service');

/**
 * Servicio Principal de Generación de Componentes
 * Orquesta el sistema RAG completo para generar código de componentes Bancolombia
 * MEJORADO: Incluye validación estricta de componentes válidos
 */
class ComponentService {
  constructor() {
    this.indexer = new ComponentIndexer();
    this.templateService = new TemplateService();
    this.promptService = new PromptService();
    this.errorPrevention = new ErrorPreventionService();
    this.validator = new ComponentValidatorService();
    this.isInitialized = false;
  }

  /**
   * Inicializa todos los servicios
   */
  async initialize() {
    console.log('🚀 Inicializando ComponentService...');
    
    try {
      // Cargar templates
      await this.templateService.loadTemplates();
      
      // Indexar componentes
      await this.indexer.indexAllComponents();
      
      this.isInitialized = true;
      console.log('✅ ComponentService inicializado correctamente');
      
      return this.getSystemStats();
      
    } catch (error) {
      console.error('❌ Error inicializando ComponentService:', error);
      throw error;
    }
  }

  /**
   * Genera código de componente basado en un prompt
   * MEJORADO: Validación estricta de componentes válidos
   */
  async generateFromPrompt(prompt, options = {}) {
    if (!this.isInitialized) {
      throw new Error('ComponentService no está inicializado. Llama a initialize() primero.');
    }

    console.log(`🎯 Generando componente desde prompt: "${prompt}"`);
    
    try {
      // 1. Analizar el prompt con validación integrada
      const promptAnalysis = this.promptService.analyzePrompt(prompt);
      
      // Verificar si el análisis fue exitoso
      if (!promptAnalysis.success) {
        return {
          success: false,
          error: promptAnalysis.error,
          suggestions: promptAnalysis.suggestions,
          analysis: promptAnalysis,
          prompt: prompt
        };
      }

      // 2. Validar que todos los componentes detectados sean válidos
      const validationResults = [];
      for (const component of promptAnalysis.components) {
        const componentValidation = this.validator.validateComponentProperties(
          component.type, 
          component.properties
        );
        
        if (!componentValidation.isValid) {
          console.log(`❌ Componente ${component.type} tiene propiedades inválidas:`, componentValidation.errors);
          return {
            success: false,
            error: `Componente ${component.type} no se puede generar: ${componentValidation.errors.join(', ')}`,
            suggestions: this.generateCorrectionSuggestions(component.type, componentValidation),
            analysis: promptAnalysis,
            prompt: prompt
          };
        }
        
        validationResults.push(componentValidation);
      }

      // 3. Buscar componentes relevantes usando RAG (solo para contexto)
      const searchResults = await this.indexer.searchComponents(prompt, 3);
      
      // 4. Generar código para cada componente validado
      const generatedComponents = [];
      
      for (let i = 0; i < promptAnalysis.components.length; i++) {
        const component = promptAnalysis.components[i];
        const validation = validationResults[i];
        
        // Verificar que el componente existe en nuestros templates
        if (!this.templateService.hasTemplate(component.template)) {
          console.log(`❌ Template no encontrado para: ${component.template}`);
          return {
            success: false,
            error: `Componente ${component.type} no está disponible en la librería`,
            suggestions: this.getAvailableComponentSuggestions(),
            analysis: promptAnalysis,
            prompt: prompt
          };
        }
        
        // Agregar el prompt original a las propiedades
        component.properties.originalPrompt = prompt;
        
        const generated = await this.generateValidatedComponent(component, validation, options);
        generatedComponents.push(generated);
      }

      // 5. Combinar interacciones si existen
      const finalCode = this.combineComponentsWithInteractions(
        generatedComponents, 
        promptAnalysis.interactions
      );

      return {
        success: true,
        prompt: prompt,
        analysis: promptAnalysis,
        searchResults: searchResults,
        components: generatedComponents,
        finalCode: finalCode,
        confidence: promptAnalysis.confidence,
        validation: {
          allValid: true,
          componentValidations: validationResults
        }
      };

    } catch (error) {
      console.error('❌ Error generando desde prompt:', error);
      return {
        success: false,
        error: error.message,
        prompt: prompt,
        suggestions: this.getGenericErrorSuggestions()
      };
    }
  }

  /**
   * Genera un componente específico con validación completa
   */
  async generateValidatedComponent(componentSpec, validation, options = {}) {
    console.log(`🔧 Generando componente validado: ${componentSpec.type}`);
    
    try {
      // Validar datos del template antes de generar
      const templateValidation = this.templateService.validateTemplateData(
        componentSpec.template, 
        componentSpec.properties
      );

      if (!templateValidation.valid) {
        throw new Error(`Datos de template inválidos: ${templateValidation.errors.join(', ')}`);
      }

      // Generar código según el tipo de componente
      let htmlResult = null;
      let typescriptResult = null;

      // Para bc-alert, solo generar código TypeScript
      if (componentSpec.type === 'bc-alert') {
        typescriptResult = this.templateService.generateCode(
          componentSpec.template, 
          { ...componentSpec.properties, templateName: componentSpec.template }
        );
      } else {
        // Para otros componentes, generar HTML
        htmlResult = this.templateService.generateCode(
          componentSpec.template, 
          { ...componentSpec.properties, templateName: componentSpec.template }
        );

        // Generar código TypeScript si es necesario
        if (this.needsTypescriptCode(componentSpec)) {
          typescriptResult = this.generateTypescriptCode(componentSpec);
        }
      }

      // Aplicar validación de errores conocidos
      const generatedCode = htmlResult?.code || typescriptResult?.code || '';
      const preventionResult = await this.errorPrevention.validateComponent(
        componentSpec.type, 
        generatedCode, 
        componentSpec.properties
      );

      // Aplicar correcciones automáticas si es necesario
      let finalCode = generatedCode;
      let corrections = null;
      
      if (!preventionResult.passed) {
        console.log(`🔧 Aplicando correcciones automáticas para ${componentSpec.type}...`);
        const correctionResult = this.errorPrevention.autoCorrect(
          componentSpec.type, 
          generatedCode, 
          componentSpec.properties
        );
        
        finalCode = correctionResult.correctedCode;
        corrections = correctionResult.corrections;
      }

      // Generar imports
      const imports = this.generateImports(componentSpec);

      // Generar reporte de validación completo
      const validationReport = {
        templateValidation,
        propertyValidation: validation,
        errorPrevention: preventionResult,
        corrections: corrections,
        isFullyValid: templateValidation.valid && validation.isValid && (preventionResult.passed || corrections !== null)
      };

      return {
        type: componentSpec.type,
        name: componentSpec.name || this.generateComponentName(componentSpec.type),
        template: componentSpec.template,
        html: componentSpec.type === 'bc-alert' ? '' : finalCode,
        typescript: componentSpec.type === 'bc-alert' ? finalCode : (typescriptResult?.code || ''),
        imports: imports,
        properties: componentSpec.properties,
        confidence: componentSpec.confidence,
        validation: validationReport,
        description: this.generateComponentDescription(componentSpec)
      };

    } catch (error) {
      console.error(`❌ Error generando componente ${componentSpec.type}:`, error);
      throw error;
    }
  }

  /**
   * Genera sugerencias de corrección para componentes inválidos
   */
  generateCorrectionSuggestions(componentType, validation) {
    const suggestions = [];
    
    for (const error of validation.errors) {
      if (error.includes('Propiedad requerida')) {
        const property = error.match(/'([^']+)'/)?.[1];
        suggestions.push({
          type: 'missing_property',
          message: `Agrega la propiedad requerida: ${property}`,
          example: `Ejemplo: "botón primario de tamaño grande"`
        });
      } else if (error.includes('no válido')) {
        suggestions.push({
          type: 'invalid_value',
          message: error,
          example: `Usa valores válidos según la documentación`
        });
      }
    }

    if (suggestions.length === 0) {
      suggestions.push({
        type: 'general',
        message: `Revisa la especificación del componente ${componentType}`,
        example: this.getComponentExample(componentType)
      });
    }

    return suggestions;
  }

  /**
   * Obtiene sugerencias de componentes disponibles
   */
  getAvailableComponentSuggestions() {
    const availableComponents = Array.from(this.validator.validComponents);
    return availableComponents.slice(0, 5).map(component => ({
      component,
      example: this.getComponentExample(component),
      description: this.getComponentDescription(component)
    }));
  }

  /**
   * Obtiene ejemplo de uso para un componente
   */
  getComponentExample(componentType) {
    const examples = {
      'bc-button': 'botón primario que diga "Guardar"',
      'bc-alert': 'alerta de éxito con mensaje "Operación completada"',
      'bc-input': 'campo de texto para email obligatorio',
      'bc-card': 'tarjeta con información de usuario',
      'bc-modal': 'modal de confirmación mediano',
      'bc-checkbox': 'checkbox para aceptar términos y condiciones',
      'bc-radio': 'grupo de radio buttons para seleccionar método de pago',
      'bc-input-select': 'lista desplegable con opciones de países',
      'bc-accordion': 'acordeón expandible con información adicional',
      'bc-tabs-group': 'pestañas para organizar contenido en secciones',
      'bc-breadcrumb': 'navegación de migas de pan para mostrar ubicación'
    };
    
    return examples[componentType] || `Ejemplo de ${componentType}`;
  }

  /**
   * Obtiene descripción de un componente
   */
  getComponentDescription(componentType) {
    const descriptions = {
      'bc-button': 'Botones para acciones e interacciones del usuario',
      'bc-alert': 'Mensajes y notificaciones para el usuario',
      'bc-input': 'Campos de entrada para formularios',
      'bc-card': 'Contenedores para mostrar información estructurada',
      'bc-modal': 'Ventanas modales para diálogos e información',
      'bc-checkbox': 'Casillas de verificación para selecciones múltiples',
      'bc-radio': 'Botones de radio para selección única',
      'bc-input-select': 'Listas desplegables para selección de opciones',
      'bc-accordion': 'Contenido expandible y colapsable',
      'bc-tabs-group': 'Navegación por pestañas para organizar contenido',
      'bc-breadcrumb': 'Navegación jerárquica de ubicación'
    };
    
    return descriptions[componentType] || `Componente ${componentType}`;
  }

  /**
   * Genera sugerencias genéricas para errores
   */
  getGenericErrorSuggestions() {
    return [
      {
        type: 'clarity',
        message: 'Sé más específico en tu solicitud',
        example: 'En lugar de "botón", di "botón primario que diga Guardar"'
      },
      {
        type: 'valid_components',
        message: 'Usa solo componentes de la librería Bancolombia',
        example: 'Componentes disponibles: botón, alerta, input, tarjeta, modal, etc.'
      },
      {
        type: 'properties',
        message: 'Incluye propiedades específicas',
        example: 'Especifica tipo, tamaño, color, estado, etc.'
      }
    ];
  }

  /**
   * Genera nombre para el componente
   */
  generateComponentName(componentType) {
    const names = {
      'bc-button': 'Botón',
      'bc-alert': 'Alerta',
      'bc-input': 'Campo de entrada',
      'bc-card': 'Tarjeta',
      'bc-modal': 'Modal',
      'bc-checkbox': 'Checkbox',
      'bc-radio': 'Radio button',
      'bc-input-select': 'Lista desplegable',
      'bc-accordion': 'Acordeón',
      'bc-tabs-group': 'Grupo de pestañas',
      'bc-breadcrumb': 'Migas de pan'
    };
    
    return names[componentType] || componentType;
  }

  /**
   * Genera descripción para el componente
   */
  generateComponentDescription(componentSpec) {
    const baseDescription = this.getComponentDescription(componentSpec.type);
    const properties = componentSpec.properties;
    
    let specificDescription = baseDescription;
    
    // Agregar detalles específicos basados en propiedades
    if (properties.typeButton) {
      specificDescription += ` de tipo ${properties.typeButton}`;
    }
    if (properties.type && componentSpec.type !== 'bc-button') {
      specificDescription += ` de tipo ${properties.type}`;
    }
    if (properties.sizeButton || properties.size) {
      const size = properties.sizeButton || properties.size;
      specificDescription += ` de tamaño ${size}`;
    }
    if (properties.text) {
      specificDescription += ` con texto "${properties.text}"`;
    }
    
    return specificDescription;
  }

  /**
   * Determina si se necesita código TypeScript
   */
  needsTypescriptCode(componentSpec) {
    // Componentes que requieren servicios o lógica TypeScript
    const needsTS = ['bc-alert', 'bc-modal', 'bc-input'];
    return needsTS.includes(componentSpec.type) || 
           componentSpec.properties.clickHandler ||
           componentSpec.properties.closeHandler;
  }

  /**
   * Genera código TypeScript para el componente
   */
  generateTypescriptCode(componentSpec) {
    const { type, properties } = componentSpec;
    
    let tsCode = '';

    // Imports necesarios para componentes que no sean bc-alert
    if (type === 'bc-modal') {
      tsCode += `import { BcDialogService } from '@bancolombia/design-system-web/bc-services';\n`;
      tsCode += `import { BcModalComponent } from '@bancolombia/design-system-web/bc-modal';\n\n`;
    }

    // Métodos del componente
    if (properties.clickHandler) {
      tsCode += `${properties.clickHandler}(): void {\n`;
      
      if (type === 'bc-button' && properties.showAlert) {
        tsCode += `  // Mostrar alerta al hacer clic\n`;
        tsCode += `  this.dialogService.open(BcAlertComponent, {\n`;
        tsCode += `    componentId: 'alert-${Date.now()}',\n`;
        tsCode += `    type: 'success',\n`;
        tsCode += `    text: 'Acción ejecutada correctamente',\n`;
        tsCode += `    inline: false,\n`;
        tsCode += `    dismissible: true\n`;
        tsCode += `  });\n`;
      } else {
        tsCode += `  console.log('Botón clickeado');\n`;
      }
      
      tsCode += `}\n\n`;
    }

    // bc-alert ahora usa template, no código hardcodeado

    return tsCode;
  }

  /**
   * Genera imports necesarios
   */
  generateImports(componentSpec) {
    const imports = [];
    
    // Obtener definición del componente
    const componentDef = this.indexer.getComponent(componentSpec.type);
    
    if (componentDef) {
      imports.push({
        module: componentDef.module,
        from: componentDef.import
      });

      // Agregar servicio si es necesario
      if (componentDef.service) {
        imports.push({
          module: componentDef.service,
          from: '@bancolombia/design-system-web/bc-services'
        });
      }
    }

    return imports;
  }

  /**
   * Combina componentes con sus interacciones
   */
  combineComponentsWithInteractions(components, interactions) {
    if (interactions.length === 0) {
      return {
        html: components.map(c => c.html).join('\n\n'),
        typescript: components.map(c => c.typescript).filter(Boolean).join('\n'),
        imports: this.mergeImports(components.map(c => c.imports))
      };
    }

    // Lógica para combinar componentes con interacciones
    let combinedHtml = '';
    let combinedTs = '';
    
    // Ejemplo: botón que muestra alerta
    if (this.hasButtonAlertInteraction(components, interactions)) {
      const button = components.find(c => c.type === 'bc-button');
      const alert = components.find(c => c.type === 'bc-alert');
      
      if (button && alert) {
        // Modificar botón para incluir handler
        button.properties.clickHandler = 'showAlert';
        
        // Regenerar HTML del botón
        const buttonResult = this.templateService.generateCode(
          button.template, 
          { ...button.properties, templateName: button.template }
        );
        
        combinedHtml = buttonResult.code;
        combinedTs = this.generateTypescriptCode({
          type: 'bc-button',
          properties: { ...button.properties, showAlert: true }
        });
      }
    } else {
      // Combinación simple
      combinedHtml = components.map(c => c.html).join('\n\n');
      combinedTs = components.map(c => c.typescript).filter(Boolean).join('\n');
    }

    return {
      html: combinedHtml,
      typescript: combinedTs,
      imports: this.mergeImports(components.map(c => c.imports))
    };
  }

  /**
   * Detecta si hay interacción botón-alerta
   */
  hasButtonAlertInteraction(components, interactions) {
    const hasButton = components.some(c => c.type === 'bc-button');
    const hasAlert = components.some(c => c.type === 'bc-alert');
    const hasShowInteraction = interactions.some(i => i.action === 'show');
    
    return hasButton && hasAlert && hasShowInteraction;
  }

  /**
   * Combina arrays de imports eliminando duplicados
   */
  mergeImports(importArrays) {
    const merged = [];
    const seen = new Set();
    
    for (const imports of importArrays) {
      for (const imp of imports) {
        const key = `${imp.module}:${imp.from}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(imp);
        }
      }
    }
    
    return merged;
  }

  /**
   * Busca componentes usando RAG
   */
  async searchComponents(query, limit = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await this.indexer.searchComponents(query, limit);
  }

  /**
   * Obtiene un componente específico
   */
  getComponent(name) {
    return this.indexer.getComponent(name);
  }

  /**
   * Genera variantes de un componente
   */
  async generateVariants(componentName, baseProperties = {}) {
    const componentDef = this.getComponent(componentName);
    if (!componentDef) {
      throw new Error(`Componente no encontrado: ${componentName}`);
    }

    const variants = [];
    
    if (componentName === 'bc-button') {
      const types = ['primary', 'secondary', 'tertiary'];
      const sizes = ['default', 'small', 'puffy'];
      
      for (const type of types) {
        for (const size of sizes) {
          variants.push({
            name: `Botón ${type} ${size}`,
            description: `Botón de tipo ${type} y tamaño ${size}`,
            typeButton: type,
            sizeButton: size,
            buttonText: baseProperties.buttonText || 'Botón',
            ...baseProperties
          });
        }
      }
    }

    return this.templateService.generateVariants(componentName, baseProperties, variants);
  }

  /**
   * Capitaliza texto
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Obtiene estadísticas del sistema incluyendo prevención de errores
   */
  getSystemStats() {
    return {
      initialized: this.isInitialized,
      indexer: this.indexer.getStats(),
      templates: this.templateService.getStats(),
      prompts: this.promptService.getStats(),
      errorPrevention: this.errorPrevention.getPreventionStats()
    };
  }
}

module.exports = ComponentService; 