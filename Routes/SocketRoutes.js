const { socketObtenerEstatus } = require("../Controllers/estatusController");
const {
  socketObtenerLineasController,
  socketObtenerEstaciones,
} = require("../Controllers/lineasController");
const { socketObtenerTurno } = require("../Controllers/productionController");

const socketRoutes = async (io) => {
  io.on("connection", (socket) => {
    console.log("Cliente conectado");

    socket.on("obtenerEstatus", () => {
      socketObtenerEstatus(socket);
    });

    socket.on("obtenerTurno", () => {
      socketObtenerTurno(socket);
    });

    socket.on("obtenerEstaciones", () => {
      socketObtenerEstaciones(socket);
    });
  });
};

module.exports = { socketRoutes };
