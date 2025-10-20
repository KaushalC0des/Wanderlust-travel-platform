const Joi = require("joi");

// Schema for Listings
module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),       // ✅ fix spelling (was "tittle")
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().min(0).required(),
    image: Joi.string().allow("", null)   // optional
  }).required()
});

// Schema for Reviews
module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required()      // ✅ must be function call
  }).required()
});
