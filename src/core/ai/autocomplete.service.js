"use strict";

/**
 * Servicio de autocompletado de prompts
 * Utiliza un pequeño corpus de ejemplos para sugerir continuaciones
 */

class AutocompleteService {
  constructor(samples = []) {
    this.samples = samples;
  }

  suggest(prefix) {
    const lower = prefix.toLowerCase();
    const match = this.samples.find(s => s.toLowerCase().startsWith(lower));
    return match ? match.slice(prefix.length) : "";
  }
}

module.exports = AutocompleteService;
