// Central API configuration for Flip Album
const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:5000";
    }
    return "https://tirthas-bday.onrender.com";
})();
