import { Router } from 'express';
import { ResourceController } from '../controllers/resource.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/v1/service-alpha/private', authMiddleware, ResourceController.getAlphaPrivateData);
router.get('/v1/service-beta/private', authMiddleware, ResourceController.getBetaPrivateData);

export default router;
