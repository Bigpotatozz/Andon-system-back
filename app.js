const dotenv = require("dotenv");
const { Server } = require("./Models/Server.js");
//Punto de entrada de la aplicacion
dotenv.config();

const servidor = new Server();

servidor.listen();
