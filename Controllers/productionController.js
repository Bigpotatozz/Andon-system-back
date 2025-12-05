const { pool } = require("../Config/connection");

const obtenerProductionRatio = async (req, res) => {
  try {
    const productionRatioQuery = `select * from lineaproduccion join turno on turno.idLineaProduccion = lineaproduccion.idLineaProduccion;`;

    const productionRatio = await pool.query(productionRatioQuery);

    if (!productionRatio) {
      return res.status(404).send({
        message: "No hay turnos registrados",
      });
    }

    return res.status(200).send({
      productionRatio: productionRatio[0],
    });
  } catch (e) {
    return res.status(200).send({
      message: "Hubo un error",
    });
  }
};

const actualizarProgresoProduccion = async (req, res) => {
  const { turno } = req.body;
  try {
    const query =
      "update turno set progresoProduccion = progresoProduccion + 1 where idTurno = ?";
    const response = await pool.query(query, [turno]);

    return res.status(200).send({
      message: "Progreso actualizado",
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

module.exports = {
  obtenerProductionRatio,
  actualizarProgresoProduccion,
};
