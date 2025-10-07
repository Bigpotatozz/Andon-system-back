const { pool } = require("../Config/connection");

const crearLinea = async (req, res) => {
  const { nombre } = req.body;

  try {
    const query = `insert into lineaproduccion (nombre) values ('${nombre}')`;
    await pool.query(query);

    return res.status(200).send({
      message: "Linea creada correctamente",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).send({
      message: "Error al crear la linea",
    });
  }
};

module.exports = { crearLinea };
