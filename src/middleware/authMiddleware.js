import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next)=>{
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({success: false, message:"Access denied. No session token provided"})
    }

    try{
        const verifiedData = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verifiedData;

        next();

    }catch(error){
        return res.status(403).json({success: false, message:"Authentication failed. Session token is invalid or expired."});
    }
};


 export const authorizeRoles = (...allowedRoles) =>{
    return(req, res, next) =>{

        if(!req.user){
          return res.status(401).json({successs: false, message:"Unauthorized . Useer profile data missing"});
        }

         if(!allowedRoles.includes(req.user.role)){
         return res.status(403).json({
            success: false,
            message: `Access Denied..`
         });
    }
         next();

    };
   

   
 }