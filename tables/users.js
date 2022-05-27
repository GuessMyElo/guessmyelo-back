const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = (app, db) => {
    const getParams = (req) => {
        return {
            username: req.body.username,
            twitch_id: req.body.twitch_id === "" ? null : JSON.stringify(req.body.twitch_id),
            discord_id: req.body.discord_id === "" ? null : JSON.stringify(req.body.discord_id),
            email: req.body.email,
            password: req.body.password,
            role: req.body.role
        }
    }

    app.get('/users', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                connection.query('SELECT * FROM users', (err, result) => {
                    connection.release();
                    if (!err) {
                        res.send(result);
                    } else {
                        console.log(err.message);
                    }
                })
            }
        })
    })

    app.get('/users/maxId', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                connection.query('SELECT MAX(id) FROM users', (err, result) => {
                    connection.release();
                    if (!err) {
                        const maxId = result[0]["MAX(id)"] === null ? 0 : result[0]["MAX(id)"];
                        res.json({ error: false, maxId });
                        console.log("Success.");
                    } else {
                        res.json({ error: true, message: "L'ID maximal n'a pas pu être récupéré." })
                        console.log(err.message);
                    }
                })
            }
        })
    })

    app.get('/users/:id', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                connection.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, result) => {
                    connection.release();

                    if (!err) {
                        res.send(result);
                        console.log("Success.");
                    } else {
                        console.log(err.message);
                    }
                })
            }
        })
    })

    app.get('/users/email/:email', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                connection.query('SELECT * FROM users WHERE email = ?', [req.params.email], (err, result) => {
                    connection.release();

                    if (!err) {
                        const accessToken = jwt.sign(
                            {
                                id: result[0].id,
                                username: result[0].username,
                                role: result[0].role,
                            },
                            process.env.JWT_SECRET
                        );
                        res.send({user : result[0], accessToken});
                        console.log("Success.");
                    } else {
                        console.log(err.message);
                    }
                })
            }
        })
    })

    app.post('/users/add', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) {
                res.json({ error: true, err });
            } else {
                let params = getParams(req);

                bcrypt.hash(params.password, parseInt(process.env.BCRYPT_SALT_ROUNDS), (err, hash) => {
                    if (err) {
                        res.json({ err });
                    } else {
                        params.password = hash;
                        connection.query('INSERT INTO users SET ?', params, (err, result) => {
                            connection.release();

                            if (!err) {
                                const accessToken = jwt.sign(
                                    {
                                        id : result.insertId,
                                        username: params.username,
                                        role: params.role,
                                    },
                                    process.env.JWT_SECRET
                                );
                                res.status(200).json({tmessage: `L'utilisateur ${params.username} a été ajouté.`, accessToken, user: params });
                            } else {
                                res.status(502).json({errno : err.errno, err : err.sqlMessage, message: "L'utilisateur n'a pas pu être ajouté." });
                                console.log(err.message);
                            }
                        })
                    }
                })
            }
        })
    })

    app.delete('/users/:id', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                connection.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
                    if (!err) {
                        res.json({ error: false, message: `L'utilisateur ${[req.params.id]} a été supprimé.` });

                        connection.query('SELECT MAX(id) FROM users', (err, result) => {
                            if (!err) {
                                const maxId = result[0]["MAX(id)"] === null ? 0 : result[0]["MAX(id)"];

                                connection.query('ALTER TABLE users AUTO_INCREMENT = ?', [maxId], (err) => {
                                    connection.release()
                                    if (err) {
                                        console.log(err.message);
                                    }
                                })
                            } else {
                                console.log(err.message);
                            }
                        })
                    } else {
                        res.json({ error: true, message: `L'utilisateur ${[req.params.id]} n'a pas pu être supprimé.` })
                        console.log(err.message);
                    }
                })
            }
        })
    })

    app.put('/users/:id', (req, res) => {
        db.getConnection((err, connection) => {
            if (err) res.json({ error: true, err });
            else {
                const params = getParams(req);

                connection.query('UPDATE users SET ? WHERE id = ?', [params, req.params.id], (err) => {
                    connection.release()

                    if (!err) {
                        res.json({ error: false, message: `L'utilisateur ${params.username} a été modifié.` });
                    } else {
                        res.json({ error: true, message: `L'utilisateur ${params.username} n'a pas été modifié.` })
                        console.log(err.message);
                    }
                })
            }
        })
    })

    app.post("/login", (req, res) => {
        db.getConnection((err, connection) => {
            if (err) {
                res.json(err);
            } else {
                const params = {
                    auth : req.body.auth,
                    password : req.body.password
                };

                connection.query("SELECT * FROM users WHERE email = ? OR username = ?", [params.auth, params.auth], (err, result) => {
                    connection.release();

                    if (err) {
                        console.log(err.message);
                        return
                    }

                    if (result.length === 0) {
                        return res.json({
                            error: true,
                            message: "Cet utilisateur n'existe pas.",
                        });
                    }

                    
                    bcrypt.compare(
                        params.password,
                        result[0].password,
                        (err, response) => {
                            if (!response) {
                                return res.json({
                                    error: true,
                                    message: "Mot de passe incorrect.",
                                });
                            }

                            const accessToken = jwt.sign(
                                {
                                    id: result[0].id,
                                    username: result[0].username,
                                    role: result[0].role,
                                },
                                process.env.JWT_SECRET
                            );
                            res.json({
                                error: false,
                                message: "Connexion réussie.",
                                user: result[0],
                                accessToken,
                            });
                        }
                    );
                }
                );
            }
        });
    })
}