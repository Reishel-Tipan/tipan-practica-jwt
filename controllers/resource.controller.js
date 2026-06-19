export class ResourceController {
    static getAlphaPrivateData(req, res) {
        return res.status(200).json({
            service: 'service-alpha',
            message: 'Acceso autorizado al Microservicio Alpha',
            authenticated_user: {
                id: req.user.sub,
                name: req.user.name,
            },
            timestamp: new Date().toISOString(),
        });
    }

    static getBetaPrivateData(req, res) {
        return res.status(200).json({
            service: 'service-beta',
            message: 'Acceso autorizado al Microservicio Beta',
            authenticated_user: {
                id: req.user.sub,
                name: req.user.name,
            },
            timestamp: new Date().toISOString(),
        });
    }
}
