import { Router } from 'express';
import db, { initDB } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  await initDB();
  res.json(db.data!.badges);
});

export default router;