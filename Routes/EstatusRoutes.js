const { Router } = require("express");
const {
  crearEstatus,
  actualizarEstatus,
} = require("../Controllers/estatusController");

const estatus_router = Router();

estatus_router.post("/crearColor", crearEstatus);
estatus_router.post("/actualizarEstatus", actualizarEstatus);

module.exports = { estatus_router };
