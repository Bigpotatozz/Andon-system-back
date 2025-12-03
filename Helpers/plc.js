const net = require("net");

//Se crea una clase Client
class Client {
  //Se crea su constructor
  constructor(ip, puerto, comandos) {
    //IP
    this.ip = ip;
    //Puerto
    this.puerto = puerto;
    //Comando parseado para el PLC
    this.comandoParseado1 = comandos[0] + "\r\n";
    this.comandoParseado2 = comandos[1] + "\r\n";
    //Nuevo socket
    this.client = new net.Socket();
    //Estatus
    this.isConnected = false;
    this.estatusActual = 0;
    this.idEstacion = 0;
  }

  //Funcion que se encarga de conectar al PLC
  connect() {
    //Se conecta al PLC
    this.client.connect(this.puerto, this.ip);

    //Cuando escucha el evento connect
    this.client.on("connect", () => {
      //El estatus lo pone en true
      this.isConnected = true;
      //Imprime
      console.log("Conectado al PLC");
      //Se ejecuta la funcion de polling
      this.polling();
    });

    this.client.on("data", (data) => {
      if (this.estatusActual == this.estatusActual) {
        console.log("nueva informacion");
        this.sendData(this.estatusActual, this.idEstacion);
      } else {
        console.log("Same data");
      }
      console.log(data.toString());
    });

    this.client.on("error", (err) => {
      console.log(`ERROR: ${err}`);
      this.isConnected = false;
    });

    this.client.on("close", () => {
      console.log("PLC desconectado");
      this.isConnected = false;
    });
  }

  //Funcion de polling
  polling() {
    //Establece un interval
    this.pollingInterval = setInterval(() => {
      //Checa si esta conectado
      if (this.isConnected) {
        //Si esta conectado envia el comando
        this.estatusActual = parseInt(this.client.write(this.comandoParseado1));
        this.idEstacion = parseInt(this.client.write(this.comandoParseado2));
      }
    }, 2000);
  }

  tryReconnect() {
    clearInterval(this.pollingInterval);

    setTimeout(() => {
      console.log("Reintentar conexion....");
      this.client.destroy();
      this.client = new net.Socket();
      this.connect();
    }, 5000);
  }

  sendData(codigoColor, idEstacion) {
    fetch("http://localhost:3000/api/estatus/actualizarEstatus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        color: codigoColor,
        idLineaProduccion: idEstacion,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      });
  }
}

const PLC = new Client("192.168.0.10", 8501, ["RD DM150", "RD DM149"]);

PLC.connect();
