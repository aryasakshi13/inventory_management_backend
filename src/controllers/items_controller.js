import db from '../config/db.js';

// @desc    Get all master catalog items with total aggregated stock quantities
// @route   GET /api/items
// @access  Protected/Private
export const getItemsCatalog = async (req, res) => {
    try {
        const { officeId, itemId } = req.query; 
          
        let queryParams = [];
        let conditions = [];
        let joinOnOfficeClause = '';
 

        const parsedOfficeId = (officeId && officeId !== 'all' && officeId !== '') ? parseInt(officeId) : null;

        // Dynamic Filters Construction

        // 1. Dynamic Filters Construction
        // if (officeId && officeId !== 'all' && officeId !== '') {
        //     // Filter stock records specifically matching this office
        //     conditions.push("s.officeId = ?");
        //     queryParams.push(parseInt(officeId));
            
        //     // Ensures even if stock is 0, we track context against the filtered office string
        //     joinOnOfficeClause = `AND s.officeId = ${parseInt(officeId)}`;
        // }


           // Dynamic Filters Construction
        if (parsedOfficeId) {
            // Filter stock records specifically matching this office
            conditions.push("s.officeId = ?");
            queryParams.push(parsedOfficeId);
            
            // Ensures even if stock is 0, we track context against the filtered office string
            joinOnOfficeClause = `AND s.officeId = ${parsedOfficeId}`;
        } 

        if (itemId && itemId !== 'all' && itemId !== '') {
            conditions.push("i.id = ?");
            queryParams.push(parseInt(itemId));
        }


        let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        let baseQuery = "";

        // const [rows] = await db.query(`
        //     SELECT 
        //         i.id AS ItemId,
        //         i.name AS ItemName,
        //         i.category AS Category,
        //         i.Date AS DateCreated,
        //         IFNULL(SUM(s.Quantity), 0) AS TotalGlobalStock
        //     FROM itemmaster i
        //     LEFT JOIN stockmaster s ON i.name = s.item
        //     GROUP BY i.id, i.name, i.category, i.Date
        //     ORDER BY i.id DESC
        // `);

        if ((itemId && itemId !== 'all' && itemId !== '') && (!officeId || officeId === 'all' || officeId === '')) {
            baseQuery = `
                SELECT 
                    i.id AS ItemId,
                    i.name AS ItemName,
                    i.category AS Category,
                    i.Date AS DateCreated,
                    IFNULL(om.OfficeName, 'System Vault') AS OfficeName,
                    (
                      IFNULL(s.Quantity, 0)
                      /* + Inbound Accepted Transits */
                        + COALESCE((SELECT SUM(Quantity) FROM stocktransfer WHERE Item = i.id AND ToOfficeID = s.officeId AND Status = 'Accepted'), 0)
                        /* - Outbound Active Transits */
                        - COALESCE((SELECT SUM(Quantity) FROM stocktransfer WHERE Item = i.id AND FromOfficeID = s.officeId AND Status != 'Rejected'), 0)
                    
                    )AS TotalGlobalStock
                FROM itemmaster i
                INNER JOIN stockmaster s ON i.name = s.item
                LEFT JOIN officemaster om ON s.officeId = om.id
                ${whereClause}
                ORDER BY TotalGlobalStock DESC
            `;
        }


        else if (officeId && officeId !== 'all' && officeId !== '')  {
            baseQuery = `
                SELECT 
                    i.id AS ItemId,
                    i.name AS ItemName,
                    i.category AS Category,
                    i.Date AS DateCreated,
                    IFNULL(om.OfficeName, 'Global System') AS OfficeName,
                    (
                     
                    /* 1. Sum up all direct purchases at this office */
                        COALESCE((SELECT SUM(Quantity) FROM stockmaster WHERE item = i.name AND officeId = ${parsedOfficeId}), 0)
                        /* 2. Add incoming accepted transfers to this office */
                        + COALESCE((SELECT SUM(Quantity) FROM stocktransfer WHERE Item = i.id AND ToOfficeID = ${parsedOfficeId} AND Status = 'Accepted'), 0)
                        /* 3. Deduct outgoing active transfers from this office */
                        - COALESCE((SELECT SUM(Quantity) FROM stocktransfer WHERE Item = i.id AND FromOfficeID = ${parsedOfficeId} AND Status != 'Rejected'), 0)
                     )AS TotalGlobalStock
                FROM itemmaster i
                LEFT JOIN stockmaster s ON i.name = s.item ${joinOnOfficeClause}
                LEFT JOIN officemaster om ON s.officeId = om.id
                ${whereClause}
                GROUP BY i.id, i.name, i.category, i.Date, om.OfficeName
                ORDER BY i.id DESC
            `;
        }
        else {
            baseQuery = `
                SELECT 
                    i.id AS ItemId,
                    i.name AS ItemName,
                    i.category AS Category,
                    i.Date AS DateCreated,
                    'Global System' AS OfficeName,
                    (
                      
                    /* Total Bought Globally */
                        COALESCE((SELECT SUM(Quantity) FROM stockmaster WHERE item = i.name), 0)
                       

                        /* 2. SUBTRACT all items permanently distributed to workers globally */
                        - COALESCE((SELECT SUM(Quantity) FROM issuemaster WHERE Item = i.name AND issue_type = 'employee'), 0)
                        
                        /* 3. SUBTRACT items currently lost in transit between branches (Pending status) */
                        - COALESCE((SELECT SUM(Quantity) FROM stocktransfer WHERE Item = i.id AND Status = 'Pending'), 0)
                    ) AS TotalGlobalStock

                    
                FROM itemmaster i
                LEFT JOIN stockmaster s ON i.name = s.item
                GROUP BY i.id, i.name, i.category, i.Date
                ORDER BY i.id DESC
            `;
        }


        const [rows] = await db.query(baseQuery, queryParams);

        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to compile master product directory metrics.",
            error: error.message
        });
    }
};

// @desc    Register a brand new item reference blueprint
// @route   POST /api/items/add
// @access  Protected (Admin Only)
export const createNewProductClass = async (req, res) => {
    try {
        const { itemName, category } = req.body;

        if (!itemName || !category) {
            return res.status(400).json({ 
                success: false, 
                message: "Validation Error: Both Item Name and Category fields are required." 
            });
        }

        await db.query(
            'INSERT INTO itemmaster (name, category, Date) VALUES (?, ?, NOW())',
            [itemName.trim(), category.trim()]
        );

        return res.status(201).json({ 
            success: true, 
            message: "New product model registered in global master directory." 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                message: "An asset model with this exact nomenclature name already exists." 
            });
        }
        return res.status(500).json({ 
            success: false, 
            message: "Failed to create item reference entry.", 
            error: error.message 
        });
    }
};



// IFNULL(SUM(s.Quantity), 0) 
// IFNULL(SUM(s.Quantity), 0)