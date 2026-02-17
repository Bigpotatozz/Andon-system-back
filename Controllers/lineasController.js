const { query } = require("express-validator");
const { pool } = require("../Config/connection");
const { obtenerIps, obtenerEstaciones } = require("../Helpers/plc");
const { obtenerEstacionesProduccion } = require("../Helpers/plc_estatus");

//Crea una nueva linea de produccion
const crearLinea = async (req, res) => {
  //accede la informacion del body
  const { nombreLinea, estaciones, turnos } = req.body;
  //Instancia la transaccion
  const connection = await pool.getConnection();

  try {
    //Inicializa la transaccion
    await connection.beginTransaction();
    //Log de depuracion
    console.log(estaciones, turnos);
    //Inicializa un arreglo donde se guardaran los idsEstaciones
    const idsEstaciones = [];
    //INSERCION DE LA LINEA DE PRODUCCION (POR LO PRONTO TIENE UN DEFAULT)
    const insertarLineaProduccionQuery =
      "INSERT INTO lineaproduccion(nombre) values (?)";
    const insertarLineaProduccion = await connection.query(
      insertarLineaProduccionQuery,
      [nombreLinea],
    );

    //OBTIENE EL ID DE LA LINEA DE PRODUCCION QUE SE ACABA DE INSERTAR
    const idLineaProduccion = insertarLineaProduccion[0].insertId;

    //RECORRE EL ARREGLO DE TURNOS
    for (const turno of turnos) {
      //INSERTA CADA UNO DE LOS TURNOS
      const insertarTurnosQuery =
        "INSERT INTO turno(nombreTurno, horaInicio, horaFin, idLineaProduccion) values (?,?,?,?)";

      const insertarTurnos = await connection.query(insertarTurnosQuery, [
        turno.nombre,
        turno.horaInicio,
        turno.horaFin,
        idLineaProduccion,
      ]);

      const insertarObjetivosQuery = `insert into objetivo(objetivoProduccionHora, objetivoProduccion, progresoProduccion, activo, idTurno)
      VALUES (?,?,?,?,?)`;

      const insertarObjetivos = await connection.query(insertarObjetivosQuery, [
        0,
        0,
        0,
        true,
        insertarTurnos[0].insertId,
      ]);
    }

    //RECORRE LAS ESTACIONES
    for (const estacion of estaciones) {
      //SI UNA ESTACION ES "" O NULL LA SALTA
      if (estacion == "" || estacion == null) {
        continue;
      }
      //INSERTA LAS ESTACIONES
      const insertarEstacionesQuery =
        "INSERT INTO estacion(nombre, estatusActual, idLineaProduccion) values(?,?,?)";
      const insertarEstaciones = await connection.query(
        insertarEstacionesQuery,
        [estacion, 0, idLineaProduccion],
      );

      //se pushea al arreglo los ids previamente insertados, para retornarlos al frontend
      idsEstaciones.push(insertarEstaciones[0].insertId);
    }
    await connection.commit();
    //Devuelve una respuesta exitosa
    return res.status(200).send({
      message: "Linea creada correctamente",
      idsEstaciones: idsEstaciones,
    });
  } catch (error) {
    console.log(error);

    //Le hace rollback a la transaccion
    await connection.rollback();
    //Devuelve un error como respuesta
    return res.status(500).send({
      message: "Error al crear la linea",
    });
  }
};

