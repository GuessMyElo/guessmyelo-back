module.exports = (app, db) => {
    const getParams = (req) => {
        return {
            rank : req.body.rank,
            url : req.body.url,
            userId : req.body.userId,
            public_id : req.body.public_id,
            status : req.body.status,
            game : req.body.game
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
    
    app.get('/video/notverified', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                connection.query('SELECT * FROM video WHERE status="not verified"', (err, result) => {
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
                const params = getParams(req);

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
                        res.json({ error: false, message: `La vidéo ${req.params.id} a été supprimé.` });
                        connection.release();
                    } else {
                        res.json({ error: true, message: `La vidéo ${req.params.id} n'a pas pu être supprimée.` })
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
                        res.json({ error: false, message: `La vidéo ${req.params.id} a été modifiée.` });
                    } else {
                        res.json({ error: true, message: `La vidéo ${req.params.id} n'a pas été modifiée.` })
                        console.log(err);
                    }
                })
            }
        })
    })
}