const Employee = require("../models/employee.model");
const response = require("../utils/response");
const moment = require("moment");

exports.create = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).json(response.error("Content cannot be empty!"));
      return;
    }

    const employee = new Employee({
      CUS_CODE: req.body.CUS_CODE,
      EMP_CODE: req.body.EMP_CODE,
      EMP_NAME: req.body.EMP_NAME,
      EMP_PASS: req.body.EMP_PASS,
      EMP_IMEI: req.body.EMP_IMEI,
      MOB_NMBR: req.body.MOB_NMBR,
      EMP_ACTV: req.body.EMP_ACTV,
      SYN_DATE: moment(req.body.SYN_DATE).format("YYYY-MM-DD HH:mm:ss"),
      EMP_MAIL: req.body.EMP_MAIL,
      SUB_CODE: req.body.SUB_CODE,
      USR_TYPE: req.body.USR_TYPE,
      REGDATE: moment(req.body.REGDATE).format("YYYY-MM-DD"),
      SUB_STDT: moment(req.body.SUB_STDT).format("YYYY-MM-DD"),
      SUB_ENDT: moment(req.body.SUB_ENDT).format("YYYY-MM-DD"),
      REG_TOKEN: req.body.REG_TOKEN,
      ad_id: req.user.id,
      DEVICE_ID: req.body.DEVICE_ID,
      STATUS: req.body.STATUS,
      SALE_OS_ACTIVE: req.body.SALE_OS_ACTIVE,
      PUR_OS_ACTIVE: req.body.PUR_OS_ACTIVE,
      SALE_ORDER_ACTIVE: req.body.SALE_ORDER_ACTIVE,
      PURCHASE_ORDER_ACTIVE: req.body.PURCHASE_ORDER_ACTIVE,
      SALE_ORDER_ENTRY: req.body.SALE_ORDER_ENTRY,
      SALE_REPORT_ACTIVE: req.body.SALE_REPORT_ACTIVE,
      PURCHASE_REPORT_ACTIVE: req.body.PURCHASE_REPORT_ACTIVE,
      LEDGER_REPORT_ACTIVE: req.body.LEDGER_REPORT_ACTIVE,
    });

    const data = await Employee.create(employee);
    res.json(response.success("Employee created successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message || "Some error occurred while creating the Employee."
        )
      );
  }
};

// Retrieve all Employees from the database
exports.findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items_per_page) || 10;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || "EMP_CODE";
    const order = req.query.order || "asc";
    const search = req.query.search || "";
    const filter_ad_id = req.query.filter_ad_id || null;
    const filter_from = req.query.filter_from || null;
    const filter_to = req.query.filter_to || null;

    // Log query parameters
    console.log("Query parameters:", {
      page,
      limit,
      offset,
      sort,
      order,
      search,
      filter_ad_id,
      filter_from,
      filter_to,
    });

    // Validate date filters
    if (filter_from && !isValidDate(filter_from)) {
      return res
        .status(400)
        .json(response.error("Invalid filter_from date format"));
    }
    if (filter_to && !isValidDate(filter_to)) {
      return res
        .status(400)
        .json(response.error("Invalid filter_to date format"));
    }

    const [employees, totalCount] = await Employee.getAll(
      limit,
      offset,
      sort,
      order,
      search,
      filter_ad_id,
      filter_from,
      filter_to
    );
    const totalPages = Math.ceil(totalCount / limit);

    let links = [];
    const maxPageLinks = 5; // Limit the number of page links
    const startPage = Math.max(1, page - Math.floor(maxPageLinks / 2));
    const endPage = Math.min(totalPages, startPage + maxPageLinks - 1);

    for (let i = startPage; i <= endPage; i++) {
      links.push(
        createPageLink(
          i,
          page,
          limit,
          sort,
          order,
          search,
          filter_ad_id,
          filter_from,
          filter_to
        )
      );
    }

    if (page > 1) {
      links.unshift(
        createPageLink(
          page - 1,
          page,
          limit,
          sort,
          order,
          search,
          filter_ad_id,
          filter_from,
          filter_to,
          "&laquo; Previous"
        )
      );
    }
    if (page < totalPages) {
      links.push(
        createPageLink(
          page + 1,
          page,
          limit,
          sort,
          order,
          search,
          filter_ad_id,
          filter_from,
          filter_to,
          "Next &raquo;"
        )
      );
    }

    const paginationData = {
      page: page,
      first_page_url: createUrl(
        1,
        limit,
        sort,
        order,
        search,
        filter_ad_id,
        filter_from,
        filter_to
      ),
      last_page: totalPages,
      next_page_url:
        page < totalPages
          ? createUrl(
              page + 1,
              limit,
              sort,
              order,
              search,
              filter_ad_id,
              filter_from,
              filter_to
            )
          : null,
      prev_page_url:
        page > 1
          ? createUrl(
              page - 1,
              limit,
              sort,
              order,
              search,
              filter_ad_id,
              filter_from,
              filter_to
            )
          : null,
      items_per_page: limit,
      from: offset + 1,
      to: offset + employees.length,
      total: totalCount,
      links,
    };

    res.json(
      response.success("Employees retrieved successfully", employees, {
        pagination: paginationData,
      })
    );
  } catch (err) {
    console.error("Error in findAll:", err);
    res
      .status(500)
      .json(response.error("An error occurred while retrieving employees."));
  }
};

