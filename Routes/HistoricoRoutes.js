const { Router } = require("express");
const { reset } = require("../Controllers/historicoController");

const historicoRouter = Router();

historicoRouter.post("/reset", reset);

module.exports = { historicoRouter };
