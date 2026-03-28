const rateLimit = require('express-rate-limit');
const deviceRoutes = require("./deviceRouter");
const recordRoutes = require("./recordRouter");

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = (app) => {
    app.use('/', apiLimiter, deviceRoutes)
    app.use('/', apiLimiter, recordRoutes)
}

