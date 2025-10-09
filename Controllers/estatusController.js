const { pool } = require("../Config/connection");

const crearEstatus = async (req, res) => {
  const { colores, lineas } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let idsColores = [];
    let idsLineas = lineas;
    for (const e of colores) {
      const query = `INSERT INTO estatus(nombre,prioridad,color,cancion) values ('prueba',?,?,'idk')`;
      const [result] = await pool.query(query, [e.peso, e.color]);
      idsColores.push(result.insertId);
    }

    console.log(idsColores);
    console.log(idsLineas);
    for (const idLinea of idsLineas) {
      const queryDetalle = `INSERT INTO detalleestatus (idEstatus, idLineaProduccion) VALUES (?,?)`;
      for (const idEstatus of idsColores) {
        const detalle = await pool.query(queryDetalle, [idEstatus, idLinea]);
      }
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

module.exports = { crearEstatus, actualizarEstatus };
