const { Router } = require("express");
const {
  crearEstatus,
  actualizarEstatus,
  obtenerEstatus,
  obtenerEstatusEspecifico,
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

module.exports = { estatus_router };
