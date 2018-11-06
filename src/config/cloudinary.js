import cloudinary from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadImage(imagePath, options = {}) {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(imagePath, options, (err, result) => {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(result.secure_url);
    });
  });
}

export default uploadImage;
