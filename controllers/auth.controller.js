import { JwtService } from '../services/jwt.service.js';

const USERS = [
    { id: 1, username: 'admin', password: 'admin123', name: 'Administrador del Sistema' },
    { id: 2, username: 'user', password: 'user123', name: 'Usuario General' },
];

export class AuthController {
    static async generateToken(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Credenciales requeridas' });
        }

        const user = USERS.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = JwtService.signToken({ id: user.id, name: user.name });

        return res.status(200).json({
            access_token: token,
            token_type: 'Bearer',
            expires_in: 60,
            algorithm: 'RS256',
        });
    }
}