const crearLinea2 = async (req, res) => {
  //accede la informacion del body
  const { linea, estaciones, turnos } = req.body;
  //Instancia la transaccion
  const connection = await pool.getConnection();

  try {
    //Inicializa la transaccion
    await connection.beginTransaction();
    //Log de depuracion
    console.log(estaciones, turnos);
    //Inicializa un arreglo donde se guardaran los idsEstaciones
    const idsEstaciones = [];
    //INSERCION DE LA LINEA DE PRODUCCION (POR LO PRONTO TIENE UN DEFAULT)
    const insertarLineaProduccionQuery =
      "INSERT INTO lineaproduccion(nombre, cicleTime) values (?, ?)";
    const insertarLineaProduccion = await connection.query(
      insertarLineaProduccionQuery,
      [linea.nombreLinea, linea.cicleTime],
    );

    //OBTIENE EL ID DE LA LINEA DE PRODUCCION QUE SE ACABA DE INSERTAR
    const idLineaProduccion = insertarLineaProduccion[0].insertId;

    //RECORRE EL ARREGLO DE TURNOS
    for (const turno of turnos) {
      //INSERTA CADA UNO DE LOS TURNOS
      const insertarTurnosQuery =
        "INSERT INTO turno(nombreTurno, horaInicio, horaFin, idLineaProduccion) values (?,?,?,?)";

      const insertarTurnos = await connection.query(insertarTurnosQuery, [
        turno.nombre || turno.nombreTurno,
        turno.horaInicio,
        turno.horaFin,
        idLineaProduccion,
      ]);

      const insertarObjetivosQuery = `insert into objetivo(objetivoProduccionHora, objetivoProduccion, progresoProduccion, activo, idTurno)
      VALUES (?,?,?,?,?)`;

      const insertarObjetivos = await connection.query(insertarObjetivosQuery, [
        0,
        0,
        0,
        true,
        insertarTurnos[0].insertId,
      ]);
    }

    //RECORRE LAS ESTACIONES
    for (const estacion of estaciones) {
      //SI UNA ESTACION ES "" O NULL LA SALTA
      if (estacion == "" || estacion == null) {
        continue;
      }
      //INSERTA LAS ESTACIONES
      const insertarEstacionesQuery =
        "INSERT INTO estacion(nombre, estatusActual, idLineaProduccion) values(?,?,?)";
      const insertarEstaciones = await connection.query(
        insertarEstacionesQuery,
        [estacion, 0, idLineaProduccion],
      );

      //se pushea al arreglo los ids previamente insertados, para retornarlos al frontend
      idsEstaciones.push(insertarEstaciones[0].insertId);
    }
    await connection.commit();
    //Devuelve una respuesta exitosa
    return res.status(200).send({
      message: "Linea creada correctamente",
      idsEstaciones: idsEstaciones,
    });
  } catch (error) {
    console.log(error);

    //Le hace rollback a la transaccion
    await connection.rollback();
    //Devuelve un error como respuesta
    return res.status(500).send({
      message: "Error al crear la linea",
    });
  }
};

const verificarExistenciaLinea = async (req, res) => {
  //Accede a los params
  const { idLinea } = req.params;
  try {
    //Realiza una consulta en base de datos donde verifica si hay alguna linea con ese id
    const query = `select * from estacion where idEstacion = ?;`;
    const response = await pool.query(query, [idLinea]);

    //Si no hay ninguna devuelve un estatus 404
    if (response[0].length == 0) {
      return res.status(404).send({
        linea: false,
        message: "Linea de produccion no existente",
      });
    }

    //Si encuentra alguna devuelve un estatus 200
    return res.status(200).send({
      linea: true,
      message: "Linea existente",
    });
  } catch (e) {
    //En caso de error se envia
    console.log(e);
    return res.status(500).send({
      linea: false,
      message: "Hubo un error",
    });
  }
};

