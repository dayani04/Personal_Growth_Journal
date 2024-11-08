const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const speakeasy = require('speakeasy');


router.get('/', (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>2FA Verification - My Node.js App</title>
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <header>
            <h1>2FA Verification - My Node.js App</h1>
             <a href="/" style="color: #7B97D3; margin: 0 15px; text-decoration: none; font-size: 1.1em;">Home</a>
        </header>
        <main>
            <div class="verification-container">
                <div class="verification-card">
                    <h2>Enter 2FA Token</h2>
                    <form action="/verification" method="POST" class="verification-form">
                        <div class="form-group">
                            <label for="email">Email:</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password:</label>
                            <input type="password" id="password" name="password" required>
                        </div>
                        <div class="form-group">
                            <label for="token">2FA Token:</label>
                            <input type="text" id="token" name="token" required>
                        </div>
                        <button type="submit">Verify</button>
                    </form>
                    <p>Don't have an account? <a href="/register">Register here</a></p>
                </div>
            </div>
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
    const { email, password, token } = req.body;

    const db = getDb();

    try {
        const user = await db.collection('users').findOne({ email: email });

        if (!user || user.password !== password) {
            return res.send('Invalid email or password.');
        }

        const verified = speakeasy.totp.verify({
            secret: user.twofa_secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (verified) {

            res.redirect('/dashboard');
        } else {

            res.send('Invalid 2FA token.');
        }
    } catch (err) {
        console.error('Error querying the database:', err);
        res.send('Error querying the database.');
    }
});

module.exports = router;
