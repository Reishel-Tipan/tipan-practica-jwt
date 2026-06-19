import jwt from 'jsonwebtoken';
import { JwtService } from '../services/jwt.service.js';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = JwtService.verifyToken(token);
        req.user = payload;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
        }

        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(403).json({ error: 'Firma o algoritmo inválido', code: 'INVALID_TOKEN' });
        }

        return res.status(403).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
    }
};
