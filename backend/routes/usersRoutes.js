import express from 'express';
const router = express.Router();
import {
    loginUser,
    registerUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    confirmUser
} from '../controllers/usersController.js';
import { protect } from '../middleware/authMiddleware.js';


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/confirm/:id', confirmUser);


export default router;