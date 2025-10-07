const { Router } = require("express");
const { crearEstatus } = require("../Controllers/estatusController");

const estatus_router = Router();

estatus_router.post("/crearColor", crearEstatus);

module.exports = { estatus_router };
