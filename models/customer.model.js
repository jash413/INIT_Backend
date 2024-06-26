const db = require("../utils/db");

const Customer = function (customer) {
  this.CUS_CODE = customer.CUS_CODE;
  this.CUS_NAME = customer.CUS_NAME;
  this.INS_DATE = customer.INS_DATE;
  this.DUE_DAYS = customer.DUE_DAYS;
  this.EXP_DATE = customer.EXP_DATE;
  this.USR_NMBR = customer.USR_NMBR;
  this.SYN_DATE = customer.SYN_DATE;
  this.POS_SYNC = customer.POS_SYNC;
  this.CUS_PASS = customer.CUS_PASS;
  this.CUS_MAIL = customer.CUS_MAIL;
  this.LOG_INDT = customer.LOG_INDT;
  this.CUS_MESG = customer.CUS_MESG;
  this.MSG_EXDT = customer.MSG_EXDT;
  this.CON_PERS = customer.CON_PERS;
  this.CUS_ADDR = customer.CUS_ADDR;
  this.PHO_NMBR = customer.PHO_NMBR;
  this.CUS_REFB = customer.CUS_REFB;
  this.GRP_CODE = customer.GRP_CODE;
  this.INS_USER = customer.INS_USER;
  this.BUS_CODE = customer.BUS_CODE;
  this.CMP_VERS = customer.CMP_VERS;
  this.client_id = customer.client_id;
  this.client_secret = customer.client_secret;
  this.database_name = customer.database_name;
  this.is_active = customer.is_active;
  this.app_key = customer.app_key;
  this.reg_type_id = customer.reg_type_id;
};

// Create a new Customer
Customer.create = async (newCustomer) => {
  if (!newCustomer.CUS_CODE) {
    throw new Error("CUS_CODE is required");
  }
  try {
    const [res] = await db.query("INSERT INTO CUS_MAST SET ?", newCustomer);
    console.log("Created customer: ", { id: res.insertId, ...newCustomer });
    return { id: res.insertId, ...newCustomer };
  } catch (err) {
    console.error("Error creating customer:", err);
    throw err;
  }
};

// Find Customer by id
exports.findById = async (req, res) => {
  try {
    const data = await Customer.findById(req.params.custId);
    if (!data) {
      res.status(404).json(response.error("Customer not found"));
    } else {
      res.json(response.success('Customer retrieved successfully', data));
    }
  } catch (err) {
    res.status(500).json(response.error("Error retrieving customer with id " + req.params.custId));
  }
};

// Update Customer by id
Customer.updateById = async (CUS_CODE, customer) => {
  try {
    const res = await db.query(
      "UPDATE CUS_MAST SET CUS_NAME = ?, CUS_MAIL = ?, CUS_PASS = ?, CUS_ADDR = ?, PHO_NMBR = ? WHERE CUS_CODE = ?",
      [
        customer.CUS_NAME,
        customer.CUS_MAIL,
        customer.CUS_PASS,
        customer.CUS_ADDR,
        customer.PHO_NMBR,
        CUS_CODE,
      ]
    );
    if (res.affectedRows == 0) {
      throw { message: "Customer not found" };
    }
    console.log("Updated customer: ", { id: CUS_CODE, ...customer });
    return { id: CUS_CODE, ...customer };
  } catch (err) {
    console.error("Error updating customer:", err);
    throw err;
  }
};

// Delete Customer by id
Customer.remove = async (custId) => {
  try {
    // Start a transaction
    await db.beginTransaction();

    // Attempt to delete related records from EMP_MAST. It's okay if no records are found.
    // This operation will not fail if CUS_CODE does not exist in EMP_MAST, it will simply affect 0 rows.
    await db.query("DELETE FROM EMP_MAST WHERE CUS_CODE = ?", [custId]);

    // Attempt to delete related records from SUB_MAST. It's okay if no records are found.
    // This operation will not fail if CUS_CODE does not exist in SUB_MAST, it will simply affect 0 rows.
    await db.query("DELETE FROM SUB_MAST WHERE CUS_CODE = ?", [custId]);

    // Finally, delete the customer from CUS_MAST
    const [res] = await db.query("DELETE FROM CUS_MAST WHERE CUS_CODE = ?", [custId]);

    // Check if the customer was successfully deleted
    if (res.affectedRows == 0) {
      // No rows affected, meaning no customer was found with the given ID
      throw new Error("Customer not found");
    }

    // If everything went well, commit the transaction
    await db.commit();

    console.log("Deleted customer, subscription plans, and employee with id: ", custId);
    return res; // Return the result to indicate success
  } catch (err) {
    // If an error occurs, rollback any changes made during the transaction
    await db.rollback();
    console.error("Error deleting customer:", err);
    throw err; // Rethrow the error to be caught by the calling function
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
module.exports = Customer;