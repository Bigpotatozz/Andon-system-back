const { pool } = require("../Config/connection");

const obtenerOEEMes = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    const data = `SELECT 
    t.idTurno,
    t.idLineaProduccion,
    t.nombreTurno,
    lp.nombre as lineaProduccion,
    SUM(oh.objetivoProduccion) AS totalObjetivo, 
    SUM(oh.progresoProduccion) AS totalRealizado,
    (SUM(oh.progresoProduccion) / SUM(oh.objetivoProduccion)) * 100 AS porcentajeCumplimiento
    FROM objetivoHistorial AS oh
    INNER JOIN objetivo AS o ON o.idObjetivo = oh.idObjetivo
    INNER JOIN turno AS t ON o.idTurno = t.idTurno
    INNER JOIN lineaProduccion AS lp ON lp.idLineaProduccion = t.idLineaProduccion
    WHERE oh.fecha >= ? AND oh.fecha <= ? 
    GROUP BY t.idTurno;`;

    const datos = await pool.query(data, [fechaInicio, fechaFin]);

    return res.status(200).send(datos[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener el OEE" });
  }
};

const obtenerRankingParosLinea = async (req, res) => {
  try {
    const data = `SELECT es.idLineaProduccion, lp.nombre, e.colorId, SUM(t.contador) as cantidadTotal, SUM(t.total) as tiempoTotal from detalleestacion as de
inner join estatus as e on e.idEstatus = de.idEstatus
inner join tiempo as t on t.idTiempo = de.idTiempo
inner join estacion as es on es.idEstacion = de.idEstacion
inner join lineaProduccion as lp on lp.idLineaProduccion = es.idLineaProduccion
where e.colorId = 1003
group by es.idLineaProduccion
ORDER BY cantidadTotal DESC;`;

    const datos = await pool.query(data);

    return res.status(200).send(datos[0]);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error al obtener el ranking de paros" });
  }
};

const obtenerRankingParosEstacion = async (req, res) => {
  try {
    const data = `SELECT lp.nombre as linea, es.idEstacion, es.nombre, t.contador, t.total as segundos  from detalleestacion as de
inner join estatus as e on e.idEstatus = de.idEstatus
inner join tiempo as t on t.idTiempo = de.idTiempo
inner join estacion as es on es.idEstacion = de.idEstacion
inner join lineaProduccion as lp on lp.idLineaProduccion = es.idLineaProduccion
where e.colorId = 1003
ORDER BY t.contador DESC;`;

    const datos = await pool.query(data);

    return res.status(200).send(datos[0]);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error al obtener el ranking de paros" });
  }
};

const obtenerObjetivosDia = async (req, res) => {
  try {
    const data = `SELECT * FROM objetivoHistorial LIMIT 7`;

    const datos = await pool.query(data);

    return res.status(200).send(datos[0]);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error al obtener los objetivos del dia" });
  }
};

module.exports = {
  obtenerOEEMes,
  obtenerRankingParosLinea,
  obtenerObjetivosDia,
  obtenerRankingParosEstacion,
};
