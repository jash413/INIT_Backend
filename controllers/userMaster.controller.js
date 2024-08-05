const UsrMast = require("../models/userMaster.model");
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

    const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");

    const usrMast = new UsrMast({
      GST_CODE: req.body.GST_CODE,
      GST_NMBR: req.body.GST_NMBR,
      USR_ID: req.body.USR_ID,
      USR_PASS: req.body.USR_PASS,
      CLIENT_ID: req.body.CLIENT_ID,
      CLIENT_SECRET: req.body.CLIENT_SECRET,
      USR_ACTV: req.body.USR_ACTV,
      CREATED_ON: currentDate, 
      CREATED_BY: req.user.name,
      MODIFY_ON: formatMomentDate(req.body.MODIFY_ON),
      MODIFY_BY: req.body.MODIFY_BY,
      is_admin: req.body.is_admin,
      last_login: formatMomentDate(req.body.last_login),
      sandbox_access: 0,
    });

    const data = await UsrMast.create(usrMast);

    res.status(201).json(response.success("User created successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message || "Some error occurred while creating the user."
        )
      );
  }
};


exports.findAll = async (req, res) => {
  try {
    const users = await UsrMast.getAll();
    res
      .status(200)
      .json(response.success("Users retrieved successfully", users));
  } catch (error) {
    res
      .status(500)
      .json(response.error("Some error occurred while retrieving users."));
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await UsrMast.findById(req.params.id);

    if (!data) {
      return res
        .status(404)
        .json(response.notFound(`User not found with id ${req.params.id}`));
    }

    res.status(200).json(response.success("User retrieved successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(response.error(`Error retrieving user with id ${req.params.id}`));
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json(response.badRequest("Data to update can't be empty!"));
    }

    const data = await UsrMast.updateById(req.params.id, req.body);

    if (!data) {
      return res
        .status(404)
        .json(
          response.notFound(
            `Cannot update user with id ${req.params.id}. Maybe user was not found!`
          )
        );
    }

    res.status(200).json(response.success("User updated successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(response.error(`Error updating user with id ${req.params.id}`));
  }
};

exports.delete = async (req, res) => {
  try {
    await UsrMast.remove(req.params.id);
    res.status(200).json(response.success("User was deleted successfully!"));
  } catch (err) {
    res
      .status(500)
      .json(response.error(`Could not delete user with id ${req.params.id}`));
  }
};
