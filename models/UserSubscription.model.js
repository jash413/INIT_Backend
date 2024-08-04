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

USRSubs.getAll = async () => {
  try {
    const [result] = await db.query("SELECT * FROM USR_SUBS");
    return result;
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
