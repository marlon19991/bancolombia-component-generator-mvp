#!/bin/bash

echo "🔍 Verificando estado de la interfaz web..."
echo ""

# Verificar servidor
echo "1. 🌐 Verificando servidor..."
if curl -s http://localhost:3000/ > /dev/null; then
    echo "   ✅ Servidor activo en puerto 3000"
else
    echo "   ❌ Servidor no responde"
    exit 1
fi

# Verificar HTML principal
echo "2. 📄 Verificando HTML principal..."
if curl -s http://localhost:3000/app | grep -q "Bancolombia RAG"; then
    echo "   ✅ HTML carga correctamente"
else
    echo "   ❌ Error cargando HTML"
fi

# Verificar CSS
echo "3. 🎨 Verificando estilos CSS..."
css_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/styles/main.css)
if [ "$css_status" = "200" ]; then
    echo "   ✅ CSS disponible (HTTP $css_status)"
else
    echo "   ❌ CSS no disponible (HTTP $css_status)"
fi

# Verificar JavaScript
echo "4. 📜 Verificando archivos JavaScript..."
js_files=("main.js" "api.js" "generator.js" "search.js" "components.js" "docs.js")
for file in "${js_files[@]}"; do
    js_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/js/$file)
    if [ "$js_status" = "200" ]; then
        echo "   ✅ $file disponible"
    else
        echo "   ❌ $file no disponible (HTTP $js_status)"
    fi
done

# Verificar API
echo "5. 🔧 Verificando API..."
if curl -s http://localhost:3000/api/v2/components/health | grep -q "healthy"; then
    echo "   ✅ API respondiendo correctamente"
else
    echo "   ⚠️  API con problemas (puede ser normal en desarrollo)"
fi

echo ""
echo "🎯 Resumen:"
echo "   🎨 Interfaz Web: http://localhost:3000/app"
echo "   📊 API REST: http://localhost:3000/"
echo "   📚 Documentación: http://localhost:3000/docs"
echo ""
echo "✅ Verificación completada" 