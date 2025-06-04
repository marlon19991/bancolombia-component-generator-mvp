"use strict";

/**
 * Gestor simple de contexto conversacional
 * Permite guardar interacciones recientes para mejorar el análisis de prompts
 */
class ContextManagerService {
  constructor(maxHistory = 10) {
    this.maxHistory = maxHistory;
    this.history = [];
  }

  addInteraction(prompt, result) {
    this.history.push({ prompt, result, date: new Date().toISOString() });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getContext() {
    return this.history.map(h => `${h.prompt} => ${h.result}` ).join("\n");
  }
}

module.exports = ContextManagerService;
