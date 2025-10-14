const { pool } = require("../Config/connection");

const crearEstatus = async (req, res) => {
  const { colores, idsLineasProduccion } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let idsColores = [];
    let idsProduccion = idsLineasProduccion;
    let tiempos = [];
    let detalleProduccion = [];
    for (const e of colores) {
      const query = `INSERT INTO estatus(nombre,prioridad,color,cancion) values ('prueba',?,?,'../Config/connection.mp3')`;
      const [result] = await pool.query(query, [e.peso, e.color]);
      idsColores.push(result.insertId);
    }

    console.log(idsColores);
    console.log(idsProduccion);
    for (const idLinea of idsProduccion) {
      const queryDetalle = `INSERT INTO detallelineaproduccion (idEstatus, idLineaProduccion) VALUES (?,?)`;

      for (const idEstatus of idsColores) {
        const [result] = await pool.query(queryDetalle, [idEstatus, idLinea]);
        const query2 = `INSERT INTO tiempo(fecha, tiempo) VALUES (NOW(), '00:00:00')`;
        const [result2] = await pool.query(query2);
        detalleProduccion.push(result.insertId);
        tiempos.push(result2.insertId);
      }
    }

    console.log(tiempos);

    for (let i = 0; i < detalleProduccion.length; i++) {
      const idDetalle = detalleProduccion[i];
      const idTiempo = tiempos[i];
      const query = `UPDATE detallelineaproduccion SET idTiempo = ? WHERE idDetalle = ?`;
      await pool.query(query, [idTiempo, idDetalle]);
    }

    await connection.commit();
    return res.status(200).send({
      message: "Estatus creado correctamente",
    });
  } catch (error) {
    console.log(error);
    await connection.rollback();
    return res.status(500).send({
      message: "Error al crear el estatus",
    });
  }
};

const actualizarEstatus = async (req, res) => {
  try {
    const { estatus, idLinea } = req.body;

    console.log(estatus);

    const query = `UPDATE lineaproduccion SET estatusRealTime = ? where idLineaProduccion = ?`;
    const [result] = await pool.query(query, [estatus, idLinea]);

    return res.status(200).send({
      message: "Estatus registrado",
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const obtenerEstatus = async (req, res) => {
  try {
    const query = `SELECT *
                    FROM lineaproduccion;;`;

    const response = await pool.query(query);

    return res.status(200).send({
      response: response,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};
module.exports = { crearEstatus, actualizarEstatus, obtenerEstatus };
