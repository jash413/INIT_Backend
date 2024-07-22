const db = require("../utils/db.js");
const response = require("../utils/response.js");

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
  this.INV_DATE = subscription.INV_DATE;
  this.ad_id = subscription.ad_id; // Include ad_id from req.user
};

// Create a new Subscription
Subscription.create = async (newSubscription) => {
  try {
    // Convert all string values in newSubscription to uppercase
    for (const key in newSubscription) {
      if (
        typeof newSubscription[key] === "string" &&
        newSubscription[key].constructor === String
      ) {
        newSubscription[key] = newSubscription[key].toUpperCase();
      }
    }

    // Query the database for the highest SUB_CODE
    const [highestCode] = await db.query(
      "SELECT SUB_CODE FROM SUB_MAST ORDER BY SUB_CODE DESC LIMIT 1"
    );
    let nextCode = 1;
    if (highestCode.length > 0) {
      const currentMaxNum =
        parseInt(highestCode[0].SUB_CODE.replace("SUB", "")) + 1;
      nextCode = currentMaxNum;
    }
    const newSUB_CODE = `SUB${nextCode.toString().padStart(3, "0")}`;

    // Check for SUB_STDT
    if (!newSubscription.SUB_STDT) {
      return response.badRequest("Subscription start date is required");
    }

    // Fetch plan details
    const [planDetails] = await db.query(
      "SELECT PLA_MONTH FROM SUB_PLAN WHERE PLA_CODE = ?",
      [newSubscription.PLA_CODE]
    );
    if (planDetails.length === 0) {
      return response.notFound("Invalid plan code");
    }
    const planMonths = planDetails[0].PLA_MONTH;

    const startDate = new Date(newSubscription.SUB_STDT);
    if (isNaN(startDate.getTime())) {
      return response.badRequest("Invalid start date format");
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + planMonths);

    const subscriptionData = {
      SUB_CODE: newSUB_CODE,
      CUS_CODE: newSubscription.CUS_CODE,
      PLA_CODE: newSubscription.PLA_CODE,
      SUB_STDT: newSubscription.SUB_STDT, // Already in YYYY-MM-DD format
      SUB_ENDT: endDate.toISOString().split("T")[0],
      LIC_USER: newSubscription.LIC_USER,
      SUB_ORDN: newSubscription.SUB_ORDN,
      status: newSubscription.status || 0,
      ORD_REQD: newSubscription.ORD_REQD,
      ad_id: newSubscription.ad_id,
      INV_DATE: newSubscription.INV_DATE,
    };

    const [res] = await db.query(
      "INSERT INTO SUB_MAST SET ?",
      subscriptionData
    );
    console.log("Created subscription: ", {
      id: res.insertId,
      ...subscriptionData,
    });
    return response.success("Subscription created successfully", {
      id: res.insertId,
      ...subscriptionData,
    });
  } catch (err) {
    console.error("Error creating subscription:", err);
    return response.error("An error occurred while creating the subscription");
  }
};

// Find Subscription by id
Subscription.findById = async (subId) => {
  try {
    // Convert subId to uppercase
    subId = subId.toUpperCase();

    const [subscriptions] = await db.query(
      "SELECT * FROM SUB_MAST WHERE SUB_CODE = ? OR CUS_CODE = ?",
      [subId, subId]
    );

    if (subscriptions.length === 0) {
      throw new Error("Subscription not found");
    }

    // Convert all string fields in the subscriptions data to uppercase
    for (const subscription of subscriptions) {
      for (const key in subscription) {
        if (
          typeof subscription[key] === "string" &&
          subscription[key].constructor === String
        ) {
          subscription[key] = subscription[key].toUpperCase();
        }
      }
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
            return { error: `Invalid ${key} format`, statusCode: 400 };
          }
          updateFields.push(`${key} = ?`);
          updateValues.push(date.toISOString().split("T")[0]); // Format as YYYY-MM-DD
        } else if (key === "LIC_USER") {
          // Ensure LIC_USER is a smallint
          const licUser = parseInt(value, 10);
          if (isNaN(licUser) || licUser < 0 || licUser > 32767) {
            return { error: "Invalid LIC_USER value", statusCode: 400 };
          }
          updateFields.push(`${key} = ?`);
          updateValues.push(licUser);
        } else if (key === "status") {
          // Ensure status is 0 or 1
          const status = parseInt(value, 10);
          if (status !== 0 && status !== 1) {
            return { error: "Invalid status value", statusCode: 400 };
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
      return { error: "No valid fields to update", statusCode: 400 };
    }

    // Handle plan code and calculate end date
    if (updateData.PLA_CODE) {
      const [planDetails] = await db.query(
        "SELECT PLA_MONTH FROM SUB_PLAN WHERE PLA_CODE = ?",
        [updateData.PLA_CODE]
      );

      if (planDetails.length === 0) {
        return { error: "Invalid plan code", statusCode: 400 };
      }

      const planMonths = planDetails[0]["PLA_MONTH"]; // Corrected syntax
      const startDate = new Date(updateData.SUB_STDT || new Date());
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + planMonths);

      updateFields.push("SUB_ENDT = ?");
      updateValues.push(endDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    }

    updateValues.push(SUB_CODE);

    const sql = `UPDATE SUB_MAST SET ${updateFields.join(
      ", "
    )} WHERE SUB_CODE = ?`;
    const [result] = await db.query(sql, updateValues);

    if (result.affectedRows === 0) {
      return { error: "Subscription not found", statusCode: 404 };
    }

    // Fetch the updated subscription
    const [updatedSubscription] = await db.query(
      "SELECT * FROM SUB_MAST WHERE SUB_CODE = ?",
      [SUB_CODE]
    );

    console.log("Updated subscription: ", { SUB_CODE, ...updateData });
    return { data: updatedSubscription, statusCode: 200 };
  } catch (err) {
    console.error("Error updating subscription:", err);
    return {
      error: `Error updating Subscription: ${err.message}`,
      statusCode: 500,
    };
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
      return {
        success: false,
        message: "Cannot delete subscription with associated employees",
      };
    }
    // Delete the subscription from SUB_MAST
    const [result] = await db.query("DELETE FROM SUB_MAST WHERE SUB_CODE = ?", [
      subId,
    ]);
    if (result.affectedRows === 0) {
      return { success: false, message: "Subscription not found" };
    }
    return {
      success: true,
      deletedSubID: subId,
      affectedRows: result.affectedRows,
    };
  } catch (err) {
    console.error("Error deleting subscription:", err);
    throw err;
  }
};

