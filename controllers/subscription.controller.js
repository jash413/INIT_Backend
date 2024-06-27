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
exports.findOne = (req, res) => {
  Subscription.findById(req.params.subId, (err, data) => {
    if (err) {
      if (err.message === "Subscription not found") {
        res.status(404).send({ message: "Subscription not found" });
      } else {
        res.status(500).send({
          message: "Error retrieving subscription with id " + req.params.subId,
        });
      }
    } else res.send(data);
  });
};

// Update a Subscription identified by the id in the request
exports.update = (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: "Content cannot be empty!" });
    return;
  }

  Subscription.updateById(
    req.params.subId,
    new Subscription(req.body),
    (err, data) => {
      if (err) {
        if (err.message === "Subscription not found") {
          res.status(404).send({ message: "Subscription not found" });
        } else {
          res.status(500).send({
            message: "Error updating subscription with id " + req.params.subId,
          });
        }
      } else res.send(data);
    }
  );
};

// Delete a Subscription with the specified id in the request
exports.delete = (req, res) => {
  Subscription.remove(req.params.subId, (err, data) => {
    if (err) {
      if (err.message === "Subscription not found") {
        res.status(404).send({ message: "Subscription not found" });
      } else {
        res.status(500).send({
          message: "Could not delete subscription with id " + req.params.subId,
        });
      }
    } else res.send({ message: "Subscription deleted successfully!" });
  });
};
