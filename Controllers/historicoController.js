const { pool } = require("../Config/connection");

const reset = async (req, res) => {
  try {
    //INSERCION EN TABLA DE TIEMPO HISTORICO
    const insertTiempohistorico = `INSERT INTO tiempohistorico(fecha, inicio, final, total, contador, idTiempo)
    SELECT fecha, inicio, final, total, contador, idTiempo from tiempo`;
    const querInsertTiempohistorico = await pool.query(insertTiempohistorico);

    //ESTABLECE COMO NULL TODOS LOS REGISTROS DE LA TABLA TIEMPO
    const resetTiempo = `UPDATE tiempo set inicio = NULL, final = NULL, total = NULL, contador = 0`;
    const querResetTiempo = await pool.query(resetTiempo);

    //RESETEA COMO 0 EL ESTATUS ACTUAL DE LA LINEA DE PRODUCCION
    const resetEstatusActual = `UPDATE estacion set estatusActual = 0`;
    const querResetEstatusActual = await pool.query(resetEstatusActual);

    const resetTurno = `update objetivo set objetivoProduccionHora = 0, objetivoProduccion = 0, progresoProduccion = 0, progresoProduccionHora = 0`;
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

const deleteAll = async (req, res) => {
  try {
    const queryBorrar = "call drop_db_procedure();";

    const borrarResponse = await pool.query(queryBorrar);

    return res.status(200).send({
      message: "Borrado exitoso",
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

module.exports = { reset, deleteAll };
