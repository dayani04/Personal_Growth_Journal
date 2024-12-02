const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const speakeasy = require('speakeasy');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sanitizeHtml = require('sanitize-html'); // For XSS prevention
const saltRounds = 10;

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'dayanisandamali977@gmail.com', // Change to your email
        pass: 'ogyp vmbk nfow wytw',   // Handle securely in production
    },
});

// Serve static files (e.g., CSS)
router.use(express.static('public'));

// Registration form (GET)
router.get('/', (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Registration</title>
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <header>
            <h1>User Registration</h1>
            <a href="/" style="color: #7B97D3; margin: 0 15px; text-decoration: none; font-size: 1.1em;">Home</a>
        </header>
        <main>
            <section class="register-container">
                <div class="register-card">
                    <h2>Create Your Account</h2>
                    <form action="/register" method="POST" class="register-form" onsubmit="return validatePassword()">
                        <div class="form-group">
                            <label for="name">Name:</label>
                            <input type="text" id="name" name="name" placeholder="Enter your name" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email:</label>
                            <input type="email" id="email" name="email" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password:</label>
                            <input type="password" id="password" name="password" placeholder="Enter your password" required>
                            <p id="password-error" style="color: red; display: none;">Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.</p>
                        </div>
                        <button type="submit">Register</button>
                    </form>
                    <p>Already have an account? <a href="/login">Login here</a></p>
                </div>
            </section>
        </main>
        <footer>
            <p>&copy; 2024 My Node.js App</p>
        </footer>
        <script>
            function validatePassword() {
                const password = document.getElementById('password').value;
                const passwordError = document.getElementById('password-error');
                const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;

                if (!strongPasswordRegex.test(password)) {
                    passwordError.style.display = 'block';
                    return false;
                }

                passwordError.style.display = 'none';
                return true;
            }
        </script>
    </body>
    </html>
    `;
    res.send(htmlContent);
});

// Handle user registration (POST)
router.post('/', async (req, res) => {
    const { name, email, password } = req.body;

    // Sanitize inputs to prevent XSS
    const sanitizedName = sanitizeHtml(name);
    const sanitizedEmail = sanitizeHtml(email);
    const sanitizedPassword = sanitizeHtml(password);

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!strongPasswordRegex.test(sanitizedPassword)) {
        return res.status(400).send('Password must meet complexity requirements.');
    }

    const db = getDb();
    try {
        const existingUser = await db.collection('pendingUsers').findOne({ email: sanitizedEmail });
        if (existingUser) {
            return res.status(400).send('Email is already registered.');
        }

        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(sanitizedPassword, salt);

        const secret = speakeasy.generateSecret({ length: 20 });
        const totpToken = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32',
        });

        // Insert unverified user into the database
        await db.collection('pendingUsers').insertOne({
            name: sanitizedName,
            email: sanitizedEmail,
            password: hashedPassword,
            totpSecret: secret.base32,
        });

        // Send TOTP to the user via email
        await transporter.sendMail({
            from: 'your-email@gmail.com', // Change to your email
            to: sanitizedEmail,
            subject: 'TOTP for Registration',
            text: `Your TOTP is: ${totpToken}`,
        });

        // Redirect to TOTP verification page
        res.redirect('/register/verify-totp?email=' + sanitizedEmail); 
    } catch (err) {
        console.error('Error saving user:', err);
        res.status(500).send('Error processing your request.');
    }
});

// TOTP Verification form (GET)
router.get('/verify-totp', (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TOTP Verification</title>
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <header>
            <h1>TOTP Verification</h1>
        </header>
        <main>
            <section class="verify-container">
                <div class="verify-card">
                    <h2>Enter Your TOTP</h2>
                    <form action="/register/verify-totp" method="POST">
                        <input type="hidden" name="email" value="${req.query.email || ''}">
                        <div class="form-group">
                            <label for="totp">TOTP:</label>
                            <input type="text" id="totp" name="totp" placeholder="Enter your TOTP" required>
                        </div>
                        <button type="submit">Verify</button>
                    </form>
                </div>
            </section>
        </main>
        <footer>
            <p>&copy; 2024 My Node.js App</p>
        </footer>
    </body>
    </html>
    `;
    res.send(htmlContent);
});

// Handle TOTP verification (POST)
router.post('/verify-totp', async (req, res) => {
    const { email, totp } = req.body;

    const sanitizedEmail = sanitizeHtml(email);
    const sanitizedTotp = sanitizeHtml(totp);

    const db = getDb();
    try {
        // Check for the user in the pendingUsers collection
        const pendingUser = await db.collection('pendingUsers').findOne({ email: sanitizedEmail });

        if (!pendingUser) {
            return res.status(400).send('User not found.');
        }

        // Verify the TOTP
        const verified = speakeasy.totp.verify({
            secret: pendingUser.totpSecret,
            encoding: 'base32',
            token: sanitizedTotp,
            window: 1,
        });

        if (!verified) {
            return res.status(400).send('Invalid TOTP.');
        }

        // Successfully verified the TOTP, move the user to the users collection
        await db.collection('users').insertOne({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
            dateRegistered: new Date(),
        });

        // Delete the unverified user record from pendingUsers collection
        await db.collection('pendingUsers').deleteOne({ email: sanitizedEmail });

        // Redirect to the login page
        res.redirect('/login');
    } catch (err) {
        console.error('Error verifying TOTP:', err);
        res.status(500).send('Error processing your request.');
    }
});

module.exports = router;
