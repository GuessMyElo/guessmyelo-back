const knex = require("./knex/knex");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRETKEY,
  secure: true,
});

module.exports = (app) => {
  app.get("/cloudinary/*", (req, res) => {
    const prefix = req.params[0];
    cloudinary.api.resources(
      { resource_type: "video", type: "upload", prefix },
      (err, result) => {
        if (err) {
          res.json({ error: true, message: err.message });
        } else {
          res.send(result.resources);
        }
      }
    );
  });

  app.post("/cloudinary/signature", (req, res) => {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        eager: "c_pad,h_300,w_400|c_crop,h_200,w_260",
        folder: req.body.folder,
      },
      cloudinary.config().api_secret
    );

    res.json({
      timestamp,
      signature,
      cloudname: cloudinary.config().cloud_name,
      apikey: cloudinary.config().api_key,
    });
  });

  app.post("/cloudinary/image", (req, res) => {
    const { folder, id } = req.body;
    const file = req.files.file;
    cloudinary.uploader
      .upload_stream({ folder }, async (err, result) => {
        if (err) return res.status(500).send(err);
        try {
          const response = await knex("users")
            .where({ id })
            .update({ imageUrl: result.secure_url });
          res.status(200).json({ message: "L'image de profil a été ajoutée.", url: result.secure_url });
        } catch (error) {
          res.status(500).send(error);
        }
      })
      .end(file.data);
  });

  app.put("/cloudinary/validate", (req, res) => {
    const video = req.body;
    const videoName = video.public_id.split("/").slice(-1)[0];
    const newPublicId = `videos/${video.game}/${videoName}`;
    cloudinary.uploader.rename(
      video.public_id,
      newPublicId,
      { resource_type: "video" },
      async (err, result) => {
        if (err) return res.status(500).send(err);

        const params = {
          status: "verified",
          url: result.secure_url,
          public_id: result.public_id,
        };

        try {
          const response = await knex("video")
            .where({ id: video.id })
            .update(params);
          res
            .status(200)
            .send(
              response > 0
                ? "La vidéo a été validée"
                : "La vidéo n'a pas été trouvée"
            );
        } catch (error) {
          res.status(500).send(error);
        }
      }
    );
  });

  app.delete("/cloudinary/*", (req, res) => {
    const public_id = req.params[0];
    cloudinary.uploader.destroy(
      public_id,
      { resource_type: "video" },
      (err, response) => {
        if (err || response.result !== "ok") {
          res.json({ error: true, message: response.result || err.message });
        } else {
          res.json({ error: false, message: "La vidéo a été supprimée." });
        }
      }
    );
  });
};
