const environment = process.env.ENVIRONMENT || 'dev'
let config = require('./knexfile.js')[environment];
let knex = require('knex')(config);

module.exports = (app) => {
    const buildtable = async (tableName, knex) => {
        try {
            await knex.schema.createTable(tableName, (table) => {
                switch (tableName) {
                    case "users":
                        table.bigincrements("id");
                        table.json("twitch_id")
                        table.json("discord_id")
                        table.string('username', 191).unique().notNullable();
                        table.string('email', 191).unique().notNullable();
                        table.string('password');
                        table.string('role').notNullable();
                        table.string('imageUrl');
                        break;
                    case "video":
                        table.bigincrements("id");
                        table.string("rank").notNullable();
                        table.string("url").notNullable();
                        table.integer("userId").notNullable();
                        table.string("public_id").notNullable();
                        table.string("status").notNullable();
                        table.string("game").notNullable();
                        break;
                    case "rooms":
                        table.string('room_id', 191).unique().notNullable();
                        table.json('config').notNullable();
                        table.integer('room_owner').notNullable();
                        table.json('participants').notNullable();
                        table.json('answers');
                    default:
                        break;
                }
            })
            switch (tableName) {
                case "users":
                    await knex('users').insert([
                        {
                            username: 'admin',
                            email: 'admin@admin.fr',
                            password: '$2b$10$zTRywOrJ1ASK7ScTx3zfkefY6t2y1nMZGqFmxwrA2Q86/pU2lv8ma', // admin
                            role: 'admin'
                        },
                        {
                            username: 'user',
                            email: 'user@user.fr',
                            password: '$2b$10$HEHC/d7GJlMpUCW/YOialu6PzUwBAhAgpmQxOdhByzc6PQ2tBwY/e', // user
                            role: 'user'
                        }
                    ]);
                    break;
                default:
                    break;
            }

            return {success : true};
        } catch (error) {
            console.log(error);
            return {success : false, error};
        }
    }

    app.get("/buildtable/:tableName", (req,res) => {
        const tableName = req.params.tableName;

        knex.raw(`CREATE DATABASE ${process.env.DB_NAME}`)
        .then(async () => {
            knex.destroy();

            config.connection.database = process.env.DB_NAME;
            knex = require('knex')(config);

            const response = await buildtable(tableName, knex);
            res.json({success : response.success, message : response.error!==undefined ? response.error.sqlMessage : `La table ${tableName} a bien ??t?? cr????e.`})
        })
        .catch(async (error) => {
            if(error.errno===1007) {
                config.connection.database = process.env.DB_NAME;
                knex = require('knex')(config);

                const response = await buildtable(tableName, knex);
                res.json({success : response.success, message : response.error!==undefined ? response.error.sqlMessage : `La table ${tableName} a bien ??t?? cr????e.`});
            } else {
                res.json({error});
                console.log(error);
            }
        })
    })

    app.delete("/droptable/:tableName", async (req,res) => {
        const tableName = req.params.tableName;
        try {
            config.connection.database = process.env.DB_NAME;
            knex = require('knex')(config);
            await knex.schema.dropTable(tableName);

            res.json({error : false, message : `La table "${tableName}" a bien ??t?? supprim??e.`})
        } catch (error) {
            res.json({error : true, message : `La table "${tableName}" n'a pas pu ??tre supprim??e. ${error.sqlMessage}.`})
            console.log(error);
        }
    })
}