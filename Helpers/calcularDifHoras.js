//Recibe las hora en formato HH:MM:SS
const calcularHoras = (horaInicio, horaFin) => {
  //Calcula los segundos de cada hora
  const segundosInicio = calcularSegundos(horaInicio);
  const segundosFin = calcularSegundos(horaFin);

  //Ya parseando a segundos se resta la hora de fin con la de inicio
  let diferencia = segundosFin - segundosInicio;

  //Si la diferencia es negativa, significa que la hora de fin es menor a la de inicio
  //Esto es en caso de que sea otro dia, por lo tanto agrega un dia entero
  if (diferencia <= 0) {
    diferencia += 86400;
  }

  //Devuelve la diferencia en horas
  return diferencia / 3600;
};

const calcularSegundos = (hora) => {
  //La hora la divide por : luego la convierte en numero para devolver un arreglo [10, 20, 10] Horas | Minutos | Segundos
  const [horas, minutos, segundos] = hora.split(":").map(Number);

  //Devuelve los segundos totales
  //Horas * cantidad de segundos de una hora + Minutos * cantidad de segundos de un minuto + Segundos
  return horas * 3600 + minutos * 60 + segundos;
};

module.exports = {
  calcularHoras,
  calcularSegundos,
};
