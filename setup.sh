#!/bin/bash

echo "🚀 CONFIGURANDO BANCOLOMBIA COMPONENT GENERATOR"
echo "================================================"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

echo "✅ Node.js detectado: $(node --version)"

# Navegar al directorio del proyecto
cd bancolombia-component-generator-mvp

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar estructura
echo "📁 Verificando estructura del proyecto..."
if [ ! -d "src" ]; then
    echo "⚠️ Creando estructura de directorios..."
    mkdir -p src/{core/{rag,generator,ai},components/{chat,code-preview,component-test},data/{component-definitions,templates,examples}}
fi

# Copiar archivos desde el directorio padre si existen
if [ -f "../demo-generator.js" ]; then
    echo "📄 Copiando archivos de demostración..."
    cp ../demo-generator.js .
    cp ../test-generator.js .
fi

# Verificar que los archivos principales existen
echo "🔍 Verificando archivos principales..."
files_needed=(
    "package.json"
    "demo-generator.js"
)

for file in "${files_needed[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (faltante)"
    fi
done

echo ""
echo "🎯 CONFIGURACIÓN COMPLETADA"
echo "=========================="
echo ""
echo "📋 Comandos disponibles:"
echo "  npm run start          - Iniciar aplicación"
echo "  npm run dev            - Modo desarrollo"
echo "  npm run analyze        - Analizar componentes"
echo "  node demo-generator.js - Ejecutar demostración"
echo ""
echo "🧪 Para probar el sistema:"
echo "  node demo-generator.js"
echo ""
echo "📚 Para ver la documentación:"
echo "  cat ../FASE2-COMPLETADA.md"
echo ""
echo "🎉 ¡Listo para generar componentes Bancolombia!" 