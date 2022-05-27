const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRETKEY,
  secure: true,
});

module.exports = (app) => {
  app.get("/signature", (req, res) => {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        eager: "c_pad,h_300,w_400|c_crop,h_200,w_260",
        folder: "videos",
      },
      cloudinary.config().api_secret
    );

    res.json({ timestamp, signature, cloudname : cloudinary.config().cloud_name, apikey : cloudinary.config().api_key })
  });
};