// Retrieve all Subscriptions
Subscription.getAll = async (
  limit,
  offset,
  sort,
  order,
  search,
  filter_ad_id,
  filter_from,
  filter_to
) => {
  try {
    let query = "SELECT * FROM SUB_MAST";
    let countQuery = "SELECT COUNT(*) as total FROM SUB_MAST";
    let params = [];
    let countParams = [];

    // Handle search
    if (search) {
      query +=
        " WHERE CONCAT_WS('', SUB_CODE, CUS_CODE, PLA_CODE, SUB_ORDN) LIKE ?";
      countQuery +=
        " WHERE CONCAT_WS('', SUB_CODE, CUS_CODE, PLA_CODE, SUB_ORDN) LIKE ?";
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    // Handle filters
    if (filter_ad_id || filter_from || filter_to) {
      if (!search) {
        query += " WHERE";
        countQuery += " WHERE";
      } else {
        query += " AND";
        countQuery += " AND";
      }
      const filters = [];
      if (filter_ad_id) {
        filters.push(" ad_id = ?");
        params.push(filter_ad_id);
        countParams.push(filter_ad_id);
      }
      if (filter_from) {
        filters.push(" CREATED_AT >= ?");
        params.push(filter_from);
        countParams.push(filter_from);
      }
      if (filter_to) {
        filters.push(" CREATED_AT <= ?");
        params.push(`${filter_to} 23:59:59`);
        countParams.push(`${filter_to} 23:59:59`);
      }
      query += filters.join(" AND ");
      countQuery += filters.join(" AND ");
    }

    // Handle sorting
    if (
      sort &&
      [
        "SUB_CODE",
        "CUS_CODE",
        "PLA_CODE",
        "SUB_STDT",
        "SUB_ENDT",
        "SUB_PDAT",
        "SUB_ORDN",
        "status",
      ].includes(sort.toUpperCase())
    ) {
      query += ` ORDER BY ${sort} ${
        order.toUpperCase() === "DESC" ? "DESC" : "ASC"
      }`;
    } else {
      query += " ORDER BY CREATED_AT DESC"; // default sorting
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

Subscription.getCount = async (
  search,
  filter_customer_id,
  filter_from,
  filter_to
) => {
  const query = `
    SELECT COUNT(*) AS totalCount
    FROM SUB_MAST
    WHERE 1=1
      ${search ? "AND subscription_name LIKE ?" : ""}
      ${filter_customer_id ? "AND customer_id = ?" : ""}
      ${filter_from ? "AND created_at >= ?" : ""}
      ${filter_to ? "AND created_at <= ?" : ""}
  `;
  const values = [
    ...(search ? [`%${search}%`] : []),
    ...(filter_customer_id ? [filter_customer_id] : []),
    ...(filter_from ? [filter_from] : []),
    ...(filter_to ? [filter_to] : []),
  ];
  console.log(query);
  try {
    const [rows] = await db.query(query, values);
    console.log(rows);
    return rows;
  } catch (err) {
    console.error("Error in getCount:", err);
    throw new Error("Unable to get count");
  }
};

module.exports = Subscription;
