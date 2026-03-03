const { pool } = require("../Config/connection");

//Envia la informacion para la pantalla production ratio
const obtenerProductionRatio = async (req, res) => {
  //Se accede al turno indicado en el body
  const { idTurno } = req.params;
  try {
    //Accede a la informacion y hace los joins de la linea con su respectivo turno
    const productionRatioQuery = `select * from lineaproduccion 
                                join turno on turno.idLineaProduccion = lineaproduccion.idLineaProduccion
                                join objetivo on objetivo.idTurno = turno.idTurno
                                where turno.idTurno = ?
                                LIMIT 1                                
                                `;
    const productionRatio = await pool.query(productionRatioQuery, [idTurno]);

    //Si no hay nada del resultado envia el error
    if (!productionRatio) {
      return res.status(404).send({
        message: "No hay turnos registrados",
      });
    }

    //Envia la informacion obtenida
    return res.status(200).send({
      productionRatio: productionRatio[0],
    });
  } catch (e) {
    return res.status(200).send({
      message: "Hubo un error",
    });
  }
};

let turnoActual = [1, 4, 7, 10, 13];
const actualizarProgresoProduccionMultiLinea = async (req, res) => {
  const { idLineaProduccion } = req.params;
  try {
    //Se accede al turno en base a la hora
    const queryTurno = `SELECT * 
                                FROM turno
                                inner join objetivo on objetivo.idTurno = turno.idTurno
                                WHERE (
                                  (horaInicio < horaFin AND CURTIME() >= horaInicio AND CURTIME() < horaFin)
                                  OR
                                  (horaInicio > horaFin AND (CURTIME() >= horaInicio OR CURTIME() < horaFin))
                                )
                                AND idLineaProduccion = ?
                                LIMIT 1`;
    const turno = await pool.query(queryTurno, [idLineaProduccion]);
    console.log(turno[0][0]);

    if (turno[0][0].idTurno != turnoActual[idLineaProduccion - 1]) {
      await historialObjetivo(turnoActual[idLineaProduccion - 1]);
      turnoActual[idLineaProduccion - 1] = turno[0][0].idTurno;
      console.log("turno diferente");
    } else {
      if (turno[0][0].progresoProduccion <= 0) {
        let fechaPrimeraPieza = new Date();
        const query =
          "update objetivo set progresoProduccion = progresoProduccion + 1, progresoProduccionHora = progresoProduccionHora + 1, primerPieza = ? where idTurno = ?";
        const response = await pool.query(query, [
          fechaPrimeraPieza,
          turno[0][0].idTurno,
        ]);
      }

      let fechaUltimaPieza = new Date();
      //Una vez teniendo el turno se aumenta 1 al progreso de produccion correspondiente al turno
      const query =
        "update objetivo set fecha = ?, progresoProduccion = progresoProduccion + 1, progresoProduccionHora = progresoProduccionHora + 1, ultimaPieza = ?, OEE = ? where idTurno = ?";
      const response = await pool.query(query, [
        new Date(),
        fechaUltimaPieza,
        ((turno[0][0].progresoProduccion + 1) /
          turno[0][0].objetivoProduccionHora) *
          100,
        turno[0][0].idTurno,
      ]);
    }

    //Devuelve un estatus exitoso
    return res.status(200).send({
      message: "Progreso actualizado",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const historialObjetivo = async (idTurno) => {
  try {
    const query = "SELECT * FROM objetivo WHERE idTurno = ?";
    const response = await pool.query(query, [idTurno]);

    const insercion =
      "INSERT INTO objetivoHistorial (objetivoProduccionHora, objetivoProduccion, progresoProduccion, progresoProduccionHora, fecha, primerPieza, ultimaPieza, OEE, idObjetivo, idTurno) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? ,?)";
    const response2 = await pool.query(insercion, [
      response[0][0].objetivoProduccionHora,
      response[0][0].objetivoProduccion,
      response[0][0].progresoProduccion,
      response[0][0].progresoProduccionHora,
      response[0][0].fecha,
      response[0][0].primerPieza,
      response[0][0].ultimaPieza,
      response[0][0].OEE,
      response[0][0].idObjetivo,
      response[0][0].idTurno,
    ]);

    const reseteo = `UPDATE objetivo SET fecha = NULL, progresoProduccion = 0, progresoProduccionHora = 0, primerPieza = NULL, ultimaPieza = NULL, OEE = 0 WHERE idTurno = ?`;
    const response3 = await pool.query(reseteo, [idTurno]);
  } catch (e) {
    console.log(e);
  }
};

//Actualizar el progreso de produccion (+1)
const actualizarProgresoProduccion = async (req, res) => {
  try {
    //Se accede al turno en base a la hora
    const queryTurno = `SELECT * 
                                FROM turno
                                inner join objetivo on objetivo.idTurno = turno.idTurno
                                WHERE (
                                  (horaInicio < horaFin AND CURTIME() >= horaInicio AND CURTIME() < horaFin)
                                  OR
                                  (horaInicio > horaFin AND (CURTIME() >= horaInicio OR CURTIME() < horaFin))
                                )
                                LIMIT 1`;
    const turno = await pool.query(queryTurno);
    console.log(turno[0][0]);

    if (turno[0][0].progresoProduccion <= 0) {
      let fechaPrimeraPieza = new Date();
      const query =
        "update objetivo set progresoProduccion = progresoProduccion + 1, progresoProduccionHora = progresoProduccionHora + 1, primerPieza = ? where idTurno = ?";
      const response = await pool.query(query, [
        fechaPrimeraPieza,
        turno[0][0].idTurno,
      ]);
    }

    let fechaUltimaPieza = new Date();
    //Una vez teniendo el turno se aumenta 1 al progreso de produccion correspondiente al turno
    const query =
      "update objetivo set fecha = ?, progresoProduccion = progresoProduccion + 1, progresoProduccionHora = progresoProduccionHora + 1, ultimaPieza = ?, OEE = ? where idTurno = ?";
    const response = await pool.query(query, [
      new Date(),
      fechaUltimaPieza,
      ((turno[0][0].progresoProduccion + 1) /
        turno[0][0].objetivoProduccionHora) *
        100,
      turno[0][0].idTurno,
    ]);

    //Devuelve un estatus exitoso
    return res.status(200).send({
      message: "Progreso actualizado",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Obtiene el turno en base a la hora
const obtenerTurno = async (req, res) => {
  try {
    //Query para obtener el turno
    const queryEnviarTurno = `
                                SELECT * 
                                FROM turno
                                WHERE (
                                  (horaInicio < horaFin AND CURTIME() >= horaInicio AND CURTIME() < horaFin)
                                  OR
                                  (horaInicio > horaFin AND (CURTIME() >= horaInicio OR CURTIME() < horaFin))
                                )
                                LIMIT 1
                              `;
    const response = await pool.query(queryEnviarTurno);

    console.log(response);

    //Devuelve la respuesta exitosa
    return res.status(200).send({
      turno: response[0],
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Inicia en 0 el progreso de produccion por hora
const resetearProgresoProduccionHora = async (req, res) => {
  //Accede al turno
  const { turno } = req.params;
  try {
    //Query para resetear el progreso de produccion por hora
    const query = `update objetivo set progresoProduccionHora = 0 where idTurno = ?`;
    const reseteo = await pool.query(query, [turno]);

    //Devuelve un estatus exitoso
    return res.status(200).send({
      message: "Progreso reseteado",
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Obtiene los turnos registrados
const obtenerTurnos = async (req, res) => {
  try {
    //Obtiene los turnos
    const query = `SELECT * FROM turno where idLineaProduccion = 1`;
    const turnos = await pool.query(query);

    //Devuelve una respuesta exitosa
    return res.status(200).send({
      turnos: turnos[0],
    });
  } catch (e) {
    console.log(e);

    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Socket para obtener los turnos en caso de cambio (en base a la hora)
const socketObtenerTurno = async (socket) => {
  //Query que obtiene el turno en base a la hora actual

  let turnoActual = 0;
  const socketQuery = `
                                SELECT * 
                                FROM turno
                                INNER JOIN objetivo ON objetivo.idTurno = turno.idTurno
                                WHERE (
                                  (horaInicio < horaFin AND CURTIME() >= horaInicio AND CURTIME() < horaFin)
                                  OR
                                  (horaInicio > horaFin AND (CURTIME() >= horaInicio OR CURTIME() < horaFin))
                                )
                                LIMIT 1
                              `;

  const estatusInterval = setInterval(async () => {
    try {
      //Ejecuta la query
      const response = await pool.query(socketQuery);
      //Emite el cambio al cliente
      socket.emit("obtenerTurno", response[0]);
    } catch (e) {
      console.log(e);
    }
  }, 1000);

  socket.on("disconnect", () => {
    clearInterval(estatusInterval);
    console.log("Intervalo terminado");
  });
};

module.exports = {
  obtenerProductionRatio,
  actualizarProgresoProduccion,
  obtenerTurno,
  socketObtenerTurno,
  resetearProgresoProduccionHora,
  obtenerTurnos,
  actualizarProgresoProduccionMultiLinea,
};
