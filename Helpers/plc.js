const net = require("net");
//Funcion para obtener la informacion del PLC(KEYENCE)
//Se declara como funcion asincrona
const main = async () => {
  //Crea un nuevo socket
  const client = new net.Socket();
  //Creacion de funcion para obtener los datos
  const obtenerDatosPLC = async (comando, client, puerto, ip) => {
    //Le da formato al comando
    const parsearComando = comando + "\r\n";
    //Crea una nueva promesa
    return await new Promise((resolve, reject) => {
      //Se conecta al plc indicando el puerto y la ip
      client.connect(puerto, ip, () => {
        //Si se conecta lo indica y accede a la variable indicada
        console.log("Conexion con PLC exitosa");
        //Escribe el comando
        client.write(parsearComando);
        //Accede a la variable indicada
        client.on("data", (data) => {
          //Destruye la conexion
          client.destroy();
          //Retorna la variable que se queria obtener del PLC
          resolve(data.toString());
        });
      });

      //EN caso de error lo devuelve como err
      client.on("error", (err) => {
        console.log(err);
        reject(err);
      });
    });
  };

  try {
    //Se crea un intervalo para poder sacar cada 2 segundos la informacion del PLC
    setInterval(async () => {
      //Se ejecuta la funcion de obtencion de datos del PLC
      code = await obtenerDatosPLC("RD DM150", client, 8501, "192.168.0.10");

      //El resultado se guarda un una variable y se parsea a entero
      const codigoEstatus = parseInt(code);
      //Se imprime la variable
      console.log(codigoEstatus);
    }, 2000);
  } catch (err) {
    //En caso de error se imprime
    console.log(err);
  }
};

//Se ejecuta la funcion
main();
