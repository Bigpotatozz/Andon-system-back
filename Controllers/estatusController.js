const { pool } = require("../Config/connection");

//Registro de nuevos estatus
const crearEstatus = async (req, res) => {
  //Accede al body de la peticion
  const bodyData = JSON.parse(req.body.data);
  const { colores, idsLineasProduccion } = bodyData;
  //Accede a los archivos de la peticion
  const canciones = req.files;

  //Inicializa una transaccion
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    console.log(colores);
    console.log(canciones);

    //Inicializa las variables a utilizar
    let idsColores = [];
    let idsProduccion = idsLineasProduccion;
    let tiempos = [];
    let detalleProduccion = [];
    let contador = 0;
    let contadorCancion = 0;
    for (const e of colores) {
      let cancion = "";

      if (e.cancion == "") {
        cancion = null;
        console.log("no cancion");
      } else {
        cancion = canciones[contadorCancion].filename;
        contadorCancion++;
      }

      //Inserta los estatus
      const query = `INSERT INTO estatus(nombre,prioridad,color,colorId, cancion) values ('prueba',?,?,?,?)`;
      const [result] = await connection.query(query, [
        e.peso,
        e.color,
        e.colorId,
        cancion,
      ]);
      idsColores.push(result.insertId);
      contador++;
    }

    console.log(idsColores);
    console.log(idsProduccion);
    for (const idLinea of idsProduccion) {
      //Inserta los detalle linea a los que les corresponden esos estatus
      const queryDetalle = `INSERT INTO detallelineaproduccion (idEstatus, idLineaProduccion) VALUES (?,?)`;

      for (const idEstatus of idsColores) {
        const [result] = await connection.query(queryDetalle, [
          idEstatus,
          idLinea,
        ]);
        //Inicializa los tiempos de cada linea
        const query2 = `INSERT INTO tiempo(fecha, inicio,final) VALUES (NOW(), NULL, NULL)`;
        const [result2] = await connection.query(query2);
        detalleProduccion.push(result.insertId);
        tiempos.push(result2.insertId);
      }
    }

    console.log(tiempos);

    //Actualiza los detalle linea produccion para agregarles la llave foranea de los tiempos
    for (let i = 0; i < detalleProduccion.length; i++) {
      const idDetalle = detalleProduccion[i];
      const idTiempo = tiempos[i];
      const query = `UPDATE detallelineaproduccion SET idTiempo = ? WHERE idDetalle = ?`;
      await connection.query(query, [idTiempo, idDetalle]);
    }

    //Confirma la transaccion
    await connection.commit();
    //Envia una respuesta
    return res.status(200).send({
      message: "Estatus creado correctamente",
    });
  } catch (error) {
    //Imprime el error
    console.log(error);
    //Cancela la transaccion
    await connection.rollback();
    //Devuelve un error como respuesta
    return res.status(500).send({
      message: "Error al crear el estatus",
    });
  }
};

