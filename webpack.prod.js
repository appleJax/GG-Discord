const merge = require('webpack-merge');
const common = require('./webpack.common');
const envVars = require('./env.js');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BOT_TOKEN': JSON.stringify(envVars.prod.BOT_TOKEN),
      'process.env.CLOUDINARY_NAME': JSON.stringify(envVars.prod.CLOUDINARY_NAME),
      'process.env.CLOUDINARY_API_KEY': JSON.stringify(envVars.prod.CLOUDINARY_API_KEY),
      'process.env.CLOUDINARY_API_SECRET': JSON.stringify(envVars.prod.CLOUDINARY_API_SECRET),
      'process.env.MONGODB_URI': JSON.stringify(envVars.prod.MONGODB_URI),
    }),
  ]
});
