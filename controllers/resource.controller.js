import * as Sentry from '@sentry/node';

export class ResourceController {
    // Error operacional simulado: Sentry lo captura automáticamente vía su ErrorHandler
    static getAlphaPrivateData(req, res, next) {
        try {
            throw new Error('Conexión perdida con la BDD');
        } catch (err) {
            return next(err);
        }
    }

    // Captura explícita con tags y contexto extra solo si ocurre un error real
    static getBetaPrivateData(req, res, next) {
        try {
            return res.status(200).json({
                service: 'service-beta',
                message: 'Acceso autorizado al Microservicio Beta',
                authenticated_user: {
                    id: req.user.sub,
                    name: req.user.name,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            Sentry.withScope((scope) => {
                scope.setTag('service', 'service-beta');
                scope.setTag('user_id', req.user?.sub ?? 'unknown');
                scope.setExtra('endpoint', '/v1/service-beta/private');
                scope.setExtra('user_name', req.user?.name ?? 'unknown');
                Sentry.captureException(err);
            });
            return next(err);
        }
    }
}
