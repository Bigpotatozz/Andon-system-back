const { Router } = require("express");
const {
  obtenerProductionRatio,
  actualizarProgresoProduccion,
  obtenerTurno,
  resetearProgresoProduccionHora,
  obtenerTurnos,
  actualizarProgresoProduccionMultiLinea,
} = require("../Controllers/productionController");
const { obtenerTurnosPorLinea } = require("../Controllers/turnosController");

const turnoRouter = Router();

//Obtiene el production ratio
turnoRouter.get("/obtenerProductionRatio/:idTurno", obtenerProductionRatio);

//Actualiza el progreso de produccion
turnoRouter.post("/actualizarProgresoProduccion", actualizarProgresoProduccion);
//Actualiza el progreso de produccion en base a la linea de produccion
turnoRouter.post(
  "/actualizarProgresoProduccionMultiLinea/:idLineaProduccion",
  actualizarProgresoProduccionMultiLinea,
);
//Obtiene un turno en especifico
turnoRouter.get("/obtenerTurno", obtenerTurno);
//Resetea el progreso de produccion
turnoRouter.put(
  "/resetearProgresoProduccionHora/:turno",
  resetearProgresoProduccionHora,
);
//Obtiene todos los turnos
turnoRouter.get("/obtenerTurnos", obtenerTurnos);

turnoRouter.get(
  "/obtenerTurnosPorLinea/:idLineaProduccion",
  obtenerTurnosPorLinea,
);
//Se exporta el router
module.exports = { turnoRouter };
