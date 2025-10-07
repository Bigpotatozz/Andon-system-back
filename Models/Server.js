const express = require("express");
const cors = require("cors");
const { pool } = require("../Config/connection.js");

class Server {
  constructor() {
    console.log("Clase iniciada");
    this.app = express();
    this.connection();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  async connection() {
    try {
      await pool;
      console.log("Conectado a la base de datos");
    } catch (e) {
      console.log(e);
    }
  }

  listen() {
    this.app.listen(3000, () => {
      console.log("Servidor corriendo en el puerto 3000");
    });
  }
}

module.exports = { Server };
