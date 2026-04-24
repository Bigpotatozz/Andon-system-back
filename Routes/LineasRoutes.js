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
  obtenerProductionRatioPorLinea,
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
lineaRouter.put(
  "/actualizarProductionRatio/:idLinea",
  actualizarProductionRatio,
);
//Obtiene los tiempos de las estaciones
lineaRouter.get(
  "/obtenerEstacionesTiempos/:idEstacion",
  obtenerEstacionesTiempos,
);
//Inicia el script del PLC
lineaRouter.post("/iniciarPLC", iniciarPLC);

//Obtiene las estaciones por linea de produccion
lineaRouter.get(
  "/obtenerEstacionesPorLinea/:idLineaProduccion",
  obtenerEstacionesPorLinea,
);
//Obtiene los tiempos de las estaciones de una linea de produccion
lineaRouter.get("/verTiempos/:idLineaProduccion", verTiemposLinea);
//Obtiene todas las lineas de produccion
lineaRouter.get("/", obtenerLineasProudccion);
//Obtiene los tiempos de las estaciones por linea de produccion
lineaRouter.get("/tiemposPorLinea/:idLineaProduccion", obtenerTiemposPorLinea);

//Obtiene los tiempos de una estacion en especifico
lineaRouter.get("/tiemposPorEstacion/:idEstacion", obtenerTiemposPorEstacion);
//Crear linea de produccion (SOLO VERSION MULTILINE)
lineaRouter.post("/crearLinea2", crearLinea2);
//Obtiene los tiempos de production ratio de una linea en especifico
lineaRouter.get("/obtenerProductionRatioPorLinea/:idLinea", obtenerProductionRatioPorLinea);
//Exportacion del router
module.exports = { lineaRouter };
