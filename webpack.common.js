const CleanWebpackPlugin = require('clean-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const envVars = require('./.env.js');

module.exports = {
  entry: [
    '@babel/polyfill',
    './src/index.js'
  ],
  target: 'node',
  node: {
    __dirname: false
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env'
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(__dirname + '/dist'),
    new webpack.DefinePlugin({
      'process.env.COMMANDS_PATH':           JSON.stringify(envVars.COMMANDS_PATH),
      'process.env.CONFIG_FILE_PATH':        JSON.stringify(envVars.CONFIG_FILE_PATH),
      'process.env.MESSAGE_PROCESSORS_PATH': JSON.stringify(envVars.MESSAGE_PROCESSORS_PATH),
      'process.env.MONGODB_URI':             JSON.stringify(envVars.MONGODB_URI),
      'process.env.SETTINGS_PATH':           JSON.stringify(envVars.SETTINGS_PATH)
    })
  ],
  resolve: {
    alias: {
      Config:  __dirname + '/src/config',
      DB:      __dirname + '/src/db',
      Models:  __dirname + '/src/db/models',
      Src:     __dirname + '/src',
      Utils:   __dirname + '/src/utils'
    }
  }
};
