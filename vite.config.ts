/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import JavaScriptObfuscator from 'javascript-obfuscator';

/**
 * Verschleiert im Produktionsbuild den Spielcode (nicht die Bibliotheken): Strings werden in eine kodierte
 * Tabelle ausgelagert, Namen unlesbar. Bewusst ohne Kontrollfluss-Verflachung, damit der BASIC-Interpreter und
 * die C64-Simulation nicht langsamer werden. Kein echter Schutz, nur Hürde gegen Blick in die Konsole.
 */
function obfuscateGame(): Plugin {
  return {
    name: 'obfuscate-game',
    apply: 'build',
    enforce: 'post',
    renderChunk(code, chunk) {
      if (chunk.name === 'vendor' || process.env.VITE_DEV_TOOLS === '1') return null;
      const out = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.75,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        splitStrings: false,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        selfDefending: false,
        debugProtection: false,
        sourceMap: false,
      });
      return { code: out.getObfuscatedCode(), map: null };
    },
  };
}

export default defineConfig({
  plugins: [react(), obfuscateGame()],
  base: './',
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // React und Bibliotheken getrennt vom Spielcode: beide Teile bleiben unter 500 kB, Browser cachen sie getrennt
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
