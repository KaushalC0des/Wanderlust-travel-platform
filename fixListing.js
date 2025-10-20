const mongoose = require("mongoose");
const Listing = require("./model/listing"); // adjust path if needed

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderLust";

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to DB");

  // Find all listings
  const listings = await Listing.find({});
  for (let listing of listings) {
    if (!listing.image || !listing.image.url) {
      listing.image = {
        url: "https://placehold.co/600x400/gray/white/png?text=No+Image",
        filename: "default"
      };
      await listing.save();
      console.log("🖼 Added default image to:", listing.title);
    }
  }

  console.log("🎉 All listings fixed!");
  mongoose.connection.close();
}

main().catch(err => {
  console.error("❌ Error:", err);
});