//Endpoint para actualiza el estatus de una linea de produccion
const actualizarEstatus = async (req, res) => {
  try {
    //Accede al body
    const { color, idLineaProduccion } = req.body;
    console.log(color, idLineaProduccion);

    //Obtiene el detalleProduccion de esa linea
    const queryObtenerIdEstatus = `select * from detallelineaproduccion as dl
                                    inner join estatus as e on dl.idEstatus = e.idEstatus
                                    where idLineaProduccion = ?
                                    AND colorId = ?;`;

    const detalleestatus = await pool.query(queryObtenerIdEstatus, [
      idLineaProduccion,
      color,
    ]);

    //Obtiene la lineaProduccion
    const lineaProduccionQuery = `select * from lineaproduccion where idLineaProduccion = ?;`;
    const lineaProduccion = await pool.query(lineaProduccionQuery, [
      idLineaProduccion,
    ]);

    console.log(detalleestatus[0][0]);
    console.log(lineaProduccion[0][0]);

    //Une todas las tablas para su visualizacion general
    if (lineaProduccion[0][0].estatusActual != 0) {
      const oldLineaQuery = `select * from lineaproduccion 
                            join detallelineaproduccion on detallelineaproduccion.idEstatus = lineaproduccion.estatusActual
                            join estatus on estatus.idEstatus = detallelineaproduccion.idEstatus
                            join tiempo on tiempo.idTiempo = detallelineaproduccion.idTiempo
                            where lineaproduccion.idLineaProduccion = detallelineaproduccion.idLineaProduccion
                            and lineaproduccion.idLineaProduccion = ?;`;
      const lineaProduccionAntigua = await pool.query(oldLineaQuery, [
        idLineaProduccion,
      ]);

      console.log(lineaProduccionAntigua);

      //Actualiza el tiempo al tiempo en caso de que hubiera otro anteriormente
      const cerrarTiempoQuery = `update tiempo set final = NOW(), total = COALESCE(total, 0) + TIMESTAMPDIFF(SECOND, inicio, NOW()) where idTiempo = ?;`;
      const cerrarTiempo = await pool.query(cerrarTiempoQuery, [
        lineaProduccionAntigua[0][0].idTiempo,
      ]);
    }

    //Actualiza el estatus en lineaProduccion
    const queryActualizarEstatus = `update lineaProduccion set estatusActual = ? where idLineaProduccion = ?;`;
    const resultado2 = await pool.query(queryActualizarEstatus, [
      detalleestatus[0][0].idEstatus,
      idLineaProduccion,
    ]);

    //Actualiza el tiempo de inicio al nuevo tiempo
    const queryActualizarTiempo = `update tiempo set inicio = NOW() where idTiempo = ?;`;
    const resultado3 = await pool.query(queryActualizarTiempo, [
      detalleestatus[0][0].idTiempo,
    ]);

    //Devuelve una respuesta exitosa
    return res.status(200).send({
      message: detalleestatus[0],
    });
  } catch (e) {
    //Devuelve un error como respuesta
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Obtiene todos los estatus
const obtenerEstatus = async (req, res) => {
  try {
    //Obtiene todos los estatus
    const query = `select * from lineaproduccion 
                    join detallelineaproduccion on detallelineaproduccion.idEstatus = lineaproduccion.estatusActual
                    join estatus on estatus.idEstatus = detallelineaproduccion.idEstatus
                    join tiempo on tiempo.idTiempo = detallelineaproduccion.idTiempo
                    where lineaproduccion.idLineaProduccion = detallelineaproduccion.idLineaProduccion;`;

    const response = await pool.query(query);

    //Devuelve los estatus y una respuesta exitosa
    return res.status(200).send({
      response: response[0],
    });
  } catch (e) {
    console.log(e);
    //Devuelve un error como respuesta
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Obtiene el estatus especificos de una linea de produccion
const obtenerEstatusEspecifico = async (req, res) => {
  //Accede a los params
  const { idEstatus } = req.params;
  try {
    //Obtiene el estatus especifico
    const query = `select * from lineaproduccion 
                    join detallelineaproduccion on detallelineaproduccion.idEstatus = lineaproduccion.estatusActual
                    join estatus on estatus.idEstatus = detallelineaproduccion.idEstatus
                    where lineaproduccion.idLineaProduccion = detallelineaproduccion.idLineaProduccion
                    and lineaproduccion.idLineaProduccion = ?;`;

    const response = await pool.query(query, [idEstatus]);

    if (response[0].length == 0) {
      return res.status(404).send({
        message: "Linea de produccion no existente",
      });
    }

    //Obtiene el detalle de la linea junto con sus tablas
    const query2 = `SELECT * 
                    FROM lineaproduccion 
                    JOIN detallelineaproduccion ON lineaproduccion.idLineaProduccion = detallelineaproduccion.idLineaProduccion
                    JOIN estatus ON estatus.idEstatus = detallelineaproduccion.idEstatus
                    JOIN tiempo ON tiempo.idTiempo = detallelineaproduccion.idTiempo
                    WHERE lineaproduccion.idLineaProduccion = ?;
                    `;
    const response2 = await pool.query(query2, [idEstatus]);

    //Devuelve la informacion obtenida
    return res.status(200).send({
      response: response[0],
      response2: response2[0],
    });
  } catch (e) {
    console.log(e);
    //Devuelve un error como respuesta
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

const obtenerEstatusProductionRatio = async (req, res) => {
  try {
    const queryObtener = `SELECT * FROM estatus`;
    const response = await pool.query(queryObtener);

    const estatus = [];
    response[0].forEach((e) => {
      if (e.colorId >= 1011 && e.colorId <= 1014) estatus.push(e);
    });

    return res.status(200).send({
      response: estatus,
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};
module.exports = {
  crearEstatus,
  actualizarEstatus,
  obtenerEstatus,
  obtenerEstatusEspecifico,
  obtenerEstatusProductionRatio,
};
