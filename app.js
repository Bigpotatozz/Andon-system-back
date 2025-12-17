const dotenv = require("dotenv");
const { ServerNode } = require("./Models/Server.js");
const { main } = require("./Helpers/plc.js");
const { plc_produccion } = require("./Helpers/plc_estatus.js");

//Punto de entrada de la aplicacion
dotenv.config();

const servidor = new ServerNode();
servidor.listen();
