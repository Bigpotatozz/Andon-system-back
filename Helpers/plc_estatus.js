const { default: axios } = require("axios");
const net = require("net");

class ClientProduccion {
  constructor(ip, puerto, dmInicial, cantidad) {
    this.ip = ip;
    this.puerto = puerto;

    // Guardamos qué rango vamos a leer
    this.dmInicial = dmInicial; // Ej: 150
    this.cantidad = cantidad; // Ej: 10 estaciones

    this.client = new net.Socket();
    this.isConnected = false;
    this.buffer = "";

    // Arrays de valores
    this.valoresCicloAnterior = new Array(cantidad).fill(null);
    this.valoresCicloActual = [];
  }

  connect() {
    this.client.connect(this.puerto, this.ip);

    // Mantiene la conexión viva y rápida
    this.client.setKeepAlive(true, 5000);
    this.client.setNoDelay(true);

    this.client.on("connect", () => {
      this.isConnected = true;
      console.log(`Conectado a PLC ${this.ip}:${this.puerto}`);
      this.iniciarCiclo();
    });

    this.client.on("data", (data) => {
      this.buffer += data.toString();

      // Procesamos solo si tenemos un terminador \r\n
      let delimiterIndex;
      while ((delimiterIndex = this.buffer.indexOf("\r\n")) !== -1) {
        const mensaje = this.buffer.substring(0, delimiterIndex).trim();
        this.buffer = this.buffer.substring(delimiterIndex + 2);

        if (mensaje.length > 0) {
          this.procesarRespuestaBloque(mensaje);
        }
      }
    });

    this.client.on("error", (err) => {
      console.error(`Error de conexión: ${err.message}`);
      this.isConnected = false;
      this.reconnect();
    });

    this.client.on("close", () => {
      console.warn("Conexión cerrada.");
      this.isConnected = false;
      this.reconnect();
    });
  }

  iniciarCiclo() {
    if (!this.isConnected) return;

    // Enviamos un solo comando para pedir todos los datos
    // RDS DM150 10 -> Lee 10 palabras empezando en DM150
    // Formato Keyence: "RDS DM[inicio] -> [cantidad]\r"
    const comando = `RDS DM${this.dmInicial} ${this.cantidad}`;
    this.client.write(comando + "\r\n");
  }

  procesarRespuestaBloque(mensaje) {
    if (mensaje.startsWith("E")) {
      console.error(`Error del PLC: ${mensaje}`);
      // Si hay error, reintentamos en 2 segundos
      setTimeout(() => this.iniciarCiclo(), 2000);
      return;
    }

    // Respuesta del PLC: "0 1 2 0 4 1 0 0"
    //Separamos la cadena de texto por espacios
    const valoresRaw = mensaje.split(" ");

    // Convertimos a enteros
    this.valoresCicloActual = valoresRaw.map((v) => {
      const n = parseInt(v);
      return isNaN(n) ? null : n;
    });

    // Validamos que recibimos la cantidad correcta
    if (this.valoresCicloActual.length !== this.cantidad) {
      console.warn(
        `Recibidos: ${this.valoresCicloActual.length} esperados: ${this.cantidad}`
      );
    } else {
      this.finalizarCiclo();
    }
  }

  finalizarCiclo() {
    console.log("Ciclo completado PRODUCCION:", this.valoresCicloActual);

    // Comparamos con el ciclo anterior
    this.valoresCicloActual.forEach((valor, index) => {
      if (valor !== this.valoresCicloAnterior[index] && valor !== null) {
        // index + 1 asume que tus estaciones son 1, 2, 3...
        this.sendData(valor, index + 1);
      }
    });

    // Guardamos estado y esperamos para el siguiente ciclo
    this.valoresCicloAnterior = [...this.valoresCicloActual];

    // Esperamos 1 segundo y pedimos de nuevo
    setTimeout(() => this.iniciarCiclo(), 1000);
  }

  sendData(codigoColor, idEstacion) {
    fetch("http://localhost:3000/api/estatus/actualizarEstatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        color: codigoColor,
        idLineaProduccion: idEstacion,
      }),
    })
      .then((response) => response.json())
      .then((data) => console.log(`Estación ${idEstacion} actualizada:`, data))
      .catch((err) => console.error("Error API:", err));
  }

  reconnect() {
    setTimeout(() => {
      console.log("Reintentando conexión...");
      this.client.destroy();
      this.client = new net.Socket();
      this.connect(); // Volvemos a conectar con la misma config
    }, 5000);
  }
}

let clienteActivo = null;
const obtenerEstacionesProduccion = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/linea/obtenerLineasRegistradas"
    );

    const totalEstaciones = response.data.lineas.length;

    if (totalEstaciones != 0) {
      if (clienteActivo) {
        console.log("Reiniciando cliente anterior...");
        clienteActivo.client.destroy();
        clienteActivo = null;
      }
      console.log(`Iniciando monitoreo de ${totalEstaciones} estaciones.`);

      //Variable inicial
      const dmInicio = 200;

      // Creamos el cliente con lógica de BLOQUE
      const PLC = new ClientProduccion(
        "192.168.0.10",
        8501,
        dmInicio,
        totalEstaciones
      );
      PLC.connect();
    } else {
      console.log("No hay lineas de produccion registradas");
    }
  } catch (e) {
    console.error("Error inicial:", e);
  }
};

obtenerEstacionesProduccion();

module.exports = { ClientProduccion, obtenerEstacionesProduccion };
