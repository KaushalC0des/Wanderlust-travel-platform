// this is for signup form and user authentication

const express = require("express");
const router = express.Router();
const User = require("../model/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl} = require("../middleware.js");

// ================== SIGNUP FORM ==================
router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

// ================== SIGNUP HANDLER ==================
router.post("/signup", wrapAsync(async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        console.log("✅ Registered user:", registeredUser);

        // Automatically log the user in after signup
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to WanderLust!");
            res.redirect("/listings");
        });

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}));

router.get("/login", (req,res) => {
    res.render("users/login.ejs");
});

router.post(
  "/login",
  saveRedirectUrl,  // middleware that stores the redirect URL
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back to WanderLust!");

    // 🧠 Fallback: if no redirect URL, go to listings
    const redirectUrl = res.locals.redirectUrl || "/listings";

    res.redirect(redirectUrl);
  }
);

router.get("/logout", (req,res,next) => {
  req.logout((err) => {
    if(err){
      next(err);
    }
    req.flash("success", "you are logged out");
    res.redirect("/listings");  
  });
})



module.exports = router;
