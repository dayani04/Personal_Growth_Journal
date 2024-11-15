const express = require('express');
const session = require('express-session');
const { connectToMongoDB } = require('./db'); // MongoDB connection function
const path = require('path');
const app = express();

// Session setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.isLoggedIn) {
        return next(); // User is authenticated, allow them to proceed
    } else {
        return res.redirect('/login'); // If not logged in, redirect to login
    }
}

// Publicly accessible routes
app.use('/', require('./views/index'));
app.use('/login', require('./views/login'));
app.use('/register', require('./views/register'));

// Routes that require authentication
app.use('/verification', isAuthenticated, require('./views/verification'));
app.use('/dashboard', isAuthenticated, require('./views/dashboard'));
app.use('/journalEntry', isAuthenticated, require('./views/journalEntry'));
app.use('/goalsManagement', isAuthenticated, require('./views/goalsManagement'));
app.use('/profile', isAuthenticated, require('./views/profile'));
app.use('/admin_register', isAuthenticated, require('./views/admin_register'));
app.use('/admin_dashboard', isAuthenticated, require('./views/admin_dashboard'));
app.use('/changeEmail', isAuthenticated, require('./views/changeEmail'));
app.use('/changePassword', isAuthenticated, require('./views/changePassword'));
app.use('/forgetPassword', isAuthenticated, require('./views/forgetPassword'));
app.use('/logout', isAuthenticated, require('./views/logout'));
app.use('/logs', isAuthenticated, require('./views/logs'));
app.use('/verify-email', isAuthenticated, require('./views/verifyEmail'));

// Handle 404 errors
app.use((req, res) => {
    res.status(404).send('<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>');
});

// Handle other errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('<h1>500 - Internal Server Error</h1><p>Something went wrong!</p>');
});

// Connect to MongoDB and start the server
connectToMongoDB().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});
