const axios = require("axios");
// Importamos Controller, Tag y ahora TagGroup
const { Controller, Tag, TagGroup } = require("st-ethernet-ip");

class AllenBradleyClient {
  constructor(ip, slot, nombreArreglo, cantidadElementos) {
    //Ip del PLC
    this.ip = ip;
    //Slot en memoria que se va a leer
    this.slot = slot || 0;
    //Nombre del arreglo
    this.nombreArreglo = nombreArreglo;
    //Cantidad de elementos a leer dentro del arreglo
    this.cantidadElementos = cantidadElementos;
    //Arreglo de valores
    this.valoresArray = [];
    // Creamos un TagGroup para agrupar todas las posiciones del arreglo
    this.grupo = new TagGroup();
    //Tags
    this.tags = [];

    this.estatusAnteriores = [];

    // Llenamos el grupo con cada índice: Estaciones[0], Estaciones[1]...
    for (let i = 0; i < this.cantidadElementos; i++) {
      //Creamos el objeto estacion donde vendra cada elemento del plc
      const estacion = {
        nombre: new Tag(`${this.nombreArreglo}[${i}]`),
        estatus: new Tag(`${this.nombreArreglo}[${i}].Estatus`),
        boton: new Tag(`${this.nombreArreglo}[${i}].Boton`),
      };
      //Pusheamos el bojeto con los respectivos comandos
      this.tags.push(estacion);

      this.grupo.add(estacion.nombre);
      this.grupo.add(estacion.estatus);
      this.grupo.add(estacion.boton);
    }
    //Controlador de la libreria
    this.plc = new Controller();
    //Verifica el estado del plc
    this.isConnected = false;
    //Valores
    this.valoresAnteriores = {};
    this.reconnectTimer = null;
    this.cicloTimeout = null;
    this.procesoIntencional = false;
  }

  detener() {
    console.log(`[PLC ${this.ip}] Deteniendo cliente...`);
    this.procesoIntencional = true;
    this.limpiarTimeouts();
    if (this.plc) this.plc.disconnect();
    this.isConnected = false;
  }

  async connect() {
    this.procesoIntencional = false;
    try {
      await this.plc.connect(this.ip, this.slot);
      this.isConnected = true;
      console.log(`Conectado a CompactLogix ${this.ip}`);
      this.iniciarCiclo();
    } catch (err) {
      console.error(`Error de conexión PLC: ${err.message}`);
      this.scheduleReconnect();
    }
  }

  limpiarTimeouts() {
    if (this.cicloTimeout) {
      clearTimeout(this.cicloTimeout);
      this.cicloTimeout = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.procesoIntencional) return;
    console.log("Reconectando en 5s...");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  async iniciarCiclo() {
    if (!this.isConnected || this.procesoIntencional) return;

    try {
      // LEER TODO EL GRUPO (Un solo paquete CIP para todo el arreglo)
      await this.plc.readTagGroup(this.grupo);
      const estatusActuales = [];
      // Iteramos sobre los tags que ya tienen sus valores actualizados
      this.tags.forEach((tag, index) => {
        const nombre = tag.value;
        const estatus = tag.estatus.value;
        const boton = tag.boton.value;

        estatusActuales.push({
          nombre: `Estacion ${index + 1}`,
          estatus: estatus,
          boton: boton,
        });
      });

      this.procesarRespuesta(estatusActuales);
      this.estatusAnteriores = estatusActuales;

      console.log(this.estatusAnteriores);
      console.log(`POOL GRUPO OK: ${new Date().toLocaleTimeString()}`);
      this.cicloTimeout = setTimeout(() => this.iniciarCiclo(), 2000);
    } catch (err) {
      console.error(`Error en ciclo de lectura: ${err.message}`);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  async procesarRespuesta(respuesta) {
    try {
      respuesta.forEach((elemento, index) => {
        if (elemento.estatus !== this.estatusAnteriores[index].estatus) {
          this.sendData(elemento.estatus + 1000, index + 1);
        }

        if (elemento.boton) {
          this.actualizarEstatus(index + 1);
        }
      });
    } catch (e) {
      console.log(e);
    }
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
      console.log(`Error API: ${e.message}`);
    }
  }
}

let clienteActivo = null;

const obtenerEstacionesBradley = async (ip) => {
  try {
    console.log("ALLEN BRADLEY SCRIPT");
    console.log("IP: ", ip);

    const response = await axios.get(
      "http://localhost:3000/api/linea/obtenerLineasRegistradas",
    );
    const totalEstaciones = response.data.lineas.length;
    const cantidadVariables = totalEstaciones;

    if (clienteActivo) {
      // Si la cantidad es la misma, no hacemos nada
      if (clienteActivo.cantidadElementos === cantidadVariables) {
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

    const nombreDelArreglo = "Estaciones";
    const tamanoDelArreglo = cantidadVariables;

    clienteActivo = new AllenBradleyClient(
      ip,
      0,
      nombreDelArreglo,
      tamanoDelArreglo,
    );
    clienteActivo.connect();
  } catch (error) {
    console.error("Error al obtener estaciones:", error);
    return [];
  }
};

module.exports = {
  AllenBradleyClient,
  obtenerEstacionesBradley,
};
