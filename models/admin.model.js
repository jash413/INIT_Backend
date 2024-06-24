const db = require("../utils/db");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Admin = function (admin) {
  this.ad_id = admin.ad_id;
  this.ad_name = admin.ad_name;
  this.ad_email = admin.ad_email;
  this.ad_pass = admin.ad_pass;
  this.ad_delete = admin.ad_delete;
  this.ad_type = admin.ad_type;
};


// Find Admin by email
Admin.findByEmail = async (ad_email) => {
  try {
    const [queryResult] = await db.query("SELECT * FROM usr_admin WHERE ad_email = ?", [ad_email]);
    return queryResult[0] ?? null;
  } catch (err) {
    console.error("Error finding admin by email:", err);
    throw err;
  }
};

// Create a new Admin
Admin.create = async (newAdmin) => {
  try {
    const [res] = await db.query("INSERT INTO usr_admin SET ?", newAdmin);
    // console.log("Created admin: ", { id: res.insertId, ...newAdmin });
    return { id: res.insertId, ...newAdmin };
  } catch (err) {
    console.error("Error creating admin:", err);
    throw err;
  }
};



// Update Admin by id
Admin.updateById = async (adId, admin) => {
  try {
    const [res] = await db.query(
      "UPDATE usr_admin SET ad_name = ?, ad_email = ?, ad_pass = ?, ad_delete = ?, ad_type = ? WHERE ad_id = ?",
      [
        admin.ad_name,
        admin.ad_email,
        admin.ad_pass,
        admin.ad_delete,
        admin.ad_type,
        adId,
      ]
    );
    if (res.affectedRows == 0) {
      throw new Error("Admin not found");
    }
    console.log("Updated admin: ", { id: adId, ...admin });
    return { id: adId, ...admin };
  } catch (err) {
    console.error("Error updating admin:", err);
    throw err;
  }
};

// Delete Admin by id
Admin.remove = async (adId) => {
  try {
    const [res] = await db.query("DELETE FROM usr_admin WHERE ad_id = ?", adId);
    if (res.affectedRows == 0) {
      throw new Error("Admin not found");
    }
    console.log("Deleted admin with id: ", adId);
    return res;
  } catch (err) {
    console.error("Error deleting admin:", err);
    throw err;
  }
};


// Find a single Admin with an id
Admin.findById = async (req, res) => {
  try {
    const data = await Admin.findById(req.params.adId);
    if (!data) {
      res.status(404).json(response.error("Admin not found"));
    } else {
      res.json(response.success('Admin retrieved successfully', data));
    }
  } catch (err) {
    res.status(500).json(response.error("Error retrieving admin with id " + req.params.adId));
  }
};

// Retrieve all Admins
Admin.getAll = async () => {
  try {
    const [res] = await db.query("SELECT * FROM usr_admin");
    // console.log("Admins: ", res);
    return res;
  } catch (err) {
    console.error("Error retrieving admins:", err);
    throw err;
  }
};




module.exports = Admin;
