const Listing  = require("./model/listing");
const Review = require("./model/review")

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

module.exports.isOwner = async(req,res,next) => {
  const { id } = req.params;
    let listing = await Listing.findById(id);

    if (!listing.owner._id.equals(res.locals.currUser._id)) {
      req.flash("error", "You are not the owner of the listing");
      return res.redirect(`/listings/${id}`); // ✅ stop execution here
    }
    next(); // its is all the mandatory to call next() in the middlewares
};

module.exports.isReviewAuthor = async(req,res,next) => {
    const { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);

    if (!review.authors.equals(res.locals.currUser._id)) {
      req.flash("error", "You are not the author of this review");
      return res.redirect(`/listings/${id}`); // ✅ stop execution here
    }
    next(); // its is all the mandatory to call next() in the middlewares
};