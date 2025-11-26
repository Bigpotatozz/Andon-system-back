const { pool } = require("../Config/connection");

//Crea una nueva linea de produccion
const crearLinea = async (req, res) => {
  //accede la informacion del body
  const { estaciones, turnos } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    console.log(estaciones, turnos);

    const idsEstaciones = [];

    //INSERCION DE LA LINEA DE PRODUCCION (POR LO PRONTO TIENE UN DEFAULT)
    const insertarLineaProduccionQuery =
      "INSERT INTO lineaproduccion(nombre) values (?)";
    const insertarLineaProduccion = await connection.query(
      insertarLineaProduccionQuery,
      ["Linea de produccion"]
    );

    //OBTIENE EL ID DE LA LINEA DE PRODUCCION QUE SE ACABA DE INSERTAR
    const idLineaProduccion = insertarLineaProduccion[0].insertId;

    //RECORRE EL ARREGLO DE TURNOS
    for (const turno of turnos) {
      //INSERTA CADA UNO DE LOS TURNOS
      const insertarTurnosQuery =
        "INSERT INTO turno(nombreTurno, horaInicio, horaFin, objetivoProduccion, progresoProduccion, idLineaProduccion) values (?,?,?,?,?,?)";

      const insertarTurnos = await connection.query(insertarTurnosQuery, [
        turno.nombre,
        turno.horaInicio,
        turno.horaFin,
        turno.objetivoProduccion,
        turno.progresoProduccion,
        idLineaProduccion,
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
        [estacion, 0, idLineaProduccion]
      );

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

    await connection.rollback();
    //Devuelve un error como respuesta
    return res.status(500).send({
      message: "Error al crear la linea",
    });
  }
};

const verificarExistenciaLinea = async (req, res) => {
  const { idLinea } = req.params;
  try {
    const query = `select * from lineaproduccion where idLineaProduccion = ?;`;

    const response = await pool.query(query, [idLinea]);

    if (response[0].length == 0) {
      return res.status(404).send({
        linea: false,
        message: "Linea de produccion no existente",
      });
    }

    return res.status(200).send({
      linea: true,
      message: "Linea existente",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      linea: false,
      message: "Hubo un error",
    });
  }
};

const obtenerLineasRegistradas = async (req, res) => {
  try {
    const query = `Select idLineaProduccion from lineaproduccion;`;
    const response = await pool.query(query);

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
  const { lunch, descanso, paro, kyt } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const queryLunch = `UPDATE estatus set tiempoDefinido = ? where colorId = 1011;`;
    const responseLunch = await pool.query(queryLunch, [lunch]);

    const queryDescanso = `UPDATE estatus set tiempoDefinido = ? where colorId = 1012;`;
    const responseDescanso = await pool.query(queryDescanso, [descanso]);

    const queryParo = `UPDATE estatus set tiempoDefinido = ? where colorId = 1013;`;
    const responseParo = await pool.query(queryParo, [paro]);

    const queryKYT = `UPDATE estatus set tiempoDefinido = ? where colorId = 1014;`;
    const responseKYT = await pool.query(queryKYT, [kyt]);

    return res.send({
      message: "Actualizado correctamente",
    });

    await connection.commit();
  } catch (e) {
    console.log(e);

    await connection.rollback();
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

module.exports = {
  crearLinea,
  verificarExistenciaLinea,
  obtenerLineasRegistradas,
  actualizarProductionRatio,
};
