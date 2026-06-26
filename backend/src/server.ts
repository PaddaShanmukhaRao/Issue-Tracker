import express, { json } from "express";
import cors from "cors";
import { pool } from "./db/database.js";

const app = express();

app.use(cors());
app.use(json());

async function connectDB() {
    try {
        const client = await pool.connect();

        console.log("Connected to PostgreSQL");

        client.release();
    } catch (err) {
        console.error(err);
    }
}

connectDB();

app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            `INSERT INTO users(email, password)
             VALUES($1, $2)
             RETURNING *`,
            [email, password]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Database Error",
        });
    }
});



app.listen(3000, () => {
    console.log("Server running on port 3000");
});