const axios = require("axios"); // ← Sin "default"
const net = require("net");

class Client {
  constructor(ip, puerto, dmInicial, cantidad) {
    this.ip = ip;
    this.puerto = puerto;
    this.dmInicial = dmInicial;
    this.cantidad = cantidad;
    this.client = null;
    this.isConnected = false;
    this.buffer = "";
    this.valoresCicloAnterior = new Array(cantidad).fill(null);
    this.valoresCicloActual = [];
    this.reconnectTimer = null;

    this.esperandoRespuesta = false;
    this.cicloTimeout = null;
    this.ciclosCompletados = 0;
    this.maxCiclosSinReconectar = 50;
  }

  connect() {
    if (this.client) {
      this.client.removeAllListeners();
      this.client.destroy();
    }

    this.client = new net.Socket({
      readableHighWaterMark: 256 * 1024,
      writableHighWaterMark: 256 * 1024,
    });

    this.client.setKeepAlive(true, 5000);
    this.client.setNoDelay(true);
    this.client.setTimeout(30000);

    this.client.on("connect", () => {
      this.isConnected = true;
      console.log(`Conectado a PLC ${this.ip}:${this.puerto}`);
      this.iniciarCiclo();
    });

    this.client.on("data", (data) => {
      this.buffer += data.toString();

      // Limita el tamaño del buffer
      if (this.buffer.length > 10000) {
        console.error(
          `Buffer demasiado grande (${this.buffer.length} bytes), reseteando`
        );
        this.buffer = "";
        return;
      }

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
      console.warn("PLC NO RESPONDE");
      this.client.destroy();
    });

    this.client.on("error", (err) => {
      console.error(`Error de conexión: ${err.message}`);
      this.isConnected = false;
      this.esperandoRespuesta = false;
      this.limpiarTimeouts();
      this.scheduleReconnect();
    });

    this.client.on("close", () => {
      console.warn("Conexión cerrada");
      this.isConnected = false;
      this.esperandoRespuesta = false;
      this.limpiarTimeouts();
      this.scheduleReconnect();
    });

    this.client.connect(this.puerto, this.ip);
  }

  limpiarTimeouts() {
    //Nombre corregido
    if (this.cicloTimeout) {
      clearTimeout(this.cicloTimeout);
      this.cicloTimeout = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    console.log("Reconectando en 5s...");

    this.limpiarTimeouts();

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  iniciarCiclo() {
    // Verificación completa
    if (!this.isConnected || this.esperandoRespuesta) {
      console.warn("Ciclo bloqueado (esperando respuesta anterior)");
      return;
    }

    if (!this.client || !this.client.writable) {
      console.warn("Socket no disponible");
      return;
    }

    this.esperandoRespuesta = true;

    const comando = `RDS DM${this.dmInicial} ${this.cantidad}`;

    try {
      this.client.write(comando + "\r\n", (err) => {
        if (err) {
          console.error(`Error al escribir: ${err.message}`);
          this.esperandoRespuesta = false;
        }
      });
    } catch (err) {
      console.error(`Excepción: ${err.message}`);
      this.esperandoRespuesta = false;
    }
  }

  procesarRespuestaBloque(mensaje) {
    if (mensaje.startsWith("E")) {
      console.error(`Error del PLC: ${mensaje}`);
      this.esperandoRespuesta = false;

      this.limpiarTimeouts();
      this.cicloTimeout = setTimeout(() => this.iniciarCiclo(), 2000);
      return;
    }

    const valoresRaw = mensaje.split(" ");
    this.valoresCicloActual = valoresRaw.map((v) => {
      const n = parseInt(v);
      return isNaN(n) ? null : n;
    });

    if (this.valoresCicloActual.length !== this.cantidad) {
      console.warn(
        `Recibidos: ${this.valoresCicloActual.length}, esperados: ${this.cantidad}`
      );
      this.esperandoRespuesta = false;
      return; //No llamar finalizarCiclo si está incompleto
    }

    this.finalizarCiclo();
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

    this.valoresCicloAnterior = [...this.valoresCicloActual];
    this.esperandoRespuesta = false;
    this.ciclosCompletados++;

    // Reconexión preventiva
    if (this.ciclosCompletados >= this.maxCiclosSinReconectar) {
      console.log(`Reconexión preventiva (${this.ciclosCompletados} ciclos)`);
      this.ciclosCompletados = 0;
      this.limpiarTimeouts();
      this.client.destroy();
      setTimeout(() => this.connect(), 2000);
      return;
    }

    this.limpiarTimeouts();

    //Aumentado a 7 segundos (era 2)
    this.cicloTimeout = setTimeout(() => this.iniciarCiclo(), 2000);
  }

  async sendData(codigoColor, idEstacion) {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/estatus/actualizarEstatus",
        {
          color: codigoColor,
          estacion: idEstacion,
        }
      );

      console.log(`${tipo.toUpperCase()} E${idEstacion}: ${valor}`);
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        console.error(`${tipo} E${idEstacion}: Timeout`);
      } else {
        console.error(`${tipo} E${idEstacion}: ${err.message}`);
      }
    }
  }
}

let clienteActivo = null;

const obtenerEstaciones = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/linea/obtenerLineasRegistradas"
    );

    const totalEstaciones = response.data.lineas.length;

    if (totalEstaciones === 0) {
      console.log("No hay líneas de producción registradas");
      return;
    }

    if (clienteActivo) {
      console.log("Reiniciando cliente anterior...");
      if (clienteActivo.limpiarTimeouts) {
        clienteActivo.limpiarTimeouts();
      }
      if (clienteActivo.client) {
        clienteActivo.client.destroy();
      }
      clienteActivo = null;
    }

    console.log(`Iniciando monitoreo de ${totalEstaciones} estaciones`);

    const dmInicio = 150;

    clienteActivo = new Client(
      "192.168.0.10",
      8501,
      dmInicio,
      totalEstaciones * 2
    );
    clienteActivo.connect();
  } catch (e) {
    console.error("Error:", e.message);
  }
};

obtenerEstaciones();

module.exports = { Client, obtenerEstaciones };
