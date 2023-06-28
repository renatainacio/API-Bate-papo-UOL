import express from "express";
import cors from "cors";
import dotenv from "dotenv";


const PORT = 5000;
const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;
mongoClient.connect()
  .then(() => db = mongoClient.db())
  .catch((err) =>  console.log(err.message));

app.post("/participants", (req, res) => {
    username = req.body.name;
});

app.get("/participants", (req, res) => {

});

app.post("/messages", (req, res) => {
    
});

app.get("/messages", (req, res) => {

});

app.post("/status", (req, res) => {
    
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));