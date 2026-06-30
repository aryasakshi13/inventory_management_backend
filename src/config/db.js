import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

// Fix for ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:27032,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
     multipleStatements: true, // 👈 CRUCIAL: Allows running all 8,983 lines at once
    ssl: {
        rejectUnauthorized: false // 👈 CRUCIAL: Required for cloud databases like Aiven
    }
});

export const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(' Success: Connected to the phpMyAdmin (MySQL) Database!');

         connection.release();
    } catch (error) {
        console.error(' Database connection failed:', error.message);
        process.exit(1);
    }
};

export default pool;