const db = require('../utils/db.js');
const response =require('../utils/response.js')

const Subscription = function (subscription) {
  this.SUB_CODE = subscription.SUB_CODE;
  this.CUS_CODE = subscription.CUS_CODE;
  this.PLA_CODE = subscription.PLA_CODE;
  this.SUB_STDT = subscription.SUB_STDT;
  this.SUB_ENDT = subscription.SUB_ENDT;
  this.LIC_USER = subscription.LIC_USER;
  this.SUB_PDAT = subscription.SUB_PDAT;
  this.SUB_ORDN = subscription.SUB_ORDN;
  this.status = subscription.status;
  this.ORD_REQD = subscription.ORD_REQD;
};


// Create a new Subscription
Subscription.create = async (newSubscription) => {
  if (!newSubscription.SUB_CODE) {
    throw new Error("SUB_CODE is required");
  }
  try {
    const [res] = await db.query("INSERT INTO SUB_MAST SET ?", newSubscription);
    console.log("Created subscription: ", { id: res.insertId, ...newSubscription });
    return { id: res.insertId, ...newSubscription };
  } catch (err) {
    console.error("Error creating subscription:", err);
    throw err;
  }
};

// Find Subscription by id
Subscription.findById = (subId, result) => {
  db.query(
    "SELECT * FROM SUB_MAST WHERE SUB_CODE = ?",
    subId,
    (err, res) => {
      if (err) {
        console.error("Error finding subscription by id:", err);
        result(err, null);
        return;
      }
      if (res.length) {
        
        result(null, res[0]);
        return;
      }
      result({ message: "Subscription not found" }, null);
    }
  );
};

// Update Subscription by id
Subscription.updateByCode = async (SUB_CODE, updateData) => {
  const allowedFields = [
    "CUS_CODE",
    "PLA_CODE",
    "SUB_STDT",
    "SUB_ENDT",
    "LIC_USER",
    "SUB_PDAT",
    "SUB_ORDN",
    "status",
    "ORD_REQD",
  ];

  const dateFields = ["SUB_STDT", "SUB_ENDT"];

  try {
    let updateFields = [];
    let updateValues = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (dateFields.includes(key) && value !== null) {
          // Handle date fields
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid ${key} format`);
          }
          updateFields.push(`${key} = ?`);
          updateValues.push(date.toISOString().slice(0, 10)); // Format as YYYY-MM-DD
        } else if (key === "LIC_USER") {
          // Ensure LIC_USER is a smallint
          const licUser = parseInt(value, 10);
          if (isNaN(licUser) || licUser < 0 || licUser > 32767) {
            throw new Error("Invalid LIC_USER value");
          }
          updateFields.push(`${key} = ?`);
          updateValues.push(licUser);
        } else if (key === "status") {
          // Ensure status is 0 or 1
          const status = parseInt(value, 10);
          if (status !== 0 && status !== 1) {
            throw new Error("Invalid status value");
          }
          updateFields.push(`${key} = ?`);
          updateValues.push(status);
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      throw new Error("No valid fields to update");
    }

    updateValues.push(SUB_CODE);

    const sql = `UPDATE SUB_MAST SET ${updateFields.join(
      ", "
    )} WHERE SUB_CODE = ?`;
    const [result] = await db.query(sql, updateValues);

    if (result.affectedRows === 0) {
      throw new Error("Subscription not found");
    }

    console.log("Updated subscription: ", { SUB_CODE, ...updateData });
    return { SUB_CODE, ...updateData };
  } catch (err) {
    console.error("Error updating subscription:", err);
    throw err;
  }
};



// Delete Subscription by id
Subscription.remove = async (subId) => {
  try {
    const [result] = await db.query("DELETE FROM SUB_MAST WHERE SUB_CODE = ?", [
      subId,
    ]);

    if (result.affectedRows === 0) {
      throw new Error("Subscription not found");
    }

    return {result,deletedSubID : subId};
  } catch (err) {
    console.error("Error deleting subscription:", err);
    throw err; // Re-throw the error to be handled by the caller
  }
};

// Retrieve all Subscriptions
Subscription.getAll = async (limit, offset) => {
  try {
    const [subscriptions] = await db.query(
      "SELECT * FROM SUB_MAST LIMIT ? OFFSET ?",
      [limit, offset]
    );
    const [countResult] = await db.query(
      "SELECT COUNT(*) as total FROM SUB_MAST"
    );
    const totalCount = countResult[0].total;
    return [subscriptions, totalCount];
  } catch (err) {
    console.error("Error retrieving subscriptions:", err);
    throw err;
  }
};


module.exports = Subscription;