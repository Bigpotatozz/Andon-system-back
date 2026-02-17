//Verifica que una estacion exista
const verificarExistenciaEstacion = async (req, res) => {
  //Accede a los params
  const { idLinea } = req.params;
  try {
    //Realiza una consulta en base de datos donde verifica si hay alguna linea con ese id
    const query = `select * from estacion where idEstacion = ?;`;
    const response = await pool.query(query, [idLinea]);

    //Si no hay ninguna devuelve un estatus 404
    if (response[0].length == 0) {
      return res.status(404).send({
        linea: false,
        message: "Linea de produccion no existente",
      });
    }

    //Si encuentra alguna devuelve un estatus 200
    return res.status(200).send({
      linea: true,
      message: "Linea existente",
    });
  } catch (e) {
    //En caso de error se envia
    console.log(e);
    return res.status(500).send({
      linea: false,
      message: "Hubo un error",
    });
  }
};

module.exports = {
  verificarExistenciaEstacion,
};
