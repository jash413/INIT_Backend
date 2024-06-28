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
    "SELECT * FROM SUB_MAST WHERE sub_id = ?",
    subId,
    (err, res) => {
      if (err) {
        console.error("Error finding subscription by id:", err);
        result(err, null);
        return;
      }
      if (res.length) {
        console.log("Found subscription: ", res[0]);
        result(null, res[0]);
        return;
      }
      result({ message: "Subscription not found" }, null);
    }
  );
};

// Update Subscription by id
Subscription.updateById = (subId, subscription, result) => {
  db.query(
    "UPDATE SUB_MAST SET sub_name = ?, sub_type = ?, sub_price = ?, sub_duration = ? WHERE sub_id = ?",
    [
      subscription.sub_name,
      subscription.sub_type,
      subscription.sub_price,
      subscription.sub_duration,
      subId,
    ],
    (err, res) => {
      if (err) {
        console.error("Error updating subscription:", err);
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ message: "Subscription not found" }, null);
        return;
      }
      console.log("Updated subscription: ", { id: subId, ...subscription });
      result(null, { id: subId, ...subscription });
    }
  );
};

// Delete Subscription by id
Subscription.remove = (subId, result) => {
  db.query(
    "DELETE FROM SUB_MAST WHERE sub_id = ?",
    subId,
    (err, res) => {
      if (err) {
        console.error("Error deleting subscription:", err);
        result(err, null);
        return;
      }
      if (res.affectedRows == 0) {
        result({ message: "Subscription not found" }, null);
        return;
      }
      // console.log("Deleted subscription with id: ", subId);
      result(null, res);
    }
  );
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

Subscription.GetPlan = async () => {
  console.log("GetPlan function called");
  try {
    console.log("Executing database query");
    const subscriptions = await db.query("SELECT * FROM SUB_PLAN");
    console.log("Query executed, retrieved subscriptions:", subscriptions);
    return subscriptions;
  } catch (err) {
    console.error("Error retrieving subscriptions:", err);
    throw err;
  }
};

module.exports = Subscription;