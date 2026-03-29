const express = require('express');
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');
const app = express();
const clientBuildPath = path.join(__dirname, 'src', 'public');

const allowedOrigins = new Set([
    'https://rabbitcave.com.vn',
    'https://api.rabbitcave.com.vn',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]);

const corsOptions = {
    origin(origin, callback) {
        // Allow server-to-server requests and non-browser tools with no Origin header.
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

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
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Serve built Vite SPA assets
app.use(express.static(clientBuildPath));

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
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

module.exports = app;

