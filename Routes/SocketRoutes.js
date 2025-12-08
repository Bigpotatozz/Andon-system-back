const { socketObtenerEstatus } = require("../Controllers/estatusController");
const {
  socketObtenerLineasController,
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
  });
};

module.exports = { socketRoutes };
