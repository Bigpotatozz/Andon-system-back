const { pool } = require("../Config/connection");

const crearLinea = async (req, res) => {
  const { nombres } = req.body;
  const idsLineas = [];

  try {
    for (const e of nombres) {
      if (e == "" || e == null) {
        continue;
      }

      const query = `insert into lineaproduccion (nombre) values ('${e}')`;
      const [result] = await pool.query(query);

      idsLineas.push(result.insertId);
    }

    return res.status(200).send({
      message: "Linea creada correctamente",
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
