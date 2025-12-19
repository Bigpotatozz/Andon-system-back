const { default: axios } = require("axios");
const net = require("net");

class Client {
  constructor(ip, puerto, dmInicial, cantidad) {
    this.ip = ip;
    this.puerto = puerto;

    // Guardamos qué rango vamos a leer
    this.dmInicial = dmInicial; // Ej: 150
    this.cantidad = cantidad; // Ej: 10 estaciones
    this.client = null;
    this.isConnected = false;
    this.buffer = "";
    // Arrays de valores
    this.valoresCicloAnterior = new Array(cantidad).fill(null);
    this.valoresCicloActual = [];
    this.reconnectTimer = null;
  }

  connect() {
    if (this.client) {
      this.client.removeAllListeners();
      this.client.destroy();
    }

    this.client = new net.Socket();

    // Mantiene la conexión viva y rápida
    this.client.setKeepAlive(true, 5000);
    this.client.setNoDelay(true);
    this.client.setTimeout(15000);

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

    this.client.on("timeout", () => {
      console.log("PLC NO RESPONDE");
      this.client.end();
      this.client.destroy();
    });

    this.client.on("error", (err) => {
      console.error(`Error de conexión: ${err.message}`);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.client.on("close", () => {
      console.warn("Conexión cerrada.");
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.client.connect(this.puerto, this.ip);
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    console.log("Restableciendo conexion");

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  iniciarCiclo() {
    if (!this.isConnected) return;

    // Enviamos un solo comando para pedir todos los datos
    // RDS DM150 10 -> Lee 10 palabras empezando en DM150
    // Formato Keyence: "RDS DM[inicio] -> [cantidad]\r"
    const comando = `RDS DM${this.dmInicial} ${this.cantidad}`;

    try {
      const flushed = this.client.write(comando + "\r\n");
      if (!flushed) {
        console.warn("Buffer de salida lleno (Red lenta?)");
      }
    } catch (err) {
      console.error("Error al escribir:", err.message);
    }
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
    console.log("Ciclo completado ESTATUS:", this.valoresCicloActual);

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
    const controller = new AbortController();
    const timeutId = setTimeout(() => {
      controller.abort();
    });
    fetch("http://localhost:3000/api/estatus/actualizarEstatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        color: codigoColor,
        idLineaProduccion: idEstacion,
      }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => console.log(`Estación ${idEstacion} actualizada:`, data))
      .catch((err) => console.error("Error API:", err));
  }
}

let clienteActivo = null;
const obtenerEstaciones = async () => {
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
      const dmInicio = 150;

      // Creamos el cliente con lógica de BLOQUE
      const PLC = new Client("192.168.0.10", 8501, dmInicio, totalEstaciones);
      PLC.connect();
    } else {
      console.log("No hay lineas de produccion registradas");
    }
  } catch (e) {
    console.error("Error inicial:", e);
  }
};

obtenerEstaciones();

module.exports = { Client, obtenerEstaciones };
