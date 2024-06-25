const Admin = require("../models/admin.model");
const response = require("../utils/response");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const pagination = require("../middlewares/pagination");

exports.Login = async (req, res) => {
  const { ad_email, ad_pass } = req.body;

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined.");
    return res.status(500).json(response.error("Internal server error"));
  }

  try {
    const admin = await Admin.findByEmail(ad_email);
    if (!admin) {
      return res.status(404).json(response.error("Admin not found"));
    }

 

    const passwordIsValid = await bcrypt.compare(ad_pass, admin.ad_pass);
    if (!passwordIsValid) {
      return res.status(401).json(response.error("Invalid Password!"));
    }

    const token = jwt.sign({ id: admin.ad_id }, process.env.JWT_SECRET, {
      expiresIn: 86400, // 24 hours 
    });

    res.json(
      response.success("Admin logged in successfully", {
        id: admin.ad_id,
        name: admin.ad_name,
        email: admin.ad_email,
        accessToken: token,
      })
    );
  } catch (err) {
    res
      .status(500)
      .json(response.error(err.message || "Error logging in admin"));
  }
};
// Create and Save a new Admin
exports.create = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).json(response.error("Content cannot be empty!"));
      return;
    }

    const hashedPassword = await bcrypt.hash(req.body.ad_pass, saltRounds);

    const admin = new Admin({
      ad_name: req.body.ad_name,
      ad_email: req.body.ad_email,
      ad_pass: hashedPassword,
      ad_delete: req.body.ad_delete,
      ad_type: req.body.ad_type,
      ad_id: req.body.ad_id,
    });

    const data = await Admin.create(admin);
    res.json(response.success("Admin created successfully", data));
  } catch (err) {
    res
      .status(500)
      .json(
        response.error(
          err.message || "Some error occurred while creating the Admin."
        )
      );
  }
};

exports.findAll = async (req, res) => {
  try {
    const data = await Admin.getAll();
    res.json({
      success: true,
      message: "Admins retrieved successfully",
      data: paginatedData.data,
      pagination: {
        meta: paginatedData.meta,
        links: paginatedData.links,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while retrieving admins.",
    });
  }
};

// Find a single Admin with an id
exports.findOne = async (req, res) => {
  try {
    const data = await Admin.findById(req.params.adId);
    if (!data) {
      res.status(404).json(response.error("Admin not found"));
    } else {
      res.json(response.success("Admin retrieved successfully", data));
    }
  } catch (err) {
    res
      .status(500)
      .json(
        response.error("Error retrieving admin with id " + req.params.adId)
      );
  }
};

// Update an Admin identified by the id in the request
exports.update = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).json(response.error("Content cannot be empty!"));
      return;
    }

    const data = await Admin.updateById(req.params.adId, new Admin(req.body));
    if (!data) {
      res.status(404).json(response.error("Admin not found"));
    } else {
      res.json(response.success("Admin updated successfully", data));
    }
  } catch (err) {
    res
      .status(500)
      .json(response.error("Error updating admin with id " + req.params.adId));
  }
};

// Delete an Admin with the specified id in the request
exports.delete = async (req, res) => {
  try {
    const data = await Admin.remove(req.params.adId);
    if (!data) {
      res.status(404).json(response.error("Admin not found"));
    } else {
      res.json(response.success("Admin deleted successfully", {}));
    }
  } catch (err) {
    res
      .status(500)
      .json(
        response.error("Could not delete admin with id " + req.params.adId)
      );
  }
};
