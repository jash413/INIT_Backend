const Customer = require("../models/customer.model");
const moment = require('moment');
const response = require("../utils/response");
// Create and Save a new Customer
exports.create = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).json(response.error("Content cannot be empty!"));
      return;
    }

    const customer = new Customer({
      CUS_CODE: req.body.CUS_CODE,
      CUS_NAME: req.body.CUS_NAME,
      INS_DATE: moment(req.body.INS_DATE).format("YYYY-MM-DD HH:mm:ss"),
      DUE_DAYS: req.body.DUE_DAYS,
      EXP_DATE: req.body.EXP_DATE,
      USR_NMBR: req.body.USR_NMBR,
      SYN_DATE: moment(req.body.SYN_DATE).format("YYYY-MM-DD HH:mm:ss"),
      POS_SYNC: moment(req.body.POS_SYNC).format("YYYY-MM-DD HH:mm:ss"),
      CUS_PASS: req.body.CUS_PASS,
      CUS_MAIL: req.body.CUS_MAIL,
      LOG_INDT: moment(req.body.LOG_INDT).format("YYYY-MM-DD HH:mm:ss"),
      CUS_MESG: req.body.CUS_MESG,
      MSG_EXDT: req.body.MSG_EXDT,
      CON_PERS: req.body.CON_PERS,
      CUS_ADDR: req.body.CUS_ADDR,
      PHO_NMBR: req.body.PHO_NMBR,
      CUS_REFB: req.body.CUS_REFB,
      GRP_CODE: req.body.GRP_CODE,
      INS_USER: req.body.INS_USER,
      BUS_CODE: req.body.BUS_CODE,
      CMP_VERS: req.body.CMP_VERS,
      client_id: req.body.client_id,
      client_secret: req.body.client_secret,
      database_name: req.body.database_name,
      is_active: req.body.is_active,
      app_key: req.body.app_key,
      reg_type_id: req.body.reg_type_id,
    });

    const data = await Customer.create(customer);
    res.json(response.success("Customer created successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message || "Some error occurred while creating the Customer."
        )
      );
  }
};


// Retrieve all Customers from the database
exports.findAll = async (req, res) => {
  try {
    const data = await Customer.getAll();
    res.json(response.success("Customers retrieved successfully", data[0]));
  } catch (err) {
    console.error("Error in findAll:", err);
    res
      .status(500)
      .json(response.error("An error occurred while retrieving customers."));
  }
};

// Find a single Customer with an id
exports.findOne = async (req, res) => {
  try {
    const data = await Customer.findById(req.params.custId);
    if (!data) {
      res.status(404).json(response.error("Customer not found"));
    } else {
      res.json(response.success("Customer retrieved successfully", data));
    }
  } catch (err) {
    res
      .status(500)
      .json(
        response.error("Error retrieving customer with id " + req.params.custId)
      );
  }
};
// Update a Customer identified by the id in the request
exports.update = (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: "Content cannot be empty!" });
    return;
  }

  Customer.updateById(
    req.params.custId,
    new Customer(req.body),
    (err, data) => {
      if (err) {
        if (err.message === "Customer not found") {
          res.status(404).send({ message: "Customer not found" });
        } else {
          res.status(500).send({
            message: "Error updating customer with id " + req.params.custId,
          });
        }
      } else res.send(data);
    }
  );
};

// Delete a Customer with the specified id in the request
exports.delete = async (req, res) => {
  try {
    const data = await Customer.remove(req.params.custId);
    if (!data) {
      res.status(404).json({ error: "Customer not found" });
    } else {
      res.json({ success: "Customer deleted successfully", data: {} });
    }
  } catch (err) {
    res
      .status(500)
      .json({
        error: "Could not delete customer with id " + req.params.custId,
      });
  }
};