const GstRegistration = require("../models/gstRegistration.model");
const response = require("../utils/response.js");

const moment = require("moment");

exports.create = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json(response.badRequest("Content cannot be empty!"));
    }

    const formatMomentDate = (date) =>
      date ? moment(date).format("YYYY-MM-DD HH:mm:ss") : null;

    const gstRegistration = new GstRegistration({
      REG_CODE: req.body.REG_CODE,
      CUS_NAME: req.body.CUS_NAME,
      CUS_ADDR: req.body.CUS_ADDR,
      CMP_NAME: req.body.CMP_NAME,
      notification_date: formatMomentDate(req.body.notification_date),
    });

    const data = await GstRegistration.create(gstRegistration);
    res
      .status(201)
      .json(response.success("GST registration created successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message ||
            "Some error occurred while creating the GST registration."
        )
      );
  }
};

exports.findAll = async (req, res) => {
  try {
    const gstRegistrations = await GstRegistration.getAll();
    res
      .status(200)
      .json(
        response.success(
          "GST registrations retrieved successfully",
          gstRegistrations
        )
      );
  } catch (error) {
    res
      .status(500)
      .json(
        response.error("Some error occurred while retrieving GST registrations")
      );
  }
};


exports.findOne = async (req, res) => {
  try {
    const data = await GstRegistration.findById(req.params.id);

    if (!data) {
      return res
        .status(404)
        .json(
          response.notFound(
            `GST registration not found with id ${req.params.id}`
          )
        );
    }

    res
      .status(200)
      .json(response.success("GST registration retrieved successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          `Error retrieving GST registration with id ${req.params.id}`
        )
      );
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json(response.badRequest("Data to update can't be empty!"));
    }

    const data = await GstRegistration.updateById(req.params.id, req.body);

    if (!data) {
      return res
        .status(404)
        .json(
          response.notFound(
            `Cannot update GST registration with id ${req.params.id}. Maybe GST registration was not found!`
          )
        );
    }

    res
      .status(200)
      .json(response.success("GST registration updated successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          `Error updating GST registration with id ${req.params.id}`
        )
      );
  }
};
exports.delete = async (req, res) => {
  try {
    await GstRegistration.remove(req.params.id);
    res.send({ message: "GST registration was deleted successfully!" });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete GST registration with id " + req.params.id,
    });
  }
};
