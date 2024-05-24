require("dotenv").config()

const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    console.log("Configuring proxy...");
    const proxy = createProxyMiddleware({
        target: `http://${process.env.HOST || "localhost"}:${process.env.API_PORT || 8081}`, changeOrigin: true,
    });

    ["/api", "/profile", "/profile.js", "/logout", "/login", "/auth", "/login_failed.html"].forEach(url => app.use(url, proxy));
};