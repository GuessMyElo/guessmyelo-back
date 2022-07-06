const bcrypt = require("bcrypt");
const { json } = require("express");
const knex = require("../knex/knex");

module.exports = (app, db) => {
    const getParams = (req) => {
        return {
            room_id: req.body.room_id,
            config_id: req.body.config_id,
            participants: req.body.participants
        }
    }

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
          const response = await knex("rooms").where({ id }).select();
          res.status(200).send(response[0]);
        } catch (error) {
          console.log(error);
          res.status(500).send(error);
        }
    })

    app.post('/rooms/create', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                const { user_id } = req.body;
                bcrypt.hash(String(user_id), parseInt(process.env.BCRYPT_SALT_ROUNDS), (err, hash) => {
                    if (err) {
                        res.json({ err });
                    } else {
                        const resplaceCharacters = ['/', '.', '$']
                        resplaceCharacters.map(elem => {
                            hash = hash.replaceAll(elem, "");
                        })
                        const params = {
                            room_id: hash,
                            config_id: 1,
                            participants: JSON.stringify([user_id])
                        }

                        connection.query('INSERT INTO rooms SET ?', params, (err, results) => {
                            connection.release();
                            console.log(err)
                            if (!err) {
                                return res.status(200).json({ room_id: hash });
                            }
                            return res.status(400);
                        })
                    }
                })
            }
        })    
    })

    app.post('/rooms/update', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                const { room_id } = req.body;
                const config = JSON.stringify(req.body.config);
                const participants = JSON.stringify(req.body.participants);

                connection.query('UPDATE rooms SET config = ?, participants = ? WHERE room_id = ?', [config, participants, room_id], (err, results) => {
                    connection.release();
                    if (!err) {
                        return res.status(200).json({success: true});
                    }
                    return res.status(400);
                })
            }
        })    
    })
}