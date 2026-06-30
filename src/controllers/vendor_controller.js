// 📄 Path: backend/controllers/vendorController.js
import db from '../config/db.js'; // Adjust based on your db configuration path

// 🟢 GET ALL VENDORS (WITH PAGINATION)
export const getVendors = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) as total FROM vendor'; 
        const [countResult] = await db.query(countQuery);
        const totalRows = countResult[0].total;
        const totalPages = Math.ceil(totalRows / limit);

       const rowsQuery = `
            SELECT VendorId, VendorName, VendorAddress, GSTNumber, ContactPerson, ContactNumber, EmailId, VendorAgreement, VendorCreated
            FROM vendor 
            ORDER BY VendorId DESC 
            LIMIT ? OFFSET ?
`;
        const [rows] = await db.query(rowsQuery, [limit, offset]);

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: { currentPage: page, totalPages, totalRows }
        });
    } catch (error) {
        console.error("Vendor streaming failure:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error reading vendor registry." });
    }
};

// 🟢 CREATE NEW VENDOR NODE ENTRY
export const createVendor = async (req, res) => {
    const { VendorName, VendorAddress, GSTNumber, ContactPerson, ContactNumber, EmailId } = req.body;

    if (!VendorName || !GSTNumber) {
        return res.status(400).json({ success: false, message: "Vendor Name and GST Number are required fields." });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO vendor(VendorName, VendorAddress, GSTNumber, ContactPerson, ContactNumber, EmailId, VendorCreated) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                VendorName.trim(),
                VendorAddress ? VendorAddress.trim() : null,
                GSTNumber.trim().toUpperCase(),
                ContactPerson ? ContactPerson.trim() : null,
                ContactNumber ? ContactNumber.trim() : null,
                EmailId ? EmailId.trim() : null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Vendor node registered successfully.",
            data: { VendorId: result.insertId, VendorName }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "This GST Number or Vendor node is already registered." });
        }
        return res.status(500).json({ success: false, message: "Failed to log entry into vendor subsystem." });
    }
};