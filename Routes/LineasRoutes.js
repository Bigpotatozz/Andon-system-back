const { Router } = require("express");
const {
  crearLinea,
  verificarExistenciaLinea,
  obtenerLineasRegistradas,
  actualizarProductionRatio,
  obtenerEstacionesTiempos,
} = require("../Controllers/lineasController");

//Rutas de las lineas de produccion
const lineaRouter = Router();
//Registra nuevas lineas de produccion
lineaRouter.post("/crearLinea", crearLinea);
lineaRouter.get("/verificarExistenciaLinea/:idLinea", verificarExistenciaLinea);
lineaRouter.get("/obtenerLineasRegistradas", obtenerLineasRegistradas);
lineaRouter.put("/actualizarProductionRatio", actualizarProductionRatio);
lineaRouter.get(
  "/obtenerEstacionesTiempos/:idEstacion",
  obtenerEstacionesTiempos
);

module.exports = { lineaRouter };
