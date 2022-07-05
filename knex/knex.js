const environment = process.env.ENVIRONMENT || 'dev'
let config = require('./knexfile.js')[environment];
config.connection.database = process.env.DB_NAME;
const knex = require('knex')(config);

module.exports = knex;