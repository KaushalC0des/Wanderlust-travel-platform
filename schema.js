const Joi = require("joi");

// ✅ Schema for Listings
module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().min(0).required(),

    category: Joi.string()
      .valid(
        "Trending",
        "Rooms",
        "Adventure",
        "Nature",
        "Castles",
        "Amazing Pools",
        "Camping",
        "Farms",
        "Arctic"
      )
      .required()
  }).required()
});

// ✅ Schema for Reviews
module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required()
  }).required()
});



