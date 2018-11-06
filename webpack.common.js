const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const envVars = require('./.env.js');

module.exports = {
  entry: [
    '@babel/polyfill',
    './src/index.js',
  ],
  target: 'node',
  node: {
    __dirname: false,
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
              '@babel/preset-env',
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(`${__dirname}/dist`),
    new CopyWebpackPlugin([
      { from: `${__dirname}/src/admin` },
      { from: `${__dirname}/src/bot/commands`, to: 'commands'  },
    ]),
    new webpack.DefinePlugin({
      'process.env.ADMIN_PW': JSON.stringify(envVars.ADMIN_PW),
      'process.env.ADMIN_USERNAME': JSON.stringify(envVars.ADMIN_USERNAME),
      'process.env.BOT_TOKEN': JSON.stringify(envVars.BOT_TOKEN),
      'process.env.CLOUDINARY_NAME': JSON.stringify(envVars.CLOUDINARY_NAME),
      'process.env.CLOUDINARY_API_KEY': JSON.stringify(envVars.CLOUDINARY_API_KEY),
      'process.env.CLOUDINARY_API_SECRET': JSON.stringify(envVars.CLOUDINARY_API_SECRET),
      'process.env.MONGODB_URI': JSON.stringify(envVars.MONGODB_URI),
      'process.env.SESSION_SECRET': JSON.stringify(envVars.SESSION_SECRET),
    }),
  ],
  resolve: {
    alias: {
      Anki: `${__dirname}/src/anki`,
      Bot: `${__dirname}/src/bot`,
      Config: `${__dirname}/src/config`,
      DB: `${__dirname}/src/db`,
      Models: `${__dirname}/src/db/models`,
      Src: `${__dirname}/src`,
      Utils: `${__dirname}/src/utils`,
    },
  },
};
