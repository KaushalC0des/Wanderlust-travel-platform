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
        filename: {
            type: String,
            default: "listingimage",
        },
        url: {
            type: String,
            default: "https://placehold.co/600x400/gray/white/png?text=No+Image",
        }
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
    ]
}, { timestamps: true });

listingSchema.post("findOneAndDelete", async(listing) => {
    if (listing) {
        await Review.deleteMany({_id: {$in : listing.reviews}});
    }
});   

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;