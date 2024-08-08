const db = require("../utils/apiDb");
const { error } = require("../utils/response");

const USRSubs = function (usrSubs) {
  this.GST_CODE = usrSubs.GST_CODE;
  this.GST_NMBR = usrSubs.GST_NMBR;
  this.SYSTEM_ID = usrSubs.SYSTEM_ID;
  this.SUBSCRIPTION_ID = usrSubs.SUBSCRIPTION_ID;
  this.SUBSCRIPTION_DATE = usrSubs.SUBSCRIPTION_DATE;
  this.ALLOTED_CALLS = usrSubs.ALLOTED_CALLS;
  this.USED_CALLS = usrSubs.USED_CALLS;
  this.PENDING_CALLS = usrSubs.PENDING_CALLS;
  this.is_active = usrSubs.is_active;
  this.created_by = usrSubs.created_by;
  this.created_on = usrSubs.created_on;
  this.user_id = usrSubs.user_id;
  this.expiry_date = usrSubs.expiry_date;
  this.INV_DATE = usrSubs.INV_DATE;
  this.INV_NO = usrSubs.INV_NO;
  this.IS_VERIFIED = usrSubs.IS_VERIFIED;
};

USRSubs.create = async (newUSRSubs) => {
  try {
    const [res] = await db.query("INSERT INTO USR_SUBS SET ?", newUSRSubs);
    return { id: res.insertId, ...newUSRSubs };
  } catch (err) {
    console.error("Error creating user subscription:", err);
    throw err;
  }
};

USRSubs.findById = async (id) => {
  try {
    const [result] = await db.query("SELECT * FROM USR_SUBS WHERE id = ?", [
      id,
    ]);
    return result.length ? result[0] : null;
  } catch (err) {
    console.error(`Error finding user subscription by ID ${id}:`, err);
    throw err;
  }
};

USRSubs.getAll = async (
  limit,
  offset,
  sort,
  order,
  search,
  filter_user_id,
  filter_from,
  filter_to
) => {
  try {
    let query = "SELECT * FROM USR_SUBS";
    let countQuery = "SELECT COUNT(*) as total FROM USR_SUBS";
    let params = [];
    let countParams = [];
    const conditions = [];

    if (search) {
      const searchCondition =
        "CONCAT_WS('', GST_CODE, GST_NMBR, SYSTEM_ID, SUBSCRIPTION_ID,created_by) LIKE ?";
      conditions.push(searchCondition);
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    if (filter_user_id) {
      conditions.push("user_id = ?");
      params.push(filter_user_id);
      countParams.push(filter_user_id);
    }

    if (filter_from) {
      conditions.push("created_on >= ?");
      params.push(filter_from);
      countParams.push(filter_from);
    }

    if (filter_to) {
      conditions.push("created_on <= ?");
      params.push(`${filter_to} 23:59:59`);
      countParams.push(`${filter_to} 23:59:59`);
    }

    if (conditions.length > 0) {
      const conditionString = conditions.join(" AND ");
      query += ` WHERE ${conditionString}`;
      countQuery += ` WHERE ${conditionString}`;
    }

    const validSortFields = [
      "GST_CODE",
      "SYSTEM_ID",
      "SUBSCRIPTION_ID",
      "SUBSCRIPTION_DATE",
      "ALLOTED_CALLS",
      "USED_CALLS",
      "PENDING_CALLS",
      "is_active",
      "created_on",
      "expiry_date",
      "ID"
    ];

    if (sort && validSortFields.includes(sort.toUpperCase())) {
      query += ` ORDER BY ${sort.toUpperCase()} ${
        order.toUpperCase() === "DESC" ? "DESC" : "ASC"
      }`;
    } else {
      query += " ORDER BY created_on DESC";
    }

    const [countResult] = await db.query(countQuery, countParams);
    const totalCount = countResult[0].total;

    if (limit === 0) {
      limit = totalCount;
    }

    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [usrSubs] = await db.query(query, params);

    // Convert Buffer objects to integer values for the is_active field
    const formattedUsrSubs = usrSubs.map((row) => ({
      ...row,
      is_active: row.is_active[0],
    }));

    return [formattedUsrSubs, totalCount];
  } catch (err) {
    console.error("Error retrieving user subscriptions:", err);
    throw err;
  }
};


USRSubs.updateById = async (id, usrSubs) => {
  try {
    const [res] = await db.query("UPDATE USR_SUBS SET ? WHERE id = ?", [
      usrSubs,
      id,
    ]);
    if (res.affectedRows == 0) {
      throw new Error("User subscription not found");
    }
    return { id, ...usrSubs };
  } catch (err) {
    console.error("Error updating user subscription:", err.message, err.stack);
    throw err;
  }
};

USRSubs.getNextSubscriptionId = async () => {
  try {
    const [result] = await db.query(
      "SELECT MAX(SUBSCRIPTION_ID) as maxId FROM USR_SUBS"
    );
    const maxId = result[0].maxId || 0;
    return maxId + 1;
  } catch (err) {
    console.error("Error getting next subscription ID:", err);
    throw err;
  }
};


USRSubs.remove = async (id) => {
  try {
    const [res] = await db.query("DELETE FROM USR_SUBS WHERE id = ?", id);
    if (res.affectedRows == 0) {
      throw new Error("User subscription not found");
    }
    return res;
  } catch (err) {
    console.error("Error deleting user subscription:", err);
    throw err;
  }
};

module.exports = USRSubs;
