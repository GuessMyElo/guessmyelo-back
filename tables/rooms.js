const bcrypt = require("bcrypt");
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
        // db.getConnection((err, connection) => {
        //     if (err) res.json({ error: true, err });
        //     else {
        //         const id = req.params.id;
        //         connection.query('SELECT * FROM rooms WHERE room_id = ?', [id], (err, room_info) => {
        //             const participants = JSON.parse(room_info[0].participants);
        //             connection.query('SELECT id, username FROM users WHERE id IN (?)', [participants], (err, users) => {
        //                 connection.release();
        //                 if (!err) {
        //                     res.status(200).json({room_info, users});
        //                 }
        //             })
        //         })
        //     }           
        // })
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
                            if (!err) {
                                res.status(200).json({ room_id: hash });
                            }
                        })
                    }
                })
            }
        })    
    })

    app.put("")
}