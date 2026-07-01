import db from '../config/db.js';
 
/**
 * @desc    Fetch all registered branches/offices (single source of truth
 *          for every dropdown across the app: Employee form, Add Stock,
 *          Branch Transfer modal, Branch Master table)
 * @route   GET /api/offices
 * @access  Protected (any logged-in role)
 */
export const getOffices = async (req, res) => {
    try {
           
        const page = parseInt(req.query.page) || 1;
        const limitInput = req.query.limit;

        const returnAll = limitInput === 'all' || parseInt(limitInput) === -1 || parseInt(limitInput) === 0 || parseInt(limitInput) > 500;
         
        
        // const page = parseInt(req.query.page) || 1;
       
        const [countResult] = await db.query('SELECT COUNT(*) as total FROM officemaster');
        const totalRows = countResult[0].total;

         const limit = parseInt(req.query.limit) || 30;
         const offset = (page - 1) * limit;
        const totalPages = Math.ceil(totalRows / limit);

        const queryStr = `
            SELECT 
                ID,
                OfficeCode,
                OfficeName,
                OfficeAddress,
                AdminEmpId,
                AdminName,
                AdminMail
            FROM officemaster
            ORDER BY OfficeName ASC
            LIMIT ? OFFSET ?
        `;
 
        const [offices] = await db.query(queryStr, [limit, offset]);
 
        return res.status(200).json({
            success: true,
            data: offices,
            pagination: { currentPage: page, totalPages, totalRows }
        });
 
    } catch (error) {
        console.error("Critical Failure inside getOffices Endpoint:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error fetching branch directory.",
            error: error.message
        });
    }
};


export const createOffice = async (req, res) => {

    console.log("--- 📥 CREATE OFFICE REQUEST INCOMING ---");
    console.log("Payload received inside req.body:", req.body);

    const {
        OfficeCode,
        OfficeName,
        OfficeAddress,
        AdminEmpId,
        AdminName,
        AdminMail
    } = req.body;

    console.log("Field Casing Verification Logs:", {
            OfficeCode: typeof OfficeCode,
            OfficeName: typeof OfficeName,
            OfficeAddress: typeof OfficeAddress
        });
 
    if (!OfficeCode || !OfficeName) {
        return res.status(400).json({
            success: false,
            message: "Validation Error: 'OfficeCode' and 'OfficeName' are required fields."
        });
    }
 
    try {
        const [result] = await db.query(
            `INSERT INTO officemaster 
                (OfficeCode, OfficeName, OfficeAddress, AdminEmpId, AdminName, AdminMail, Password) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                OfficeCode.trim(),
                OfficeName.trim(),
                OfficeAddress || null,
                AdminEmpId || null,
                AdminName || null,
                AdminMail || null,
                "BRANCH_DEFAULT_NOPASS"
            ]
        );
 
        return res.status(201).json({
            success: true,
            message: "Branch registered successfully.",
            data: { ID: result.insertId, OfficeCode, OfficeName, OfficeAddress, AdminEmpId, AdminName, AdminMail }
        });
 
    } catch (error) {
        // ER_DUP_ENTRY fires when the unique index on OfficeCode is violated
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: `Office Code "${OfficeCode}" is already in use by another branch. Please choose a different code.`
            });
        }
 
        console.error("Critical Failure inside createOffice Endpoint:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error while registering branch.",
            error: error.message
        });
    }
};

