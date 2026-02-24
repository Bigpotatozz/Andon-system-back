const { Router } = require("express");
const {
  obtenerOEEMes,
  obtenerRankingParos,
} = require("../Controllers/analisisController");

const analisis_router = Router();

analisis_router.get("/obtenerOEE", obtenerOEEMes);
analisis_router.get("/obtenerRankingParos", obtenerRankingParos);

module.exports = analisis_router;
