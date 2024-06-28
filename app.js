const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

// Use the CORS middleware without any configuration to allow all origins
app.use(cors());

// Handling preflight requests
app.options('*', cors());

// Parse requests of content-type: application/json
app.use(bodyParser.json());

// Parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const adminRoutes = require("./routes/admin.routes");
const customerRoutes = require("./routes/customer.routes");
const employeeRoutes = require("./routes/employee.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const subplanroutes = require("./routes/subplan.routes");

// Use routes
app.use("/api/admins", adminRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/sub-plans", subplanroutes);

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to your application." });
});

// Set port, listen for requests
const PORT = process.env.PORT || 3000;
app.listen(PORT,"0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}.`);
});
