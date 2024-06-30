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

    const [employees, totalCount] = await Employee.getAll(
      limit,
      offset,
      sort,
      order,
      search
    );
    const totalPages = Math.ceil(totalCount / limit);

    let links = [];
    for (let i = 1; i <= totalPages; i++) {
      links.push({
        url: `/api/employees?page=${i}&items_per_page=${limit}&sort=${sort}&order=${order}&search=${search}`,
        label: `${i}`,
        active: i === page,
        page: i,
      });
    }

    if (page > 1) {
      links.unshift({
        url: `/api/employees?page=${page - 1}&items_per_page=${limit}&sort=${sort}&order=${order}&search=${search}`,
        label: "&laquo; Previous",
        active: false,
        page: page - 1,
      });
    }
    if (page < totalPages) {
      links.push({
        url: `/api/employees?page=${page + 1}&items_per_page=${limit}&sort=${sort}&order=${order}&search=${search}`,
        label: "Next &raquo;",
        active: false,
        page: page + 1,
      });
    }

    const paginationData = {
      page: page,
      first_page_url: `/api/employees?page=1&items_per_page=${limit}&sort=${sort}&order=${order}&search=${search}`,
      last_page: totalPages,
      next_page_url: page < totalPages ? `/api/employees?page=${page + 1}&items_per_page=${limit}&sort=${sort}&order=${order}&search=${search}` : null,
      prev_page_url: page > 1 ? `/api/employees?page=${page - 1}&items_per_page=${limit}&sort=${sort}&order=${order}&search=${search}` : null,
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
    console.error("Error in findAllEmployees:", err);
    res
      .status(500)
      .json(response.error("An error occurred while retrieving employees."));
  }
};

// Find a single Employee with an id

exports.findOne = async (req, res) => {
  try {
    const data = await Employee.findByMultipleCriteria(req.params.empId);
    if (!data || data.length === 0) {
      console.error("Employee not found with id:", req.params.empId);
      return res.status(404).send(response.notFound("Employee not found"));
    }
    console.log("Employee(s) retrieved successfully:", data);
    return res
      .status(200)
      .send(response.success("Employee(s) retrieved successfully", data));
  } catch (err) {
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

// Update an Employee identified by the id in the request
exports.update = (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: "Content cannot be empty!" });
    return;
  }

  Employee.updateById(req.params.empId, new Employee(req.body), (err, data) => {
    if (err) {
      if (err.message === "Employee not found") {
        res.status(404).send({ message: "Employee not found" });
      } else {
        res.status(500).send({
          message: "Error updating employee with id " + req.params.empId,
        });
      }
    } else res.send(data);
  });
};

// Delete an Employee with the specified id in the request
exports.delete = (req, res) => {
  Employee.remove(req.params.empId, (err, data) => {
    if (err) {
      if (err.message === "Employee not found") {
        res.status(404).send({ message: "Employee not found" });
      } else {
        res.status(500).send({
          message: "Could not delete employee with id " + req.params.empId,
        });
      }
    } else res.send({ message: "Employee deleted successfully!" });
  });
};
