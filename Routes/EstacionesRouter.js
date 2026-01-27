const { Router } = require("express");
const {
  verificarExistenciaEstacion,
} = require("../Controllers/estacionController");

const estaciones_router = Router();

estaciones_router.get(
  "/verificarExistenciaEstacion/:idEstacion",
  verificarExistenciaEstacion,
);
