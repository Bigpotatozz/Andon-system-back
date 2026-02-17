const { Router } = require("express");
const {
  obtenerProductionRatio,
  actualizarProgresoProduccion,
  obtenerTurno,
  resetearProgresoProduccionHora,
  obtenerTurnos,
} = require("../Controllers/productionController");

const turnoRouter = Router();

//Obtiene el production ratio
turnoRouter.get("/obtenerProductionRatio/:idTurno", obtenerProductionRatio);

//Actualiza el progreso de produccion
turnoRouter.post("/actualizarProgresoProduccion", actualizarProgresoProduccion);
//Obtiene un turno en especifico
turnoRouter.get("/obtenerTurno", obtenerTurno);
//Resetea el progreso de produccion
turnoRouter.put(
  "/resetearProgresoProduccionHora/:turno",
  resetearProgresoProduccionHora,
);
//Obtiene todos los turnos
turnoRouter.get("/obtenerTurnos", obtenerTurnos);

//Se exporta el router
module.exports = { turnoRouter };
