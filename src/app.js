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

const schemaUser = Joi.object({
    username: Joi.string()
        .required()
        .min(1),
});

const schemaMessage = Joi.object({
    to: Joi.string()
        .required()
        .min(1),
    text: Joi.string()
        .required()
        .min(1),
    type: Joi.string().valid('message', 'private_message').required()
});

const mongoClient = new MongoClient(process.env.DATABASE_URL);
try {
  await mongoClient.connect()
} catch (err) {
  console.log(err.message)
}
const db = mongoClient.db();


app.post("/participants", async (req, res) => {
    const username = req.body.name;
    const {error, value} = (schemaUser.validate({username: username}));
    if(error)
        return res.sendStatus(422);
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
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs(time).format('HH:mm:ss')
        });
        return res.sendStatus(201);
    }catch(err){
        console.log(err.message);
        return res.sendStatus(500);
    }
});

app.get("/participants", async (req, res) => {
    try{
        const participants = await db.collection('participants').find().toArray();
        return res.send(participants);
    }catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
});

app.post("/messages", async (req, res) => {
    const details = req.body;
    const user = req.headers.user;

    const {error, value} = (schemaMessage.validate(details));
    if(error)
        return res.sendStatus(422);

    try{
        const resp = await db.collection("participants").findOne({name: user});
        if(!user || !resp)
            return res.sendStatus(422);
        const message = db.collection('messages').insertOne({
            to: details.to,
            text: details.text,
            type: details.type,
            from: user,
            time: dayjs(Date.now()).format('HH:mm:ss')
        });
        return res.sendStatus(201);
    }catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
});

app.get("/messages", async (req, res) => {
    const {user} = req.headers;
    const {limit} = req.query;
    try{
        const messages = await db.collection('messages').find({$or: [{to: user}, {from: user}, {type: "message"}, {type: "status"}]}).toArray();
        if(limit) {
            if(isNaN(limit) || Number(limit) <= 0)
                return res.sendStatus(422);
            return res.send(messages.slice(-limit));
        }
        return res.send(messages);
    }catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
});

app.post("/status", (req, res) => {
    
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));