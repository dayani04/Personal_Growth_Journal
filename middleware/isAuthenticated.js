const jwt = require('jsonwebtoken');

// Middleware to check if the user is authenticated
const checkAuth = (req, res, next) => {
    const token = req.session.authToken;  // Get token from the session

    if (!token) {
        return res.redirect('/login');  // If no token, redirect to login page
    }

    // Verify the JWT token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.redirect('/login');  // Invalid token, redirect to login page
        }

        // Store the decoded user data in the request object
        req.user = decoded;
        next();  // Proceed to the next middleware or route handler
    });
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();  // User is an admin, proceed to the next middleware/route
    }
    res.redirect('/dashboard');  // If not an admin, redirect to the user dashboard
};

// Middleware to check if the user is a regular user
const isUser = (req, res, next) => {
    if (req.user && !req.user.isAdmin) {
        return next();  // User is not an admin, proceed to the next middleware/route
    }
    res.redirect('/admin_dashboard');  // If an admin, redirect to the admin dashboard
};

// Export the middlewares
module.exports = { checkAuth, isAdmin, isUser };
