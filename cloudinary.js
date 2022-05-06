const { exec } = require("child_process");
const formidable = require("formidable");
const ffmpeg = require("ffmpeg");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRETKEY,   
    secure: true
});

module.exports = (app) => {
    app.post("/upload", (req, res) => {
        const file = req;
        console.log(req.files);
        if(file === null) {
            res.status(400).send("Aucune vidéo n'a été envoyée.")
        } else {
            cloudinary.uploader.upload_stream({}, (err, result) => {
                if(!err) {
                    console.log(result);
                } else {
                    console.log(err);
                }
                res.send("Fin")
            }).end(file.data);
        }

    })
}