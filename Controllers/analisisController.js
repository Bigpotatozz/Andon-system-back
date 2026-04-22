const { pool } = require("../Config/connection");
//Consulta que va obteniendo el OEE acumulado del mes
const obtenerOEEMes = async (req, res) => {
  //Indicas la fecha inicio y fecha  de fin
  //01-03-26 10-03-26
  const { fechaInicio, fechaFin } = req.query;

  try {
    //Ejectua la consulta para calcular dicho OEE
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

    //Ejecuta la consulta en base de datos
    const datos = await pool.query(data, [fechaInicio, fechaFin]);

    //Envia la respuesta
    return res.status(200).send(datos[0]);
    //En caso de error lo atrapa
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener el OEE" });
  }
};

//Obtiene los ranking de paros por linea (toma en cuenta solo el numero de paros)
const obtenerRankingParosLinea = async (req, res) => {
  try {
    //Consulta para calcular el ranking
    const data = `SELECT es.idLineaProduccion, lp.nombre, e.colorId, SUM(t.contador) as cantidadTotal, SUM(t.total) as tiempoTotal from detalleestacion as de
                  inner join estatus as e on e.idEstatus = de.idEstatus
                  inner join tiempo as t on t.idTiempo = de.idTiempo
                  inner join estacion as es on es.idEstacion = de.idEstacion
                  inner join lineaProduccion as lp on lp.idLineaProduccion = es.idLineaProduccion
                  where e.colorId = 1003
                  group by es.idLineaProduccion
                  ORDER BY cantidadTotal DESC;`;

    //Ejecucion de consulta
    const datos = await pool.query(data);

    //Envia la respuesta
    return res.status(200).send(datos[0]);

    // En caso de error envia el error
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error al obtener el ranking de paros" });
  }
};

//Obtiene el ranking de paros por estacion (en base a la cantidad de paros, no tiempo)
const obtenerRankingParosEstacion = async (req, res) => {
  try {
    //Consulta que calcula el ranking
    const data = `SELECT lp.nombre as linea, es.idEstacion, es.nombre, t.contador, t.total as segundos  from detalleestacion as de
                  inner join estatus as e on e.idEstatus = de.idEstatus
                  inner join tiempo as t on t.idTiempo = de.idTiempo
                  inner join estacion as es on es.idEstacion = de.idEstacion
                  inner join lineaProduccion as lp on lp.idLineaProduccion = es.idLineaProduccion
                  where e.colorId = 1003
                  ORDER BY t.contador DESC;`;

    //Ejecucion de consulta en bd
    const datos = await pool.query(data);

    //Envio de datos
    return res.status(200).send(datos[0]);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error al obtener el ranking de paros" });
  }
};

//Obtiene los objetivos del dia
const obtenerObjetivosDia = async (req, res) => {
  try {
    //Consulta que obtiene los objetivos del dia
    const data = `SELECT * FROM objetivoHistorial LIMIT 7`;
    //Ejecucion de consulta
    const datos = await pool.query(data);
    //Envio de datos obtenidos
    return res.status(200).send(datos[0]);

    //En caso de error envia el error
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error al obtener los objetivos del dia" });
  }
};

const socketObtenerOEEPrincipal = async (socket) => {
  //Query para obtener las estaciones
  const socketQuery = `select * from lineaproduccion as lp
inner join turno as t on t.idLineaProduccion = lp.idLineaProduccion
inner join objetivo as o on o.idTurno = t.idTurno
where o.OEE IS NOT NUll;`;

  //Ejecuta un ciclo que checa si hay cambios cada 2 segundos
  const intervalEstaciones = setInterval(async () => {
    try {
      const response = await pool.query(socketQuery);
      socket.emit("obtenerOEESocket", response[0]);
    } catch (e) {
      console.log(e);
    }
  }, 2000);

  socket.on("disconnect", () => {
    clearInterval(intervalEstaciones);
    console.log("Intervalo terminado");
  });
};

module.exports = {
  obtenerOEEMes,
  obtenerRankingParosLinea,
  obtenerObjetivosDia,
  obtenerRankingParosEstacion,
  socketObtenerOEEPrincipal,
};
