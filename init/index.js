const mongoose = require("mongoose");
const initData = require("./data.js");          // ✅ same folder
const Listing = require("../model/listing.js"); // ✅ one folder up

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderLust";

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: "68f500a0746f89af17ff16c8"}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

initDB();
