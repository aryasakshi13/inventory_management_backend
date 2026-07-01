import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/authRoutes.js';
import cors from 'cors' ;
import inventoryRoutes from './src/routes/inventoryRoutes.js';
import itemRoutes from './src/routes/item_routes.js'
import officeRoutes from './src/routes/branchRoutes.js'
import vendorRoutes from './src/routes/vendorRoutes.js'
import fs from 'fs';



dotenv.config();

const app = express();
  const PORT = process.env.PORT || 5001;
// app.use(express.json());

// Initialize DB connection


const uploadFolder = './uploads';
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
    console.log("📁 Generated missing 'uploads' directory automatically.");
}

// app.use(cors({
//     origin: 'http://localhost:5175',
//     credentials: true,               
//     methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role','x-user-office-id' ]
// }));

app.use(cors({
    // origin: function (origin, callback) {
    //     // Allows all incoming origins dynamically so cookies match explicit domains
    //     callback(null, true);
    // },
    // origin:"http://localhost:5175", 

     origin: [
        "http://localhost:5173",
        "http://localhost:5175",
        "https://inventory-management-livid-nu.vercel.app"
    ],
    credentials: true,               
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-office-id']
}));
// app.options("*", cors());

// app.options('*', cors());

// app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Global health check
// app.get('/', (req, res) => {
//     res.status(200).json({ status: "OK", message: "Server is running smoothly" });
// });

// app.get('/health', (req, res) => {
//     res.status(200).json({ status: "OK", message: "Server is running very smoothly" });
// });

app.use('/api/auth', authRoutes);

app.use('/uploads', express.static('uploads'));

app.use('/api/inventry',inventoryRoutes);

app.use('/api/items', itemRoutes);

app.use('/api/branch', officeRoutes);

app.use('/api/vendor', vendorRoutes);



const startServer = async()=>{
    try{
         console.log("Initializing system component....");

         await connectDB();
         console.log(" Database connected successfully.");    
       
          app.listen(PORT, () => {
          console.log(` Server running on port ${PORT}`);
        });
    } catch(error){
        console.error("Database error:", error.message);
        process.exit(1);
    }
};

startServer();

