const {
  socketObtenerOEEPrincipal,
} = require("../Controllers/analisisController");
const { socketObtenerEstatus } = require("../Controllers/estatusController");
const {
  socketObtenerLineasController,
  socketObtenerEstaciones,
} = require("../Controllers/lineasController");
const { socketObtenerTurno } = require("../Controllers/productionController");

//Seccion de sockets
const socketRoutes = async (io) => {
  //Se incia el socket y se definen las "rutas"
  io.on("connection", (socket) => {
    console.log("Cliente conectado");

    //Socket que obtiene los estatus
    socket.on("obtenerEstatus", () => {
      socketObtenerEstatus(socket);
    });

    //socket que obtiene los turnos
    socket.on("obtenerTurno", () => {
      socketObtenerTurno(socket);
    });

    //socket que obtiene las estaciones
    socket.on("obtenerEstaciones", () => {
      socketObtenerEstaciones(socket);
    });

    socket.on("obtenerOEESocket", () => {
      socketObtenerOEEPrincipal(socket);
    });
  });
};

module.exports = { socketRoutes };
