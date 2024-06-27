const db = require("../utils/db");

const Customer = function (customer) {
  this.CUS_CODE = customer.CUS_CODE;
  this.CUS_NAME = customer.CUS_NAME;
  this.INS_DATE = customer.INS_DATE;
  this.DUE_DAYS = customer.DUE_DAYS;
  this.EXP_DATE = customer.EXP_DATE;
  this.USR_NMBR = customer.USR_NMBR;
  this.CUS_PASS = customer.CUS_PASS;
  this.CUS_MAIL = customer.CUS_MAIL;
  this.CUS_MESG = customer.CUS_MESG;
  this.CON_PERS = customer.CON_PERS;
  this.CUS_ADDR = customer.CUS_ADDR;
  this.PHO_NMBR = customer.PHO_NMBR;
  this.CUS_REFB = customer.CUS_REFB;
  this.is_active = 1;
};

// Create a new Customer
Customer.create = async (newCustomer) => {
  if (!newCustomer.CUS_NAME) {
    throw new Error("CUS_NAME is required");
  }

  const now = new Date();
  const expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  // Generate CUS_CODE
  const nameParts = newCustomer.CUS_NAME.split(' ');
  const initials = nameParts.map(part => part[0].toUpperCase()).join('');

  try {
    // Find the highest number for the given initials
    const [rows] = await db.query(
      "SELECT CUS_CODE FROM CUS_MAST WHERE CUS_CODE LIKE ? ORDER BY CUS_CODE DESC LIMIT 1",
      [`${initials}%`]
    );

    let number = 1;
    if (rows.length > 0) {
      const lastCode = rows[0].CUS_CODE;
      const lastNumber = parseInt(lastCode.slice(-4));
      number = lastNumber + 1;
    }

    newCustomer.CUS_CODE = `${initials}${number.toString().padStart(4, '0')}`;

    // Set other required fields
    newCustomer.INS_DATE = now.toISOString().slice(0, 19).replace('T', ' ');
    newCustomer.DUE_DAYS = 30;
    newCustomer.EXP_DATE = expirationDate.toISOString().slice(0, 10);
    newCustomer.is_active = 1;

    // Insert the new customer
    const [res] = await db.query("INSERT INTO CUS_MAST SET ?", newCustomer);
    console.log("Created customer: ", { id: res.insertId, ...newCustomer });
    return { id: res.insertId, ...newCustomer };
  } catch (err) {
    console.error("Error creating customer:", err);
    throw err;
  }
};

// Retrieve Customer by id
Customer.findById = async (custId) => {
  try {
    const [customers] = await db.query("SELECT * FROM CUS_MAST WHERE CUS_CODE = ?", [custId]);
    if (customers.length === 0) {
      throw { message: "Customer not found" };
    }
    return customers[0];
  } catch (err) {
    console.error("Error retrieving customer:", err);
    throw err;
  }
};

// Update Customer by id
Customer.updateById = async (CUS_CODE, updateData) => {
  const allowedFields = [
    'CUS_NAME', 'INS_DATE', 'DUE_DAYS', 'EXP_DATE', 'USR_NMBR', 
    'SYN_DATE', 'POS_SYNC', 'CUS_PASS', 'CUS_MAIL', 'LOG_INDT', 
    'CUS_MESG', 'MSG_EXDT', 'CON_PERS', 'CUS_ADDR', 'PHO_NMBR', 
    'CUS_REFB', 'GRP_CODE', 'INS_USER', 'BUS_CODE', 'CMP_VERS', 
    'client_id', 'client_secret', 'database_name', 'is_active', 
    'app_key', 'reg_type_id'
  ];
  
  try {
    let updateFields = [];
    let updateValues = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      throw new Error("No valid fields to update");
    }
    
    updateValues.push(CUS_CODE);
    
    const sql = `UPDATE CUS_MAST SET ${updateFields.join(', ')} WHERE CUS_CODE = ?`;

    const [result] = await db.query(sql, updateValues);

    if (result.affectedRows === 0) {
      throw new Error("Customer not found");
    }
    
    console.log("Updated customer: ", { CUS_CODE, ...updateData });
    return { CUS_CODE, ...updateData };
  } catch (err) {
    console.error("Error updating customer:", err);
    throw err;
  }
};

// Retrieve all Customers
Customer.getAll = async (limit, offset) => {
  try {
    const [customers] = await db.query(
      "SELECT * FROM CUS_MAST LIMIT ? OFFSET ?",
      [limit, offset]
    );
    const [countResult] = await db.query(
      "SELECT COUNT(*) as total FROM CUS_MAST"
    );
    const totalCount = countResult[0].total;
    return [customers, totalCount];
  } catch (err) {
    console.error("Error retrieving customers:", err);
    throw err;
  }
};

// Delete Customer by id
Customer.remove = async (CUS_CODE) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Delete related records from EMP_MAST
    await connection.query("DELETE FROM EMP_MAST WHERE CUS_CODE = ?", [CUS_CODE]);

    // Delete related records from SUB_MAST
    await connection.query("DELETE FROM SUB_MAST WHERE CUS_CODE = ?", [CUS_CODE]);

    // Delete the customer from CUS_MAST
    const [result] = await connection.query("DELETE FROM CUS_MAST WHERE CUS_CODE = ?", [CUS_CODE]);

    if (result.affectedRows === 0) {
      throw new Error("Customer not found");
    }

    await connection.commit();
    console.log("Deleted customer, subscription plans, and employee with CUS_CODE: ", CUS_CODE);
    return result;
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting customer:", err);
    throw err;
  } finally {
    connection.release();
  }
};
module.exports = Customer;