const { default: axios } = require("axios");
const net = require("net");

class ClientProduccion {
  constructor(ip, puerto, comandos) {
    this.ip = ip;
    this.puerto = puerto;
    // IMPORTANTE: Definir claramente qué es cada comando por su posición
    // 0: Estatus (DM150)
    // 1: ID Estación (DM149)
    // 2: Producido (DM151)
    this.comandos = comandos;
    this.client = new net.Socket();
    this.isConnected = false;
    // Variables de estado
    this.estatusActual = 0;
    this.idEstacion = 0;
    this.producido = 0;
    this.estatusAnterior = null; // Para detectar cambios reales

    // Control de flujo TCP
    this.buffer = "";
    this.indiceComandoActual = 0; // Reemplaza a 'contador'
  }

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
      this.buffer += data.toString();

      // 2. Procesar mientras haya delimitadores completos (\r\n)
      let delimiterIndex;
      while ((delimiterIndex = this.buffer.indexOf("\r\n")) !== -1) {
        // Extraer mensaje limpio
        const mensaje = this.buffer.substring(0, delimiterIndex).trim();

        console.log(mensaje);
        // Avanzar buffer (+2 por \r\n)
        this.buffer = this.buffer.substring(delimiterIndex + 2);

        // Si el mensaje no está vacío, procesarlo
        if (mensaje.length > 0) {
          this.procesarRespuesta(mensaje);
        }
      }
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

  procesarRespuesta(mensaje) {
    const valor = parseInt(mensaje);

    if (isNaN(valor)) return; // Ignorar basura

    // Usar el índice actual para saber qué es
    switch (this.indiceComandoActual) {
      case 0: // ID Estacion
        this.idEstacion = valor;
        console.log(`Estacion: ${this.idEstacion}`);
        break;
      case 1:
        this.producido = valor;

        if (this.producido !== 0) {
          this.marcarProducido(this.idEstacion);
        }

        console.log(`Producido: ${this.producido}`);
    }

    this.indiceComandoActual++;
    if (this.indiceComandoActual >= this.comandos.length) {
      this.indiceComandoActual = 0;
    }
  }

  //Funcion de polling
  polling() {
    //Establece un interval
    this.pollingInterval = setInterval(() => {
      //Checa si esta conectado
      if (this.isConnected) {
        this.comandos.forEach((cmd) => {
          this.client.write(cmd + "\r\n");
        });
      }
    }, 2000);
  }

  marcarProducido = async (idEstacion) => {
    fetch("http://localhost:3000/api/turno/actualizarProgresoProduccion", {
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
  };

  tryReconnect() {
    clearInterval(this.pollingInterval);

    setTimeout(() => {
      console.log("Reintentar conexion....");
      this.client.destroy();
      this.client = new net.Socket();
      this.connect();
    }, 5000);
  }
}

const PLC = new ClientProduccion("192.168.0.10", 8501, [
  "RD DM149",
  "RD DM151",
]);
PLC.connect();

module.exports = { ClientProduccion };
