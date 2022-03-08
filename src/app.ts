import dotenv from "dotenv";
dotenv.config();

import express, { ErrorRequestHandler } from "express";
import sequelize from "./sequelize";
import cors from "cors";

import authRouter from "./routes/auth.route";
import dishesRouter from "./routes/dish.route";
import menusRouter from "./routes/menu.route";
import reservationsRouter from "./routes/reservation.route";
import usersRouter from "./routes/user.route";

const app = express();

const corsOptions = {
    origin: "http://localhost:3000"
};

app.use(cors(corsOptions));

// test if the connection to the database is OK
(async () => {
    try {
        await sequelize.authenticate();
        console.log("Connection to the database has been established successfully.");
    }
    catch (error) {
        console.error("Unable to connect to the database:", error);
    }
})();

const port = +process.env.PORT! || 3000;

// parse incoming requests with JSON payloads
app.use(express.json());

// routing
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/dishes", dishesRouter);
app.use("/api/v1/menus", menusRouter);
app.use("/api/v1/reservations", reservationsRouter);
app.use("/api/v1/users", usersRouter);

// error handling
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    res.status(err.status || 500).json({
        error: err.message || "Something failed!"
    });
};
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Resht API listening at http://localhost:${port}`);
});