import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export class JwtService {
    static signToken(user) {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            sub: user.id,
            name: user.name,
            exp: now + 60, // expira exactamente en 1 minuto
        };

        if (config.PRIVATE_KEY) {
            return jwt.sign(payload, config.PRIVATE_KEY, { algorithm: 'RS256' });
        }

        return jwt.sign(payload, config.JWT_SECRET, { algorithm: 'HS256' });
    }

    static verifyToken(token) {
        if (config.PUBLIC_KEY) {
            return jwt.verify(token, config.PUBLIC_KEY, { algorithms: ['RS256'] });
        }

        return jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    }
}
