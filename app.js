const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// Parse requests of content-type: application/json
app.use(bodyParser.json());

// Parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const adminRoutes = require("./routes/admin.routes");
const customerRoutes = require("./routes/customer.routes");
const employeeRoutes = require("./routes/employee.routes");
const subscriptionRoutes = require("./routes/subscription.routes");

// Use routes
app.use("/api/admins", adminRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to your application." });
});

// Set port, listen for requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
