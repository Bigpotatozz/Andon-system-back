const { Router } = require("express");
const {
  crearLinea,
  verificarExistenciaLinea,
  obtenerLineasRegistradas,
  actualizarProductionRatio,
  obtenerEstacionesTiempos,
  registrarIps,
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

lineaRouter.put("/registrarIp", registrarIps);

module.exports = { lineaRouter };
