const dotenv = require("dotenv");
const { Server } = require("./Models/Server.js");
dotenv.config();

const servidor = new Server();

servidor.listen();
