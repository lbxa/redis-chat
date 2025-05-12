import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'path';

const ReactCompilerConfig = {
  /* ... */
};

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(opts) {
        opts.plugins?.unshift([
          'babel-plugin-react-compiler',
          ReactCompilerConfig,
        ]);
      },
    }),
  ],
  source: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});