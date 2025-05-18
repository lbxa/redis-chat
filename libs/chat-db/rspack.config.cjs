const { rspack } = require('@rspack/core');

/** @type {import('@rspack/cli').Configuration} */
const config = {
  context: __dirname,
  target: 'node',
  entry: {
    main: ['@rspack/core/hot/poll?100', './index.ts'],
  },
  output: {
    filename: 'main.cjs',
    library: {
      type: 'commonjs2',
    },
  },
  resolve: {
    extensions: ['...', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                decorators: true,
              },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
              },
            },
          },
        },
      },
    ],
  },
  optimization: {
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin({
        minimizerOptions: {
          // We need to disable mangling and compression for class names and function names for Nest.js to work properly
          // The execution context class returns a reference to the class/handler function, which is for example used for applying metadata using decorators
          // https://docs.nestjs.com/fundamentals/execution-context#executioncontext-class
          compress: {
            keep_classnames: true,
            keep_fnames: true,
          },
          mangle: {
            keep_classnames: true,
            keep_fnames: true,
          },
        },
      }),
    ],
  },
  externalsType: 'commonjs',
  devServer: {
    devMiddleware: {
      writeToDisk: true,
    },
  },
  stats: 'errors-only',
};
module.exports = config;