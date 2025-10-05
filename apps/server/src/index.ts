import Express from "express";
import cors from "cors";

const app = Express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Working !");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});