const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
//Accede a DOTENV
dotenv.config();

//Crea un pool para la interaccion con base de datos
//Usa las variables de entorno
const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.PORT,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

//Conecta el pool
pool
  .getConnection()
  .then((connection) => {
    console.log("Conectado a la base de datos");
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = { pool };
