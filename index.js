const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const app = express();
const port = 5000;
const db = mysql.createPool({
    connectionLimit: 10,
    host: "mysql",
    port: "3306",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.enable('trust proxy');
app.use(cors({
    origin: [process.env.ORIGIN],
    methods: ["GET","POST", "DELETE", "PUT"],
    credentials: true
}));
app.use(cookieParser());
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(session({
    key: "session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.ENVIRONMENT!=="dev",
        maxAge: 1000 * 60 * 60 * 24 //1000 = 1 seconde
    }
}));

app.listen(port, () => console.log(`Listen on port ${port}`));