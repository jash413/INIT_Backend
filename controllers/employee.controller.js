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
    const data = await Employee.getAll();
    res.json(response.success("Employees retrieved successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message || "Some error occurred while retrieving employees."
        )
      );
  }
};

// Find a single Employee with an id
exports.findOne = async (req, res) => {
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
