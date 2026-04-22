const { Router } = require("express");
const {
  obtenerOEEMes,
  obtenerObjetivosDia,
  obtenerRankingParosLinea,
  obtenerRankingParosEstacion,
  obtenerOEEPrincipal,
} = require("../Controllers/analisisController");

const analisis_router = Router();

analisis_router.get("/obtenerOEE", obtenerOEEMes);
analisis_router.get("/obtenerRankingParosLinea", obtenerRankingParosLinea);
analisis_router.get("/obtenerObjetivosDia", obtenerObjetivosDia);
analisis_router.get(
  "/obtenerRankingParosEstacion/",
  obtenerRankingParosEstacion,
);

module.exports = analisis_router;
