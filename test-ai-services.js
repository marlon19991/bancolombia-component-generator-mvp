"use strict";

const FineTunerService = require('./src/core/ai/fine-tuner.service');
const ContextManagerService = require('./src/core/ai/context-manager.service');
const AutocompleteService = require('./src/core/ai/autocomplete.service');
const VisualRecognitionService = require('./src/core/ai/visual-recognition.service');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🧪 Probando servicios de IA avanzados');

  // Fine tuning (simulado)
  const fine = new FineTunerService('test-key');
  const dataset = fine.prepareDataset([
    { prompt: 'hola', completion: 'mundo' }
  ], path.join(__dirname, 'sample.jsonl'));
  const ft = await fine.startFineTune(dataset);
  console.log('Fine tune:', ft);

  // Context manager
  const context = new ContextManagerService(2);
  context.addInteraction('prompt 1', 'resultado1');
  context.addInteraction('prompt 2', 'resultado2');
  console.log('Contexto:', context.getContext());

  // Autocomplete
  const ac = new AutocompleteService(['crear botón primario', 'crear alerta de éxito']);
  console.log('Sugerencia:', ac.suggest('crear b'));

  // Visual recognition
  const vr = new VisualRecognitionService();
  const tmpImg = path.join(__dirname, 'sample.png');
  const base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOeC/2IAAAAASUVORK5CYII=';
  fs.writeFileSync(tmpImg, Buffer.from(base64, 'base64'));
  const info = vr.analyzeImage(tmpImg);
  console.log('Imagen:', info);
  fs.unlinkSync(tmpImg);
})();
