/**
 * Servicio de Prevención de Errores
 * Centraliza todas las lecciones aprendidas para evitar repetir errores en nuevos componentes
 */
class ErrorPreventionService {
  constructor() {
    this.knownErrors = this.initializeKnownErrors();
    this.preventionRules = this.initializePreventionRules();
    this.validationLayers = this.initializeValidationLayers();
  }

  /**
   * Inicializa los errores conocidos basados en correcciones implementadas
   */
  initializeKnownErrors() {
    return {
      'bc-button': {
        errors: [
          {
            id: 'BUTTON_WRONG_SYNTAX',
            description: 'Uso de propiedades en lugar de clases CSS',
            wrongPattern: 'typeButton="primary"',
            correctPattern: 'class="bc-button-primary"',
            severity: 'critical'
          },
          {
            id: 'BUTTON_MISSING_TYPE',
            description: 'Falta el atributo type="button"',
            wrongPattern: '<button bc-button>',
            correctPattern: '<button bc-button type="button">',
            severity: 'high'
          }
        ]
      },
      'bc-alert': {
        errors: [
          {
            id: 'ALERT_DIRECT_HTML',
            description: 'Uso de HTML directo en lugar de BcDialogService',
            wrongPattern: '<bc-alert componentId="..." type="...">',
            correctPattern: 'this.dialogService.open(BcAlertComponent, {...})',
            severity: 'critical'
          },
          {
            id: 'ALERT_GENERIC_MESSAGES',
            description: 'Mensajes genéricos en lugar de contextuales',
            wrongPattern: 'text: "Mensaje de información"',
            correctPattern: 'text: "Los datos se han guardado correctamente"',
            severity: 'medium'
          },
          {
            id: 'ALERT_DISCONNECTED_EVENTS',
            description: 'Eventos sin funciones definidas',
            wrongPattern: '(click)="onClick()" // función no definida',
            correctPattern: '(click)="showSaveSuccessAlert()" // función específica',
            severity: 'high'
          }
        ]
      }
    };
  }

  /**
   * Inicializa las reglas de prevención
   */
  initializePreventionRules() {
    return {
      syntaxValidation: {
        'bc-button': {
          enforceClasses: true,
          requiredAttributes: ['type'],
          forbiddenAttributes: ['typeButton', 'sizeButton'],
          classPattern: /^bc-button-(primary|secondary|tertiary|background|ghost)\s+bc-button-(default|small|puffy)(\s+bc-button-(fill|hug))?$/
        },
        'bc-alert': {
          enforceService: true,
          forbiddenHTML: true,
          requiredService: 'BcDialogService',
          serviceMethod: 'open'
        }
      },
      contextualGeneration: {
        'bc-alert': {
          requireContextualMessages: true,
          requireSpecificFunctions: true,
          contextDetection: true
        }
      },
      eventConnection: {
        all: {
          validateEventHandlers: true,
          requireFunctionDefinitions: true,
          preventOrphanEvents: true
        }
      }
    };
  }

  /**
   * Inicializa las capas de validación
   */
  initializeValidationLayers() {
    return [
      {
        name: 'Syntax Validation',
        priority: 1,
        validator: this.validateSyntax.bind(this)
      },
      {
        name: 'Context Validation', 
        priority: 2,
        validator: this.validateContext.bind(this)
      },
      {
        name: 'Event Connection Validation',
        priority: 3,
        validator: this.validateEventConnection.bind(this)
      },
      {
        name: 'Anti-Pattern Detection',
        priority: 4,
        validator: this.detectAntiPatterns.bind(this)
      }
    ];
  }

