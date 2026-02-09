const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/pricing", require("./routes/pricing"));
app.use("/settings", require("./routes/settings"));
app.use("/customers", require("./routes/customers"));
app.use("/invoices", require("./routes/invoices"));



app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
