const bcrypt = require("bcrypt");
const knex = require("../knex/knex");

module.exports = (app) => {
    app.get("/rooms", async (req, res) => {
        try {
          const response = await knex.select().from("rooms");
          res.status(200).send(response);
        } catch (error) {
          console.log(error);
          res.status(500).send(error);
        }
      });
    

      app.get('/rooms/:id', async (req, res) => {
        const id = req.params.id;
        try {
          const response = await knex("rooms").where({ room_id : id }).select();
          const participants = JSON.parse(response[0].participants);
          const users = await knex("users").select().whereIn("id", participants)
          console.log("ROOMS", participants);
          res.status(200).send({room_info : response[0], users});
        } catch (error) {
          console.log(error);
          res.status(500).send(error);
        }
    })

    app.post('/rooms/create', (req, res) => {
        const { user_id } = req.body;
        bcrypt.hash(String(user_id), parseInt(process.env.BCRYPT_SALT_ROUNDS), async (err, hash) => {
            if (err) {
                res.status(500).send(err);
            } 

            const resplaceCharacters = ['/', '.', '$']
            resplaceCharacters.map(elem => {
                hash = hash.replaceAll(elem, "");
            })
            const params = {
                room_id: hash,
                config: {},
                participants: JSON.stringify([user_id]),
                room_owner: user_id
            }

            try {
                await knex("rooms").insert(params);
                return res.status(200).json({room_id : hash});
            } catch (error) {
                res.status(500).send(error);
            }
        })
    })

    app.post('/rooms/update', async (req, res) => {
        const { room_id } = req.body;
        const config = JSON.stringify(req.body.config);
        const participants = req.body.participants;

        try {
            await knex("rooms").update({config, participants: JSON.stringify(participants.map((p) => p.id))}).where({room_id})
            res.status(200).json({success : true})
        } catch (error) {
            res.status(500).send(error);
        }
    })
}