const { Router } = require("express");
const { reset, deleteAll } = require("../Controllers/historicoController");

const historicoRouter = Router();

historicoRouter.post("/reset", reset);

historicoRouter.delete("/deleteAll", deleteAll);

module.exports = { historicoRouter };