// Helper function to validate date format
const createPageLink = (
  pageNum,
  currentPage,
  limit,
  sort,
  order,
  search,
  filter_ad_id,
  filter_from,
  filter_to,
  label = null
) => {
  return {
    url: createUrl(
      pageNum,
      limit,
      sort,
      order,
      search,
      filter_ad_id,
      filter_from,
      filter_to
    ),
    label: label || `${pageNum}`,
    active: pageNum === currentPage,
    page: pageNum,
  };
};

const createUrl = (
  page,
  limit,
  sort,
  order,
  search,
  filter_ad_id,
  filter_from,
  filter_to
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    items_per_page: limit.toString(),
    sort,
    order,
    search: encodeURIComponent(search),
  });

  if (filter_ad_id) params.append("filter_ad_id", filter_ad_id);
  if (filter_from) params.append("filter_from", filter_from);
  if (filter_to) params.append("filter_to", filter_to);

  return `/api/employees?${params.toString()}`;
};

const isValidDate = (dateString) => {
  // This regex allows for dates in the format YYYY-MM-DD or YYYY-DD-MM
  const regex = /^\d{4}-(0[1-9]|1[0-2]|[1-3]\d)-(0[1-9]|[12]\d|3[01])$/;
  if (!regex.test(dateString)) return false;

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};




// Find a single Employee with an id
exports.findOne = async (req, res) => {
  try {
    const empId = req.params.empId;

    // Attempt to find by EMP_CODE first
    const employee = await Employee.findByEmpCode(empId);

    if (employee) {
      return res
        .status(200)
        .send(
          response.success("Employee retrieved successfully", employee, {}, 200)
        );
    } else {
      // If not found by EMP_CODE, search by multiple criteria
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      const sort = req.query.sort || "EMP_CODE";
      const order = req.query.order || "ASC";

      const [employees, totalCount] = await Employee.findByMultipleCriteria(
        limit,
        offset,
        sort,
        order,
        null, // search
        null, // filter_dept_id
        null, // filter_joined_from
        null, // filter_joined_to
        empId // searchId
      );

      if (employees.length === 0) {
        return res
          .status(404)
          .send(response.error(`Employee not found with id ${empId}`, 404));
      } else {
        return res
          .status(200)
          .send(
            response.success(
              "Employees retrieved successfully",
              employees,
              { totalCount },
              200
            )
          );
      }
    }
  } catch (err) {
    console.error(
      `Error retrieving employee(s) with id ${req.params.empId}:`,
      err
    );
    return res
      .status(500)
      .send(
        response.error(
          `Error retrieving employee(s) with id ${req.params.empId}: ${err.message}`,
          500
        )
      );
  }
};


// Update an Employee identified by the id in the request
exports.update = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json(response.error("Content cannot be empty!"));
    }

    const updatedEmployee = new Employee(req.body);
    const data = await Employee.updateById(req.params.empId, updatedEmployee);

    if (!data) {
      return res.status(404).json(response.notFound("Employee not found"));
    }

    res.json(response.success("Employee updated successfully", data));
  } catch (err) {
    console.error("Error updating employee with id " + req.params.empId, err);
    res
      .status(500)
      .json(
        response.error("Error updating employee with id " + req.params.empId)
      );
  }
};


// Delete an Employee with the specified id in the request
exports.delete = async (req, res) => {
  try {
    const empId = req.params.empId;
    console.log("Attempting to delete employee with id: ", empId);
    await Employee.remove(empId);
    res.send({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Error in delete operation: ", err.message);
    res.status(500).send({ message: err.message });
  }
};
