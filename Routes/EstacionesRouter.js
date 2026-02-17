const { Router } = require("express");
const {
  verificarExistenciaEstacion,
} = require("../Controllers/estacionController");

const estaciones_router = Router();

//Ruta que verifica la existencia de una estacion
estaciones_router.get(
  "/verificarExistenciaEstacion/:idEstacion",
  verificarExistenciaEstacion,
);
