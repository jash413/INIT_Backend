const db = require('../utils/db.js');
const response =require('../utils/response.js')

const Subscription = function (subscription) {
  this.SUB_CODE = subscription.SUB_CODE;
  this.CUS_CODE = subscription.CUS_CODE;
  this.PLA_CODE = subscription.PLA_CODE;
  this.SUB_STDT = subscription.SUB_STDT;
  this.SUB_ENDT = subscription.SUB_ENDT;
  this.LIC_USER = subscription.LIC_USER;
  this.SUB_ORDN = subscription.SUB_ORDN;
  this.status = subscription.status;
  this.ORD_REQD = subscription.ORD_REQD;
  this.ad_id = subscription.ad_id; // Include ad_id from req.user
};

// Create a new Subscription
Subscription.create = async (newSubscription) => {
  try {
    // Query the database for the highest SUB_CODE
    const [highestCode] = await db.query(
      "SELECT SUB_CODE FROM SUB_MAST ORDER BY SUB_CODE DESC LIMIT 1"
    );
    let nextCode = 1;
    if (highestCode.length > 0) {
      // Extract the numeric part and increment
      const currentMaxNum =
        parseInt(highestCode[0].SUB_CODE.replace("SUB", "")) + 1;
      nextCode = currentMaxNum;
    }
    // Format the new SUB_CODE with leading zeros
    const newSUB_CODE = `SUB${nextCode.toString().padStart(3, "0")}`;

    // Fetch plan details
    const [planDetails] = await db.query(
      "SELECT PLA_MONTH FROM SUB_PLAN WHERE PLA_CODE = ?",
      [newSubscription.PLA_CODE]
    );

    if (planDetails.length === 0) {
      throw new Error("Invalid plan code");
    }

    const planMonths = planDetails[0].PLA_MONTH;

    // Set start date to current date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + planMonths);

    // Prepare the new subscription data
    const subscriptionData = {
      SUB_CODE: newSUB_CODE,
      CUS_CODE: newSubscription.CUS_CODE,
      PLA_CODE: newSubscription.PLA_CODE,
      SUB_STDT: startDate.toISOString().split("T")[0],
      SUB_ENDT: endDate.toISOString().split("T")[0],
      LIC_USER: newSubscription.LIC_USER,
      SUB_ORDN: newSubscription.SUB_ORDN,
      status: newSubscription.status || 1, // Use provided status or default to 1
      ORD_REQD: newSubscription.ORD_REQD,
      ad_id: newSubscription.ad_id
    };

    // Ensure SUB_PDAT is not included
    delete subscriptionData.SUB_PDAT;

    // Insert the new subscription into the database
    const [res] = await db.query(
      "INSERT INTO SUB_MAST SET ?",
      subscriptionData
    );
    console.log("Created subscription: ", {
      id: res.insertId,
      ...subscriptionData,
    });
    return { id: res.insertId, ...subscriptionData };
  } catch (err) {
    console.error("Error creating subscription:", err);
    throw err;
  }
};

// Find Subscription by id
Subscription.findById = async (subId) => {
  try {
    const [subscriptions] = await db.query(
      "SELECT * FROM SUB_MAST WHERE SUB_CODE = ? OR CUS_CODE = ?",
      [subId, subId]
    );

    if (subscriptions.length === 0) {
      throw new Error("Subscription not found");
    }

    // Check if the match is by SUB_CODE
    const subCodeMatch = subscriptions.find((sub) => sub.SUB_CODE === subId);

    // If there's a SUB_CODE match, return it as a single object
    if (subCodeMatch) {
      return subCodeMatch;
    }

    // Otherwise, return the array of subscriptions (matching CUS_CODE)
    return subscriptions;
  } catch (err) {
    console.error("Error retrieving subscriptions:", err);
    throw err;
  }
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
Subscription.remove = async (subId, cusCode) => {
  try {
    // Check if there are any related records in EMP_MAST matching SUB_CODE
    const [empResultBySubCode] = await db.query(
      "SELECT COUNT(*) AS count FROM EMP_MAST WHERE SUB_CODE = ?",
      [subId]
    );

    // Check if there are any related records in EMP_MAST matching CUS_CODE
    const [empResultByCusCode] = await db.query(
      "SELECT COUNT(*) AS count FROM EMP_MAST WHERE CUS_CODE = ?",
      [cusCode]
    );

    if (empResultBySubCode[0].count > 0 || empResultByCusCode[0].count > 0) {
      throw new Error("Cannot delete subscription with associated employees");
    }

    // Delete the subscription from SUB_MAST
    const [result] = await db.query("DELETE FROM SUB_MAST WHERE SUB_CODE = ?", [
      subId,
    ]);

    if (result.affectedRows === 0) {
      throw new Error("Subscription not found");
    }

    return { deletedSubID: subId, affectedRows: result.affectedRows };
  } catch (err) {
    console.error("Error deleting subscription:", err);
    throw err; // Re-throw the error to be handled by the caller
  }
};


// Retrieve all Subscriptions
Subscription.getAll = async (
  limit,
  offset,
  sort,
  order,
  search,
  filter_plan_id,
  filter_start_from,
  filter_start_to
) => {
  try {
    let query = "SELECT * FROM SUB_MAST";
    let countQuery = "SELECT COUNT(*) as total FROM SUB_MAST";
    let params = [];
    let countParams = [];

    // Handle search
    if (search) {
      query +=
        " WHERE CONCAT_WS('', SUB_CODE, CUS_NAME, SUB_PLAN, SUB_STATUS) LIKE ?";
      countQuery +=
        " WHERE CONCAT_WS('', SUB_CODE, CUS_NAME, SUB_PLAN, SUB_STATUS) LIKE ?";
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    // Handle filters
    if (filter_plan_id || filter_start_from || filter_start_to) {
      if (!search) {
        query += " WHERE";
        countQuery += " WHERE";
      } else {
        query += " AND";
        countQuery += " AND";
      }

      const filters = [];
      if (filter_plan_id) {
        filters.push(" plan_id = ?");
        params.push(filter_plan_id);
        countParams.push(filter_plan_id);
      }
      if (filter_start_from) {
        filters.push(" START_DATE >= ?");
        params.push(filter_start_from);
        countParams.push(filter_start_from);
      }
      if (filter_start_to) {
        filters.push(" START_DATE <= ?");
        params.push(filter_start_to);
        countParams.push(filter_start_to);
      }

      query += filters.join(" AND ");
      countQuery += filters.join(" AND ");
    }

    // Handle sorting
    if (
      sort &&
      [
        "SUB_CODE",
        "CUS_NAME",
        "START_DATE",
        "END_DATE",
        "SUB_PLAN",
        "SUB_STATUS",
      ].includes(sort.toUpperCase())
    ) {
      query += ` ORDER BY ${sort} ${
        order.toUpperCase() === "DESC" ? "DESC" : "ASC"
      }`;
    } else {
      query += " ORDER BY SUB_CODE ASC"; // default sorting
    }

    // Handle pagination
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    // Execute queries
    const [subscriptions] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    const totalCount = countResult[0].total;

    return [subscriptions, totalCount];
  } catch (err) {
    console.error("Error retrieving subscriptions:", err);
    throw err;
  }
};



module.exports = Subscription;