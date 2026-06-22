import 'dotenv/config';
import * as Sentry from '@sentry/node';
import express from 'express';
import { config } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import resourceRoutes from './routes/resource.routes.js';

const app = express();

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/', resourceRoutes);

// El handler de Sentry debe registrarse después de todas las rutas
Sentry.setupExpressErrorHandler(app);

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
});
