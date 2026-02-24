const { pool } = require("../Config/connection");

const obtenerOEEMes = async (req, res) => {
  const { fechaInicio, fechaFin, idLineaProduccion, idTurno } = req.query;
  try {
    const data = `SELECT 
    t.idTurno,
    SUM(oh.objetivoProduccion) AS TotalObjetivo, 
    SUM(oh.progresoProduccion) AS TotalRealizado,
    (SUM(oh.progresoProduccion) / SUM(oh.objetivoProduccion)) * 100 AS PorcentajeCumplimiento
FROM objetivoHistorial AS oh
INNER JOIN objetivo AS o ON o.idObjetivo = oh.idObjetivo
INNER JOIN turno AS t ON o.idTurno = t.idTurno
WHERE oh.fecha >= ? AND oh.fecha <= ? 
  AND t.idLineaProduccion = ? 
  AND t.idTurno = ?
GROUP BY t.idTurno;`;

    const datos = await pool.query(data, [
      fechaInicio,
      fechaFin,
      idLineaProduccion,
      idTurno,
    ]);

    return res.status(200).send(datos[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener el OEE" });
  }
};

module.exports = {
  obtenerOEEMes,
};
