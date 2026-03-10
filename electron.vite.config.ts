import { resolve } from "path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import JavaScriptObfuscator from "javascript-obfuscator";
import type { Plugin } from "vite";

function createObfuscationPlugin(): Plugin {
  return {
    name: "build-obfuscation",
    apply: "build",
    enforce: "post",
    generateBundle(_outputOptions, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk" || !fileName.endsWith(".js")) {
          continue;
        }

        const obfuscated = JavaScriptObfuscator.obfuscate(chunk.code, {
          compact: true,
          identifierNamesGenerator: "hexadecimal",
          renameGlobals: false,
          simplify: true,
          splitStrings: true,
          splitStringsChunkLength: 8,
          stringArray: true,
          stringArrayEncoding: ["base64"],
          stringArrayThreshold: 0.75,
          transformObjectKeys: true,
          unicodeEscapeSequence: false
        });

        chunk.code = obfuscated.getObfuscatedCode();
      }
    }
  };
}

const buildObfuscationPlugin = createObfuscationPlugin();

export default defineConfig({
  main: {
    build: {
      sourcemap: false,
      minify: "esbuild"
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: "resources/*",
            dest: "resources"
          }
        ]
      }),
      buildObfuscationPlugin
    ]
  },
  preload: {
    build: {
      sourcemap: false,
      minify: "esbuild"
    },
    plugins: [buildObfuscationPlugin]
  },
  renderer: {
    build: {
      sourcemap: false,
      minify: "esbuild"
    },
    resolve: {
      alias: {
        "@renderer": resolve(__dirname, "src/renderer/src")
      }
    },
    plugins: [
      react(),
      tailwindcss(),
      buildObfuscationPlugin
    ]
  }
});
