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


exports.findById = async (req, res) => {
  try {
    const data = await Employee.findById(req.params.empId);
    if (!data) {
      res.status(404).json(response.error("Employee not found"));
    } else {
      res.json(response.success("Employee retrieved successfully", data));
    }
  } catch (err) {
    res
      .status(500)
      .json(
        response.error("Error retrieving employee with id " + req.params.empId)
      );
  }
};

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

Employee.getAll = async (limit, offset) => {
  try {
    const [employees] = await db.query(
      "SELECT * FROM EMP_MAST LIMIT ? OFFSET ?",
      [limit, offset]
    );
    const [countResult] = await db.query(
      "SELECT COUNT(*) as total FROM EMP_MAST"
    );
    const totalCount = countResult[0].total;
    return [employees, totalCount];
  } catch (err) {
    console.error("Error retrieving employees:", err);
    throw err;
  }
};

module.exports = Employee;
