const { Router } = require("express");
const {
  obtenerProductionRatio,
  actualizarProgresoProduccion,
  obtenerTurno,
} = require("../Controllers/productionController");

const turnoRouter = Router();

turnoRouter.get("/obtenerProductionRatio", obtenerProductionRatio);

turnoRouter.post("/actualizarProgresoProduccion", actualizarProgresoProduccion);
turnoRouter.get("/obtenerTurno", obtenerTurno);

module.exports = { turnoRouter };
