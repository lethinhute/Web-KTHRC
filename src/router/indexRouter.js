const deviceRoutes = require("./deviceRouter");
const recordRoutes = require("./recordRouter");

module.exports = (app) => {
    app.use('/', deviceRoutes)
    app.use('/', recordRoutes)
}

