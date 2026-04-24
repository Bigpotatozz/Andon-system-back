const { Router } = require("express");
const {
  crearEstatus,
  actualizarEstatus,
  obtenerEstatus,
  obtenerEstatusEspecifico,
  obtenerEstatusProductionRatio,
  activarEstatus,
  obtenerEstatusRatio,
  obtenerEstatusTiempos,
  obtenerEstatusModificar,
  modificarEstatus,
  obtenerTiemposEstatus,
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
  obtenerEstatusEspecifico,
);

//Obtiene los estatus de la seccion production Ratio
estatus_router.get(
  "/obtenerEstatusProductionRatio",
  obtenerEstatusProductionRatio,
);
//Activa un estatus de production ratio
estatus_router.post("/activarEstatus/:idLinea", activarEstatus);
//Obtiene el estatus activo de production ratio
estatus_router.get("/obtenerEstatusRatio/:idLinea", obtenerEstatusRatio);
//Obtiene los tiempos de los estatus
estatus_router.get("/obtenerEstatusTiempos/", obtenerEstatusTiempos);
//Obtiene un tiempo en especifico de un estatus
estatus_router.get("/obtenerTiemposEstatus/:id", obtenerTiemposEstatus);
//Obtiene los estatus para modificar
estatus_router.get("/obtenerEstatusModificar", obtenerEstatusModificar);
//Modifica un estatus
estatus_router.put("/modificarEstatus", upload.any(), modificarEstatus);
module.exports = { estatus_router };
