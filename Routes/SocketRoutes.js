const { socketObtenerEstatus } = require("../Controllers/estatusController");
const {
  socketObtenerLineasController,
} = require("../Controllers/lineasController");

const socketRoutes = async (io) => {
  io.on("connection", (socket) => {
    console.log("Cliente conectado");

    socket.on("obtenerEstatus", () => {
      socketObtenerEstatus(socket);
    });
  });
};

module.exports = { socketRoutes };
