"use strict";

/**
 * Servicio de reconocimiento visual simplificado
 * Analiza una imagen y devuelve sus dimensiones y tipo
 * (Sirve como placeholder para futuras integraciones de visión por computadora)
 */

const imageSize = require('image-size');

class VisualRecognitionService {
  analyzeImage(filePath) {
    const info = imageSize(filePath);
    return {
      width: info.width,
      height: info.height,
      type: info.type
    };
  }
}

module.exports = VisualRecognitionService;
