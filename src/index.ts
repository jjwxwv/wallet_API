import express from "express";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { adminRouter } from "./routes/adminRoute";
import { walletRouter } from "./routes/walletRoute";

dotenv.config();

const app = express();
const cors = require("cors");

export const appDataSource = new DataSource({
  type: "mariadb",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: "walletapi01",
  entities: ["src/entities/*.ts"],
  synchronize: true,
  ssl: true,
});
appDataSource
  .initialize()
  .then(() => {
    console.log("Connected to MariaDB");
  })
  .catch((error) => {
    console.error(error);
    throw new Error("Unable to connect to MariaDB");
  });
app.use(cors());
app.use(express.json());

//Routes
app.use("/admin", adminRouter);
app.use("/wallet", walletRouter);

app.listen(8080, () => {
  console.log("Now running on port 8080");
});
