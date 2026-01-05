const axios = require("axios"); // ← Sin "default"
const net = require("net");

class Client {
  constructor(ip, puerto, dmInicial, cantidad) {
    //Ip del PLC
    this.ip = ip;
    //puerto del plc
    this.puerto = puerto;
    //variable de inicio
    this.dmInicial = dmInicial;
    //cantidad de variables a leer
    this.cantidad = cantidad;
    //cliente tcp
    this.client = null;
    //chequea si esta conectado
    this.isConnected = false;
    //buffer
    this.buffer = "";
    //valores del pull anterior
    this.valoresCicloAnterior = new Array(cantidad).fill(null);
    //valores del pull actual
    this.valoresCicloActual = [];
    //variable para reconectar
    this.reconnectTimer = null;
    //variable para el control de las respuestas
    this.esperandoRespuesta = false;
    //variable para el control de los ciclos en caso de tardar
    this.cicloTimeout = null;
    //variable que guarda los pulls que se conectaron
    this.ciclosCompletados = 0;
    //variable limite para hacer el reinicio de la conexion
    this.maxCiclosSinReconectar = 50;
    this.procesoIntencional = false;
  }

  connect() {
    //Si ya existe un cliente elimina el ya existente
    if (this.client) {
      this.client.removeAllListeners();
      this.client.destroy();
    }

    //Crea un nuevo cliente
    this.client = new net.Socket({
      readableHighWaterMark: 256 * 1024,
      writableHighWaterMark: 256 * 1024,
    });

    //Configuraciones del cliente
    this.client.setKeepAlive(true, 5000); //Mantiene la conexion
    this.client.setNoDelay(true); //Evita que el plc envie un delay
    this.client.setTimeout(30000); //Temporizador por cada polling

    //Se conecta al plc
    this.client.on("connect", () => {
      //Establece que se conecto
      this.isConnected = true;
      this.procesoIntencional = false;
      //Imprime que se conecto
      console.log(`Conectado a PLC ${this.ip}:${this.puerto}`);
      //Inicia ciclo
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
      if (this.procesoIntencional) {
        console.log("cierre intencional");
        return;
      }

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
    // Verifica que este conectado o si esta espernado una respuesta
    if (!this.isConnected || this.esperandoRespuesta) {
      //Advierte y dice que esta bloqueado
      console.warn("Ciclo bloqueado (esperando respuesta anterior)");
      return;
    }
    //Si no hay un cliente o si no se puede escribir el comando
    if (!this.client || !this.client.writable) {
      //Envia que el socket no esta disponible
      console.warn("Socket no disponible");
      return;
    }
    //Establece que esta esperando una respuesta
    this.esperandoRespuesta = true;
    //Crea el comando
    const comando = `RDS DM${this.dmInicial} ${this.cantidad}`;

    try {
      //Escribe el comando en el plc
      this.client.write(comando + "\r\n", (err) => {
        //SI hay error pues lo devuelve
        if (err) {
          console.error(`Error al escribir: ${err.message}`);
          this.esperandoRespuesta = false;
        }
      });
      //catch preventivo
    } catch (err) {
      console.error(`Excepción: ${err.message}`);
      this.esperandoRespuesta = false;
    }
  }

  procesarRespuestaBloque(mensaje) {
    //Maneja el error
    if (mensaje.startsWith("E")) {
      console.error(`Error del PLC: ${mensaje}`);
      this.esperandoRespuesta = false;

      this.limpiarTimeouts();
      this.cicloTimeout = setTimeout(() => this.iniciarCiclo(), 2000);
      return;
    }

    //divide el mensaje del plc por espacios
    const valoresRaw = mensaje.split(" ");
    //Del arreglo resultante parsea a entero cada uno de los valores
    this.valoresCicloActual = valoresRaw.map((v) => {
      const n = parseInt(v);
      return isNaN(n) ? null : n;
    });

    //Si encuentra una diferencia en la longitud advierte (los valores siempre tienen que ser iguales)
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
    //Recibe e imprime los valores
    console.log(
      `Ciclo completado ESTATUS ${new Date().toLocaleTimeString()}:`,
      this.valoresCicloActual
    );

    // Comparamos con el ciclo anterior
    //Aqui se evalua si hubo diferencias respecto al ciclo anterior
    this.valoresCicloActual.forEach((valor, index) => {
      //Verfica si algun estatus es diferente del anterior
      if (valor !== this.valoresCicloAnterior[index] && valor !== null) {
        // index + 1 asume que tus estaciones son 1, 2, 3...
        this.sendData(valor, index + 1);
      }
    });

    //los valores actuales los pone como anteriores
    this.valoresCicloAnterior = [...this.valoresCicloActual];
    //Establece que no se esta esperando ninguna respuesta
    this.esperandoRespuesta = false;
    //Aumenta el contador de ciclos completados
    this.ciclosCompletados++;

    // Reconexión preventiva
    if (this.ciclosCompletados >= this.maxCiclosSinReconectar) {
      this.procesoIntencional = true;
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
          idLineaProduccion: idEstacion,
        }
      );

      console.log(`${tipo.toUpperCase()} E${idEstacion}: ${valor}`);
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        console.error(`$E${idEstacion}: Timeout`);
      } else {
        console.error(`E${idEstacion}: ${err.message}`);
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

    //obtiene las lineas registradas
    const totalEstaciones = response.data.lineas.length;

    if (totalEstaciones === 0) {
      console.log("No hay líneas de producción registradas");

      if (clienteActivo) {
        console.log("Destruyendo cliente (no hay estaciones)");
        if (clienteActivo.limpiarTimeouts) {
          clienteActivo.limpiarTimeouts();
        }
        if (clienteActivo.reconnectTimer) {
          clearTimeout(clienteActivo.reconnectTimer);
          clienteActivo.reconnectTimer = null;
        }
        if (clienteActivo.client) {
          clienteActivo.client.destroy();
        }
        clienteActivo = null;
      }
      return;
    }

    const dmInicio = 150;
    const cantidadVariables = totalEstaciones * 2;

    if (clienteActivo) {
      if (clienteActivo.cantidad === cantidadVariables) {
        console.log(
          `Cliente ya activo para ${totalEstaciones} estaciones (${cantidadVariables} variables)`
        );
        console.log(`Reutilizando cliente existente, no se crea duplicado`);
        return;
      }

      console.log(
        `Cantidad de estaciones cambió (${
          clienteActivo.cantidad / 2
        } → ${totalEstaciones})`
      );
      console.log(`Destruyendo cliente anterior...`);

      if (clienteActivo.limpiarTimeouts) {
        clienteActivo.limpiarTimeouts();
      }
      if (clienteActivo.reconnectTimer) {
        clearTimeout(clienteActivo.reconnectTimer);
        clienteActivo.reconnectTimer = null;
      }
      if (clienteActivo.client) {
        clienteActivo.client.destroy();
      }
      clienteActivo = null;
    }

    // Solo llega aquí si NO existe cliente o si la cantidad cambió
    console.log(
      `🚀 Iniciando monitoreo de ${totalEstaciones} estaciones (${cantidadVariables} variables)`
    );
    clienteActivo = new Client(
      "192.168.0.10",
      8501,
      dmInicio,
      cantidadVariables
    );
    clienteActivo.connect();
  } catch (e) {
    console.error("Error en obtenerEstaciones:", e.message);
  }
};

module.exports = { Client, obtenerEstaciones };
