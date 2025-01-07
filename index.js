const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

const DB_FILE = "./db.json";
let races = require(DB_FILE).races || [];

function saveToDatabase() {
  fs.writeFileSync(DB_FILE, JSON.stringify({ races }, null, 2));
}

app.get("/carrera/get", (req, res) => {
  res.json(races);
});

app.get("/carrera/get/:id", (req, res) => {
  const race = races.find((r) => r.id === parseInt(req.params.id));
  if (!race) {
    return res.send("Carrera no encontrada.");
  }
  res.json(race);
});

app.post("/carrera/post", (req, res) => {
  const numCorredores = req.query.numC;
  const distancia = req.query.distancia;

  if (!numCorredores || !distancia) {
    return res.send("numero de Corredores o distancia no fueron ingresados");
  }

  const nuevaCarrera = {
    id: races.length + 1,
    distance: distancia,
    corredores: Array.from({ length: numCorredores }, (_, i) => ({
      id: i + 1,
      nombre: `Corredor ${i + 1}`,
      velocidad: Math.floor(Math.random() * 10) + 1, // Velocidad aleatoria entre 1 y 10 km/h
      posicion: 0,
    })),
    ganador: null,
    terminada: false,
  };

  races.push(nuevaCarrera);
  saveToDatabase();
  res.json(nuevaCarrera);
});

app.put("/carrera/put/:id", (req, res) => {
  const race = races.find((r) => r.id === parseInt(req.params.id));
  if (!race) {
    return res.send("Carrera no encontrada.");
  }

  const corredores = req.query.numC;
  const distancia = req.query.distancia;
  if (distancia) race.distance = distancia;
  if (corredores) race.corredores = corredores;

  saveToDatabase();
  res.json(race);
});

app.delete("/carrera/delete/:id", (req, res) => {
  const raceIndex = races.findIndex((r) => r.id === parseInt(req.params.id));
  if (raceIndex === -1) return res.send("Carrera no encontrada.");

  const deletedRace = races.splice(raceIndex, 1);
  saveToDatabase();
  res.send("Carrera eliminada");
});

app.post("/simular/:id", (req, res) => {
    const race = races.find(r => r.id === parseInt(req.params.id));
    if (!race) return res.status(404).send("Carrera no encontrada.");

    if (race.terminada) {
        return res.status(400).json({ error: "La carrera ya ha sido simulada." });
    }

    // Registro del progreso por horas
    const progress = [];
    let hora = 0;

    while (!race.terminada) {
        hora++;

        race.corredores.forEach(corredor => {
            const distanciaAvanzada = corredor.velocidad;
            corredor.posicion += distanciaAvanzada;

            if (corredor.posicion >= race.distance && !race.terminada) {
                race.terminada = true;
                race.ganador = corredor.nombre;
            }
        });

        // Guardar el estado de la carrera en esta hora
        progress.push({
            hora,
            corredores: race.corredores.map(c => ({
                id: c.id,
                nombre: c.nombre,
                posicion: c.posicion > race.distance ? race.distance : c.posicion,
                distanciaAvanzada: c.posicion > race.distance ? 0 : c.velocidad
            })),
        });
    }

    // Guardar el resultado final en la base de datos
    saveToDatabase();

    // Enviar el progreso paso a paso junto con los resultados finales
    res.json({
        id: race.id,
        distance: race.distance,
        ganador: race.ganador,
        progress,
    });
});

app.listen(3000, () =>
  console.log(`Servidor corriendo...`)
);
