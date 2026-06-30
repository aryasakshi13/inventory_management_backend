import pool from "../config/db.js";
import jwt from "jsonwebtoken" ;
import bcrypt from 'bcryptjs';
import { createHash } from "crypto";
import crypto from 'crypto';
// import { connectDB } from "../config/db.js";
import db from '../config/db.js';

export const loginUser = async (req, res) =>{
     try{
         const {email, password} = req.body;

         console.log("user.....:", email)

         if(!email || !password){
            return res.status(400).json({success:false, message: "User not found."});
         }
 
        //  const [rows] = await pool.query('SELECT * FROM employeemaster where Mail = ?',[email]);

         const [rows] = await pool.query(
                'SELECT *, OfficeID as officeId FROM employeemaster WHERE Mail = ? LIMIT 1',
            [email]
         );

        //  const rows = dbResult[0];
         if(rows.length === 0){
             return res.status(401).json({success: false, message:"Np user found with this mail."});
         }

         const user = rows[0];

        //  const ispasswordMatch = await bcrypt.compare(password, user.password);
        //  if(!ispasswordMatch){
        //     return res.status(401).json({success: false, message: "Invalid email or password."});

        //  }

            console.log("-----------------------------------------");
            console.log(`Password from Postman:   "${password}" (Length: ${password.length})`);
            console.log(`Password from Database:  "${user.PASSWORD}" (Length: ${user.PASSWORD.length})`);
            console.log("-----------------------------------------");


         const hashedIncomingPassword = createHash('sha256').update(password).digest('hex');

         if (hashedIncomingPassword !== user.PASSWORD) {
             return res.status(401).json({ success: false, message: "Incorrect password." });
         }

      //   if (password !== user.PASSWORD) {
      //       return res.status(401).json({ success: false, message: "Incorrect password." });
      //   }

         const token = jwt.sign(
            // {id: user.id, email: user.Email, role:user.role, officeId: user.officeId || null },

                        { 
                    ID: user.ID,        // Passes Shehnshah's true numeric ID across your session cookies
                    email: user.Mail,   // Maps the database value 'Mail' to the token key 'email'
                    role: user.role, 
                    officeId: user.officeId || null 
                },
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_SECRET_IN ? String(process.env.JWT_EXPIRES_IN).trim() : '1d'}
         );
        
         let redirectUrl ='/employee/dashboard';
         if(user.role === 'admin'){
            redirectUrl='/admin/dashboard';
         } else if(user.role === 'branch admin'){
            redirectUrl = '/branch-admin/dashboard';

         }

         res.cookie('token', token,{
            httpOnly: true,
            sameSite: 'none',
            secure: true, 
            maxAge: 24*60*60* 1000
         });

        return res.status(200).json({
            success: true,
            message: `Successfully authenticated ! welsome back to the dashboard`,
            user:{
                id:user.ID,
                empId:user.empId,
                name: user.Name,
                email: user.Mail,
                role:user.role,
                officeId: user.officeId || null
            },
              redirecteTo: redirectUrl
        });

     }catch(error){
        console.log("Login Error:", error.message);
        return res.status(500).json({sccess: false, message: "Internal sever Authentication Error"});
     }

}

export const logoutUser = async(req, res) =>{
    try{
       res.clearCookie('token', {
         httpOnly: true,
         sameSite: 'strict',
       });

       return res.status(200).json({
         success: true,
         message: "User logout Successfully."
       });
    }catch(error){
      console.error("Logout controller error:", error.message);
      return res.status(500).json({success:false, message:"Internal server Logout Error"});
    }
}

