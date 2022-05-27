const bcrypt = require("bcrypt");

module.exports = (app, db) => {
    const getParams = (req) => {
        return {
            room_id: req.body.room_id,
            config: req.body.config,
            participants: req.body.participants
        }
    }

    app.get('/rooms/:id', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                const id = req.params.id;
                connection.query('SELECT * FROM rooms WHERE room_id = ?', [id], (err, room_info) => {
                    console.log('rooms id : ',room_info[0]);
                    const roomOwner = room_info[0] ? room_info[0].room_owner : -1;
                    connection.query('SELECT id, username FROM users WHERE id = ?', [roomOwner], (err, users) => {
                        connection.release();
                        if (!err) {
                            res.status(200).json({room_info: room_info[0], users});
                        }
                    })
                })
            }           
        })
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
                            config_id: -1,
                            room_owner:user_id
                        }

                        console.log(params)

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
}