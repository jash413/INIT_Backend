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
    const [res] = await db.query("INSERT INTO cus_mast SET ?", newCustomer);
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
      "UPDATE cus_mast SET CUS_NAME = ?, CUS_MAIL = ?, CUS_PASS = ?, CUS_ADDR = ?, PHO_NMBR = ? WHERE CUS_CODE = ?",
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
Customer.remove = async (CUS_CODE) => {
  try {
    const res = await db.query("DELETE FROM cus_mast WHERE CUS_CODE = ?", CUS_CODE);
    if (res.affectedRows == 0) {
      throw { message: "Customer not found" };
    }
    console.log("Deleted customer with id: ", CUS_CODE);
    return res;
  } catch (err) {
    console.error("Error deleting customer:", err);
    throw err;
  }
};

// Retrieve all Customers
Customer.getAll = async () => {
  try {
    const res = await db.query("SELECT * FROM cus_mast");
    console.log("Customers: ", res);
    return res;
  } catch (err) {
    console.error("Error retrieving customers:", err);
    throw err;
  }
};

module.exports = Customer;