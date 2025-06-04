#!/bin/bash

echo "🔍 ANALIZADOR AUTOMÁTICO DE COMPONENTES BANCOLOMBIA"
echo "=================================================="

# Directorio base de la librería
LIB_DIR="node_modules/@bancolombia/design-system-web"
OUTPUT_FILE="component-props.txt"

# Limpiar archivo de salida
> $OUTPUT_FILE

echo "📊 Analizando 78 componentes..."

# Componentes prioritarios para análisis detallado
PRIORITY_COMPONENTS=(
  "bc-button"
  "bc-alert" 
  "bc-input"
  "bc-card"
  "bc-modal"
  "bc-checkbox"
  "bc-radio"
  "bc-input-select"
  "bc-accordion"
  "bc-tabs-group"
)

echo "=== ANÁLISIS DETALLADO DE COMPONENTES PRIORITARIOS ===" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

for component in "${PRIORITY_COMPONENTS[@]}"; do
  if [ -d "$LIB_DIR/$component" ]; then
    echo "🔍 Analizando $component..."
    echo "### $component ###" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    
    # Buscar archivos de definición
    find "$LIB_DIR/$component" -name "*.d.ts" -type f | while read file; do
      filename=$(basename "$file")
      echo "--- $filename ---" >> $OUTPUT_FILE
      
      # Extraer interfaces, propiedades @Input y @Output
      grep -E "(interface|@Input|@Output|export declare class)" "$file" | head -20 >> $OUTPUT_FILE
      echo "" >> $OUTPUT_FILE
    done
    
    echo "----------------------------------------" >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
  fi
done

echo "=== ÍNDICE COMPLETO DE COMPONENTES ===" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Listar todos los componentes
ls "$LIB_DIR" | grep "^bc-" | while read component; do
  echo "- $component" >> $OUTPUT_FILE
done

echo "" >> $OUTPUT_FILE
echo "=== ESTADÍSTICAS ===" >> $OUTPUT_FILE
echo "Total de componentes: $(ls "$LIB_DIR" | grep "^bc-" | wc -l)" >> $OUTPUT_FILE
echo "Fecha de análisis: $(date)" >> $OUTPUT_FILE

echo "✅ Análisis completado. Resultados en: $OUTPUT_FILE"

# Mostrar resumen en consola
echo ""
echo "📋 RESUMEN:"
echo "- Componentes analizados: ${#PRIORITY_COMPONENTS[@]}"
echo "- Total de componentes: $(ls "$LIB_DIR" | grep "^bc-" | wc -l)"
echo "- Archivo de salida: $OUTPUT_FILE"

# Extraer algunos ejemplos de sintaxis
echo ""
echo "🎯 EJEMPLOS DE SINTAXIS ENCONTRADOS:"
echo ""

# BC-BUTTON
if [ -f "$LIB_DIR/bc-button/bc-button.directive.d.ts" ]; then
  echo "BC-BUTTON:"
  grep -A 5 "typeButton:" "$LIB_DIR/bc-button/bc-button.directive.d.ts" | head -3
  echo ""
fi

# BC-ALERT  
if [ -f "$LIB_DIR/bc-alert/bc-alert.component.d.ts" ]; then
  echo "BC-ALERT:"
  grep -A 3 "type:" "$LIB_DIR/bc-alert/bc-alert.component.d.ts" | head -3
  echo ""
fi

echo "🚀 Listo para implementar el generador RAG!" 