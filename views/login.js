const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const useragent = require('useragent');

router.get('/', (req, res) => {
    const lockedOutUntil = req.session.lockedOutUntil || 0;
    const currentTime = Date.now();
    const isLockedOut = currentTime < lockedOutUntil;
    const remainingTime = isLockedOut ? Math.ceil((lockedOutUntil - currentTime) / 1000) : 0;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - My Node.js App</title>
        <link rel="stylesheet" href="/style.css">
        <script>
            window.onload = function() {
                var remainingTime = ${remainingTime};
                var countdownElement = document.getElementById('countdown');
                var submitButton = document.querySelector('button[type="submit"]');
                var emailInput = document.getElementById('email');
                var passwordInput = document.getElementById('password');
                var userTypeSelect = document.getElementById('userType');

                if (remainingTime > 0) {
                    submitButton.disabled = true;
                    emailInput.disabled = true;
                    passwordInput.disabled = true;
                    userTypeSelect.disabled = true;

                    var interval = setInterval(function() {
                        countdownElement.textContent = remainingTime + ' seconds remaining';
                        remainingTime--;

                        if (remainingTime <= 0) {
                            clearInterval(interval);
                            countdownElement.textContent = '';
                            submitButton.disabled = false;
                            emailInput.disabled = false;
                            passwordInput.disabled = false;
                            userTypeSelect.disabled = false;
                        }
                    }, 1000);
                }
            };
        </script>
    </head>
    <body>
        <header>
            <h1>Welcome Back</h1>
            <a href="/" style="color: #7B97D3; margin: 0 15px; text-decoration: none; font-size: 1.1em;">Home</a>
        </header>
        <main>
            <section class="login-container">
                <div class="login-card">
                    <h2>Login</h2>
                    ${req.session.errorMessage ? `<p style="color: red;">${req.session.errorMessage}</p>` : ''}
                    <p id="countdown" style="color: red;"></p>
                    <form action="/login" method="POST" class="login-form">
                        <div class="form-group">
                            <label for="email">Email:</label>
                            <input type="email" id="email" name="email" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password:</label>
                            <input type="password" id="password" name="password" placeholder="Enter your password" required>
                        </div>
                        <div class="form-group">
                            <label for="userType">Login as:</label>
                            <select id="userType" name="userType" required>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit">Login</button>
                    </form>
                    <p>Don't have an account? <a href="/register">Register here</a></p>
                    <p><a href="/forgetPassword">Forgot your password?</a></p>
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

router.post('/', async (req, res) => {
    const { email, password, userType } = req.body;
    const db = getDb();

    if (!req.session.attempts) {
        req.session.attempts = 0;
    }

    const currentTime = Date.now();

    if (req.session.lockedOutUntil && currentTime < req.session.lockedOutUntil) {
        req.session.errorMessage = `Too many failed login attempts. Please try again later.`;
        return res.redirect('/login');
    }

    try {
        let collectionName;
        if (userType === 'admin') {
            collectionName = 'admins';
        } else if (userType === 'user') {
            collectionName = 'users';
        } else {
            req.session.errorMessage = 'Please select a valid login type.';
            return res.redirect('/login');
        }

        const user = await db.collection(collectionName).findOne({ email: email });

        if (user) {
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                req.session.attempts = 0;

                const agent = useragent.parse(req.headers['user-agent']);
                const deviceDetails = `${agent.family} on ${agent.os.family} (${agent.device.family})`;
                const sessionCode = uuidv4();
                const loginTime = new Date();

                console.log(`User ${user._id} logging in. Session code: ${sessionCode}, Device: ${deviceDetails}, Time: ${loginTime}`);

                await db.collection('logs').insertOne({
                    userId: user._id,
                    loginTime: loginTime,
                    device: deviceDetails,
                    sessionCode: sessionCode
                });

                req.session.user = {
                    id: user._id,
                    email: user.email,
                    sessionCode: sessionCode
                };

                if (userType === 'admin') {
                    res.redirect('/admin_dashboard');
                } else {
                    res.redirect('/dashboard');
                }
            } else {
                req.session.attempts++;
                if (req.session.attempts >= 3) {
                    req.session.lockedOutUntil = currentTime + 30 * 1000;
                    req.session.errorMessage = `Too many failed login attempts. Please wait for 30 seconds.`;
                } else {
                    req.session.errorMessage = `Invalid email or password. You have ${3 - req.session.attempts} attempts remaining.`;
                }
                res.redirect('/login');
            }
        } else {
            req.session.errorMessage = `Invalid email or password.`;
            res.redirect('/login');
        }
    } catch (err) {
        console.error('Error querying the database:', err);
        req.session.errorMessage = 'An error occurred. Please try again.';
        res.redirect('/login');
    }
});

module.exports = router;
