const { pool } = require("../Config/connection");

const agregarTurnos = async (req, res) => {
  const { turnos } = req.body;
  const { idLineaProduccion } = req.params;
  try {
    for (let turno of turnos) {
      const query = `INSERT INTO turnos (nombreTurno, horaInicio, horaFin, cicleTime) VALUES (?,?,?,?)`;

      const values = [
        turno.nombreTurno,
        turno.horaInicio,
        turno.horaFin,
        turno.cicleTime,
      ];

      const turnosAgregados = await pool.query(query, values);

      const query2 = `INSERT INTO detalleTurno (idTurno, idLineaProduccion) VALUES (?, ?)`;

      const values2 = [turnosAgregados.insertId, idLineaProduccion];

      await pool.query(query2, values2);
    }

    res.status(200).json({ message: "Turnos agregados correctamente" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al agregar turnos" });
  }
};

module.exports = {
  agregarTurnos,
};
