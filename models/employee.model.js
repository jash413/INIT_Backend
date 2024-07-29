const db = require("../utils/db");

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
  this.DEVICE_ID = employee.DEVICE_ID;
  this.STATUS = employee.STATUS ? employee.STATUS : "0";
  this.SALE_OS_ACTIVE = employee.SALE_OS_ACTIVE;
  this.PUR_OS_ACTIVE = employee.PUR_OS_ACTIVE;
  this.SALE_ORDER_ACTIVE = employee.SALE_ORDER_ACTIVE;
  this.PURCHASE_ORDER_ACTIVE = employee.PURCHASE_ORDER_ACTIVE;
  this.SALE_ORDER_ENTRY = employee.SALE_ORDER_ENTRY;
  this.SALE_REPORT_ACTIVE = employee.SALE_REPORT_ACTIVE;
  this.PURCHASE_REPORT_ACTIVE = employee.PURCHASE_REPORT_ACTIVE;
  this.LEDGER_REPORT_ACTIVE = employee.LEDGER_REPORT_ACTIVE;
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
    let nextEmpCode = "E000001"; // Default if no employees exist

    if (lastEmp.length > 0) {
      const lastEmpCode = lastEmp[0].EMP_CODE;
      const numericPart = parseInt(lastEmpCode.substring(1)) + 1; // Extract numeric part and increment
      nextEmpCode = `E${numericPart.toString().padStart(5, "0")}`; // Generate next EMP_CODE with 6 digits (1 letter + 5 digits)
    }
    // Add the generated EMP_CODE to newEmployee object
    newEmployee.EMP_CODE = nextEmpCode;

    // Convert all string and char fields in newEmployee to uppercase
    for (const key in newEmployee) {
      if (
        typeof newEmployee[key] === "string" &&
        newEmployee[key].constructor === String
      ) {
        newEmployee[key] = newEmployee[key].toUpperCase();
      }
    }

    // Insert the new employee with the generated EMP_CODE
    const [res] = await db.query("INSERT INTO EMP_MAST SET ?", newEmployee);
    return { id: res.insertId, ...newEmployee };
  } catch (err) {
    console.error("Error creating employee:", err);
    throw err;
  }
};

Employee.findByEmpCode = async (empCode) => {
  try {
    const query = "SELECT * FROM EMP_MAST WHERE MOB_NMBR = ?";
    const [result] = await db.query(query, [empCode]);
    return result.length ? result[0] : null;
  } catch (err) {
    console.error(`Error finding employee by EMP_CODE ${empCode}:`, err);
    throw err;
  }
};

