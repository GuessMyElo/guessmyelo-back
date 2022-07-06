const jwt = require("jsonwebtoken");
const knex = require("./knex/knex");

const getAccessToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET);
};

const getRandomVideos = async (limit) => {
    try {
      const response = await knex("video").select().orderByRaw("RAND()").limit(limit);
      return response;
    } catch (error) {
      console.log(error);
      return null;
    }
}

module.exports = {
  getAccessToken,
  getRandomVideos
};
