/**
 * Demostración del Generador de Componentes Bancolombia
 * Versión simplificada para validar el concepto RAG
 */

console.log('🚀 DEMOSTRACIÓN BANCOLOMBIA COMPONENT GENERATOR');
console.log('='.repeat(60));

// Simulación de componentes indexados
const componentIndex = {
  'bc-button': {
    name: 'bc-button',
    type: 'directive',
    description: 'Directiva de botones con los diseños de Bancolombia',
    properties: {
      typeButton: ['primary', 'secondary', 'tertiary', 'background', 'ghost'],
      sizeButton: ['default', 'small', 'puffy'],
      width: ['fill', 'hug']
    },
    template: '<button bc-button typeButton="{{typeButton}}" sizeButton="{{sizeButton}}" {{#if width}}width="{{width}}"{{/if}}>{{buttonText}}</button>'
  },
  'bc-alert': {
    name: 'bc-alert',
    type: 'component',
    description: 'Componente de alertas con los diseños de Bancolombia',
    properties: {
      type: ['error', 'success', 'info', 'warning', 'inactive'],
      inline: [true, false],
      dismissible: [true, false]
    },
    template: '<bc-alert componentId="{{componentId}}" type="{{type}}" text="{{text}}" inline="{{inline}}" dismissible="{{dismissible}}"></bc-alert>'
  }
};

// Analizador de prompts simplificado
function analyzePrompt(prompt) {
  console.log(`🧠 Analizando: "${prompt}"`);
  
  const normalized = prompt.toLowerCase();
  const components = [];
  
  // Detectar botón
  if (normalized.includes('botón') || normalized.includes('button')) {
    const button = {
      type: 'bc-button',
      properties: {
        typeButton: 'primary',
        sizeButton: 'default',
        buttonText: 'Botón'
      }
    };
    
    // Detectar tipo
    if (normalized.includes('primario') || normalized.includes('primary')) button.properties.typeButton = 'primary';
    if (normalized.includes('secundario') || normalized.includes('secondary')) button.properties.typeButton = 'secondary';
    
    // Detectar tamaño
    if (normalized.includes('pequeño') || normalized.includes('small')) button.properties.sizeButton = 'small';
    if (normalized.includes('grande') || normalized.includes('puffy')) button.properties.sizeButton = 'puffy';
    
    // Detectar ancho
    if (normalized.includes('completo') || normalized.includes('fill') || normalized.includes('ancho')) {
      button.properties.width = 'fill';
    }
    
    // Extraer texto
    const textMatch = prompt.match(/(?:que diga|con texto|"([^"]+)"|'([^']+)')/i);
    if (textMatch) {
      button.properties.buttonText = textMatch[1] || textMatch[2] || 'Botón';
    }
    
    // Buscar acciones comunes
    if (normalized.includes('guardar')) button.properties.buttonText = 'Guardar';
    if (normalized.includes('cancelar')) button.properties.buttonText = 'Cancelar';
    if (normalized.includes('aceptar')) button.properties.buttonText = 'Aceptar';
    
    components.push(button);
  }
  
  // Detectar alerta
  if (normalized.includes('alerta') || normalized.includes('alert') || normalized.includes('mensaje')) {
    const alert = {
      type: 'bc-alert',
      properties: {
        componentId: `alert-${Date.now()}`,
        type: 'info',
        text: 'Mensaje de información',
        inline: false,
        dismissible: true
      }
    };
    
    // Detectar tipo
    if (normalized.includes('éxito') || normalized.includes('success')) alert.properties.type = 'success';
    if (normalized.includes('error')) alert.properties.type = 'error';
    if (normalized.includes('advertencia') || normalized.includes('warning')) alert.properties.type = 'warning';
    
    // Extraer texto
    const textMatch = prompt.match(/(?:que diga|con texto|"([^"]+)"|'([^']+)')/i);
    if (textMatch) {
      alert.properties.text = textMatch[1] || textMatch[2];
    }
    
    components.push(alert);
  }
  
  return {
    components,
    confidence: components.length > 0 ? 0.8 : 0.2
  };
}

// Generador de código simplificado
function generateCode(component) {
  const definition = componentIndex[component.type];
  if (!definition) return null;
  
  let template = definition.template;
  
  // Reemplazar variables en el template
  for (const [key, value] of Object.entries(component.properties)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, value);
  }
  
  // Manejar condicionales simples
  template = template.replace(/{{#if (\w+)}}([^{]+){{\/if}}/g, (match, prop, content) => {
    return component.properties[prop] ? content : '';
  });
  
  return template;
}

// Función principal de demostración
async function demo() {
  const testPrompts = [
    'botón primario que diga Guardar',
    'botón secundario pequeño',
    'alerta de éxito que diga "Operación completada"',
    'botón ancho completo',
    'alerta de error',
    'botón de cancelar'
  ];
  
  console.log('\n📋 EJECUTANDO PRUEBAS DE GENERACIÓN:');
  console.log('-'.repeat(40));
  
  for (const prompt of testPrompts) {
    console.log(`\n🔍 Prompt: "${prompt}"`);
    
    // Analizar prompt
    const analysis = analyzePrompt(prompt);
    console.log(`📊 Confianza: ${(analysis.confidence * 100).toFixed(1)}%`);
    console.log(`📦 Componentes detectados: ${analysis.components.length}`);
    
    // Generar código
    for (const component of analysis.components) {
      const code = generateCode(component);
      console.log(`\n🏷️ Código generado (${component.type}):`);
      console.log(code);
    }
    
    console.log('-'.repeat(40));
  }
  
  console.log('\n✅ DEMOSTRACIÓN COMPLETADA');
  console.log('🎯 El sistema RAG básico está funcionando correctamente');
  console.log('📈 Próximo paso: Implementar embeddings vectoriales reales');
}

// Ejecutar demostración
demo().catch(console.error); 