const { Router } = require("express");
const {
  crearEstatus,
  actualizarEstatus,
  obtenerEstatus,
} = require("../Controllers/estatusController");

const estatus_router = Router();

estatus_router.post("/crearColor", crearEstatus);
estatus_router.post("/actualizarEstatus", actualizarEstatus);
estatus_router.get("/obtenerEstatus", obtenerEstatus);

module.exports = { estatus_router };
