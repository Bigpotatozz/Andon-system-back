const { Router } = require("express");
const {
  obtenerProductionRatio,
  actualizarProgresoProduccion,
  obtenerTurno,
  resetearProgresoProduccionHora,
} = require("../Controllers/productionController");

const turnoRouter = Router();

turnoRouter.get("/obtenerProductionRatio", obtenerProductionRatio);

turnoRouter.post("/actualizarProgresoProduccion", actualizarProgresoProduccion);
turnoRouter.get("/obtenerTurno", obtenerTurno);

turnoRouter.put(
  "/resetearProgresoProduccionHora/:turno",
  resetearProgresoProduccionHora
);

module.exports = { turnoRouter };
