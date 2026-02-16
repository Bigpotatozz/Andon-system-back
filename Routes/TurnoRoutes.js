const { Router } = require("express");
const {
  obtenerProductionRatio,
  actualizarProgresoProduccion,
  obtenerTurno,
  resetearProgresoProduccionHora,
  obtenerTurnos,
} = require("../Controllers/productionController");

const turnoRouter = Router();

turnoRouter.get("/obtenerProductionRatio/:idTurno", obtenerProductionRatio);

turnoRouter.post("/actualizarProgresoProduccion", actualizarProgresoProduccion);
turnoRouter.get("/obtenerTurno", obtenerTurno);

turnoRouter.put(
  "/resetearProgresoProduccionHora/:turno",
  resetearProgresoProduccionHora,
);

turnoRouter.get("/obtenerTurnos", obtenerTurnos);

module.exports = { turnoRouter };
