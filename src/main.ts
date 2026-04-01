import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3000, () => {
  console.log(
    "Server is running on port 3000, open http://localhost:3000 to view it in the browser.",
  );
});
