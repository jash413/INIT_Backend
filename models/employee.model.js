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
  this.ad_id = employee.ad_id; // Include ad_id from req.user
};

Employee.create = async (newEmployee) => {
  try {
    // Fetch the SUB_STDT and SUB_ENDT for the given SUB_CODE
    const [subscription] = await db.query(
      "SELECT SUB_STDT, SUB_ENDT FROM SUB_MAST WHERE SUB_CODE = ?",
      [newEmployee.SUB_CODE]
    );

    if (subscription.length === 0) {
      throw new Error("Subscription code not found");
    }

    // Update the newEmployee object with the subscription dates
    newEmployee.SUB_STDT = subscription[0].SUB_STDT;
    newEmployee.SUB_ENDT = subscription[0].SUB_ENDT;

    // Fetch the last EMP_CODE and generate the next EMP_CODE
    const [lastEmp] = await db.query(
      "SELECT EMP_CODE FROM EMP_MAST ORDER BY EMP_CODE DESC LIMIT 1"
    );
    let nextEmpCode = "E001"; // Default if no employees exist

    if (lastEmp.length > 0) {
      const lastEmpCode = lastEmp[0].EMP_CODE;
      const numericPart = parseInt(lastEmpCode.substring(1)) + 1; // Extract numeric part and increment
      nextEmpCode = `E${numericPart.toString().padStart(3, "0")}`; // Generate next EMP_CODE
    }

    // Add the generated EMP_CODE to newEmployee object
    newEmployee.EMP_CODE = nextEmpCode;

    // Insert the new employee with the generated EMP_CODE
    const [res] = await db.query("INSERT INTO EMP_MAST SET ?", newEmployee);
    console.log("Created employee: ", { id: res.insertId, ...newEmployee });
    return { id: res.insertId, ...newEmployee };
  } catch (err) {
    console.error("Error creating employee:", err);
    throw err;
  }
};


Employee.FIndByfindByMultipleCriteria = async (
  limit,
  offset,
  sort,
  order,
  search,
  filter_dept_id,
  filter_joined_from,
  filter_joined_to,
  searchId
) => {
  try {
    let query = "SELECT * FROM EMP_MAST";
    let countQuery = "SELECT COUNT(*) as total FROM EMP_MAST";
    let params = [];
    let countParams = [];

    // Handle multiple criteria search
    if (searchId) {
      query += " WHERE EMP_CODE = ? OR CUS_CODE = ? OR SUB_CODE = ?";
      countQuery += " WHERE EMP_CODE = ? OR CUS_CODE = ? OR SUB_CODE = ?";
      params.push(searchId, searchId, searchId);
      countParams.push(searchId, searchId, searchId);
    } else {
      // Handle search
      if (search) {
        query +=
          " WHERE CONCAT_WS('', EMP_CODE, EMP_NAME, EMP_MAIL, PHO_NMBR, EMP_ADDR) LIKE ?";
        countQuery +=
          " WHERE CONCAT_WS('', EMP_CODE, EMP_NAME, EMP_MAIL, PHO_NMBR, EMP_ADDR) LIKE ?";
        params.push(`%${search}%`);
        countParams.push(`%${search}%`);
      }

      // Handle filters
      if (filter_dept_id || filter_joined_from || filter_joined_to) {
        if (!search) {
          query += " WHERE";
          countQuery += " WHERE";
        } else {
          query += " AND";
          countQuery += " AND";
        }

        const filters = [];
        if (filter_dept_id) {
          filters.push(" dept_id = ?");
          params.push(filter_dept_id);
          countParams.push(filter_dept_id);
        }
        if (filter_joined_from) {
          filters.push(" JOINED_AT >= ?");
          params.push(filter_joined_from);
          countParams.push(filter_joined_from);
        }
        if (filter_joined_to) {
          filters.push(" JOINED_AT <= ?");
          params.push(filter_joined_to);
          countParams.push(filter_joined_to);
        }

        query += filters.join(" AND ");
        countQuery += filters.join(" AND ");
      }
    }

    // Handle sorting
    if (
      sort &&
      [
        "EMP_CODE",
        "EMP_NAME",
        "JOINED_AT",
        "DEPT_ID",
        "EMP_MAIL",
        "PHO_NMBR",
      ].includes(sort.toUpperCase())
    ) {
      query += ` ORDER BY ${sort} ${
        order.toUpperCase() === "DESC" ? "DESC" : "ASC"
      }`;
    } else {
      query += " ORDER BY EMP_CODE ASC"; // default sorting
    }

    // Handle pagination
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    // Execute queries
    const [employees] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    const totalCount = countResult[0].total;

    // Check if the match is by EMP_CODE
    const empCodeMatch = employees.find((emp) => emp.EMP_CODE === searchId);

    // If there's an EMP_CODE match, return it as a single object
    if (empCodeMatch) {
      return [empCodeMatch, 1];
    }

    return [employees, totalCount];
  } catch (err) {
    console.error("Error retrieving employees:", err);
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
