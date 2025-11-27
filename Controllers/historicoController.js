const { pool } = require("../Config/connection");

const reset = async (req, res) => {
  try {
    //INSERCION EN TABLA DE TIEMPO HISTORICO
    const insertTiempohistorico = `INSERT INTO tiempohistorico(fecha, inicio, final, total, idTiempo)
    SELECT fecha, inicio, final, total, idTiempo from tiempo`;
    const querInsertTiempohistorico = await pool.query(insertTiempohistorico);

    //ESTABLECE COMO NULL TODOS LOS REGISTROS DE LA TABLA TIEMPO
    const resetTiempo = `UPDATE tiempo set inicio = NULL, final = NULL, total = NULL`;
    const querResetTiempo = await pool.query(resetTiempo);

    //RESETEA COMO 0 EL ESTATUS ACTUAL DE LA LINEA DE PRODUCCION
    const resetEstatusActual = `UPDATE estacion set estatusActual = 0`;
    const querResetEstatusActual = await pool.query(resetEstatusActual);

    //INSERCION EN TABLA DE TURNOS HISTORICO
    const insertTurnosHistorico = `insert into turnoHistorico (nombreTurno, horaInicio, horaFin, objetivoProduccion, progresoProduccion, idTurno)
    select nombreTurno, horaInicio, horaFin, objetivoProduccion, progresoProduccion, idTurno from turno`;
    const querInsertTurnosHistorico = await pool.query(insertTurnosHistorico);

    const resetTurno = `UPDATE turno set objetivoProduccion = 0, progresoProduccion = 0`;
    const querResetTurno = await pool.query(resetTurno);

    return res.status(200).send({
      message: "Reseteo exitoso",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

module.exports = { reset };
