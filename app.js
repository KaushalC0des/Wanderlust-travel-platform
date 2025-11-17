if(process.env.NODE_Env != "production"){
  require("dotenv").config();
}

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
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./model/user.js");
const multer = require("multer");
const {storage} = require("./cloudConfig.js")
const upload = multer({storage});



const userRouter = require("./routes/user.js")
const {isLoggedIn, isOwner, isReviewAuthor} = require("./middleware.js");


// ================== DATABASE CONNECTION ==================
 //const MONGO_URL = "mongodb://127.0.0.1:27017/wanderLust";

const dbUrl = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(dbUrl);
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

app.use((req, res, next) => {
  console.log("🛰️ Method:", req.method, "URL:", req.url);
  next();
});


// Root
// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });

// cookies


const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24*3600,
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

store.on("error",() => {
  console.log("Error in mongo session store",err);
});

// const store = MongoStore.create({
//   mongoUrl: dbUrl,
//   crypto: {
//     secret: "mysupersecretstring",
//   },
//   touchAfter: 24*3600,
// });

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
  res.locals.currUser = req.user;
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

// Show Route - Show details of one listing (with reviews and author populated)
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" }, // 👈 populate the review author
      })
      .populate("owner"); // also populate listing owner

    if (!listing) {
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  })
);


// Create Route - Add new listing to DB
app.post(
  "/listings",
  isLoggedIn,
  upload.single("listing[image]"),
  wrapAsync(async (req, res) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
      const errMsg = error.details.map((el) => el.message).join(",");
      throw new ExpressError(400, errMsg);
    }

    // Safe file handling
    let url, filename;
    if (req.file) {
      url = req.file.path;
      filename = req.file.filename;
    } else {
      url = "https://placehold.co/600x400/gray/white/png?text=No+Image";
      filename = "default";
    }

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    await newListing.save();
    req.flash("success", "New listing created successfully!");
    console.log("File uploaded:", req.file);
    res.redirect(`/listings/${newListing._id}`);
  })
);



// app.post("/listings", upload.single("listing[image]"), (req, res) => {
//   console.log("🧾 Form data:", req.body);
//   console.log("🖼️ File info:", req.file);
//   res.send({
//     body: req.body,
//     file: req.file
//   });
// });


// Edit Route - Show form to edit listing
app.get(
  "/listings/:id/edit", 
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing Not Found!");
      return res.redirect("/listings");
    }

    let orignalImageUrl = listing.image.url;
    orignalImageUrl = orignalImageUrl.replace("/upload", "/upload/,w_250");
    res.render("listings/edit.ejs", { listing, orignalImageUrl });
  })
);

// Update Route - Update listing in DB
app.put(
  "/listings/:id", 
  isLoggedIn,
  isOwner,
  upload.single("listing[image]"),
  validateListing,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
    // Safe file handling
    let url, filename;
    if (req.file) {
      url = req.file.path;
      filename = req.file.filename;
      listing.image = {url,filename};
    } else {
      url = "https://placehold.co/600x400/gray/white/png?text=No+Image";
      filename = "default";
    }
    await listing.save();
    req.flash("success", "Listing updated successfully");
    res.redirect(`/listings/${id}`);
  })
);


// Delete Route - Delete a listing
app.delete(
  "/listings/:id", 
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing deleted successfully!")
    res.redirect("/listings");
  })
);

// ================== REVIEWS ROUTE ==================
app.post("/listings/:id/reviews", validateReview, isLoggedIn, wrapAsync(async (req, res) => {
  console.log("➡️ Incoming review request:", req.body);

  const listing = await Listing.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path : "author"
      },
    })
    .populate("owner");
  if (!listing) {
    throw new ExpressError(404, "Listing Not Found!");
  }

  const newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  console.log("✅ Review saved & linked to listing");
  res.redirect(`/listings/${listing._id}`);
}));

// Delete Review Route
app.delete("/listings/:id/reviews/:reviewId", 
  isLoggedIn,
  isReviewAuthor, 
  wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, {pull: reviewId});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
  })
);


app.get("/flash-test", (req, res) => {
  req.flash("success", "Flash is working perfectly!");
  res.redirect("/show-flash");
});

app.get("/show-flash", (req, res) => {
  res.render("test.ejs"); // create this file inside views/
});


// searchbar🛰️ Method: GET URL: /search?q=Cozy+Bechfront+Cottage

app.get("/search", async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === "") {
    return res.redirect("/listings");
  }

  const listings = await Listing.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { location: { $regex: query, $options: "i" } },
      { country: { $regex: query, $options: "i" } }
    ]
  });

  res.render("listings/index", { listings });
});

// ruote for category

app.get("/listings/category/:category", async (req,res) => {
  const { category } = req.params;

  const listings = await Listing.find({category});

  res.render("listings/index",{listings});
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
