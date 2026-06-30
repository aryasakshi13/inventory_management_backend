import express from 'express';
import { getVendors, createVendor } from '../controllers/vendor_controller.js';

const router = express.Router();

// 🟢 Mounts directly to /api/vendor due to the prefix assignment in server.js
router.get('/', getVendors);
router.post('/', createVendor);

export default router;