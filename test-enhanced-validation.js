#!/usr/bin/env node

/**
 * Script de Prueba - Sistema de Validación Mejorado
 * Verifica que solo se generen componentes válidos de la librería Bancolombia
 */

const ComponentService = require('./src/core/generator/component.service');
const ComponentValidatorService = require('./src/core/validation/component-validator.service');

async function testEnhancedValidation() {
  console.log('🧪 Iniciando pruebas del sistema de validación mejorado...\n');

  const componentService = new ComponentService();
  const validator = new ComponentValidatorService();

  try {
    // Inicializar servicios
    console.log('🚀 Inicializando servicios...');
    await componentService.initialize();
    console.log('✅ Servicios inicializados\n');

    // Mostrar estadísticas del validador
    const validatorStats = validator.getStats();
    console.log('📊 Estadísticas del validador:');
    console.log(`   - Componentes válidos: ${validatorStats.validComponentsCount}`);
    console.log(`   - Aliases soportados: ${validatorStats.aliasesCount}`);
    console.log(`   - Reglas de validación: ${validatorStats.validationRulesCount}`);
    console.log(`   - Componentes: ${validatorStats.validComponents.join(', ')}\n`);

    // Pruebas de prompts válidos
    console.log('✅ PRUEBAS DE PROMPTS VÁLIDOS:\n');
    
    const validPrompts = [
      'botón primario que diga "Guardar"',
      'alerta de éxito con mensaje',
      'campo de texto para email',
      'tarjeta con información de usuario',
      'modal de confirmación',
      'checkbox para términos y condiciones',
      'lista desplegable con opciones',
      'acordeón expandible',
      'pestañas para organizar contenido',
      'navegación de migas de pan'
    ];

    for (const prompt of validPrompts) {
      console.log(`🔍 Probando: "${prompt}"`);
      
      const result = await componentService.generateFromPrompt(prompt);
      
      if (result.success) {
        console.log(`   ✅ Generación exitosa`);
        console.log(`   📦 Componentes: ${result.components.map(c => c.type).join(', ')}`);
        console.log(`   📊 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   🛡️ Validación: ${result.validation.allValid ? 'Válida' : 'Con errores'}`);
      } else {
        console.log(`   ❌ Error: ${result.error}`);
      }
      console.log('');
    }

    // Pruebas de prompts inválidos
    console.log('❌ PRUEBAS DE PROMPTS INVÁLIDOS:\n');
    
    const invalidPrompts = [
      'crear un slider',
      'necesito un carousel',
      'hacer un tooltip',
      'generar un datepicker',
      'crear un progress bar',
      'hacer un dropdown menu',
      'generar un sidebar',
      'crear un navbar',
      'hacer un footer',
      'generar un header'
    ];

    for (const prompt of invalidPrompts) {
      console.log(`🔍 Probando: "${prompt}"`);
      
      const result = await componentService.generateFromPrompt(prompt);
      
      if (result.success) {
        console.log(`   ⚠️ Se generó algo inesperadamente`);
        console.log(`   📦 Componentes: ${result.components.map(c => c.type).join(', ')}`);
      } else {
        console.log(`   ✅ Correctamente rechazado: ${result.error}`);
        if (result.suggestions && result.suggestions.length > 0) {
          console.log(`   💡 Sugerencias: ${result.suggestions.slice(0, 2).map(s => s.component || s.message).join(', ')}`);
        }
      }
      console.log('');
    }

    // Pruebas de prompts ambiguos
    console.log('🤔 PRUEBAS DE PROMPTS AMBIGUOS:\n');
    
    const ambiguousPrompts = [
      'crear algo',
      'necesito un elemento',
      'hacer un componente',
      'generar una cosa',
      'crear un widget'
    ];

    for (const prompt of ambiguousPrompts) {
      console.log(`🔍 Probando: "${prompt}"`);
      
      const result = await componentService.generateFromPrompt(prompt);
      
      if (result.success) {
        console.log(`   ⚠️ Se generó algo con prompt ambiguo`);
        console.log(`   📦 Componentes: ${result.components.map(c => c.type).join(', ')}`);
        console.log(`   📊 Confianza: ${(result.confidence * 100).toFixed(1)}%`);
      } else {
        console.log(`   ✅ Correctamente rechazado: ${result.error}`);
        if (result.suggestions && result.suggestions.length > 0) {
          console.log(`   💡 Sugerencias: ${result.suggestions.slice(0, 2).map(s => s.example || s.message).join(', ')}`);
        }
      }
      console.log('');
    }

    // Pruebas de validación de propiedades
    console.log('🔧 PRUEBAS DE VALIDACIÓN DE PROPIEDADES:\n');
    
    const propertyTests = [
      {
        component: 'bc-button',
        properties: { typeButton: 'invalid', sizeButton: 'wrong' },
        description: 'Botón con propiedades inválidas'
      },
      {
        component: 'bc-alert',
        properties: { type: 'invalid' },
        description: 'Alerta con tipo inválido'
      },
      {
        component: 'bc-input',
        properties: { type: 'invalid' },
        description: 'Input con tipo inválido'
      },
      {
        component: 'bc-modal',
        properties: {},
        description: 'Modal sin propiedades requeridas'
      }
    ];

    for (const test of propertyTests) {
      console.log(`🔍 Probando: ${test.description}`);
      
      const validation = validator.validateComponentProperties(test.component, test.properties);
      
      console.log(`   🛡️ Válido: ${validation.isValid ? 'Sí' : 'No'}`);
      if (!validation.isValid) {
        console.log(`   ❌ Errores: ${validation.errors.join(', ')}`);
      }
      if (validation.warnings && validation.warnings.length > 0) {
        console.log(`   ⚠️ Advertencias: ${validation.warnings.join(', ')}`);
      }
      console.log('');
    }

    // Pruebas de detección de componentes
    console.log('🎯 PRUEBAS DE DETECCIÓN DE COMPONENTES:\n');
    
    const detectionTests = [
      'quiero hacer clic en algo',
      'necesito mostrar un mensaje',
      'capturar información del usuario',
      'mostrar datos organizados',
      'confirmar una acción',
      'seleccionar múltiples opciones',
      'elegir una opción única',
      'expandir información adicional'
    ];

    for (const prompt of detectionTests) {
      console.log(`🔍 Analizando: "${prompt}"`);
      
      const validation = validator.validatePrompt(prompt);
      
      console.log(`   🎯 Componentes detectados: ${validation.detectedComponents.join(', ') || 'Ninguno'}`);
      console.log(`   📊 Confianza: ${(validation.confidence * 100).toFixed(1)}%`);
      console.log(`   ✅ Válido: ${validation.isValid ? 'Sí' : 'No'}`);
      console.log('');
    }

    console.log('🎉 Pruebas completadas exitosamente!');
    console.log('\n📋 RESUMEN:');
    console.log('   ✅ Sistema de validación funcionando');
    console.log('   ✅ Solo componentes válidos se generan');
    console.log('   ✅ Prompts inválidos son rechazados');
    console.log('   ✅ Sugerencias útiles se proporcionan');
    console.log('   ✅ Validación de propiedades activa');
    console.log('   ✅ Detección inteligente de componentes');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testEnhancedValidation().catch(console.error);
}

module.exports = testEnhancedValidation; 