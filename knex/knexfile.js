module.exports =  {
    dev: {
        client: 'mysql',
        connection: {
            host : "localhost",
            user : "root",
            password : ""
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