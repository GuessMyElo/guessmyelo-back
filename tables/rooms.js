const bcrypt = require("bcrypt");
const { json } = require("express");

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
            if (err) return res.json({ error: true, err });
            const id = req.params.id;
            connection.query('SELECT * FROM rooms WHERE room_id = ?', [id], (roomerr, room_info) => {
                if(roomerr || !room_info[0]) return res.status(404).json({success: false, message: `Can't find room for id ${id}`});

                const participants = room_info[0] ?room_info[0].participants : null;
                connection.query('SELECT id, username FROM users WHERE id = ?', participants, (participantserr, users) => {
                    connection.release();
                    if (participantserr) return res.status(400).json({success: false, message: `Can't find participants for room:  ${id}`});

                    if (!participantserr) {
                        const { config, room_owner, room_id } = room_info[0];
                        return res.status(200).json({room_info: {config: JSON.parse(config), participants: JSON.parse(participants), room_id, room_owner}, users});
                    }
                })
            })
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
                            config: JSON.stringify({}),
                            room_owner: user_id,
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