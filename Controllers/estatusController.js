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
        const query2 = `INSERT INTO tiempo(fecha, inicio,final) VALUES (NOW(), '00:00:00', '00:00:00')`;
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
    const { color, idLineaProduccion } = req.body;
    console.log(color, idLineaProduccion);

    const queryObtenerIdEstatus = `select * from detallelineaproduccion as dl
                                    inner join estatus as e on dl.idEstatus = e.idEstatus
                                    where idLineaProduccion = ?
                                    AND color = ?;`;

    const detalleestatus = await pool.query(queryObtenerIdEstatus, [
      idLineaProduccion,
      color,
    ]);

    const lineaProduccionQuery = `select * from lineaproduccion where idLineaProduccion = ?;`;
    const lineaProduccion = await pool.query(lineaProduccionQuery, [
      idLineaProduccion,
    ]);

    console.log(detalleestatus[0][0]);
    console.log(lineaProduccion[0][0]);

    if (lineaProduccion[0][0].estatusActual != 0) {
      const oldLineaQuery = `select * from lineaproduccion 
                            join detallelineaproduccion on detallelineaproduccion.idEstatus = lineaproduccion.estatusActual
                            join estatus on estatus.idEstatus = detallelineaproduccion.idEstatus
                            where lineaproduccion.idLineaProduccion = detallelineaproduccion.idLineaProduccion
                            and lineaproduccion.idLineaProduccion = ?;`;
      const lineaProduccionAntigua = await pool.query(oldLineaQuery, [
        idLineaProduccion,
      ]);

      console.log(lineaProduccionAntigua);

      const cerrarTiempoQuery = `update tiempo set final = NOW() where idTiempo = ?;`;
      const cerrarTiempo = await pool.query(cerrarTiempoQuery, [
        lineaProduccionAntigua[0][0].idTiempo,
      ]);
    }

    const queryActualizarEstatus = `update lineaProduccion set estatusActual = ? where idLineaProduccion = ?;`;
    const resultado2 = await pool.query(queryActualizarEstatus, [
      detalleestatus[0][0].idEstatus,
      idLineaProduccion,
    ]);

    const queryActualizarTiempo = `update tiempo set inicio = NOW() where idTiempo = ?;`;
    const resultado3 = await pool.query(queryActualizarTiempo, [
      detalleestatus[0][0].idTiempo,
    ]);

    return res.status(200).send({
      message: detalleestatus[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const obtenerEstatus = async (req, res) => {
  try {
    const query = `select * from lineaproduccion 
                    join detallelineaproduccion on detallelineaproduccion.idEstatus = lineaproduccion.estatusActual
                    join estatus on estatus.idEstatus = detallelineaproduccion.idEstatus
                    where lineaproduccion.idLineaProduccion = detallelineaproduccion.idLineaProduccion;`;

    const response = await pool.query(query);

    return res.status(200).send({
      response: response[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};
module.exports = { crearEstatus, actualizarEstatus, obtenerEstatus };
