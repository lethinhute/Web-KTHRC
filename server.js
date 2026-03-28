const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');
const app = express();

// Cấu hình session
app.use(session({
    secret: 'your_secret_key',  // Chìa khóa bí mật để mã hóa session
    resave: false,              // Không lưu lại session nếu không có thay đổi
    saveUninitialized: true,    // Lưu session mới ngay cả khi chưa có giá trị
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // Thời gian sống của cookie (1 ngày)
    }
}));

const mainRoute = require("./src/router/indexRouter");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static site files from the project root
app.use(express.static(__dirname));

// Serve static assets (images, fonts, videos) from the project root
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/font', express.static(path.join(__dirname, 'font')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

mainRoute(app);

// Rate limiter for the SPA fallback
const spaLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});

// Fallback to index.html for client-side routing (SPA)
app.use(spaLimiter, (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = app;

