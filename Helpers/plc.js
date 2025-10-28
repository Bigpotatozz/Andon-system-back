const net = require("net");
const main = async () => {
  const client = new net.Socket();
  const obtenerDatosPLC = async (comando, client, puerto, ip) => {
    const parsearComando = comando + "\r\n";

    return await new Promise((resolve, reject) => {
      client.connect(puerto, ip, () => {
        console.log("Conexion con PLC exitosa");

        client.write(parsearComando);

        client.on("data", (data) => {
          client.destroy();
          resolve(data.toString());
        });
      });

      client.on("error", (err) => {
        console.log(err);
        reject(err);
      });
    });
  };

  try {
    const statusCode = 0;

    setInterval(async () => {
      code = await obtenerDatosPLC("RD DM150", client, 8501, "192.168.0.10");

      const codigoEstatus = parseInt(code);
      console.log(codigoEstatus);
    }, 2000);
  } catch (err) {
    console.log(err);
  }
};

main();
