const { default: axios } = require("axios");
const net = require("net");

class Client {
  constructor(ip, puerto, comandos) {
    //Ip del PLC
    this.ip = ip;
    //Puerto de los datos
    this.puerto = puerto;

    //Arreglo de comandos a verificar
    this.comandos = comandos;
    //Socket
    this.client = new net.Socket();
    //Valida si esta conectado al PLC
    this.isConnected = false;

    this.pollingInterval = null;

    // Buffer y Control
    this.buffer = "";
    this.valoresCicloAnterior = [];
    this.valoresCicloActual = []; // Almacena respuestas del ciclo en curso
    this.indiceComandoActual = 0; // Saber qué comando estamos esperando
  }

  connect() {
    //Se conecta al PLC
    this.client.connect(this.puerto, this.ip);

    //Escucha cuando se conecta
    this.client.on("connect", () => {
      //Establece conectado como true
      this.isConnected = true;
      console.log(`Conectado a PLC ${this.ip}:${this.puerto}`);
      //Inicia el polling de datos
      this.iniciarPolling();
    });

    //Se ejecuta cuando recibe datos
    this.client.on("data", (data) => {
      //Todas las respuestas del plc las va concatenando aqui

      this.buffer += data.toString();

      let delimiterIndex;
      //Busca cuando la cadena de texto y corta cuando hay un \r\n
      //Mientras en la cadena encuentre estos caracteres sigue haciendo el while
      // "100\r\n" dura una vez "100\r\n200\r\n" dura dos veces
      // Si un dato no termina en \r\n aborta ese elemento
      while ((delimiterIndex = this.buffer.indexOf("\r\n")) !== -1) {
        //Obtiene toda la cadena desde el inicio hasta la posicion donde encontro el \r\n y le quita espacios
        //Limpia los espacios en blanco " " con trim()
        const mensaje = this.buffer.substring(0, delimiterIndex).trim();

        //Forma el comando para mandarlo al plc
        this.buffer = this.buffer.substring(delimiterIndex + 2);

        //Si el mensaje es mayor a 0 lo manda a procesarRespuesta
        if (mensaje.length > 0) {
          this.procesarRespuesta(mensaje);
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

  procesarRespuesta(mensaje) {
    // Los PLC cuando mandan error dan un E, este valida si hay alguno y lo imprime
    if (mensaje.startsWith("E")) {
      console.error(
        `Error del PLC en comando ${
          this.comandos[this.indiceComandoActual]
        }: ${mensaje}`
      );
      this.valoresCicloActual.push(null); // Guardar null para mantener el orden
    } else {
      //parsea la respuesta a un entero
      const valor = parseInt(mensaje);
      //valida que sea un numero
      if (!isNaN(valor)) {
        //pushea el valor al arreglo
        this.valoresCicloActual.push(valor);
      } else {
        //Si es diferente pues avisa e igual pushea para mantener el orden del arreglo
        console.warn(`Respuesta extraña: ${mensaje}`);
        this.valoresCicloActual.push(null);
      }
    }

    // Avanza al siguiente índice
    this.indiceComandoActual++;

    // Verificar si completamos el ciclo de todos los comandos
    if (this.indiceComandoActual >= this.comandos.length) {
      this.finalizarCiclo();
    }
  }

  finalizarCiclo() {
    // Aquí tienes TODOS los valores del polling actual
    console.log("CICLO COMPLETADO ESTATUS:", this.valoresCicloActual);

    this.valoresCicloActual.forEach((valor, index) => {
      if (valor !== this.valoresCicloAnterior[index]) {
        this.sendData(valor, index + 1);
      }
    });

    // Resetear para el siguiente ciclo
    this.valoresCicloAnterior = this.valoresCicloActual;
    this.valoresCicloActual = [];
    this.indiceComandoActual = 0;
  }

  iniciarPolling() {
    // Usamos un ciclo recursivo con setTimeout para garantizar orden y delay
    const loop = async () => {
      //Si no esta conectado al plc lo retorna
      if (!this.isConnected) return;

      // Envia los comando de uno en uno con un timeout de 50 milisegundos
      // Recorre los comandos
      for (let i = 0; i < this.comandos.length; i++) {
        if (!this.isConnected) break;

        const comando = this.comandos[i];
        this.client.write(comando + "\r\n");

        // Pausa de 50ms entre comandos para no saturar al PLC
        await new Promise((r) => setTimeout(r, 50));
      }

      // Esperar 1 segundo antes de iniciar el siguiente ciclo completo
      setTimeout(loop, 1000);
    };

    loop();
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

  reconnect() {
    if (this.pollingInterval) clearTimeout(this.pollingInterval); // Detener loop anterior

    setTimeout(() => {
      console.log("Reintentando conexión...");
      this.client.destroy(); // Asegurar limpieza
      this.client = new net.Socket(); // Nuevo socket limpio
      this.connect();
    }, 5000);
  }
}

const obtenerEstaciones = async () => {
  try {
  } catch (e) {}

  try {
    const response = await axios.get(
      "http://localhost:3000/api/linea/obtenerLineasRegistradas"
    );

    console.log(response.data);

    let contador = 150;
    let contador2 = 200;
    const comandos = [];
    const comandos2 = [];
    response.data.lineas.forEach((e) => {
      comandos.push(`RD DM${contador}`);

      comandos2.push(`RD DM${contador2}`);
      contador++;
      contador2++;
    });

    const PLC = new Client("192.168.0.10", 8501, comandos);
    PLC.connect();

    if (PLC.isConnected) {
      PLC.client.destroy();
    }
  } catch (e) {
    console.log(e);
  }
};

// Uso

obtenerEstaciones();

module.exports = { Client, obtenerEstaciones };
