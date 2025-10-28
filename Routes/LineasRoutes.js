const { Router } = require("express");
const { crearLinea } = require("../Controllers/lineasController");

//Rutas de las lineas de produccion
const lineaRouter = Router();
//Registra nuevas lineas de produccion
lineaRouter.post("/crearLinea", crearLinea);

module.exports = { lineaRouter };
