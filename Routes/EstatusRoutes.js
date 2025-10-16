const { Router } = require("express");
const {
  crearEstatus,
  actualizarEstatus,
  obtenerEstatus,
  obtenerEstatusEspecifico,
} = require("../Controllers/estatusController");
const upload = require("../Helpers/fileUpload");

const estatus_router = Router();

estatus_router.post("/crearColor", upload.any(), crearEstatus);
estatus_router.post("/actualizarEstatus", actualizarEstatus);
estatus_router.get("/obtenerEstatus", obtenerEstatus);
estatus_router.get(
  "/obtenerEstatusEspecifico/:idEstatus",
  obtenerEstatusEspecifico
);

module.exports = { estatus_router };
