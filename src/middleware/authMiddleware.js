import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next)=>{

     console.log("--- MIDDLEWARE HANDSHAKE START ---");
        console.log("Raw Authorization Header:", req.headers.authorization);
        console.log("Raw Cookies Object:", req.cookies);

    // const token = req.cookies.token;

      const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    console.log("Parsed Token Result:", token ? `Token Found: ${token.substring(0, 15)}...` : "Token is NULL/UNDEFINED");

    if(!token){
        return res.status(401).json({success: false, message:"Access denied. No session token provided"})
    }

    try{
        const verifiedData = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verifiedData;

        console.log("Decoded Token Data (req.user):", req.user);

        next();

    }catch(error){
        return res.status(403).json({success: false, message:"Authentication failed. Session token is invalid or expired."});
    }
};


 export const authorizeRoles = (...allowedRoles) =>{
    return(req, res, next) =>{

        console.log("Checking Authorization for Roles:", allowedRoles);
        console.log("User Role inside req.user:", req.user?.role);

        if(!req.user){
          return res.status(401).json({successs: false, message:"Unauthorized . Useer profile data missing"});
        }

         if(!allowedRoles.includes(req.user.role)){

          console.log(`❌ ROLE MISMATCH ERROR: Required: ${allowedRoles}, Found: ${req.user.role}`);   
         return res.status(403).json({
            success: false,
            message: `Access Denied..`
         });
    }

       
         next();

    };
   

   
 }