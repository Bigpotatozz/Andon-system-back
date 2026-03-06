const axios = require("axios");
const net = require("net");

class Client {
  constructor(ip, puerto, dmInicial, cantidad) {
    this.ip = ip; //IP del plc
    this.puerto = puerto; //Puerto de conexion TCP
    this.dmInicial = dmInicial; //Variable de inicio
    this.cantidad = cantidad; //Cantidad de estaciones

    this.client = null; //Se activa en caso de que ya este un cliente activo
    this.isConnected = false; //Se activa en caso de que ya se este conectado
    this.buffer = ""; //"variable" o espacio donde se guardan las variables leidas del plc
    this.valoresCicloAnterior = new Array(cantidad).fill(null); //Valores de la iteracion anterior
    this.valoresCicloActual = []; //Valores de la iteracion actual
    this.reconnectTimer = null; //Se activa cuando hay algun error de conexion al plc
    this.esperandoRespuesta = false; //Se activa en caso de saturacion del plc
    this.cicloTimeout = null; //Tiempo que se tarda en volver a ejecutar el ciclo
    this.ciclosCompletados = 0; //Cantidad de ciclos, sirve para la desconexion y conexion de prevencion
    this.maxCiclosSinReconectar = 50; //Indica en que iteracion se hara la desconexion de prevencion
    this.procesoIntencional = false; //Indica si se interrumpio intencionalmente
  }

  // Limpia absolutamente todo antes de destruir o reiniciar
  detener() {
    console.log(`[PLC ${this.ip}] Deteniendo cliente de forma absoluta...`);
    this.procesoIntencional = true;

    // Limpia todos los temporizadores
    this.limpiarTimeouts();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // IMPORTANTE: Quitar listeners ANTES de destruir para evitar que el evento 'close' dispare reconexiones
    if (this.client) {
      this.client.removeAllListeners();
      this.client.destroy();
      this.client = null;
    }

    //Reestablece todas las variables dependientes
    this.isConnected = false;
    this.esperandoRespuesta = false;
  }

  connect() {
    // Si ya existe un cliente, cerramos el cliente antes de crear otro
    if (this.client) {
      this.detener();
    }

    this.procesoIntencional = false;
    //Crea un nuevo socket con una longitud de "variable especifica"
    this.client = new net.Socket({
      readableHighWaterMark: 256 * 1024,
      writableHighWaterMark: 256 * 1024,
    });

    //Intenta conectar durante 5 segundos
    this.client.setKeepAlive(true, 5000);
    //Quita delay entre la comunicacion del plc
    this.client.setNoDelay(true);
    //Si no se logra conectar reintenta la conexion en 30 segundos
    this.client.setTimeout(30000);

    //Se conecta al cliente
    this.client.on("connect", () => {
      //Establece el estatus como conectado
      this.isConnected = true;
      //log
      console.log(`Conectado a PLC ${this.ip}:${this.puerto}`);
      //Inicia el ciclo (que se repita cada 0.5)
      this.iniciarCiclo();
    });

    this.client.on("data", (data) => {
      //Al buffer le va agregando la informacion del plc
      this.buffer += data.toString();
      //Si el buffer se llena borra todo y lo deja limpio
      if (this.buffer.length > 10000) {
        this.buffer = "";
        return;
      }

      //Procesamos solo si tenemos un terminador \r\n
      let delimiterIndex;
      //Separa las variables una a una para dejarlas en formato [1000,1001,1004]
      while ((delimiterIndex = this.buffer.indexOf("\r\n")) !== -1) {
        const mensaje = this.buffer.substring(0, delimiterIndex).trim();
        this.buffer = this.buffer.substring(delimiterIndex + 2);
        //Si el mensaje SI existe
        if (mensaje.length > 0) {
          //Pasa a la funcion procesar bloque con el mensaje como parametro
          this.procesarRespuestaBloque(mensaje);
        }
      }
    });

    //En caso de que se acabe el tiempo de conexion
    this.client.on("timeout", () => {
      //Advierte en consola
      console.warn("PLC NO RESPONDE (Timeout)");
      //Destruye el cliente para poder permitir la conexion de otro
      this.client.destroy();
    });

    //Si hay un error en algun punto / variable
    this.client.on("error", (err) => {
      //Si es intencional lo ignora (en caso de la reconexion preventiva)
      if (this.procesoIntencional) return;
      // Imprime el log
      console.error(`Error de conexión PLC: ${err.message}`);

      //Establece como desconectado
      this.isConnected = false;
      //Ejectua schedule reconnect
      this.scheduleReconnect();
    });

    //Si la conexion se cierra
    this.client.on("close", () => {
      //Si la conexion cerrada es intencional
      if (this.procesoIntencional) {
        // Imprime el log y retorna
        console.log("Cierre de socket intencional y limpio.");
        return;
      }
      // Advierte en consola
      console.warn("Conexión cerrada inesperadamente");
      // Establece el estatus como desconectado
      this.isConnected = false;
      // Ejecuta schedule reconnect
      this.scheduleReconnect();
    });

    //Hace la conexion
    this.client.connect(this.puerto, this.ip);
  }

