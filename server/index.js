const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any lovable.app subdomain
    if (origin.endsWith(".lovable.app") || origin.endsWith(".lovableproject.com")) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

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
app.use("/purchases", require("./routes/purchases"));

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