//Obtiene todas las estaciones registradas
const obtenerLineasRegistradas = async (req, res) => {
  try {
    //Consulta para obtener las estaciones
    const query = `Select idEstacion, nombre, progreso, idLineaProduccion from estacion;`;
    const response = await pool.query(query);

    //Devuelve las estaciones
    return res.status(200).send({
      lineas: response[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const actualizarProductionRatio = async (req, res) => {
  const { lunch, descanso, paro, kyt, turno, cicleTime } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const queryLunch = `UPDATE estatus set tiempoDefinido = ? where colorId = 1011;`;
    const responseLunch = await connection.query(queryLunch, [lunch]);

    const queryDescanso = `UPDATE estatus set tiempoDefinido = ? where colorId = 1012;`;
    const responseDescanso = await connection.query(queryDescanso, [descanso]);

    const queryParo = `UPDATE estatus set tiempoDefinido = ? where colorId = 1013;`;
    const responseParo = await connection.query(queryParo, [paro]);

    const queryKYT = `UPDATE estatus set tiempoDefinido = ? where colorId = 1014;`;
    const responseKYT = await connection.query(queryKYT, [kyt]);

    const queryTurno = "select * from turno where idTurno = ?";
    const turnoInfo = await connection.query(queryTurno, [turno]);

    const objetivoProduccionHora = Math.round(3600 / cicleTime);
    const objetivoProduccion = objetivoProduccionHora * 8;

    console.log(objetivoProduccion, objetivoProduccionHora);
    const queryPlan = `UPDATE objetivo set objetivoProduccion = ?, objetivoProduccionHora = ? where idTurno = ?;`;
    const plan = await connection.query(queryPlan, [
      objetivoProduccion,
      objetivoProduccionHora,
      turno,
    ]);
    await connection.commit();
    return res.send({
      message: "Actualizado correctamente",
    });
  } catch (e) {
    console.log(e);

    await connection.rollback();
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const obtenerEstacionesTiempos = async (req, res) => {
  const { idEstacion } = req.params;

  try {
    const queryEstacionesTiempo = `select * from estacion 
                            join detalleEstacion on detalleEstacion.idEstatus = estacion.estatusActual
                            join estatus on estatus.idEstatus = detalleEstacion.idEstatus
                            join tiempo on tiempo.idTiempo = detalleEstacion.idTiempo
                            where estacion.idEstacion = detalleEstacion.idEstacion                            
                            and estacion.idEstacion = ?;`;

    const estacionesTiempo = await pool.query(queryEstacionesTiempo, [
      idEstacion,
    ]);

    if (!estacionesTiempo) {
      return res.status(404).send({
        message: "Estacion no inicializada",
      });
    }

    return res.status(200).send({
      response: estacionesTiempo[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const registrarIps = async (req, res) => {
  const { estaciones } = req.body;
  try {
    for (let estacion of estaciones) {
      const queryRegistrarIp =
        "update estacion set ip = ? where idEstacion = ?";
      const registrarIp = await pool.query(queryRegistrarIp, [
        estacion.ip,
        estacion.idEstacion,
      ]);
    }

    obtenerIps();

    return res.status(200).send({
      message: "Ips registradas correctamente",
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const iniciarPLC = async (req, res) => {
  try {
    obtenerEstaciones();

    return res.status(200).send({
      message: "PLC iniciado correctamente",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const obtenerEstacionesPorLinea = async (req, res) => {
  const { idLineaProduccion } = req.params;
  try {
    const queryEstaciones = `SELECT * FROM estacion WHERE idLineaProduccion = ?;`;
    const estaciones = await pool.query(queryEstaciones, [idLineaProduccion]);

    return res.status(200).send({
      estaciones: estaciones[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};
const verTiemposLinea = async (req, res) => {
  const { idLineaProduccion } = req.params;
  try {
    const queryEstatus = `SELECT * FROM estacion WHERE idLineaProduccion = ?`;

    const estaciones = await pool.query(queryEstatus, [idLineaProduccion]);

    let tiempos = [];
    for (let estacion of estaciones[0]) {
      const queryDetalle = `SELECT * FROM detalleestacion WHERE idEstacion = ?;`;
      const detalle = await pool.query(queryDetalle, [estacion.idEstacion]);

      for (let tiempo of detalle[0]) {
        const queryTiempo = `SELECT * FROM tiempo WHERE idTiempo = ?;`;

        const tiemposBD = await pool.query(queryTiempo, [tiempo.idTiempo]);

        tiempos.push(tiemposBD[0]);
      }
    }

    return res.status(200).send({
      tiempos: tiempos,
    });
  } catch (e) {
    console.log(e);

    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const obtenerLineasProudccion = async (req, res) => {
  try {
    const queryLineas = `SELECT * FROM lineaproduccion;`;

    const lineasProduccion = await pool.query(queryLineas);

    return res.status(200).send({
      lineas: lineasProduccion[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const obtenerTiemposPorLinea = async (req, res) => {
  const { idLineaProduccion } = req.params;
  try {
    const queryTiempos = `
                          select 
                          lp.idLineaProduccion, lp.nombre,
                          e.idEstacion, e.nombre as nombreEstacion, e.estatusActual, e.progreso,
                          de.idDetalleEstacion, de.idEstatus, de.idEstacion, de.idTiempo,
                          est.idEstatus, est.nombre, est.prioridad, est.color, est.colorId, est.cancion, est.tiempoDefinido, 
                          est.activo, temp.idTiempo, temp.fecha, temp.inicio, temp.final, temp.total, temp.contador
                          from lineaProduccion as lp
                          inner join estacion as e on e.idLineaProduccion = lp.idLineaProduccion
                          inner join detalleestacion as de on de.idEstacion = e.idEstacion 
                          inner join estatus as est on est.idEstatus = de.idEstatus
                          inner join tiempo as temp on temp.idTiempo = de.idTiempo
                          where lp.idLineaProduccion = ?;`;

    const tiempos = await pool.query(queryTiempos, [idLineaProduccion]);

    return res.status(200).send({
      tiempos: tiempos[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const obtenerTiemposPorEstacion = async (req, res) => {
  const { idEstacion } = req.params;
  try {
    const queryTiempos = `
                          select * from detalleestacion as de
                          inner join tiempo on de.idTiempo = tiempo.idTiempo
                          inner join estatus on de.idEstatus = estatus.idEstatus
                          where idEstacion = ?;`;

    const tiempos = await pool.query(queryTiempos, [idEstacion]);

    return res.status(200).send({
      tiempos: tiempos[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const socketObtenerEstaciones = async (socket) => {
  const socketQuery = `Select idEstacion, nombre,progreso from estacion;`;

  const intervalEstaciones = setInterval(async () => {
    try {
      const response = await pool.query(socketQuery);

      socket.emit("obtenerEstaciones", response[0]);
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
  crearLinea,
  verificarExistenciaLinea,
  obtenerLineasRegistradas,
  actualizarProductionRatio,
  obtenerEstacionesTiempos,
  registrarIps,
  socketObtenerEstaciones,
  iniciarPLC,
  verTiemposLinea,
  obtenerLineasProudccion,
  obtenerEstacionesPorLinea,
  obtenerTiemposPorLinea,
  obtenerTiemposPorEstacion,
  crearLinea2,
};
