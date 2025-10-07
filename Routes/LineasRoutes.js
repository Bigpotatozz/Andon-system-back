const { Router } = require("express");
const { crearLinea } = require("../Controllers/lineasController");

const lineaRouter = Router();

lineaRouter.post("/crearLinea", crearLinea);

module.exports = { lineaRouter };
