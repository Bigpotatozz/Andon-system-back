const express = require("express");
const cors = require("cors");
const { pool } = require("../Config/connection.js");
const { lineaRouter } = require("../Routes/LineasRoutes.js");
const { estatus_router } = require("../Routes/EstatusRoutes.js");

class Server {
  constructor() {
    this.app = express();
    this.connection();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use("/uploads", express.static("uploads"));
  }

  async connection() {
    try {
      await pool;
      console.log("Conectado a la base de datos");
    } catch (e) {
      console.log(e);
    }
  }

  routes() {
    this.app.use("/api/linea", lineaRouter);
    this.app.use("/api/estatus", estatus_router);
  }

  listen() {
    this.app.listen(3000, () => {
      console.log("Servidor corriendo en el puerto 3000");
    });
  }
}

module.exports = { Server };
