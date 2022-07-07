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


const saveUserAnswers = (room_id, answers) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await knex("rooms").where({room_id}).update({answers});
      resolve(response);
    } catch (error) {
      reject(error);
    }
  })
}

const getUserAnswers = (room_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let response = await knex("rooms").where({room_id}).select("answers");
      response.map((e) => ({...e}));
      resolve(response[0].answers);
    } catch (error) {
      reject(error);
    }
  })
}

module.exports = {
  getAccessToken,
  getRandomVideos,
  saveUserAnswers,
  getUserAnswers
};
