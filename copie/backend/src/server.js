require('dotenv').config();
const app = require('./app');
const { demarrerNettoyage } = require('./services/nettoyage');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`CampusSave API running on http://localhost:${PORT}/api`);
  demarrerNettoyage(); // commandes non payées : annulation après 30 min, toutes les 5 min
});