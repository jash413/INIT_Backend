const db = require("../utils/apiDb");

const GstRegistration = function (gstRegistration) {
  this.REG_CODE = gstRegistration.REG_CODE;
  this.CUS_NAME = gstRegistration.CUS_NAME;
  this.CUS_ADDR = gstRegistration.CUS_ADDR;
  this.CMP_NAME = gstRegistration.CMP_NAME;
  this.notification_date = gstRegistration.notification_date;
};

GstRegistration.create = async (newGstRegistration) => {
  try {
    const [res] = await db.query(
      "INSERT INTO gst_registration SET ?",
      newGstRegistration
    );
    return { id: res.insertId, ...newGstRegistration };
  } catch (err) {
    console.error("Error creating GST registration:", err);
    throw err;
  }
};

GstRegistration.findById = async (id) => {
  try {
    const [result] = await db.query(
      "SELECT * FROM gst_registration WHERE id = ?",
      [id]
    );
    return result.length ? result[0] : null;
  } catch (err) {
    console.error(`Error finding GST registration by id ${id}:`, err);
    throw err;
  }
};

GstRegistration.updateById = async (id, gstRegistration) => {
  try {
    const [res] = await db.query("UPDATE gst_registration SET ? WHERE id = ?", [
      gstRegistration,
      id,
    ]);
    if (res.affectedRows == 0) {
      throw new Error("GST registration not found");
    }
    return { id: id, ...gstRegistration };
  } catch (err) {
    console.error("Error updating GST registration:", err);
    throw err;
  }
};

GstRegistration.remove = async (id) => {
  try {
    const [res] = await db.query(
      "DELETE FROM gst_registration WHERE id = ?",
      id
    );
    if (res.affectedRows == 0) {
      throw new Error("GST registration not found");
    }
    console.log("Deleted GST registration with id: ", id);
    return res;
  } catch (err) {
    console.error("Error deleting GST registration:", err);
    throw err;
  }
};

GstRegistration.getAll = async () => {
  try {
    const [result] = await db.query("SELECT * FROM gst_registration");
    return result;
  } catch (err) {
    console.error("Error retrieving GST registrations:", err);
    throw err;
  }
};

module.exports = GstRegistration;
