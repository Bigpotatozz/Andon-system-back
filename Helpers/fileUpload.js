const fs = require("fs");
const multer = require("multer");
const path = require("path");

//Funcion para guardar archivos de musica

//Define donde se guardaran los archivos
const uploadDir = "uploads";
//Verifica si existe ese archivo, de lo contrario lo guarda
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

//Inicializacion de funcion para guardado
const storage = multer.diskStorage({
  //Define donde se guardara el archivo
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  //Le asigna un nombre nuevo
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

//Filtro para la validacion de tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp3|wav|ogg|m4a/;
  const allowedMimeTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/x-m4a",
    "audio/mp4",
  ];
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  console.log("Extensión válida:", extname);
  console.log("Mimetype válido:", mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Solo permitidos archivos de audio"));
  }
};

//Guarda el archivo
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
