const USRSubs = require("../models/UserSubscription.model.js");
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



  

    const usrSubs = new USRSubs({
      GST_CODE: req.body.GST_CODE,
      GST_NMBR: req.body.GST_NMBR,
      SYSTEM_ID: req.body.SYSTEM_ID,
      SUBSCRIPTION_ID: req.body.SUBSCRIPTION_ID,
      SUBSCRIPTION_DATE: formatMomentDate(req.body.SUBSCRIPTION_DATE),
      ALLOTED_CALLS: req.body.ALLOTED_CALLS,
      USED_CALLS: req.body.USED_CALLS,
      PENDING_CALLS: req.body.PENDING_CALLS,
      is_active: req.body.is_active,
      created_by: req.user.name,
      created_on: formatMomentDate(req.body.created_on),
      user_id: req.body.user_id,
      expiry_date: formatMomentDate(req.body.expiry_date),
      INV_DATE: formatMomentDate(req.body.INV_DATE),
      INV_NO: req.body.INV_NO,
      IS_VERIFIED: req.body.IS_VERIFIED,
    });

    const data = await USRSubs.create(usrSubs);
  
    res
      .status(201)
      .json(response.success("User subscription created successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message ||
            "Some error occurred while creating the user subscription."
        )
      );
  }
};

exports.findAll = async (req, res) => {
  try {
    const usrSubs = await USRSubs.getAll();
 

    res
      .status(200)
      .json(
        response.success("User subscriptions retrieved successfully", usrSubs)
    );

    
  } catch (error) {
    res
      .status(500)
      .json(
        response.error(
          "Some error occurred while retrieving user subscriptions"
        )
      );
    }
    
};

exports.findOne = async (req, res) => {
  try {
    const data = await USRSubs.findById(req.params.id);

    if (!data) {
      return res
        .status(404)
        .json(
          response.notFound(
            `User subscription not found with id ${req.params.id}`
          )
        );
    }

    res
      .status(200)
      .json(response.success("User subscription retrieved successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          `Error retrieving user subscription with id ${req.params.id}`
        )
      );
  }
};

exports.update = async (req, res) => {
  try {
    console.log("Request params:", req.params); // Add this line
    if (!req.body) {
      return res
        .status(400)
        .json(response.badRequest("Data to update can't be empty!"));
    }

    const data = await USRSubs.updateById(req.params.id, req.body);

    res
      .status(200)
      .json(response.success("User subscription updated successfully", data));
  } catch (err) {
    console.error("Error updating user subscription:", err.message, err.stack);
    res
      .status(500)
      .json(
        response.error(
          `Error updating user subscription with id ${req.params.id}`,
          err.message
        )
      );
  }
};


exports.delete = async (req, res) => {
  try {
    await USRSubs.remove(req.params.id);
    res.send({ message: "User subscription was deleted successfully!" });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete user subscription with id " + req.params.id,
    });
  }
};
