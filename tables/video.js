const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = (app, db) => {
    const getParams = (req) => {
        return {
            rank : req.body.rank,
            url : req.body.url,
            user_id : req.body.userID
        }
    }

    app.get('/video', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                connection.query('SELECT * FROM video', (err, result) => {
                    connection.release();
                    if (!err) {
                        res.send(result);
                    } else {
                        console.log(err);
                    }
                })
            }
        })
    })

    app.get('/video/maxId', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                connection.query('SELECT MAX(id) FROM video', (err, result) => {
                    connection.release();
                    if (!err) {
                        const maxId = result[0]["MAX(id)"] === null ? 0 : result[0]["MAX(id)"];
                        res.json({ error: false, maxId });
                        console.log("Success.");
                    } else {
                        res.json({ error: true, message: "L'ID maximal n'a pas pu être récupéré." })
                        console.log(err);
                    }
                })
            }
        })
    })

    app.get('/video/:id', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                connection.query('SELECT * FROM video WHERE id = ?', [req.params.id], (err, result) => {
                    connection.release();

                    if (!err) {
                        res.send(result);
                        console.log("Success.");
                    } else {
                        console.log(err);
                    }
                })
            }
        })
    })

    app.post('/video', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) {
                res.json({ error: true, err });
            } else {
                let params = getParams(req);

                bcrypt.hash(params.password, parseInt(process.env.BCRYPT_SALT_ROUNDS), (err, hash) => {
                    if (err) {
                        res.json({ err });
                        console.log(err);
                    } else {
                        params.password = hash;
                        connection.query('INSERT INTO video SET ?', params, (err) => {
                            connection.release();

                            if (!err) {
                                res.json({ error: false, message: `La vidéo ${params.username} a été ajoutée.` });
                            } else {
                                res.json({ error: true, message: "La vidéo n'a pas pu être ajoutée." });
                                console.log(err);
                            }
                        })
                    }
                })
            }
        })
    })

    app.delete('/video/:id', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                connection.query('DELETE FROM video WHERE id = ?', [req.params.id], (err) => {
                    if (!err) {
                        res.json({ error: false, message: `La vidéo ${[req.params.id]} a été supprimé.` });
                        connection.release();
                    } else {
                        res.json({ error: true, message: `La vidéo ${[req.params.id]} n'a pas pu être supprimée.` })
                        console.log(err);
                    }
                })
            }
        })
    })

    app.put('/video/:id', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                const params = getParams(req);

                connection.query('UPDATE video SET ? WHERE id = ?', [params, req.params.id], (err) => {
                    connection.release()

                    if (!err) {
                        res.json({ error: false, message: `La vidéo ${params.username} a été modifiée.` });
                    } else {
                        res.json({ error: true, message: `La vidéo ${params.username} n'a pas été modifiée.` })
                        console.log(err);
                    }
                })
            }
        })
    })
}