const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/chat", async (req, res) => {
    try {
        const response = await axios.post(
            "http://127.0.0.1:8000/chat",
            {
                message: req.body.message,
                session_id: req.sessionID
            }
        );

        res.json(response.data);

    } catch (error) {
        console.error("AI service error:", error.message);

        res.status(500).json({
            error: "AI service is unavailable"
        });
    }
});

module.exports = router; 