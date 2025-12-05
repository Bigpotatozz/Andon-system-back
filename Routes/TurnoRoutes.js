const { Router } = require("express");
const {
  obtenerProductionRatio,
  actualizarProgresoProduccion,
} = require("../Controllers/productionController");

const turnoRouter = Router();

turnoRouter.get("/obtenerProductionRatio", obtenerProductionRatio);

turnoRouter.post("/actualizarProgresoProduccion", actualizarProgresoProduccion);

module.exports = { turnoRouter };
