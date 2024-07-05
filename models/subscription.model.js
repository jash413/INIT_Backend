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
  this.INV_DATE = subscription.INV_DATE;
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
      status: newSubscription.status || 1,
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
  const dateFields = [
    "SUB_STDT",
    "SUB_ENDT",
    "SUB_PDAT",
    "INV_DATE",
    "CREATED_AT",
  ];

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  try {
    let updateFields = [];
    let updateValues = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (dateFields.includes(key) && value !== null) {
          updateFields.push(`${key} = ?`);
          updateValues.push(formatDate(value));
        } else if (key === "LIC_USER") {
          const licUser = parseInt(value, 10);
          if (isNaN(licUser) || licUser < 0 || licUser > 32767) {
            return { error: "Invalid LIC_USER value", statusCode: 400 };
          }
          updateFields.push(`${key} = ?`);
          updateValues.push(licUser);
        } else if (key === "status") {
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

    // Start transaction
    await db.beginTransaction();

    if (updateData.PLA_CODE) {
      const [planDetails] = await db.query(
        "SELECT PLA_MONTH FROM SUB_PLAN WHERE PLA_CODE = ?",
        [updateData.PLA_CODE]
      );
      if (planDetails.length === 0) {
        await db.rollback();
        return { error: "Invalid plan code", statusCode: 400 };
      }
      const planMonths = planDetails[0].PLA_MONTH;
      const startDate = new Date(updateData.SUB_STDT || new Date());
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + planMonths);
      updateFields.push("SUB_ENDT = ?");
      updateValues.push(formatDate(endDate));
    }

    updateValues.push(SUB_CODE);
    const sql = `UPDATE SUB_MAST SET ${updateFields.join(
      ", "
    )} WHERE SUB_CODE = ?`;
    const [result] = await db.query(sql, updateValues);

    if (result.affectedRows === 0) {
      await db.rollback();
      return { error: "Subscription not found", statusCode: 404 };
    }

    // Fetch the updated subscription
    const [updatedSubscription] = await db.query(
      "SELECT * FROM SUB_MAST WHERE SUB_CODE = ?",
      [SUB_CODE]
    );

    // Format date fields in the response
    const formattedSubscription = { ...updatedSubscription[0] };
    for (const field of dateFields) {
      if (formattedSubscription[field]) {
        formattedSubscription[field] = formatDate(formattedSubscription[field]);
      }
    }

    await db.commit();

    console.log("Updated subscription: ", {
      SUB_CODE,
      ...formattedSubscription,
    });
    return { data: formattedSubscription, statusCode: 200 };
  } catch (err) {
    await db.rollback();
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