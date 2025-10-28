const express = require("express");
const cors = require("cors");
const { pool } = require("../Config/connection.js");
const { lineaRouter } = require("../Routes/LineasRoutes.js");
const { estatus_router } = require("../Routes/EstatusRoutes.js");

//Inicializacion de la aplicacion
class Server {
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
  }

  //Funcion de escucha
  listen() {
    this.app.listen(3000, () => {
      console.log("Servidor corriendo en el puerto 3000");
    });
  }
}

module.exports = { Server };
