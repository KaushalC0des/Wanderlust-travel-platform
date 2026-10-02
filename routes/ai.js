const express = require("express");

const router = express.Router();

const axios = require("axios");

router.post("/chat", async (req, res) => {

    try {

        const response = await axios.post(
            `${process.env.AI_SERVICE_URL}/chat`,
            {
                message: req.body.message,
                session_id: req.sessionID
            },
            {
                responseType: "stream"
            }
        );

        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8"
        );

        response.data.on("data", (chunk) => {

            res.write(chunk);

        });

        response.data.on("end", () => {

            res.end();

        });

    } catch (error) {

        console.error(
            "AI service error:",
            error.message
        );

        if (!res.headersSent) {

            res.status(500).json({
                error: "AI service is unavailable"
            });

        }

    }

});

module.exports = router;