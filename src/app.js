import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Joi from "joi";
import {MongoClient} from 'mongodb';
import dayjs from 'dayjs';


const PORT = 5000;
const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const schema = Joi.object({
    username: Joi.string()
        .required()
        .min(1),
})

const mongoClient = new MongoClient(process.env.DATABASE_URL);
try {
  await mongoClient.connect()
} catch (err) {
  console.log(err.message)
}
const db = mongoClient.db();


app.post("/participants", async (req, res) => {
    const username = req.body.name;
    const {error, value} = (schema.validate({username: username}));
    if(error)
        res.sendStatus(422);
    try{
        const resp = await db.collection('participants').findOne({name: username});
        if(resp)
            return res.sendStatus(409);
        const time  = Date.now();
        const user = await db.collection('participants').insertOne({
            name: username,
            lastStatus: time
        });
        const message = await db.collection("messages").insertOne({
            from: username,
            to: "Todos",
            text: 'entra na sala...',
            type: 'entra na sala...',
            time: dayjs(time).format('HH:mm:ss')
        });
        res.sendStatus(201);
    }catch(err){
        console.log(err.message);
        res.sendStatus(500);
    }
});

app.get("/participants", async (req, res) => {
    try{
        const participants = await db.collection('participants').find().toArray();
        return res.send(participants);
    }catch(err){
        console.log(err);
        res.sendStatus(500);
    }
});

app.post("/messages", (req, res) => {
    
});

app.get("/messages", (req, res) => {

});

app.post("/status", (req, res) => {
    
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));