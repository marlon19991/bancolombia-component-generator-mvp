#!/bin/bash

# Script para abrir la interfaz web de Bancolombia RAG
echo "🌐 Abriendo interfaz web de Bancolombia RAG..."

# Verificar si el servidor está corriendo
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✅ Servidor detectado en puerto 3000"
    echo "🚀 Abriendo navegador..."
    
    # Abrir en el navegador por defecto
    if command -v open > /dev/null; then
        # macOS
        open http://localhost:3000/app
    elif command -v xdg-open > /dev/null; then
        # Linux
        xdg-open http://localhost:3000/app
    elif command -v start > /dev/null; then
        # Windows
        start http://localhost:3000/app
    else
        echo "📋 Abre manualmente: http://localhost:3000/app"
    fi
    
    echo ""
    echo "🎯 URLs disponibles:"
    echo "   🎨 Interfaz Web: http://localhost:3000/app"
    echo "   📊 API REST: http://localhost:3000/"
    echo "   📚 Documentación: http://localhost:3000/docs"
    echo ""
else
    echo "❌ Servidor no detectado en puerto 3000"
    echo "💡 Inicia el servidor con: npm run start-web"
    echo "   o: node src/app.js"
fi 