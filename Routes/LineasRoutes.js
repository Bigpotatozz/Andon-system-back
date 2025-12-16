const { Router } = require("express");
const {
  crearLinea,
  verificarExistenciaLinea,
  obtenerLineasRegistradas,
  actualizarProductionRatio,
  obtenerEstacionesTiempos,
  registrarIps,
  iniciarPLC,
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

lineaRouter.get("/iniciarPLC", iniciarPLC);

module.exports = { lineaRouter };
