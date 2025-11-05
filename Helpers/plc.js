const net = require("net");
const { pool } = require("../Config/connection");
//Funcion para obtener la informacion del PLC(KEYENCE)
//Se declara como funcion asincrona
const main = async () => {
  //Crea un nuevo socket

  //Creacion de funcion para obtener los datos
  const obtenerDatosPLC = async (comando, puerto, ip) => {
    const client = new net.Socket();
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
    let codeMemory = 0;
    //Se crea un intervalo para poder sacar cada 2 segundos la informacion del PLC
    setInterval(async () => {
      //Se ejecuta la funcion de obtencion de datos del PLC
      code = await obtenerDatosPLC("RD DM150", 8501, "192.168.0.10");
      //El resultado se guarda un una variable y se parsea a entero
      const codigoEstatus = parseInt(code);

      if (codigoEstatus == codeMemory) {
        return;
      } else {
        codeMemory = codigoEstatus;

        fetch("http://localhost:3000/api/estatus/actualizarEstatus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            colorId: 1000,
            idLineaProduccion: 11,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
          });

        //Se imprime la variable
        console.log(codigoEstatus);
      }
    }, 2000);
  } catch (err) {
    //En caso de error se imprime
    console.log(err);
  }
};
module.exports = { main };
