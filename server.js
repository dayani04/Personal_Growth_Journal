const express = require('express');
const session = require('express-session');
const path = require('path');
const { connectToMongoDB } = require('./db'); // MongoDB connection function
const { checkAuth, isAdmin, isUser } = require('./middleware/isAuthenticated'); 
const app = express();
require('dotenv').config();


app.use(session({
    secret: process.env.JWT_SECRET,  // Use the same secret as in the .env file
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
 }));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Import route files
const indexRoute = require('./views/index');
const loginRoute = require('./views/login');
const verificationRoute = require('./views/verification');
const registerRoute = require('./views/register');
const dashboardRoute = require('./views/dashboard');
const journalEntryRoute = require('./views/journalEntry');
const goalsManagementRoute = require('./views/goalsManagement');
const profileRoute = require('./views/profile');
const adminRegisterRoute = require('./views/admin_register');
const changeEmailRoute = require('./views/changeEmail');
const changePasswordRoute = require('./views/changePassword');
const forgetPasswordRoute = require('./views/forgetPassword');
const logoutRoute = require('./views/logout');
const logsRoute = require('./views/logs');
const verifyEmailRoute = require('./views/verifyEmail');
const adminDashboardRoute = require('./views/admin_dashboard');
const adminProfileRoute = require('./views/admin_profile');
const adminChangePasswordRoute = require('./views/admin_changePassword');
const adminChangeEmailRoute = require('./views/admin_changeEmail');

// Apply routes
app.use('/', indexRoute);
app.use('/login', loginRoute);
app.use('/verification', verificationRoute);
app.use('/register', registerRoute);
app.use('/verification', checkAuth,isUser,verificationRoute);
app.use('/dashboard', checkAuth,isUser, dashboardRoute); // Protect with authentication
app.use('/journalEntry', checkAuth,isUser, journalEntryRoute); // Protect with authentication
app.use('/goalsManagement', checkAuth,isUser, goalsManagementRoute); // Protect with authentication
app.use('/profile', checkAuth,isUser, profileRoute); // Protect with authentication
app.use('/admin_register',checkAuth,isAdmin, adminRegisterRoute); // Protect with authentication
app.use('/changeEmail', checkAuth,isUser, changeEmailRoute); // Protect with authentication
app.use('/changePassword', checkAuth,isUser, changePasswordRoute); // Protect with authentication
app.use('/forgetPassword', checkAuth,isUser,forgetPasswordRoute); // Public route
app.use('/logout', checkAuth,isUser, logoutRoute); // Protect with authentication
app.use('/logs', checkAuth,isUser, logsRoute); // Protect with authentication
app.use('/verify-email', verifyEmailRoute);
app.use('/admin_dashboard',checkAuth,isAdmin, adminDashboardRoute); // Protect with authentication
app.use('/admin_profile', checkAuth,isAdmin, adminProfileRoute); // Protect with authentication
app.use('/admin_changePassword', checkAuth,isAdmin, adminChangePasswordRoute); // Protect with authentication
app.use('/admin_changeEmail', checkAuth,isAdmin, adminChangeEmailRoute); // Protect with authentication

// 404 error handler
app.use((req, res) => {
    res.status(404).send('<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>');
});

// 500 error handler
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
