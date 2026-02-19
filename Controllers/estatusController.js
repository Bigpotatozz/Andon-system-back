const { response } = require("express");
const { pool } = require("../Config/connection");
//Registro de nuevos estatus
const crearEstatus = async (req, res) => {
  //Accede al body de la peticion y lo parsea a JSON
  const bodyData = JSON.parse(req.body.data);
  //Accede a los colores y estaciones
  const { colores, idsEstaciones } = bodyData;
  //Accede a los archivos de la peticion
  const canciones = req.files;

  //Inicializa una transaccion
  const connection = await pool.getConnection();
  try {
    //Inicializa la transaccion
    await connection.beginTransaction();
    console.log(colores);
    console.log(canciones);

    //Inicializa las variables a utilizar
    let idsColores = []; //Se guardaran los colores que se inserten
    let idsProduccion = idsEstaciones; //Se guardan los ids de las estaciones que se registraron
    let tiempos = []; // Se guardan los ids de los registros de tiempo que se inserten
    let detalleProduccion = []; //Se guarda los ids de los detalleEstatus que se inserten
    let contador = 0;
    let contadorCancion = 0;
    //Se recorre cada elemento del arreglo de colores
    for (const e of colores) {
      //Se declara una variable que guardara el nombre de la cancion
      let cancion = "";
      //Si la cancion es null
      if (e.cancion == "") {
        //La variable se queda como null
        cancion = null;
        console.log("no cancion");
      } else {
        /*Si no es null la variable tendra el valor del nombre de la cancion en esa posicion
        La posicion empieza en 0 y cada que se contenga una cancion este va a ir aumentando
        Esto para manejar los estatus que no tienen cancion
        Este es el arreglo de archivos mp3 que envio el usuario
        */
        cancion = canciones[contadorCancion].filename;
        //Aumenta el contador para seguir iterando
        contadorCancion++;
      }

      //Inserta los estatus (colores)
      const insertEstatusQuery = `INSERT INTO estatus(nombre,prioridad,color,colorId, cancion) values ('prueba',?,?,?,?)`;
      const insertEstatus = await connection.query(insertEstatusQuery, [
        e.peso,
        e.color,
        e.colorId,
        cancion,
      ]);
      //Accede a la variable de insercion y accede a los ids de los estatus que previamente se insertaron
      idsColores.push(insertEstatus[0].insertId);
      //Aumenta el contador
      contador++;
    }

    //Variable debug para ver los estatus insertados
    console.log(idsColores);
    //Variable debug para ver los idsEstaciones que se enviaron
    console.log(idsProduccion);
    //Se recorre cada estacion que envio el usuario
    for (const idEstacion of idsProduccion) {
      //llena el campo idEstacion en detalleEstacion
      const queryDetalle = `INSERT INTO detalleEstacion (idEstatus, idEstacion) VALUES (?,?)`;

      //Se recorre los idsColores (estatus) que se insertaron
      for (const idEstatus of idsColores) {
        const [result] = await connection.query(queryDetalle, [
          idEstatus,
          idEstacion,
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
      const query = `UPDATE detalleEstacion SET idTiempo = ? WHERE idDetalleEstacion = ?`;
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

    //Obtiene el detalleProduccion de esa linea
    const queryObtenerIdEstatus = `select * from detalleEstacion as dl
                                    inner join estatus as e on dl.idEstatus = e.idEstatus
                                    where idEstacion = ?
                                    AND colorId = ?;`;

    const detalleestatus = await pool.query(queryObtenerIdEstatus, [
      idLineaProduccion,
      color,
    ]);

    //Obtiene la lineaProduccion
    const lineaProduccionQuery = `select * from estacion where idEstacion = ?;`;
    const lineaProduccion = await pool.query(lineaProduccionQuery, [
      idLineaProduccion,
    ]);

    //Une todas las tablas para su visualizacion general
    if (lineaProduccion[0][0].estatusActual != 0) {
      const oldLineaQuery = `select * from estacion 
                            join detalleEstacion on detalleEstacion.idEstatus = estacion.estatusActual
                            join estatus on estatus.idEstatus = detalleEstacion.idEstatus
                            join tiempo on tiempo.idTiempo = detalleEstacion.idTiempo
                            where estacion.idEstacion = detalleEstacion.idEstacion                            
                            and estacion.idEstacion = ?;`;
      const lineaProduccionAntigua = await pool.query(oldLineaQuery, [
        idLineaProduccion,
      ]);

      //Actualiza el tiempo al tiempo en caso de que hubiera otro anteriormente
      const cerrarTiempoQuery = `update tiempo set 
      final = NOW(), 
      total = COALESCE(total, 0) + TIMESTAMPDIFF(SECOND, inicio, NOW()), 
      contador = ? 
      where idTiempo = ?;`;
      const cerrarTiempo = await pool.query(cerrarTiempoQuery, [
        lineaProduccionAntigua[0][0].contador + 1,
        lineaProduccionAntigua[0][0].idTiempo,
      ]);
    }

    //Actualiza el estatus en lineaProduccion
    const queryActualizarEstatus = `update estacion set estatusActual = ? where idEstacion = ?;`;
    const resultado2 = await pool.query(queryActualizarEstatus, [
      detalleestatus[0][0].idEstatus,
      idLineaProduccion,
    ]);

    //Actualiza el tiempo de inicio al nuevo tiempo
    const queryActualizarTiempo = `update tiempo set inicio = NOW() where idTiempo = ?;`;
    const resultado3 = await pool.query(queryActualizarTiempo, [
      detalleestatus[0][0].idTiempo,
    ]);

    // Obtener instancia de io
    const io = req.app.get("io");

    //Devuelve una respuesta exitosa
    res.status(200).send({
      message: detalleestatus[0],
    });

    setImmediate(() => {
      socketObtenerEstatus(io);
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
    const query = `select * from estacion 
                    join detalleEstacion on detalleEstacion.idEstatus = estacion.estatusActual
                    join estatus on estatus.idEstatus = detalleEstacion.idEstatus
                    join tiempo on tiempo.idTiempo = detalleEstacion.idTiempo
                    where estacion.idEstacion = detalleEstacion.idEstacion;`;

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
  const { idEstacion } = req.params;
  try {
    //Obtiene el estatus especifico
    const query = `select * from estacion 
                    join detalleEstacion on detalleEstacion.idEstatus = estacion.estatusActual
                    join estatus on estatus.idEstatus = detalleEstacion.idEstatus
                    where estacion.idEstacion = detalleEstacion.idEstacion
                    and estacion.idEstacion = ?;`;

    const response = await pool.query(query, [idEstacion]);

    //Obtiene el detalle de la linea junto con sus tablas
    const query2 = `SELECT * 
                    FROM estacion 
                    JOIN detalleEstacion ON estacion.idEstacion = detalleEstacion.idEstacion
                    JOIN estatus ON estatus.idEstatus = detalleEstacion.idEstatus
                    JOIN tiempo ON tiempo.idTiempo = detalleEstacion.idTiempo
                    WHERE estacion.idEstacion = ?;
                    `;
    const response2 = await pool.query(query2, [idEstacion]);

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

//Obtiene y manda los estatus de production ratio (PRODUCCION, PQ TIME, DESCANSO, ETC)
const obtenerEstatusProductionRatio = async (req, res) => {
  try {
    //Selecciona los estatus registrados
    const queryObtener = `SELECT * FROM estatus`;
    const response = await pool.query(queryObtener);

    //Arreglo para guardar estatus
    const estatus = [];
    //Recorre el arreglo y agrega los estatus que esten entre 1011 y 1014
    response[0].forEach((e) => {
      if (e.colorId >= 1011 && e.colorId <= 1014) estatus.push(e);
    });

    //Devuelve los estatus
    return res.status(200).send({
      response: estatus,
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Activa uno de los estatus de production ratio
const activarEstatus = async (req, res) => {
  //Obtiene el colorId del body
  const { colorId } = req.body;
  try {
    //Desactiva si hay algun otro estatus activo
    const desactivarEstatusQuery = `UPDATE estatus set activo = false where colorId != ?`;
    const desactivarEstatus = await pool.query(desactivarEstatusQuery, [
      colorId,
    ]);
    //Activa el nuevo estatus
    const activarEstatusQuery = `UPDATE estatus set activo = true where colorId = ?`;
    const activarEstatus = await pool.query(activarEstatusQuery, [colorId]);

    //Envia una respuesta exitosa
    return res.status(200).send({
      message: "Estatus activado",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Obtener el estatus activo de production ratio
const obtenerEstatusRatio = async (req, res) => {
  try {
    //Obtiene el estatus que esta en true
    const estatusRatioQuery = "select * from estatus where activo = true";
    const estatusRatio = await pool.query(estatusRatioQuery);

    //Si no hay ningun en true devuelve que no hay ninguno activo
    if (!estatusRatio) {
      return res.status(404).send({
        message: "No hay estatus activos",
      });
    }

    //Si hay uno activo lo devuelve
    return res.status(200).send({
      response: estatusRatio[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Obtiene los tiempos de cada estatus
const obtenerEstatusTiempos = async (req, res) => {
  try {
    //Obtiene los estatus con sus respectivos tiempos
    const queryEstatusTiempos = `SELECT * 
                    FROM estacion 
                    JOIN detalleEstacion ON estacion.idEstacion = detalleEstacion.idEstacion
                    JOIN estatus ON estatus.idEstatus = detalleEstacion.idEstatus
                    JOIN tiempo ON tiempo.idTiempo = detalleEstacion.idTiempo
                    ORDER BY estacion.idEstacion;`;
    const tiempos = await pool.query(queryEstatusTiempos);

    //Si no hay ningun estatus registrado devuelve el error
    if (tiempos[0].length <= 0) {
      return res.status(404).send({
        message: "No hay estatus activos",
      });
    }

    //Devuelve los estatus
    return res.status(200).send({
      tiempos: tiempos[0],
    });
  } catch (e) {
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Obtiene los tiempos de una sola estacion
const obtenerTiemposEstatus = async (req, res) => {
  //Accede al id
  const { id } = req.params;
  try {
    //Busca los estatus de esa estacion y une los tiempos correspondientes
    const query = `SELECT * 
                    FROM estacion 
                    JOIN detalleEstacion ON estacion.idEstacion = detalleEstacion.idEstacion
                    JOIN estatus ON estatus.idEstatus = detalleEstacion.idEstatus
                    JOIN tiempo ON tiempo.idTiempo = detalleEstacion.idTiempo
                    WHERE estacion.idEstacion = ?;`;
    const tiempos = await pool.query(query, [id]);

    //Devuelve la informacion
    return res.status(200).send({
      tiempos: tiempos[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Obtiene los estatus del 1000 al 1010
const obtenerEstatusModificar = async (req, res) => {
  try {
    //Obtiene los estatus del 1000 al 1010
    // Del 1011 en adelante son estatus de production ratio
    const queryEstatus = "select * from estatus where colorId < 1011";
    const estatus = await pool.query(queryEstatus);

    //Si no hay estatus que cumplan con la condicion devuelve el error
    if (estatus[0].length <= 0) {
      return res.status(404).send({
        message: "No hay estatus activos",
      });
    }

    //Devuelve la informacion
    return res.status(200).send({
      estatus: estatus[0],
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Modifica la prioridad de de los estatus indicados
const modificarEstatus = async (req, res) => {
  //Accede a los ids de los estatus que vienen en el body
  const { ids } = req.body;
  console.log(ids);
  try {
    //Query para hacer la modificacion de la prioridad
    const queryModificarEstatus =
      "update estatus set prioridad = ? where idEstatus = ?";

    //Recorre cada uno de los ids y ejecuta la query
    for (let id of ids) {
      const modificarEstatus = await pool.query(queryModificarEstatus, [
        id.prioridad,
        id.idEstatus,
      ]);
    }

    //Devuelve la respuesta exitosa
    return res.status(200).send({
      message: "Estatus modificado correctamente",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      message: "Hubo un error",
    });
  }
};

//Socket para reflejar los cambios de estatus en las estaciones
const socketObtenerEstatus = async (socket) => {
  //Query para obtener la informacions
  const query = `select lineaproduccion.idLineaProduccion, estacion.nombre AS nombreEstacion, estacion.idEstacion, estacion.estatusActual, detalleEstacion.*, estatus.*, tiempo.* 
                  from estacion 
                  join lineaproduccion on lineaproduccion.idLineaProduccion = estacion.idLineaProduccion
                  join detalleEstacion on detalleEstacion.idEstatus = estacion.estatusActual
                  join estatus on estatus.idEstatus = detalleEstacion.idEstatus
                  join tiempo on tiempo.idTiempo = detalleEstacion.idTiempo
                  where estacion.idEstacion = detalleEstacion.idEstacion;`;

  //Ejecuta la query
  const response = await pool.query(query);

  //Activar en caso de errores
  //console.log("////////////////////////////////////////////////////");
  //console.log(response[0]);
  //console.log("////////////////////////////////////////////////////");

  //Emite el cambio al cliente
  socket.emit("obtenerEstatus", response[0]);
};

module.exports = {
  crearEstatus,
  actualizarEstatus,
  obtenerEstatus,
  obtenerEstatusEspecifico,
  obtenerEstatusProductionRatio,
  activarEstatus,
  obtenerEstatusRatio,
  socketObtenerEstatus,
  obtenerEstatusTiempos,
  obtenerEstatusModificar,
  modificarEstatus,
  obtenerTiemposEstatus,
};
