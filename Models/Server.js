const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { pool } = require("../Config/connection.js");
const { lineaRouter } = require("../Routes/LineasRoutes.js");
const { estatus_router } = require("../Routes/EstatusRoutes.js");
const { historicoRouter } = require("../Routes/HistoricoRoutes.js");
const { socketRoutes } = require("../Routes/SocketRoutes.js");

//Inicializacion de la aplicacion
class ServerNode {
  //Inicializacion de los metodos
  constructor() {
    this.app = express();
    this.connection();
    this.middlewares();
    this.routes();
  }

  //Registro de middlewares
  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use("/uploads", express.static("uploads"));
  }

  //Funcion de conexion
  async connection() {
    try {
      await pool;
      console.log("Conectado a la base de datos");
    } catch (e) {
      console.log(e);
    }
  }

  //Registro de rutas
  routes() {
    this.app.use("/api/linea", lineaRouter);
    this.app.use("/api/estatus", estatus_router);
    this.app.use("/api/historico/", historicoRouter);
  }

  socketEvents() {
    this.io.on("connection");
  }

  //Funcion de escucha
  listen() {
    this.httpServer = this.app.listen(3000, () => {
      console.log("Servidor corriendo en el puerto 3000");
    });

    this.io = new Server(this.httpServer, {
      cors: "*",
    });

    this.app.set("io", this.io);

    socketRoutes(this.io);
  }
}

module.exports = { ServerNode };
