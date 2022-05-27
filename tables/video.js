const knex = require("../knex/knex");

module.exports = (app, db) => {
  app.get("/video", async (req, res) => {
    try {
      const response = await knex.select().from("video");
      res.status(200).send(response);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  app.get("/video/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const response = await knex("video").where({ id }).select();
      res.status(200).send(response[0]);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  app.post("/video", async (req, res) => {
    const params = req.body;
    try {
      await knex("video").insert(params);
      res.status(204).send(`La vidéo a été ajouté.`);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  app.delete("/video/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const response = await knex("video").where({ id }).del();
      res
        .status(200)
        .send(
          response > 0
            ? `La vidéo ${id} a été supprimée.`
            : `La vidéo ${id} n'existe pas.`
        );
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  app.put("/video/:id", async (req, res) => {
    const id = req.params.id;
    const params = req.body;

    try {
      const response = await knex("video").where({ id }).update(params);
      res
        .status(200)
        .send(
          response > 0
            ? `La vidéo ${id} a été modifiée.`
            : `La vidéo ${id} n'existe pas.`
        );
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });
};
