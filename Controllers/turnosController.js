const { pool } = require("../Config/connection");

//Endpoint para agregar un turno nuevo (VERSION ALTERNATIVA, NO LISTA PARA PRODUCCION)
const agregarTurnos = async (req, res) => {
  //Accede al objeto de turnos
  const { turnos } = req.body;
  //Accede al id de la linea de produccion
  const { idLineaProduccion } = req.params;
  try {
    //Recorre cada uno de los turnos del body
    for (let turno of turnos) {
      //Va insertando el turno
      const query = `INSERT INTO turnos (nombreTurno, horaInicio, horaFin, cicleTime) VALUES (?,?,?,?)`;
      const values = [
        turno.nombreTurno,
        turno.horaInicio,
        turno.horaFin,
        turno.cicleTime,
      ];
      const turnosAgregados = await pool.query(query, values);

      //Query que inserta en el detalleTurno
      const query2 = `INSERT INTO detalleTurno (idTurno, idLineaProduccion) VALUES (?, ?)`;
      const values2 = [turnosAgregados.insertId, idLineaProduccion];
      await pool.query(query2, values2);
    }

    //Devuelve la respuesta exitosa
    res.status(200).json({ message: "Turnos agregados correctamente" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al agregar turnos" });
  }
};

const obtenerTurnosPorLinea = async (req, res) => {
  const { idLineaProduccion } = req.params;
  try {
    const data = `SELECT * FROM turno WHERE idLineaProduccion = ?`;
    const datos = await pool.query(data, [idLineaProduccion]);
    return res.status(200).send(datos[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener los turnos" });
  }
};

module.exports = {
  agregarTurnos,
  obtenerTurnosPorLinea,
};