  /**
   * Valida un componente contra todos los errores conocidos
   */
  async validateComponent(componentType, generatedCode, componentData) {
    console.log(`🛡️ Validando ${componentType} contra errores conocidos...`);
    
    const validationResults = {
      passed: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Ejecutar todas las capas de validación
    for (const layer of this.validationLayers) {
      try {
        const layerResult = await layer.validator(componentType, generatedCode, componentData);
        
        if (!layerResult.passed) {
          validationResults.passed = false;
          validationResults.errors.push(...layerResult.errors);
        }
        
        validationResults.warnings.push(...(layerResult.warnings || []));
        validationResults.suggestions.push(...(layerResult.suggestions || []));
        
      } catch (error) {
        console.error(`❌ Error en capa de validación ${layer.name}:`, error);
        validationResults.errors.push(`Error en validación: ${layer.name}`);
        validationResults.passed = false;
      }
    }

    return validationResults;
  }

  /**
   * Valida la sintaxis contra errores conocidos
   */
  validateSyntax(componentType, generatedCode, componentData) {
    const result = { passed: true, errors: [], warnings: [], suggestions: [] };
    const rules = this.preventionRules.syntaxValidation[componentType];
    
    if (!rules) {
      return result;
    }

    // Validación específica para bc-button
    if (componentType === 'bc-button') {
      // Verificar que no use propiedades prohibidas
      if (rules.forbiddenAttributes) {
        for (const attr of rules.forbiddenAttributes) {
          if (generatedCode.includes(`${attr}="`)) {
            result.passed = false;
            result.errors.push(`❌ Sintaxis incorrecta: No usar ${attr}="...". Usar clases CSS en su lugar.`);
          }
        }
      }

      // Verificar que use clases CSS correctas
      if (rules.enforceClasses && !generatedCode.includes('class="bc-button-')) {
        result.passed = false;
        result.errors.push(`❌ Falta clase CSS: Debe incluir class="bc-button-[tipo] bc-button-[tamaño]"`);
      }

      // Verificar atributos requeridos
      if (rules.requiredAttributes) {
        for (const attr of rules.requiredAttributes) {
          if (!generatedCode.includes(`${attr}="`)) {
            result.passed = false;
            result.errors.push(`❌ Atributo faltante: Debe incluir ${attr}="..."`);
          }
        }
      }
    }

    // Validación específica para bc-alert
    if (componentType === 'bc-alert') {
      // Verificar que no use HTML directo
      if (rules.forbiddenHTML && generatedCode.includes('<bc-alert')) {
        result.passed = false;
        result.errors.push(`❌ HTML directo prohibido: Usar ${rules.requiredService}.${rules.serviceMethod}() en su lugar`);
      }

      // Verificar que use el servicio correcto - CORREGIDO: buscar patrón más flexible
      if (rules.enforceService) {
        const hasDialogService = generatedCode.includes('dialogService.open') || 
                                generatedCode.includes('this.dialogService.open') ||
                                generatedCode.includes('BcDialogService');
        
        if (!hasDialogService) {
          result.passed = false;
          result.errors.push(`❌ Servicio requerido: Debe usar ${rules.requiredService}.${rules.serviceMethod}()`);
        }
      }
    }

    return result;
  }

  /**
   * Valida el contexto y mensajes específicos
   */
  validateContext(componentType, generatedCode, componentData) {
    const result = { passed: true, errors: [], warnings: [], suggestions: [] };
    const rules = this.preventionRules.contextualGeneration[componentType];
    
    if (!rules) {
      return result;
    }

    // Validación específica para bc-alert
    if (componentType === 'bc-alert') {
      // Verificar mensajes contextuales
      if (rules.requireContextualMessages) {
        const genericMessages = [
          'Mensaje de información',
          'Mensaje genérico',
          'Alerta',
          'Información'
        ];
        
        for (const generic of genericMessages) {
          if (generatedCode.includes(generic)) {
            result.warnings.push(`⚠️ Mensaje genérico detectado: "${generic}". Considerar mensaje más específico.`);
          }
        }
      }

      // Verificar funciones específicas
      if (rules.requireSpecificFunctions) {
        const genericFunctions = ['onClick', 'showAlert', 'handleClick'];
        
        for (const generic of genericFunctions) {
          if (generatedCode.includes(generic)) {
            result.suggestions.push(`💡 Función genérica: "${generic}". Sugerir nombre más específico como "showSaveSuccessAlert()"`);
          }
        }
      }
    }

    return result;
  }

  /**
   * Valida la conexión de eventos
   */
  validateEventConnection(componentType, generatedCode, componentData) {
    const result = { passed: true, errors: [], warnings: [], suggestions: [] };
    
    // Buscar eventos en el código HTML
    const eventPattern = /\((\w+)\)="(\w+)\(\)"/g;
    const events = [...generatedCode.matchAll(eventPattern)];
    
    for (const event of events) {
      const eventType = event[1];
      const functionName = event[2];
      
      // CORREGIDO: Verificar que la función esté definida en el código TypeScript
      // Buscar patrones más flexibles de definición de función
      const functionPatterns = [
        `${functionName}(): void`,
        `${functionName}() {`,
        `${functionName}():void`,
        `${functionName}(){`
      ];
      
      const functionDefined = functionPatterns.some(pattern => 
        generatedCode.includes(pattern)
      );
      
      if (!functionDefined) {
        // Solo marcar como error si no es una función genérica conocida
        const genericFunctions = ['onClick', 'showAlert', 'handleClick'];
        if (!genericFunctions.includes(functionName)) {
          result.errors.push(`❌ Evento desconectado: ${eventType}="${functionName}()" pero función no definida`);
          result.passed = false;
        } else {
          // Para funciones genéricas, solo advertencia
          result.warnings.push(`⚠️ Función genérica: ${functionName}() - considerar nombre más específico`);
        }
      }
    }

    return result;
  }

  /**
   * Detecta anti-patrones conocidos
   */
  detectAntiPatterns(componentType, generatedCode, componentData) {
    const result = { passed: true, errors: [], warnings: [], suggestions: [] };
    const knownErrors = this.knownErrors[componentType];
    
    if (!knownErrors) {
      return result;
    }

    for (const error of knownErrors.errors) {
      if (generatedCode.includes(error.wrongPattern)) {
        if (error.severity === 'critical') {
          result.passed = false;
          result.errors.push(`❌ Anti-patrón crítico: ${error.description}`);
          result.suggestions.push(`💡 Usar: ${error.correctPattern}`);
        } else if (error.severity === 'high') {
          result.warnings.push(`⚠️ Anti-patrón detectado: ${error.description}`);
          result.suggestions.push(`💡 Usar: ${error.correctPattern}`);
        }
      }
    }

    return result;
  }

  /**
   * Aplica correcciones automáticas cuando es posible
   */
  autoCorrect(componentType, generatedCode, componentData) {
    console.log(`🔧 Aplicando correcciones automáticas para ${componentType}...`);
    
    let correctedCode = generatedCode;
    const corrections = [];

    // Correcciones específicas para bc-button
    if (componentType === 'bc-button') {
      // Corregir sintaxis de propiedades a clases
      correctedCode = correctedCode.replace(
        /typeButton="(\w+)"/g, 
        (match, type) => {
          corrections.push(`Corregido: typeButton="${type}" → class="bc-button-${type}"`);
          return `class="bc-button-${type}"`;
        }
      );

      // Agregar type="button" si falta
      if (!correctedCode.includes('type="button"')) {
        correctedCode = correctedCode.replace(
          /<button\s+bc-button/,
          '<button bc-button type="button"'
        );
        corrections.push('Agregado: type="button"');
      }
    }

    // Correcciones específicas para bc-alert
    if (componentType === 'bc-alert') {
      // Convertir HTML directo a servicio (si es posible detectar el patrón)
      if (correctedCode.includes('<bc-alert')) {
        corrections.push('⚠️ HTML directo detectado - requiere conversión manual a BcDialogService');
      }
    }

    return {
      correctedCode,
      corrections,
      requiresManualReview: corrections.some(c => c.includes('manual'))
    };
  }

  /**
   * Genera reporte de validación
   */
  generateValidationReport(componentType, validationResults, corrections = null) {
    const report = {
      component: componentType,
      timestamp: new Date().toISOString(),
      status: validationResults.passed ? 'PASSED' : 'FAILED',
      summary: {
        errors: validationResults.errors.length,
        warnings: validationResults.warnings.length,
        suggestions: validationResults.suggestions.length
      },
      details: validationResults,
      corrections: corrections || null
    };

    return report;
  }

  /**
   * Obtiene estadísticas del sistema de prevención
   */
  getPreventionStats() {
    const totalErrors = Object.values(this.knownErrors)
      .reduce((sum, component) => sum + component.errors.length, 0);
    
    return {
      knownErrorTypes: Object.keys(this.knownErrors).length,
      totalKnownErrors: totalErrors,
      validationLayers: this.validationLayers.length,
      preventionRules: Object.keys(this.preventionRules).length
    };
  }
}

module.exports = ErrorPreventionService; 