const path = require('path');

module.exports = {
  entry: {
    index: './arbitrage/strategy/cetus-bn-sui-usdt.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
    'node-fetch': 'commonjs2 node-fetch',
  },
  target: 'node',
  mode: 'production',
  // devtool: 'source-map'
};