  //Limpia el timeout indicado (parte del limpiado de conexiones)
  limpiarTimeouts() {
    if (this.cicloTimeout) {
      clearTimeout(this.cicloTimeout);
      this.cicloTimeout = null;
    }
  }

  //Inidica que en caso de error se siga intentando conectar
  scheduleReconnect() {
    if (this.reconnectTimer || this.procesoIntencional) return;
    console.log("Reconectando en 5s...");
    this.limpiarTimeouts();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  //Ciclo donde se leen las variables
  iniciarCiclo() {
    //Validacion
    if (!this.isConnected || this.esperandoRespuesta || this.procesoIntencional)
      return;
    if (!this.client || !this.client.writable) return;
    // Establece que se esta esperando una respuesta
    this.esperandoRespuesta = true;
    //Vriable que almacena el comando a ejecutar en el plc
    const comando = `RDS DM${this.dmInicial} ${this.cantidad}`;

    try {
      //Le manda el comando al plc
      this.client.write(comando + "\r\n", (err) => {
        //Si da error lo devuelve
        if (err) {
          console.error(`Error al escribir: ${err.message}`);
          this.esperandoRespuesta = false;
        }
      });
    } catch (err) {
      //Si se rompe la conexion lo indica
      console.error(`Excepción en escritura: ${err.message}`);
      this.esperandoRespuesta = false;
    }
  }

  //Funcion que procesa la respuesta del plc
  procesarRespuestaBloque(mensaje) {
    // En caso de cerrar la conexion intencionalmente
    if (this.procesoIntencional) return;

    //Los E en PLC indica error en la lectura por lo tanto maneja dicho error
    if (mensaje.startsWith("E")) {
      console.error(`Error del PLC: ${mensaje}`);
      this.esperandoRespuesta = false;
      this.limpiarTimeouts();
      this.cicloTimeout = setTimeout(() => this.iniciarCiclo(), 2000);
      return;
    }

    //El mensaje lo divide por espacios y lo agrega a un arreglo
    const valoresRaw = mensaje.split(" ");
    // Va recorriendo el arreglo y lo va parseando a entero, maneja los NaN
    this.valoresCicloActual = valoresRaw.map((v) => {
      const n = parseInt(v);
      return isNaN(n) ? null : n;
    });

    if (this.valoresCicloActual.length !== this.cantidad) {
      this.esperandoRespuesta = false;
      return;
    }

    this.finalizarCiclo();
  }

  finalizarCiclo() {
    if (this.procesoIntencional) return;

    // Comparación y envío de datos si hay cambios
    this.valoresCicloActual.forEach((valor, index) => {
      if (valor !== this.valoresCicloAnterior[index] && valor !== null) {
        this.sendData(valor, index + 1);
      }
    });

    //Define la variable de inicio contando el total y le resta 5
    //Si son 135 le resta 5 y da 130 que es la variable inicial de produccion
    let indiceInicioProgreso = this.valoresCicloActual.length - 5;
    //Defina la variable final que vendria siendo el conteo de todas estas
    let indiceFinProgreso = this.valoresCicloActual.length;

    //Una vez teniendo el indice se crea otro arreglo que corta el arreglo en la posicion indiceInicioProgreso
    //Hasta indiceFinProgreso
    const valoresProgreso = this.valoresCicloActual.slice(
      indiceInicioProgreso,
      indiceFinProgreso,
    );

    console.log("VALORES PRODUCCION: ", valoresProgreso);
    //El arreglo que se recorto se recorre uno en uno
    valoresProgreso.forEach((linea, index) => {
      //Si encuentra que un elemento de ese arreglo es 1
      if (linea != 1) {
        console.log("NO HAY PRODUCCION EN LA LINEA: ", index + 1);
      }

      if (linea == 1) {
        this.actualizarEstatus(index + 1);
      }
    });

    console.log(this.valoresCicloActual);
    console.log(`POOL: ${new Date()}`);
    this.valoresCicloAnterior = [...this.valoresCicloActual];
    this.esperandoRespuesta = false;
    this.ciclosCompletados++;

    // Reconexión preventiva revisada
    if (this.ciclosCompletados >= this.maxCiclosSinReconectar) {
      console.log(`Reconexión preventiva (${this.ciclosCompletados} ciclos)`);
      this.ciclosCompletados = 0;
      this.detener(); // Limpia todo
      setTimeout(() => {
        this.connect(); // Crea conexión nueva limpia
      }, 2000);
      return;
    }

    this.limpiarTimeouts();
    this.cicloTimeout = setTimeout(() => this.iniciarCiclo(), 1000);
  }

  async sendData(codigoColor, idEstacion) {
    try {
      await axios.post("http://localhost:3000/api/estatus/actualizarEstatus", {
        color: codigoColor,
        idLineaProduccion: idEstacion,
      });
      console.log(`ACTUALIZADO E${idEstacion}: ${codigoColor}`);
    } catch (err) {
      console.error(`Error enviando datos E${idEstacion}: ${err.message}`);
    }
  }

  async actualizarEstatus(idLinea) {
    try {
      await axios.post(
        `http://localhost:3000/api/turno/actualizarProgresoProduccionMultiLinea/${idLinea}`,
      );
    } catch (e) {
      console.log(`Error enviando datos E${idLinea}: ${e.message}`);
    }
  }
}

let clienteActivo = null;

const obtenerEstaciones = async (ip) => {
  try {
    console.log("KEYENCE SCRIPT");
    console.log("IP: ", ip);

    const response = await axios.get(
      "http://localhost:3000/api/linea/obtenerLineasRegistradas",
    );
    const totalEstaciones = response.data.lineas.length;

    const dmInicio = 100;
    const cantidadVariables = totalEstaciones;

    if (clienteActivo) {
      // Si la cantidad es la misma, no hacemos nada
      if (clienteActivo.cantidad === cantidadVariables) {
        console.log("Reutilizando cliente activo (sin cambios)");
        return;
      }

      // Si cambió o si totalEstaciones es 0, matamos al cliente actual
      console.log("Configuración cambió. Limpiando cliente anterior...");
      clienteActivo.detener();
      clienteActivo = null;
    }

    if (totalEstaciones === 0) {
      console.log("No hay líneas para monitorear.");
      return;
    }

    // Iniciar nuevo cliente
    console.log(`Iniciando monitoreo de ${totalEstaciones} estaciones...`);
    clienteActivo = new Client(ip, 8501, dmInicio, cantidadVariables + 5);
    clienteActivo.connect();
  } catch (e) {
    console.error("Error en obtenerEstaciones:", e.message);
  }
};

module.exports = { Client, obtenerEstaciones };
