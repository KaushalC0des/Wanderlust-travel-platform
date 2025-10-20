const express = require("express");
const app = express();
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(flash());

const sessionOptions = {
    secret: "mysupersecretstring",
    resave: false,
    saveUnintialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
    },
};

app.use(session(sessionOptions));

app.get("/register", (req,res) => {
    let { name="anonymous"} = req.query;
    req.session.name = name;
    req.flash("success", "user registered successfully");
    console.log(req.session.name);
    res.redirect("/hello");
});

app.get("/hello", (req,res) => {
    res.render("page.ejs", {name: req.session.name});
});

app.listen(3000, () => {
    console.log("server is listening to port");
});