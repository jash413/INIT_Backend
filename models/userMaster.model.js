const db = require("../utils/apiDb");

const UsrMast = function (usrMast) {
  this.GST_CODE = usrMast.GST_CODE;
  this.GST_NMBR = usrMast.GST_NMBR;
  this.USR_ID = usrMast.USR_ID;
  this.USR_PASS = usrMast.USR_PASS;
  this.CLIENT_ID = usrMast.CLIENT_ID;
  this.CLIENT_SECRET = usrMast.CLIENT_SECRET;
  this.USR_ACTV = usrMast.USR_ACTV;
  this.CREATED_ON = usrMast.CREATED_ON;
  this.CREATED_BY = usrMast.CREATED_BY;
  this.MODIFY_ON = usrMast.MODIFY_ON;
  this.MODIFY_BY = usrMast.MODIFY_BY;
  this.is_admin = usrMast.is_admin;
  this.last_login = usrMast.last_login;
  this.sandbox_access = usrMast.sandbox_access;
};

UsrMast.create = async (newUsrMast) => {
  try {
    const [res] = await db.query("INSERT INTO USR_MAST SET ?", newUsrMast);
    return { id: res.insertId, ...newUsrMast };
  } catch (err) {
    console.error("Error creating user:", err);
    throw err;
  }
};

UsrMast.findById = async (id) => {
  try {
    const [result] = await db.query("SELECT * FROM USR_MAST WHERE id = ?", [
      id,
    ]);
    return result.length ? result[0] : null;
  } catch (err) {
    console.error(`Error finding user by id ${id}:`, err);
    throw err;
  }
};

UsrMast.updateById = async (id, usrMast) => {
  try {
    const [res] = await db.query("UPDATE USR_MAST SET ? WHERE id = ?", [
      usrMast,
      id,
    ]);
    if (res.affectedRows == 0) {
      throw new Error("User not found");
    }
    return { id: id, ...usrMast };
  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
};

UsrMast.remove = async (id) => {
  try {
    const [res] = await db.query("DELETE FROM USR_MAST WHERE id = ?", id);
    if (res.affectedRows == 0) {
      throw new Error("User not found");
    }
    console.log("Deleted user with id: ", id);
    return res;
  } catch (err) {
    console.error("Error deleting user:", err);
    throw err;
  }
};

UsrMast.getAll = async () => {
  try {
    const [result] = await db.query("SELECT * FROM USR_MAST");
    return result;
  } catch (err) {
    console.error("Error retrieving users:", err);
    throw err;
  }
};

module.exports = UsrMast;
