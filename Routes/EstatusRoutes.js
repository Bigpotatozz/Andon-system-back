const { Router } = require("express");
const {
  crearEstatus,
  actualizarEstatus,
  obtenerEstatus,
  obtenerEstatusEspecifico,
  obtenerEstatusProductionRatio,
  activarEstatus,
  obtenerEstatusRatio,
  obtenerProductionRatio,
  actualizarProgresoProduccion,
} = require("../Controllers/estatusController");
const upload = require("../Helpers/fileUpload");

//Definicion de rutas para el manejo de estatus
const estatus_router = Router();
//Crea un estatus nuevo
estatus_router.post("/crearColor", upload.any(), crearEstatus);
//Actualiza el estatus de una linea de produccion
estatus_router.post("/actualizarEstatus", actualizarEstatus);
//Obtiene todos los estatus
estatus_router.get("/obtenerEstatus", obtenerEstatus);
//Obtiene un estatus especifico de una linea
estatus_router.get(
  "/obtenerEstatusEspecifico/:idEstatus",
  obtenerEstatusEspecifico
);
estatus_router.get(
  "/obtenerEstatusProductionRatio",
  obtenerEstatusProductionRatio
);
estatus_router.post("/activarEstatus", activarEstatus);
estatus_router.get("/obtenerEstatusRatio", obtenerEstatusRatio);

estatus_router.get("/obtenerProductionRatio", obtenerProductionRatio);

estatus_router.post(
  "/actualizarProgresoProduccion",
  actualizarProgresoProduccion
);

//estatus_router.get("/obtenerEstatusSocket");

module.exports = { estatus_router };
