const express = require('express');
const session = require('express-session');
const { connectToMongoDB } = require('./db'); // MongoDB connection function
const path = require('path');
const app = express();

 
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Import route files
const indexRoute = require('./views/index');
const loginRoute = require('./views/login');
const verificationRoute = require('./views/verification');
const registerRoute = require('./views/register');
const dashboardRoute = require('./views/dashboard');
const journalEntryRoute = require('./views/journalEntry');
const goalsManagementRoute = require('./views/goalsManagement');
const profileRoute = require('./views/profile');
const admin_registerRoute = require('./views/admin_register');
const admin_dashboardRoute = require('./views/admin_dashboard');
const changeEmailRoute = require('./views/changeEmail');
const changePasswordRoute = require('./views/changePassword');
const forgetPasswordRoute = require('./views/forgetPassword');
const logoutRoute = require('./views/logout');
const logsRoute = require('./views/logs');
const verifyEmailRoute = require('./views/verifyEmail');



// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Use imported routes
app.use('/', indexRoute);
app.use('/login', loginRoute);
app.use('/verification', verificationRoute);
app.use('/register', registerRoute);
app.use('/dashboard', dashboardRoute);
app.use('/journalEntry', journalEntryRoute);
app.use('/goalsManagement', goalsManagementRoute);
app.use('/profile', profileRoute);
app.use('/admin_register', admin_registerRoute);
app.use('/admin_dashboard', admin_dashboardRoute);
app.use('/changeEmail', changeEmailRoute);
app.use('/changePassword', changePasswordRoute);
app.use('/forgetPassword', forgetPasswordRoute);
app.use('/logout', logoutRoute);
app.use('/logs', logsRoute);
app.use('/verify-email', verifyEmailRoute);



app.use((req, res) => {
    res.status(404).send('<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>');
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('<h1>500 - Internal Server Error</h1><p>Something went wrong!</p>');
});


connectToMongoDB().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});
