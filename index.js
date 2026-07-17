import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

import studentRoutes from "./routes/student.routes.js";

const app = express();
app.use(express.json());
const port = 8000;

dotenv.config();

app.use(express.json({limit: "10mb"}));
app.use(express.urlencoded({limit: "10mb", extended: true}))

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("database connected"))
  .catch((error) => console.log(error));



app.use((req, res, next) => {
  console.log(`Incomming ${req.method} Request on URL : ${req.url}`);
  next();
})

app.use("/api/student", studentRoutes);

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(process.env.PORT || port, () =>
  console.log(`app listening on port http://localhost:${process.env.PORT}`),
);
