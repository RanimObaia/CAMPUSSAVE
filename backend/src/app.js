const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { limiteGenerale } = require('./middleware/limiteur');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Derrière le proxy de l'hébergeur (Render, Railway…) : lire la vraie adresse IP pour la limite de requêtes
app.set('trust proxy', 1);
app.use('/api', limiteGenerale, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