export const addEmployee = async (req, res) => {
    try {
        const {  name, email, password, role,  OfficeID } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const [existingUser] = await pool.query('SELECT * FROM employeemaster WHERE Mail = ?', [email.trim()]);
        if (existingUser.length > 0) {
            return res.status(409).json({ success: false, message: "An employee profile already exists with this email." });
        }

         const [maxResult] = await pool.query(
            `SELECT MAX(CAST(EmpID AS UNSIGNED)) as maxId 
             FROM employeemaster 
             WHERE EmpID REGEXP '^[0-9]+$'`
        );
        const nextNumber = (maxResult[0].maxId || 0) + 1;
        const generatedEmpId = String(nextNumber).padStart(3, '0');



        // Hash password using SHA-256 to match your current database schema setup
        const databaseHash = crypto.createHash('sha256').update(password).digest('hex');

        // ⚠️ DOUBLE CHECK: Ensure 'EmpID', 'Name', 'Mail', 'PASSWORD', and 'role' match your exact database columns!
        await pool.query(
            'INSERT INTO employeemaster (EmpID, Name, Mail, PASSWORD, role,  OfficeID ) VALUES (?, ?, ?, ?, ?, ?)',
            [generatedEmpId, name.trim(), email.trim(), databaseHash, role.toLowerCase(), OfficeID || null]
        );

        return res.status(201).json({ success: true, message: `Successfully registered profile for ${name}!`,   EmpId: generatedEmpId });


    } catch (error) {
        console.error("Add Employee Error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server registry insertion error." });
    }
};



export const updateCredentials = async (req, res) => {
    try {
        const { EmpId, password, role, OfficeID  } = req.body;

        if (!EmpId || !password || !role) {
            return res.status(400).json({ success: false, message: "Missing required modification parameters." });
        }

        const databaseHash = crypto.createHash('sha256').update(password).digest('hex');

        // ⚠️ DOUBLE CHECK: Ensure columns match your phpMyAdmin precisely!
        const [result] = await pool.query(
            'UPDATE employeemaster SET role = ?, PASSWORD = ?, OfficeID = ? WHERE EmpID = ?',
            [role.toLowerCase(), databaseHash, OfficeID || null, EmpId.trim()]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Employee ID not found." });
        }

        return res.status(200).json({ success: true, message: "Security profile activated successfully!" });

    } catch (error) {
        console.error("Update Credentials Error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server profile update error." });
    }
};

export const getAllEmployees = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30; // Sets 5 items per view window
        const offset = (page - 1) * limit;

         const [countResult] = await db.query('SELECT COUNT(*) as total FROM employeemaster');
        const totalRows = countResult[0].total;
        const totalPages = Math.ceil(totalRows / limit);

        // 🚀 Now db points directly to your pool, making .query() work flawlessly!
        // const [rows] = await db.query(
        //     'SELECT EmpId, Name, Mail, role, status FROM employeemaster LIMIT ? OFFSET ?',
        //     [limit, offset]
        // );

         const [rows] = await db.query(
            `SELECT 
                e.EmpId, 
                e.Name, 
                e.Mail, 
                e.role, 
                e.status, 
                e.OfficeID,
                o.OfficeName,
                o.OfficeCode
            FROM employeemaster e
            LEFT JOIN officemaster o ON e.OfficeID = o.ID
            ORDER BY e.ID DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        
        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                currentPage: page,
                limit: limit,
                totalRows: totalRows,
                totalPages: totalPages
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Database retrieval failed.",
            error: error.message
        });
    }
};


export const searchEmployees = async (req, res) => {
    const { query } = req.query; // Captures whatever text is typed into the search box

    if (!query) {
        return res.status(400).json({ success: false, message: "Search query query parameter is required." });
    }

    try {
        // 🎯 SAFE JOIN: Selects the clean matching tracking properties using your exact columns
        const [employees] = await pool.query(
            `SELECT 
                e.EmpId AS employee_id, 
                e.Name AS employee_name, 
                e.OfficeID AS office_id,
                IFNULL(o.OfficeName, 'Headquarters') AS branch_name 
             FROM employeemaster e
             LEFT JOIN officemaster o ON e.OfficeID = o.ID
             WHERE e.Name LIKE ? OR e.EmpId LIKE ?
             ORDER BY e.Name ASC 
             LIMIT 25`, 
            [`%${query}%`, `%${query}%`]
        );

        return res.status(200).json({ success: true, data: employees });

    } catch (error) {
        console.error("Critical Failure inside searchEmployees Controller:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error searching employees.", error: error.message });
    }
};