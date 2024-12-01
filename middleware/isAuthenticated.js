// middleware/isAuthenticated.js
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        res.status(401).send('Unauthorized. Please log in to access this page.');
    }
}

module.exports = isAuthenticated;
