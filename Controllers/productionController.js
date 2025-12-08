const { pool } = require("../Config/connection");

const obtenerProductionRatio = async (req, res) => {
  try {
    const productionRatioQuery = `select * from lineaproduccion join turno on turno.idLineaProduccion = lineaproduccion.idLineaProduccion;`;

    const productionRatio = await pool.query(productionRatioQuery);

    if (!productionRatio) {
      return res.status(404).send({
        message: "No hay turnos registrados",
      });
    }

    return res.status(200).send({
      productionRatio: productionRatio[0],
    });
  } catch (e) {
    return res.status(200).send({
      message: "Hubo un error",
    });
  }
};

const actualizarProgresoProduccion = async (req, res) => {
  const { turno } = req.body;
  try {
    const query =
      "update turno set progresoProduccion = progresoProduccion + 1 where idTurno = ?";
    const response = await pool.query(query, [turno]);

    return res.status(200).send({
      message: "Progreso actualizado",
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const obtenerTurno = async (req, res) => {
  try {
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

    return res.status(200).send({
      turno: response[0],
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const socketObtenerTurno = async (socket) => {
  const socketQuery = `
                                SELECT * 
                                FROM turno
                                WHERE (
                                  (horaInicio < horaFin AND CURTIME() >= horaInicio AND CURTIME() < horaFin)
                                  OR
                                  (horaInicio > horaFin AND (CURTIME() >= horaInicio OR CURTIME() < horaFin))
                                )
                                LIMIT 1
                              `;

  const estatusInterval = setInterval(async () => {
    try {
      const response = await pool.query(socketQuery);

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
};
