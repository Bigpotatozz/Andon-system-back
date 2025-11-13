const { pool } = require("../Config/connection");

//Crea una nueva linea de produccion
const crearLinea = async (req, res) => {
  //accede la informacion del body
  const { idsLineasProduccion } = req.body;

  try {
    console.log(idsLineasProduccion);
    //Crea las lineas de produccion
    for (const e of idsLineasProduccion) {
      if (e == "" || e == null) {
        continue;
      }

      const query = `insert into lineaproduccion (idLineaProduccion, estatusActual) values (?, 0);`;
      const result = await pool.query(query, e);
    }

    //Devuelve una respuesta exitosa
    return res.status(200).send({
      message: "Linea creada correctamente",
      idsLineas: idsLineasProduccion,
    });
  } catch (error) {
    console.log(error);

    //Devuelve un error como respuesta
    return res.status(500).send({
      message: "Error al crear la linea",
      idsLineas: idsLineas,
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

module.exports = {
  crearLinea,
  verificarExistenciaLinea,
  obtenerLineasRegistradas,
};
