const db = require("../utils/db");
const response = require("../utils/response");

const Employee = function (employee) {
  this.CUS_CODE = employee.CUS_CODE;
  this.EMP_CODE = employee.EMP_CODE;
  this.EMP_NAME = employee.EMP_NAME;
  this.EMP_PASS = employee.EMP_PASS;
  this.EMP_IMEI = employee.EMP_IMEI;
  this.MOB_NMBR = employee.MOB_NMBR;
  this.EMP_ACTV = employee.EMP_ACTV;
  this.SYN_DATE = employee.SYN_DATE;
  this.EMP_MAIL = employee.EMP_MAIL;
  this.SUB_CODE = employee.SUB_CODE;
  this.USR_TYPE = employee.USR_TYPE;
  this.REGDATE = employee.REGDATE;
  this.SUB_STDT = employee.SUB_STDT;
  this.SUB_ENDT = employee.SUB_ENDT;
  this.REG_TOKEN = employee.REG_TOKEN;
};


Employee.findByMultipleCriteria = async (searchId) => {
    try {
      const [employees] = await db.query(
        `SELECT * FROM EMP_MAST 
         WHERE EMP_CODE = ? OR CUS_CODE = ? OR SUB_CODE = ?`,
        [searchId, searchId, searchId]
      );
      if (employees.length === 0) {
        throw new Error("Employee not found");
      }
      return employees; // Return all matching employees
    } catch (err) {
      console.error("Error retrieving employee(s):", err);
      throw err;
    }
  }

Employee.create = async (newEmployee) => {
  try {
    const [res] = await db.query("INSERT INTO EMP_MAST SET ?", newEmployee);
    console.log("Created employee: ", { id: res.insertId, ...newEmployee });
    return { id: res.insertId, ...newEmployee };
  } catch (err) {
    console.error("Error creating employee:", err);
    throw err;
  }
};

// Update Employee by id
Employee.updateById = (empId, employee, result) => {
  db.query(
    "UPDATE EMP_MAST SET emp_name = ?, emp_email = ?, emp_pass = ?, emp_position = ?, emp_salary = ? WHERE emp_id = ?",
    [
      employee.emp_name,
      employee.emp_email,
      employee.emp_pass,
      employee.emp_position,
      employee.emp_salary,
      empId,
    ],
    (err, res) => {
      if (err) {
        console.error("Error updating employee:", err);
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ message: "Employee not found" }, null);
        return;
      }
      console.log("Updated employee: ", { id: empId, ...employee });
      result(null, { id: empId, ...employee });
    }
  );
};

// Delete Employee by id
Employee.remove = (empId, result) => {
  db.query("DELETE FROM EMP_MAST WHERE emp_id = ?", empId, (err, res) => {
    if (err) {
      console.error("Error deleting employee:", err);
      result(err, null);
      return;
    }
    if (res.affectedRows == 0) {
      result({ message: "Employee not found" }, null);
      return;
    }
    console.log("Deleted employee with id: ", empId);
    result(null, res);
  });
};

Employee.getAll = async (limit, offset, sort, order, search) => {
  try {
    let query = "SELECT * FROM EMP_MAST";
    let countQuery = "SELECT COUNT(*) as total FROM EMP_MAST";
    let params = [];

    // Updated search to include additional fields and corrected column names
    if (search) {
      query +=
        " WHERE CONCAT_WS('', EMP_CODE, EMP_NAME, EMP_MAIL, MOB_NMBR, EMP_IMEI, EMP_ACTV, SUB_CODE, USR_TYPE, STATUS) LIKE ?";
      countQuery +=
        " WHERE CONCAT_WS('', EMP_CODE, EMP_NAME, EMP_MAIL, MOB_NMBR, EMP_IMEI, EMP_ACTV, SUB_CODE, USR_TYPE, STATUS) LIKE ?";
      params.push(`%${search}%`);
    }

    // Updated sort validation to include all sortable fields
    if (
      sort &&
      [
        "EMP_CODE",
        "EMP_NAME",
        "EMP_MAIL",
        "MOB_NMBR",
        "EMP_IMEI",
        "EMP_ACTV",
        "SYN_DATE",
        "SUB_CODE",
        "USR_TYPE",
        "REGDATE",
        "SUB_STDT",
        "SUB_ENDT",
        "STATUS"
      ].includes(sort.toUpperCase())
    ) {
      query += ` ORDER BY ${sort} ${
        order.toUpperCase() === "DESC" ? "DESC" : "ASC"
      }`;
    } else {
      query += " ORDER BY EMP_CODE ASC"; // default sorting
    }

    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [employees] = await db.query(query, params);
    const [countResult] = await db.query(
      countQuery,
      search ? [`%${search}%`] : []
    );
    const totalCount = countResult[0].total;

    return [employees, totalCount];
  } catch (err) {
    console.error("Error retrieving employees:", err);
    throw err;
  }
};

module.exports = Employee;
