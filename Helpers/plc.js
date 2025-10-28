const net = require("net");

const ObtenerDatosPLC = () => {
  const client = new net.Socket();
  const comandoVariable = "RD DM150"; //Guarda el comando seguido de la variable que se leera
  const comando = comandoVariable + "\r\n"; //Le da formato

  client.connect(8501, "192.168.0.10", () => {
    //Es un metodo que lo que hace es conectarse con el plc en el puerto 8500 y con su ip
    console.log("Conectado al PLC via TCP"); //Imprime que se conecto al PLC
    client.write(comando); // comando ejemplo para PLC Keyence
  });

  client.on("data", (data) => {
    //
    console.log("Respuesta del PLC:", data.toString());
    client.destroy(); // cerrar conexión
  });

  client.on("error", (err) => {
    console.error("Error en conexión TCP:", err);
  });
};

while (true) {
  ObtenerDatosPLC();
}

export default ObtenerDatosPLC;
