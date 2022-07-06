module.exports =  {
    dev: {
        client: 'mysql',
        connection: {
            host : process.env.DB_HOST,
            user : process.env.DB_USER,
            password : process.env.DB_PASSWORD,
            database : process.env.DB_DATABASE
        },
        migrations: {
            directory: __dirname + '/knex/migrations'
        },
        seeds: {
            directory: __dirname + '/knex/seeds'
        }
    },
    prod: {
        client: 'mysql',
        connection: {
            host : "",
            user : "",
            password : "",
        },
        migrations: {
            directory: __dirname + '/knex/migrations'
        },
        seeds: {
            directory: __dirname + '/knex/seeds'
        }
    }
}