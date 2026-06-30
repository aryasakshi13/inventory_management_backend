// routes/office_routes.js
import express from 'express';
import { getOffices, createOffice } from '../controllers/branch_controller.js';

const router = express.Router();

router.get('/', getOffices);
router.post('/offices', createOffice);

export default router;