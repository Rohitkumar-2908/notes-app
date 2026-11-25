import { Router } from 'express';
import { getStats, getUsers, createUser, updateUser, deleteUser } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../models/User.js';

const router = Router();

// Middleware chain: authenticate -> authorize(admin) -> controller
router.use(protect, authorize(ROLES.ADMIN));

router.get('/stats', getStats);
router.route('/users').get(getUsers).post(createUser);
router.route('/users/:id').patch(updateUser).delete(deleteUser);

export default router;
