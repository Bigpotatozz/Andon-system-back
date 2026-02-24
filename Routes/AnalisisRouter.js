const { Router } = require("express");
const { obtenerOEEMes } = require("../Controllers/analisisController");

const analisis_router = Router();

analisis_router.get("/obtenerOEE", obtenerOEEMes);

module.exports = analisis_router;
