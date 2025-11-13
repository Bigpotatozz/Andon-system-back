const { Router } = require("express");
const {
  crearLinea,
  verificarExistenciaLinea,
  obtenerLineasRegistradas,
} = require("../Controllers/lineasController");

//Rutas de las lineas de produccion
const lineaRouter = Router();
//Registra nuevas lineas de produccion
lineaRouter.post("/crearLinea", crearLinea);
lineaRouter.get("/verificarExistenciaLinea/:idLinea", verificarExistenciaLinea);
lineaRouter.get("/obtenerLineasRegistradas", obtenerLineasRegistradas);

module.exports = { lineaRouter };
