const express = require('express');
const redis=require('redis')
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const mailer=require('./routes/mailer')
const Saved=require('./controllers/savingControl')
const usercontrol=require('./controllers/usercontrol')
const propControl=require('./controllers/propertycontrol')
const auth=require('./routes/auth')
const sellerControl=require('./controllers/sellerControl')

const client = redis.createClient();
// client.connect().then(() => {
//   console.log("Connected to Redis");
// }).catch((err) => {
//   console.error("Error connecting to Redis:", err);
// });


app.use(bodyParser.json({ limit: '50mb' })); // Increase this value as per your need
app.use(cookieParser())
app.use(cors(
    {
        origin: 'http://localhost:3001',
        credentials: true
    }
));
app.use('/save',Saved)
app.use(auth)
app.use(usercontrol)
app.use(propControl)
app.use(sellerControl)
app.use(mailer)
app.post("/store-lookUp", async (req, res) => {
    const lookUp = req.body.lookUp;
    console.log("lookUp")
console.log("Storing lookUp", lookUp);
  const lookUpArray = [...lookUp];
await client.set("lookUp", JSON.stringify(lookUp));
res.send("lookUp stored in Redis");
  }
);
  
app.get("/get-lookUp", async (req, res) => {
    try {
        const data = await client.get('lookUp');
        if (data) {
            return res.json(JSON.parse(data));
        } else {
            return res.status(404).send("Data not found");
        }
    } catch (err) {
        console.error("Error retrieving data from Redis:", err);
        res.status(500).send("Error retrieving data");
    }
});
  

app.listen(3000, () => {
    console.log("Listening on port 3000");
});

mongoose.connect(process.env.uri).then(() => {
    console.log("Connected to database");
}).catch((error) => {
    console.log(error);
});

