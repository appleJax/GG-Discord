const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common');
const envVars = require('./.env.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false,
    }),
    new webpack.DefinePlugin({
      'process.env.BOT_TOKEN': JSON.stringify(envVars.staging.BOT_TOKEN),
      'process.env.CLOUDINARY_NAME': JSON.stringify(envVars.staging.CLOUDINARY_NAME),
      'process.env.CLOUDINARY_API_KEY': JSON.stringify(envVars.staging.CLOUDINARY_API_KEY),
      'process.env.CLOUDINARY_API_SECRET': JSON.stringify(envVars.staging.CLOUDINARY_API_SECRET),
      'process.env.MONGODB_URI': JSON.stringify(envVars.staging.MONGODB_URI),
    }),
  ],
});
