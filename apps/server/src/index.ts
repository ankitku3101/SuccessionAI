import Express = require("express");
import cors = require("cors");

const app = Express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Working !");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});