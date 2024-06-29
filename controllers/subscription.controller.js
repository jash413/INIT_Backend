const Subscription = require('../models/subscription.model.js');
const moment = require('moment');
const response=require('../utils/response.js')

exports.create = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).json(response.error("Content cannot be empty!"));
      return;
    }

    const subscription = new Subscription({
      SUB_CODE: req.body.SUB_CODE,
      CUS_CODE: req.body.CUS_CODE,
      PLA_CODE: req.body.PLA_CODE,
      SUB_STDT: moment(req.body.SUB_STDT).format("YYYY-MM-DD"),
      SUB_ENDT: moment(req.body.SUB_ENDT).format("YYYY-MM-DD"),
      LIC_USER: req.body.LIC_USER,
      SUB_PDAT: moment(req.body.SUB_PDAT).format("YYYY-MM-DD"),
      SUB_ORDN: req.body.SUB_ORDN,
      status: req.body.status,
      ORD_REQD: req.body.ORD_REQD,
    });

    const data = await Subscription.create(subscription);
    res.json(response.success("Subscription created successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message || "Some error occurred while creating the Subscription."
        )
      );
  }
};
// Retrieve all Subscriptions from the database
exports.findAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Assuming SUB_MAST has a similar getAll method
    const [subscriptions, totalCount] = await Subscription.getAll(limit, offset);

    const totalPages = Math.ceil(totalCount / limit);

    let links = [];
    for (let i = 1; i <= totalPages; i++) {
      links.push({
        url: `/?page=${i}`,
        label: `${i}`,
        active: i === page,
        page: i,
      });
    }

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
      to: offset + subscriptions.length,
      total: totalCount,
      links,
    };

    res.json(
      response.success("Subscriptions retrieved successfully", subscriptions, {
        pagination: paginationData,
      })
    );
  } catch (err) {
    console.error("Error in findAllSubscriptions:", err);
    res
      .status(500)
      .json(response.error("An error occurred while retrieving subscriptions."));
  }
};

// Find a single Subscription with an id
exports.findOne = async (req, res) => {

  try {
    const data = await Subscription.findById(req.params.subId);
    console.log("Subscription retrieved successfully:", data);
    return res
      .status(200)
      .send(
        response.success("Subscription retrieved successfully", data)
      );
  } catch (err) {
    if (err.message === "Subscription not found") {
      console.error("Subscription not found with id:", req.params.subId);
      return res
        .status(404)
        .send(response.notFound("Subscription not found"));
    } else {
      console.error(
        "Error retrieving subscription with id",
        req.params.subId,
        ":",
        err
      );
      return res
        .status(500)
        .send(
          response.error(
            "Error retrieving subscription with id " + req.params.subId
          )
        );
    }
  }
};

// Update a Subscription identified by the id in the request
exports.update = async (req, res) => {


  if (!req.body || Object.keys(req.body).length === 0) {
    console.log("Empty request body");
    return res
      .status(400)
      .send(response.badRequest("Content can not be empty!"));
  }

  const subCode = req.params.subCode;

  try {
    const data = await Subscription.updateByCode(subCode, req.body);

    return res
      .status(200)
      .send(response.success("Subscription updated successfully", data));
  } catch (err) {
    console.error("Error in updateByCode:", err);
    if (err.message === "Subscription not found") {
      return res
        .status(404)
        .send(
          response.notFound(
            `Subscription not found with code ${subCode}.`
          )
        );
    } else {
      return res
        .status(500)
        .send(
          response.error(
            `Error updating Subscription with code ${subCode}: ${err.message}`
          )
        );
    }
  }
};

// Delete a Subscription with the specified id in the request
exports.delete = async (req, res) => {
  try {
    await Subscription.remove(req.params.subId);
    res.send({ message: "Subscription deleted successfully!" });
  } catch (err) {
    if (err.message === "Subscription not found") {
      res.status(404).send({ message: "Subscription not found" });
    } else {
      console.error("Error in delete controller:", err);
      res.status(500).send({
        message: `Could not delete subscription with id ${req.params.subId}`,
      });
    }
  }
};

