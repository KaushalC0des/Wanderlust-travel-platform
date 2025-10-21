const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./model/listing.js");
const Review = require("./model/review.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const session = require("express-session")
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./model/user.js")

const userRouter = require("./routes/user.js")
const {isLoggedIn} = require("./middleware.js");


// ================== DATABASE CONNECTION ==================
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderLust";

async function main() {
  await mongoose.connect(MONGO_URL);
}
main()
  .then(() => {
    console.log("✅ Connected to DB");
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err);
  });

// ================== APP SETUP ==================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// Root
app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

// cookies
const sessionOptions = {
    secret: "mysupersecretstring",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
})

app.use("/", userRouter);

// ================== ROUTES ==================


const validateListing = (req,res,next) => {
  let { error } = listingSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400,errMsg);
  } else {
    next();
  }
};

const validateReview = (req,res,next) => {
  let { error } = reviewSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400,errMsg);
  } else {
    next();
  }
};

// Index Route - Show all listings
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const listings = await Listing.find({});
    res.render("listings/index.ejs", { listings });
  })
);

// New Route - Show form to create new listing
app.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

// Show Route - Show details of one listing (with reviews populated)
app.get(
  "/listings/:id", isLoggedIn,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if (!listing) {
      req.flash("error", "listing you requested for does not exist");
      res.redirect("/listings");
      // throw new ExpressError(404, "Listing Not Found!");
    }
    res.render("listings/show.ejs", { listing });
  })
);

// Create Route - Add new listing to DB
app.post(
  "/listings", isLoggedIn,
  wrapAsync(async (req, res) => {
    let result = listingSchema.validate(req.body);
    console.log(result);

    if (result.error) {
      throw new ExpressError(400, result.error);
    }

    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  })
);

// Edit Route - Show form to edit listing
app.get(
  "/listings/:id/edit", isLoggedIn,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      throw new ExpressError(404, "Listing Not Found!");
    }
    res.render("listings/edit.ejs", { listing });
  })
);

// Update Route - Update listing in DB
app.put(
  "/listings/:id", isLoggedIn,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { new: true, runValidators: true }
    );
    res.redirect(`/listings/${id}`);
  })
);

// Delete Route - Delete a listing
app.delete(
  "/listings/:id", isLoggedIn,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
  })
);

// ================== REVIEWS ROUTE ==================
app.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res) => {
  console.log("➡️ Incoming review request:", req.body);

  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new ExpressError(404, "Listing Not Found!");
  }

  const newReview = new Review(req.body.review);
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  console.log("✅ Review saved & linked to listing");
  res.redirect(`/listings/${listing._id}`);
}));

// Delete Review Route
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
  const { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  res.redirect(`/listings/${id}`);
}));


app.get("/flash-test", (req, res) => {
  req.flash("success", "Flash is working perfectly!");
  res.redirect("/show-flash");
});

app.get("/show-flash", (req, res) => {
  res.render("test.ejs"); // create this file inside views/
});




// ================== ERROR HANDLING ==================

// 404 handler (for unmatched routes)
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// General error handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// ================== SERVER LISTEN ==================
app.listen(8080, () => {
  console.log("🚀 Server is running on http://localhost:8080");
});
