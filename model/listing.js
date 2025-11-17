const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    image: {
        url: String,
        filename: String,
    },
    price: {
        type: Number,
        min: 0,
    },
    location: String,
    country: String,
    reviews: [
        {
        type: Schema.Types.ObjectId,
        ref: "Review",
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    category: {
        type: String,
        enum: [
           "Trending" ,
           "Rooms",
           "Adventure",
           "Nature",
           "Castles",
           "Amazing Pools",
            "Camping",
            "Farms",
            "Arctic",
        ],
        default: "Trending"

    },
}, { timestamps: true });

listingSchema.post("findOneAndDelete", async(listing) => {
    if (listing) {
        await Review.deleteMany({_id: {$in : listing.reviews}});
    }
});   

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;