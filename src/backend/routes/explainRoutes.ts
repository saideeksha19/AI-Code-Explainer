import { Router, Response, NextFunction } from 'express';
import { explainCode, getUserHistory, deleteHistoryItem, remediateVulnerability, scanFile, proxyGithubZip } from '../controllers/explainController';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to attach user profile optionally if authorization is present
function optionalProtect(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return (protect as any)(req, res, next);
  }
  next();
}

router.post('/analyze', optionalProtect as any, explainCode as any);
router.post('/remediate', optionalProtect as any, remediateVulnerability as any);
router.post('/scan-file', optionalProtect as any, scanFile as any);
router.get('/github-zip', optionalProtect as any, proxyGithubZip as any);
router.get('/history', protect as any, getUserHistory as any);
router.delete('/history/:id', protect as any, deleteHistoryItem as any);



export default router;
