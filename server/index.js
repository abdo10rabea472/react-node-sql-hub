const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/pricing", require("./routes/pricing"));
app.use("/settings", require("./routes/settings"));
app.use("/customers", require("./routes/customers"));
app.use("/invoices", require("./routes/invoices"));
app.use("/wedding-pricing", require("./routes/weddingPricing"));
app.use("/wedding-invoices", require("./routes/weddingInvoices"));
app.use("/whatsapp", require("./routes/whatsapp"));

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
