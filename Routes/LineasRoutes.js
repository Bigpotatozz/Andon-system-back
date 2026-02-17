const { Router } = require("express");
const {
  crearLinea,
  verificarExistenciaLinea,
  obtenerLineasRegistradas,
  actualizarProductionRatio,
  obtenerEstacionesTiempos,
  iniciarPLC,
  obtenerEstacionesPorLinea,
  verTiemposLinea,
  obtenerLineasProudccion,
  obtenerTiemposPorLinea,
  obtenerTiemposPorEstacion,
  crearLinea2,
} = require("../Controllers/lineasController");

//Rutas de las lineas de produccion
const lineaRouter = Router();
//Registra nuevas lineas de produccion
lineaRouter.post("/crearLinea", crearLinea);
//Verifica la existencia de una estacion
lineaRouter.get("/verificarExistenciaLinea/:idLinea", verificarExistenciaLinea);
//Obtiene todas las estaciones registradas
lineaRouter.get("/obtenerLineasRegistradas", obtenerLineasRegistradas);
//Actualiza el production ratio de una linea
lineaRouter.put("/actualizarProductionRatio", actualizarProductionRatio);
//Obtiene los tiempos de las estaciones
lineaRouter.get(
  "/obtenerEstacionesTiempos/:idEstacion",
  obtenerEstacionesTiempos,
);

lineaRouter.get("/iniciarPLC", iniciarPLC);

lineaRouter.get(
  "/obtenerEstacionesPorLinea/:idLineaProduccion",
  obtenerEstacionesPorLinea,
);
lineaRouter.get("/verTiempos/:idLineaProduccion", verTiemposLinea);

lineaRouter.get("/", obtenerLineasProudccion);

lineaRouter.get("/tiemposPorLinea/:idLineaProduccion", obtenerTiemposPorLinea);

lineaRouter.get("/tiemposPorEstacion/:idEstacion", obtenerTiemposPorEstacion);

lineaRouter.post("/crearLinea2", crearLinea2);
module.exports = { lineaRouter };
