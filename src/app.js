import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Joi from "joi";
import {MongoClient, ObjectId} from 'mongodb';
import dayjs from 'dayjs';
import { stripHtml } from "string-strip-html";

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
    let username = req.body.name;
    if(username)
        username = stripHtml(username).result.trim();
    const {error, value} = (schemaUser.validate({username: username}, {abortEarly: false}));
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
    let user = req.headers.user;
    if(user)
        user = stripHtml(user).result.trim();
    const {error, value} = (schemaMessage.validate(details, {abortEarly: false}));
    if(error)
        return res.sendStatus(422);

    try{
        const resp = await db.collection("participants").findOne({name: user});
        if(!user || !resp)
            return res.sendStatus(422);
        const message = await db.collection('messages').insertOne({
            to: stripHtml(details.to).result.trim(),
            text: stripHtml(details.text).result.trim(),
            type: stripHtml(details.type).result.trim(),
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
    let user = req.headers.user;
    if(user)
        user = stripHtml(user).result.trim();
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

app.post("/status", async (req, res) => {
    let user = req.headers.user;
    if(user)
        user = stripHtml(user).result.trim();
    if(!user)
        return res.sendStatus(404);
    try{
        const resp = await db.collection('participants').findOne({name: user});
        if(!resp)
            return res.sendStatus(404);
        const update = await db.collection('participants').updateOne(
            {name: user},
            {$set: {
                name: user,
                lastStatus: Date.now()
            }},
            {upsert: false}
        );
        res.sendStatus(200);
    }catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
});

app.delete("/messages/:id", async(req, res) => {
    const {id} = req.params;
    let user = req.headers.user;
    if(user)
        user = stripHtml(user).result.trim();
    try {
        const msg = await db.collection('messages').findOne({_id: new ObjectId(id)});
        if(!msg)
            return res.send(404);
        if(msg.from !== user)
            return res.send(401);
        await db.collection('messages').deleteOne(msg);
    } catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
});

app.put("/messages/:id", async(req, res) => {
    const {id} = req.params;
    let user = req.headers.user;
    const details = req.body;
    const {error, value} = (schemaMessage.validate(details, {abortEarly: false}));
    if(error)
        return res.sendStatus(422);
    if(user)
        user = stripHtml(user).result.trim();
    try {
        const resp = await db.collection("participants").findOne({name: user});
        if(!user || !resp)
            return res.sendStatus(422);
        const msg = await db.collection('messages').findOne({_id: new ObjectId(id)});
        if(!msg)
            return res.send(404);
        if(msg.from !== user)
            return res.send(401);
        const updatedMessage = {
            to: stripHtml(details.to).result.trim(),
            text: stripHtml(details.text).result.trim(),
            type: stripHtml(details.type).result.trim(),
            from: user,
        };
        const result = await db.collection("messages").updateOne(
            {_id: new ObjectId(id)},
            {$set: updatedMessage}
        )
    } catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
});




setInterval(() => removeInactiveUsers(), 15000);

async function removeInactiveUsers(){
    try {
        const now = Date.now();
        const participants = await db.collection('participants').find({lastStatus: {$lt: now-10000} }).toArray();
        if (participants.length != 0){            
            await db.collection('participants').deleteMany({lastStatus: {$lt: now-10000} });
            const leaveMessages = participants.map(p =>
                ({
                    from: p.name,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type: 'status',
                    time: dayjs(Date.now()).format('HH:mm:ss')            
                })
            );
            await db.collection('messages').insertMany(leaveMessages);
        }
    } catch(err){
        console.log(err);
    }
}


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));