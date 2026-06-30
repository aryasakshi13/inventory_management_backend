import express from "express";

import { loginUser, logoutUser, addEmployee, updateCredentials, getAllEmployees, searchEmployees } from "../controllers/auth_controller.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", logoutUser);

// router.get("/admin/dashboard-data", verifyToken, authorizeRoles("admin"), (req, res) => {
//     return res.status(200).json({
//         success: true,
//         message: "Welcome to the Secure Admin Server Workspace.",
//         userEmail: req.user.email 
//     });
// });

router.post("/add-employee", addEmployee); 
router.post("/update-credentials", updateCredentials);
router.get('/employees', getAllEmployees);

router.get('/search', searchEmployees);
export default router;