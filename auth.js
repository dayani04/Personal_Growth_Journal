// middleware/auth.js

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();  // User is logged in, allow access to the page
    } else {
        res.redirect('/login');  // User is not logged in, redirect to login page
    }
}

module.exports = isAuthenticated;
