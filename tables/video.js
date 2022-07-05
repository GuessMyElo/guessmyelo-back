const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const knex = require("../knex/knex");

module.exports = (app, db) => {
    const getParams = (req) => {
        return {
            rank : req.body.rank,
            url : req.body.url,
            userId : req.body.userId
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

    app.get("/video/random/:limit", async (req, res) => {
        const limit = req.params.limit;
        try {
          const response = await knex("video").select().orderByRaw("RAND()").limit(limit);
          res.status(200).send(response);
        } catch (error) {
          console.log(error);
          res.status(500).send(error);
        }
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

                connection.query('INSERT INTO video SET ?', params, (err) => {
                    connection.release();

                    if (!err) {
                        res.json({ error: false, message: `La vidéo a été ajoutée.` });
                    } else {
                        res.json({ error: true, message: "La vidéo n'a pas pu être ajoutée." });
                        console.log(err);
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