Employee.findByMultipleCriteria = async (
  limit,
  offset,
  sort,
  order,
  search,
  filter_dept_id,
  filter_joined_from,
  filter_joined_to,
  searchId,
  cusCode
) => {
  try {
    limit = !isNaN(parseInt(limit)) ? parseInt(limit) : 10;
    offset = !isNaN(parseInt(offset)) ? parseInt(offset) : 0;
    let query = "SELECT * FROM EMP_MAST";
    let countQuery = "SELECT COUNT(*) as total FROM EMP_MAST";
    let params = [];
    let countParams = [];
    let whereClause = [];

    // Handling searchId
    const isMobileNumber = /^\d{10}$/.test(searchId);
    if (searchId) {
      whereClause.push("(MOB_NMBR = ? OR CUS_CODE = ? OR SUB_CODE = ?)");
      params.push(searchId, searchId, searchId);
      countParams.push(searchId, searchId, searchId);
    }

    // Handling search
    if (search) {
      whereClause.push(
        "CONCAT_WS('', MOB_NMBR, EMP_NAME, EMP_MAIL, MOB_NMBR) LIKE ?"
      );
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    // Handling cusCode
    if (cusCode) {
      whereClause.push("CUS_CODE = ?");
      params.push(cusCode);
      countParams.push(cusCode);
    }

    // Handling additional filters
    if (filter_dept_id) {
      whereClause.push("DEPT_ID = ?");
      params.push(filter_dept_id);
      countParams.push(filter_dept_id);
    }
    if (filter_joined_from) {
      whereClause.push("JOINED_AT >= ?");
      params.push(filter_joined_from);
      countParams.push(filter_joined_from);
    }
    if (filter_joined_to) {
      whereClause.push("JOINED_AT <= ?");
      params.push(filter_joined_to);
      countParams.push(filter_joined_to);
    }

    // Combining all where clauses
    if (whereClause.length > 0) {
      query += " WHERE " + whereClause.join(" AND ");
      countQuery += " WHERE " + whereClause.join(" AND ");
    }

    // Sorting
    if (
      sort &&
      ["EMP_CODE", "EMP_NAME", "JOINED_AT", "EMP_MAIL", "MOB_NMBR"].includes(
        sort.toUpperCase()
      )
    ) {
      query += ` ORDER BY ${sort} ${
        order.toUpperCase() === "DESC" ? "DESC" : "ASC"
      }`;
    } else {
      query += " ORDER BY EMP_CODE ASC";
    }

    // Pagination
    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [employees] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    const totalCount = countResult[0].total;

    console.log("Final Query:", query);
    console.log("Query Params:", params);
    console.log("Count Query:", countQuery);
    console.log("Count Params:", countParams);

    // If searching by mobile number, return a single object
    if (isMobileNumber && employees.length > 0) {
      return [employees[0], totalCount];
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
    const setParts = [];
    const values = [];

    for (const [key, value] of Object.entries(employee)) {
      if (key === "ad_id") continue;

      // Convert all string and char fields to uppercase
      if (typeof value === "string" && value.constructor === String) {
        employee[key] = value.toUpperCase();
      }

      // Check if the value is a datetime string in ISO 8601 format
      if (
        typeof value === "string" &&
        value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      ) {
        // Convert the datetime string to MySQL's datetime format
        const formattedDate = new Date(value)
          .toISOString()
          .replace("T", " ")
          .replace(/\.\d{3}Z$/, "");
        setParts.push(`${key.toUpperCase()} = ?`);
        values.push(formattedDate);
      } else {
        setParts.push(`${key.toUpperCase()} = ?`);
        values.push(value);
      }
    }

    if (setParts.length === 0) {
      throw new Error("No fields to update");
    }

    const setClause = setParts.join(", ");
    values.push(empId.toUpperCase());

    const sqlQuery = `UPDATE EMP_MAST SET ${setClause} WHERE MOB_NMBR = ?`;

    const [result] = await db.query(sqlQuery, values);

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
    const [res] = await db.query(
      "DELETE FROM EMP_MAST WHERE MOB_NMBR = ?",
      empId
    );
    if (res.affectedRows == 0) {
      throw new Error("Employee not found");
    }
    console.log("Deleted employee with id: ", empId);
    return res;
  } catch (err) {
    console.error("Error deleting employee:", err);
    throw err;
  }
};

Employee.getAll = async (
  limit,
  offset,
  sort,
  order,
  search,
  filter_ad_id,
  filter_from,
  filter_to
) => {
  try {
    let query = `SELECT 
    EMP_MAST.*, 
    usr_admin.ad_name AS admin_name, 
    CUS_MAST.CUS_NAME AS customer_name
  FROM EMP_MAST
  LEFT JOIN usr_admin ON EMP_MAST.ad_id = usr_admin.ad_id
  LEFT JOIN CUS_MAST ON EMP_MAST.CUS_CODE = CUS_MAST.CUS_CODE`;
    let countQuery = "SELECT COUNT(*) as total FROM EMP_MAST";
    let params = [];
    let countParams = [];

    // Handle search
    if (search) {
      query +=
        " WHERE CONCAT_WS('', EMP_CODE, EMP_NAME, EMP_MAIL, CUS_CODE, MOB_NMBR) LIKE ?";
      countQuery +=
        " WHERE CONCAT_WS('', EMP_CODE, EMP_NAME, EMP_MAIL, CUS_CODE, MOB_NMBR) LIKE ?";
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    // Handle filters
    if (filter_ad_id || filter_from || filter_to) {
      if (!search) {
        query += " WHERE";
        countQuery += " WHERE";
      } else {
        query += " AND";
        countQuery += " AND";
      }
      const filters = [];
      if (filter_ad_id) {
        filters.push(" ad_id = ?");
        params.push(filter_ad_id);
        countParams.push(filter_ad_id);
      }

      // Check if filter_from and filter_to are the same
      if (filter_from && filter_to && filter_from === filter_to) {
        filters.push(" DATE(CREATED_AT) = ?");
        params.push(filter_from);
        countParams.push(filter_from);
      } else {
        if (filter_from) {
          filters.push(" CREATED_AT >= ?");
          params.push(filter_from);
          countParams.push(filter_from);
        }
        if (filter_to) {
          filters.push(" CREATED_AT <= ?");
          params.push(`${filter_to} 23:59:59`);
          countParams.push(`${filter_to} 23:59:59`);
        }
      }

      query += filters.join(" AND ");
      countQuery += filters.join(" AND ");
    }

    // Handle sorting
    if (
      sort &&
      [
        "EMP_CODE",
        "EMP_NAME",
        "EMP_MAIL",
        "CUS_CODE",
        "STATUS",
        "CREATED_AT",
      ].includes(sort.toUpperCase())
    ) {
      query += ` ORDER BY ${sort} ${
        order.toUpperCase() === "DESC" ? "DESC" : "ASC"
      }`;
    } else {
      query += " ORDER BY CREATED_AT DESC"; // default sorting
    }

    // Execute count query first to get total count
    const [countResult] = await db.query(countQuery, countParams);
    const totalCount = countResult[0].total;

    // Handle case where limit is 0
    if (limit === 0) {
      limit = totalCount; // Set limit to total count if limit is 0
    }

    // Handle pagination
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    // Execute main query with limit and offset
    const [employees] = await db.query(query, params);

    return [employees, totalCount];
  } catch (err) {
    console.error("Error retrieving employees:", err);
    throw err;
  }
};

module.exports = Employee;
