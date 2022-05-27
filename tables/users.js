const bcrypt = require("bcrypt");
const { getAccessToken } = require("../functions");
const knex = require("../knex/knex");

module.exports = (app) => {
  const getParams = (req) => {
    return {
      username: req.body.username,
      twitch_id:
        req.body.twitch_id === "" ? null : JSON.stringify(req.body.twitch_id),
      discord_id:
        req.body.discord_id === "" ? null : JSON.stringify(req.body.discord_id),
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    };
  };

  app.get("/users", async (req, res) => {
    try {
      const response = await knex.select().from("users");
      res.status(200).send(response);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  app.get("/users/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const response = await knex("users").where({ id }).select();
      res.status(200).send(response[0]);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  app.get("/users/email/:email", async (req, res) => {
    const email = req.params.email;
    try {
      const response = await knex("users").where({ email }).select();
      const user = response[0];

      let accessToken;
      if (user) {
        accessToken = getAccessToken(user);
      }

      res.status(user ? 200 : 204).json({ user, accessToken });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  app.post("/register", async (req, res) => {
    let params = getParams(req);
    try {
      params.password = bcrypt.hashSync(
        params.password,
        parseInt(process.env.BCRYPT_SALT_ROUNDS)
      );

      const response = await knex("users").insert(params);

      const accessToken = getAccessToken({
        id: response[0],
        username: params.username,
        role: params.role,
      });

      const { password, ...user } = params;

      res.status(200).json({
        message: `L'utilisateur ${user.username} a été ajouté.`,
        accessToken,
        user,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  app.delete("/users/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const response = await knex("users").where({ id }).del();
      res
        .status(200)
        .send(
          response > 0
            ? `L'utilisateur ${id} a été supprimé.`
            : `L'utilisateur ${id} n'existe pas.`
        );
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  app.put("/users/:id", async (req, res) => {
    const id = req.params.id;
    const params = getParams(req);

    try {
      const response = await knex("users").where({ id }).update(params);
      res
        .status(200)
        .send(
          response > 0
            ? `L'utilisateur ${id} a été modifié.`
            : `L'utilisateur ${id} n'existe pas.`
        );
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  app.post("/login", async (req, res) => {
    const params = {
      auth: req.body.auth,
      password: req.body.password,
    };

    try {
      const response = await knex
        .select()
        .from("users")
        .where({ username: params.auth })
        .orWhere({ email: params.auth });

      if (response.length === 0)
        return res
          .status(401)
          .json({ message: "Nom d'utilisateur ou mot de passe incorrect" });

      const user = response[0];

      const isPasswordCorrect = bcrypt.compareSync(
        params.password,
        user.password
      );

      if (!isPasswordCorrect)
        return res
          .status(401)
          .json({ message: "Nom d'utilisateur ou mot de passe incorrect" });

      const accessToken = getAccessToken(user);

      res.status(200).json({ user, accessToken });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });
};
