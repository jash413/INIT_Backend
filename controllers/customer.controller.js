const Customer = require("../models/customer.model");
const moment = require("moment");
const response = require("../utils/response");

// Create and Save a new Customer
exports.create = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).json(response.error("Content cannot be empty!"));
      return;
    }

    const formatMomentDate = (date) =>
      date ? moment(date).format("YYYY-MM-DD HH:mm:ss") : null;

    const customer = new Customer({
      CUS_CODE: req.body.CUS_CODE,
      CUS_NAME: req.body.CUS_NAME,
      INS_DATE: formatMomentDate(req.body.INS_DATE),
      DUE_DAYS: req.body.DUE_DAYS,
      EXP_DATE: req.body.EXP_DATE, // Assuming EXP_DATE and MSG_EXDT are not formatted because they might already be in correct format or not date fields
      USR_NMBR: req.body.USR_NMBR,
      SYN_DATE: null,
      POS_SYNC: formatMomentDate(req.body.POS_SYNC),
      CUS_PASS: req.body.CUS_PASS,
      CUS_MAIL: req.body.CUS_MAIL,
      LOG_INDT: formatMomentDate(req.body.LOG_INDT),
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [customers, totalCount] = await Customer.getAll(limit, offset);

    const totalPages = Math.ceil(totalCount / limit);

    // Initialize links array
    let links = [];

    // Generate links for each page
    for (let i = 1; i <= totalPages; i++) {
      links.push({
        url: `/?page=${i}`,
        label: `${i}`,
        active: i === page,
        page: i,
      });
    }

    // Optionally, add Previous and Next links
    if (page > 1) {
      links.unshift({
        url: `/?page=${page - 1}`,
        label: "&laquo; Previous",
        active: false,
        page: page - 1,
      });
    }
    if (page < totalPages) {
      links.push({
        url: `/?page=${page + 1}`,
        label: "Next &raquo;",
        active: false,
        page: page + 1,
      });
    }

    const paginationData = {
      page: page,
      first_page_url: `/?page=1`,
      last_page: totalPages,
      next_page_url: page < totalPages ? `/?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/?page=${page - 1}` : null,
      items_per_page: limit,
      from: offset + 1,
      to: offset + customers.length,
      total: totalCount,
      links, // Include the updated links array in the pagination data
    };

    res.json(
      response.success("Customers retrieved successfully", customers, {
        pagination: paginationData,
      })
    );
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

exports.update = async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({ message: "Update data cannot be empty!" });
  }

  const allowedFields = [
    "CUS_NAME",
    "DUE_DAYS",
    "USR_NMBR",
    "POS_SYNC",
    "CUS_PASS",
    "CUS_MAIL",
    "CUS_MESG",
    "MSG_EXDT",
    "CON_PERS",
    "CUS_ADDR",
    "PHO_NMBR",
    "CUS_REFB",
    "GRP_CODE",
    "INS_USER",
    "BUS_CODE",
    "CMP_VERS",
    "client_id",
    "client_secret",
    "database_name",
    "is_active",
    "app_key",
    "reg_type_id",
  ];

  const updateData = {};
  let hasValidField = false;

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
      hasValidField = true;
    }
  }

  if (!hasValidField) {
    return res.status(400).send({
      message:
        "No valid fields to update. Allowed fields are: " +
        allowedFields.join(", "),
    });
  }

  try {
    const updatedCustomer = await Customer.updateById(
      req.params.custId,
      updateData
    );
    res.send(updatedCustomer);
  } catch (err) {
    if (err.message === "Customer not found") {
      res.status(404).send({ message: "Customer not found" });
    } else if (err.message === "No valid fields to update") {
      res.status(400).send({ message: "No valid fields to update" });
    } else {
      console.error("Error in update controller:", err);
      res.status(500).send({
        message: "Error updating customer with id " + req.params.custId,
      });
    }
  }
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
    res.status(500).json({
      error: "Could not delete customer with id " + req.params.custId,
    });
  }
};
