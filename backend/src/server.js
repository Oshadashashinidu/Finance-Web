require("dotenv").config();
const express = require("express");
const cors = require("cors");
const companyRoutes = require("./routes/companyRoutes");
const rawMaterialRoutes = require("./routes/rawMaterialRoutes");
const stockIntakeRoutes = require("./routes/stockIntakeRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const purchaseRequestRoutes = require("./routes/purchaseRequestRoutes");
const chatRoutes = require("./routes/chatRoutes");
const stockIssueRoutes = require("./routes/stockIssueRoutes");
const fifoRoutes = require("./routes/fifoRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/companies", companyRoutes);
app.use("/api/raw-materials", rawMaterialRoutes);
app.use("/api/stock-intakes", stockIntakeRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase-requests", purchaseRequestRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stock-issues", stockIssueRoutes);
app.use("/api/fifo", fifoRoutes);

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";

  res.status(status).json({
    success: false,
    message
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
