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


exports.findOne = async (req, res) => {
  try {
    const data = await Employee.findByMultipleCriteria(req.params.empId);
    console.log("Employee(s) retrieved successfully:", data);

    // Check if data is an array (CUS_CODE or SUB_CODE match) or object (EMP_CODE match)
    const message = Array.isArray(data)
      ? "Employees retrieved successfully"
      : "Employee retrieved successfully";

    return res.status(200).send(response.success(message, data));
  } catch (err) {
    if (err.message === "Employee not found") {
      console.error("Employee not found with id:", req.params.empId);
      return res.status(404).send(response.notFound("Employee not found"));
    }
    console.error(
      "Error retrieving employee(s) with id",
      req.params.empId,
      ":",
      err
    );
    return res
      .status(500)
      .send(
        response.error(
          "Error retrieving employee(s) with id " + req.params.empId
        )
      );
  }
};

Employee.create = async (newEmployee) => {
  try {
    // Step 1: Fetch the last EMP_CODE
    const [lastEmp] = await db.query("SELECT EMP_CODE FROM EMP_MAST ORDER BY EMP_CODE DESC LIMIT 1");
    let nextEmpCode = 'E001'; // Default if no employees exist

    if (lastEmp.length > 0) {
      const lastEmpCode = lastEmp[0].EMP_CODE;
      const numericPart = parseInt(lastEmpCode.substring(1)) + 1; // Extract numeric part and increment
      nextEmpCode = `E${numericPart.toString().padStart(3, '0')}`; // Generate next EMP_CODE
    }

    // Step 2: Generate the next EMP_CODE and add it to newEmployee object
    newEmployee.EMP_CODE = nextEmpCode;

    // Step 3: Insert the new employee with the generated EMP_CODE
    const [res] = await db.query("INSERT INTO EMP_MAST SET ?", newEmployee);
    console.log("Created employee: ", { id: res.insertId, ...newEmployee });
    return { id: res.insertId, ...newEmployee };
  } catch (err) {
    console.error("Error creating employee:", err);
    throw err;
  }
};

// Update Employee by id
Employee.updateById = async (empId, employee) => {
  try {
    const [result] = await db.query(
      "UPDATE EMP_MAST SET EMP_NAME = ?, EMP_MAIL = ?, EMP_PASS = ?, EMP_POSITION = ?, EMP_SALARY = ? WHERE EMP_CODE = ?",
      [
        employee.EMP_NAME,
        employee.EMP_MAIL,
        employee.EMP_PASS,
        employee.EMP_POSITION,
        employee.EMP_SALARY,
        empId,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Employee not found");
    }

    console.log("Updated employee: ", { id: empId, ...employee });
    return { id: empId, ...employee };
  } catch (err) {
    console.error("Error updating employee:", err);
    throw err;
  }
};


// Delete Employee by id
Employee.remove = async (empId) => {
    try {
      const [res] = await db.query("DELETE FROM EMP_MAST WHERE EMP_CODE = ?", empId);
      if (res.affectedRows == 0) {
        throw new Error("Employee not found");
      }
      console.log("Deleted employee with id: ", empId);
      return res;
    } catch (err) {
      console.error("Error deleting employee:", err);
      throw err;
    }
  }

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
