const path = require('path');
const express = require('express');
const bodyparser = require('body-parser');
const knex = require('knex');
const multer  = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, "./uploads");
    },
    filename: function(req, file, cb) {
        return cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const db = knex({
    client: 'pg',
    connection: {
        host: 'localhost',
        user: 'postgres',
        port: 5432,
        password: '12345',
        database: 'testing',
        ssl: false
    }
});

const upload = multer({storage});

const app = express();
const port = 8000;

app.set('view engine', 'ejs');
app.set('views', path.resolve("./views"));

app.use(express.urlencoded({extended: false}));

app.get('/', (req, res) => {
    return res.render("homepage");
});

app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    const docname = req.file.filename; 
    const docloc = req.file.path;      

    try {
        await db("data").insert({
            docname: docname,
            docloc: docloc
        });

        console.log(`File saved: ${docname} at ${docloc}`);
        return res.redirect('/');
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).send("Database error.");
    }
});

app.get("/getfile", async (req, res) => {
    try {
        const doc = await db.select('docname', 'docloc').from('data');
        res.json(doc);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Error retrieving documents.");
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});