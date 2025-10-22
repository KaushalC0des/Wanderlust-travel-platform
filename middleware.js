module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // 🧠 Fix: it’s `req.originalUrl` (not `orignalUrl`)
        req.session.redirectUrl = req.originalUrl;

        // Set the flash message
        req.flash("error", "You must be logged in to create a listing!");
        
        // Redirect to login page
        return res.redirect("/login");
    }

    // If logged in, move to next middleware
    next();
};


module.exports.saveRedirectUrl = (req,res,next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};