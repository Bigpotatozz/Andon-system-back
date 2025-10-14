const { pool } = require("../Config/connection");

const crearLinea = async (req, res) => {
  const { idsLineasProduccion } = req.body;

  try {
    console.log(idsLineasProduccion);
    for (const e of idsLineasProduccion) {
      if (e == "" || e == null) {
        continue;
      }

      const query = `insert into lineaproduccion (idLineaProduccion, estatusActual) values (?, 0);`;
      const result = await pool.query(query, e);
    }

    return res.status(200).send({
      message: "Linea creada correctamente",
      idsLineas: idsLineasProduccion,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).send({
      message: "Error al crear la linea",
      idsLineas: idsLineas,
    });
  }
};

module.exports = { crearLinea };
