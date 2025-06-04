"use strict";

/**
 * Servicio de Fine-Tuning para modelos de lenguaje
 * Permite preparar datasets y lanzar procesos de fine-tuning con OpenAI
 * Por simplicidad, muchas funciones son simuladas para evitar llamadas reales a la API.
 */

const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

class FineTunerService {
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    this.apiKey = apiKey;
    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  /**
   * Prepara un dataset JSONL a partir de pares de prompt/respuesta
   * @param {Array<{prompt:string, completion:string}>} samples
   * @param {string} outputFile
   */
  prepareDataset(samples, outputFile) {
    const lines = samples.map(s => JSON.stringify({ prompt: s.prompt, completion: s.completion }));
    fs.writeFileSync(outputFile, lines.join("\n"));
    return outputFile;
  }

  /**
   * Lanza un proceso de fine-tuning. Esta implementación es simulada
   * para evitar llamadas a la API real.
   */
  async startFineTune(datasetFile, model = "gpt-3.5-turbo") {
    if (!fs.existsSync(datasetFile)) {
      throw new Error(`Dataset no encontrado: ${datasetFile}`);
    }

    // Simulación: devolver un identificador ficticio
    return {
      id: `ft-${Date.now()}`,
      status: "created",
      model,
      dataset: path.basename(datasetFile)
    };
  }
}

module.exports = FineTunerService;
