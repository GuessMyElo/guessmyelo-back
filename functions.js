const jwt = require("jsonwebtoken");

const getAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET
  );
};

module.exports = {
  getAccessToken
};
