import express from 'express';
import multer from 'multer';
import path from 'path';

import { addInventoryBatch, updateInventoryItem, getInventory, issueInventoryAsset, getInventoryTransfers, acceptBranchTransfer, getEmployeeIssuedHistory,  getBranchStock, rejectBranchTransfer} from '../controllers/inventry_controller.js';


import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid format. Only PDF documentation copies are permitted.'), false);
    }
};

const upload = multer({ storage, fileFilter });

// const verifyToken = (req, res, next) => {
//     // In production, parse your actual JWT token and attach user metadata to req.user
//     // Example simulated logged-in user context payload:
//     req.user = {
//         role: req.headers['x-user-role'] || 'employee',      // admin, branch admin, employee
//         officeId: req.headers['x-user-office-id'] ||  1   // 'HQ', 'Branch_A', etc.
//     };
//     next();
// };

// const isAdmin = (req, res, next) => {
//     const userRole = (req.user?.role || '').toLowerCase();
//     if (userRole !== 'admin' && userRole !== 'branch admin') {
//         return res.status(403).json({
//             success: false,
//             message: "Access Denied. Operational parameters require Master Administrator clearance privileges."
//         });
//     }
//     next();
// };



router.post('/add', verifyToken, authorizeRoles('admin', 'branch admin'), upload.fields([
    { name: 'purchaseCopy', maxCount: 1 },
    { name: 'invoiceCopy', maxCount: 1 }
]), addInventoryBatch);

router.post('/update', verifyToken, authorizeRoles('admin', 'branch admin' ), upload.fields([
    { name: 'purchaseCopy', maxCount: 1 },
    { name: 'invoiceCopy', maxCount: 1 }   
]),updateInventoryItem);

router.get('/', verifyToken, getInventory);




router.post('/issue', verifyToken, authorizeRoles('admin', 'branch admin'), issueInventoryAsset);

// Add this dedicated route line alongside your other endpoints
router.get('/transfers-log', getInventoryTransfers);

router.get('/issued-history', getEmployeeIssuedHistory);

router.get('/branch-stock/:officeId', verifyToken, getBranchStock);

router.post('/accept', verifyToken, authorizeRoles('admin', 'branch admin'), acceptBranchTransfer);


router.post('/reject', verifyToken, authorizeRoles('admin', 'branch admin'), rejectBranchTransfer);
export default router;

