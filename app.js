const dotenv = require("dotenv");
const { Server } = require("./Models/Server.js");
const { main } = require("./Helpers/plc.js");
//Punto de entrada de la aplicacion
dotenv.config();

const servidor = new Server();
servidor.listen();
