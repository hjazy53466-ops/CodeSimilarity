import express from "express";
import path from "path"
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import codeRouter from './router/code.router.js'
import studentCode from "./model/student.code.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve()))

// DB
connectDB()

// api
app.use("/api" , codeRouter);


app.get("/",(req,res)=>{
  res.sendFile(path.resolve("index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server is Running on port 🐱 ${PORT}`);
});
