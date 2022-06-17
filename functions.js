const jwt = require("jsonwebtoken");

const getAccessToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET);
};

module.exports = {
  getAccessToken,
};
