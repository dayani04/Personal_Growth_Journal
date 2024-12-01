const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const isAuthenticated = require('../middleware/isAuthenticated');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'dayanisandamali977@gmail.com',
        pass: 'ogyp vmbk nfow wytw',
    },
});

router.get('/',isAuthenticated, (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Forget Password</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f4f8;
            color: #03045e;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        h1 {
            color: #7B97D3;
            font-size: 2em;
            text-align: center;
        }
        h2 {
            color: #0000;
            font-size: 1.5em;
            text-align: center;
        }
        nav {
            background-color: #C9D2F2;
            padding: 15px;
            text-align: center;
            color: white;
        }
        nav a {
            color: white;
            margin: 0 15px;
            text-decoration: none;
            font-size: 1.1em;
        }
        nav a:hover {
            text-decoration: underline;
        }
        footer {
            background-color:  #C9D2F2;
            color: #7B97D3;
            text-align: center;
            padding: 10px 0;
            position: absolute;
            width: 100%;
            bottom: 0;
        }
        .container {
            flex-grow: 1;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        form {
            background-color: #FFFFFF;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 100%;
            margin-top: 20px;
        }
        label {
            font-size: 1.1em;
            margin-bottom: 10px;
            display: block;
            color: black;
        }
        input[type="email"], input[type="text"], input[type="password"] {
            width: 100%;
            padding: 10px;
            margin: 10px 0 20px 0;
            border: 1px solid #7B97D3;
            border-radius: 5px;
            font-size: 1em;
            box-sizing: border-box;
        }
        button {
            background-color: #0077b6;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-size: 1em;
            cursor: pointer;
            transition: background-color 0.3s ease;
            width: 100%;
        }
        button:hover {
            background-color: #03045e;
        }
    </style>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    </head>
    <body>
        <nav>
            <h1>Forget Password</h1>
            <a href="/login">Back to Login</a>
        </nav>
        <div class="container">
            <form action="/forgetPassword" method="POST">
                <label for="email">Enter your email:</label>
                <input type="email" id="email" name="email" required>
                <button type="submit">Send Verification Code</button>
            </form>

            ${req.session.verificationCodeSent ? `
            <h2>Enter Verification Code</h2>
            <form id="resetPasswordForm">
                <label for="verificationCode">Verification Code:</label>
                <input type="text" id="verificationCode" name="verificationCode" required>
                <label for="newPassword">New Password:</label>
                <input type="password" id="newPassword" name="newPassword" required>
                <button type="submit">Reset Password</button>
            </form>

            <script>
                document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const verificationCode = document.getElementById('verificationCode').value;
                    const newPassword = document.getElementById('newPassword').value;

                    const response = await fetch('/forgetPassword/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ verificationCode, newPassword }),
                    });

                    const result = await response.json();

                    if (result.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: result.message,
                        }).then(() => {
                            window.location.href = '/login';
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: result.message,
                        });
                    }
                });
            </script>
            ` : ''}
        </div>
        <footer>&copy; 2024 GreenCity. All rights reserved.</footer>
    </body>
    </html>
    `);
});

router.post('/',isAuthenticated, async (req, res) => {
    const { email } = req.body;
    const db = getDb();

    try {
        // Check if the email exists in the users or admins collection
        const user = await db.collection('users').findOne({ email });
        const admin = await db.collection('admins').findOne({ email });

        if (!user && !admin) {
            return res.send('Email not found.');
        }

        // Determine the user type (admin or regular user)
        const isUser = !!user;
        const targetUser = isUser ? user : admin;

        // Generate a verification code
        const verificationCode = speakeasy.totp({
            secret: targetUser.twofa_secret || 'defaultSecret',
            encoding: 'base32',
            digits: 6
        });

        const mailOptions = {
            from: 'dayanisandamali977@gmail.com',
            to: email,
            subject: 'Password Reset Verification Code',
            text: `Your verification code is: ${verificationCode}`
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent.');

        req.session.verificationCode = verificationCode;
        req.session.email = email;
        req.session.isUser = isUser; // Store whether it's a user or admin
        req.session.verificationCodeSent = true;

        res.redirect('/forgetPassword');
    } catch (err) {
        console.error('Error sending verification code:', err);
        res.send('Error sending verification code.');
    }
});

router.post('/verify', async (req, res) => {
    const { verificationCode, newPassword } = req.body;

    if (verificationCode === req.session.verificationCode) {
        const db = getDb();

        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update the password in the appropriate collection
            if (req.session.isUser) {
                await db.collection('users').updateOne(
                    { email: req.session.email },
                    { $set: { password: hashedPassword } }
                );
            } else {
                await db.collection('admins').updateOne(
                    { email: req.session.email },
                    { $set: { password: hashedPassword } }
                );
            }

            req.session.verificationCode = null;
            req.session.email = null;
            req.session.verificationCodeSent = false;

            res.json({ success: true, message: 'Password successfully updated!' });
        } catch (err) {
            console.error('Error updating password:', err);
            res.json({ success: false, message: 'Error updating password. Please try again.' });
        }
    } else {
        res.json({ success: false, message: 'Invalid verification code.' });
    }
});

module.exports = router;
