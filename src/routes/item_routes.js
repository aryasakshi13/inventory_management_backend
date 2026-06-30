import express from 'express';
import { getItemsCatalog, createNewProductClass } from '../controllers/items_controller.js';

const router = express.Router();

 import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

// const verifyToken = (req, res, next) => {
//     req.user = {
//         role: req.headers['x-user-role'] || 'employee',
//         officeId: req.headers['x-user-office-id'] || 1
//     };
//     next();
// };

// 2️⃣ Copy your isAdmin block (Modified strictly for 'admin' only, no branch admin!)
// const isAdmin = (req, res, next) => {
//     const userRole = (req.user?.role || '').toLowerCase();
//     if (userRole !== 'admin') {
//         return res.status(403).json({
//             success: false,
//             message: "Access Denied. Operational parameters require Master Administrator clearance privileges."
//         });
//     }
//     next();
// };

// Route for your items directory listing & dropdown elements
router.get('/', getItemsCatalog);

// Route for your standalone item catalog registration modal
router.post('/add',verifyToken, authorizeRoles('admin'), createNewProductClass);

export default router;