#!/usr/bin/env node

/**
 * Script de inicio para Bancolombia RAG Component Generator
 * Incluye interfaz web integrada
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Bancolombia RAG Component Generator v2.0');
console.log('📦 Sistema inteligente de generación de componentes del Design System');
console.log('');

// Verificar que existe el archivo principal
const mainFile = path.join(__dirname, 'src', 'index.js');
if (!fs.existsSync(mainFile)) {
    console.error('❌ Error: No se encontró el archivo principal src/index.js');
    process.exit(1);
}

// Configurar variables de entorno por defecto
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '3000';
process.env.WEB_MODE = 'true'; // Activar modo web

const port = process.env.PORT;

console.log('⚙️  Configuración:');
console.log(`   • Entorno: ${process.env.NODE_ENV}`);
console.log(`   • Puerto: ${port}`);
console.log(`   • Host: localhost`);
console.log('');

// Iniciar el servidor
console.log('🚀 Iniciando servidor web...');

const serverProcess = spawn('node', ['src/index.js'], {
    stdio: 'inherit',
    env: {
        ...process.env,
        WEB_MODE: 'true',
        INTERACTIVE_MODE: 'false'
    }
});

// Manejar errores del proceso
serverProcess.on('error', (error) => {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
});

// Manejar cierre del proceso
serverProcess.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ El servidor se cerró con código de error: ${code}`);
        process.exit(code);
    }
    console.log('✅ Servidor cerrado correctamente');
});

// Manejar señales de cierre
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    serverProcess.kill('SIGTERM');
});

// Mostrar información de acceso después de un breve delay
setTimeout(() => {
    console.log('\n🌐 Servidor iniciado correctamente:');
    console.log('');
    console.log('   📊 API REST:');
    console.log(`      http://localhost:${port}/`);
    console.log(`      http://localhost:${port}/docs`);
    console.log('');
    console.log('   🎨 Interfaz Web:');
    console.log(`      http://localhost:${port}/app`);
    console.log(`      http://localhost:${port}/web`);
    console.log('');
    console.log('   🔧 Endpoints principales:');
    console.log(`      POST http://localhost:${port}/api/v2/components/generate`);
    console.log(`      POST http://localhost:${port}/api/v2/components/search`);
    console.log(`      GET  http://localhost:${port}/api/v2/components`);
    console.log('');
    console.log('💡 Presiona Ctrl+C para detener el servidor');
    console.log('');
}, 3000); 