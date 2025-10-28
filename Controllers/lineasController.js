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

module.exports = { crearLinea };
