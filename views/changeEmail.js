const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');


const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'dayanisandamali977@gmail.com',
        pass: 'ogyp vmbk nfow wytw',
    },
});

router.get('/', (req, res) => {
    res.send(`
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
                color: #7B97D3;
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
            form {
                background-color: #FFFFFF;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                width: 100%;
                margin: 0 auto;
                margin-top: 20px;
            }
            label {
                font-size: 1.1em;
                margin-bottom: 10px;
                display: block;
                color: black;
            }
            input[type="email"], input[type="password"] {
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
            .container {
                flex-grow: 1;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        </style>

        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

        <nav>
            <h1>Change Your Email</h1>
            <a href="/profile">Back</a>
        </nav>

        <div class="container">
            <form action="/changeEmail" method="POST">
                <label for="oldEmail">Old Email:</label>
                <input type="email" id="oldEmail" name="oldEmail" required>
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
                <label for="newEmail">New Email:</label>
                <input type="email" id="newEmail" name="newEmail" required>
                <button type="submit">Submit</button>
            </form>

            ${req.session.verificationCode ? `
                <form action="/changeEmail/verify" method="POST" class="verification-form">
                    <h2>Enter Verification Code</h2>
                    <label for="verificationCode">Verification Code:</label>
                    <input type="text" id="verificationCode" name="verificationCode" required>
                    <button type="submit">Verify and Update Email</button>
                </form>
            ` : ''}
        </div>

        <footer>
            <p>&copy; 2024 GreenCity. All rights reserved.</p>
        </footer>

        <script>
            ${req.session.success ? `
                Swal.fire({ icon: 'success', title: 'Success', text: '${req.session.success}' });
                req.session.success = null;
            ` : ''}

            ${req.session.error ? `
                Swal.fire({ icon: 'error', title: 'Error', text: '${req.session.error}' });
                req.session.error = null;
            ` : ''}
        </script>
    `);
});

router.post('/', async (req, res) => {
    const { oldEmail, password, newEmail } = req.body;
    const db = getDb();

    try {
        const user = await db.collection('users').findOne({ email: oldEmail });

        if (!user) {
            req.session.error = 'Invalid email or password.';
            return res.redirect('/changeEmail');
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            req.session.error = 'Invalid email or password.';
            return res.redirect('/changeEmail');
        }
        const verificationCode = speakeasy.totp({
            secret: user.twofa_secret,
            encoding: 'base32',
            digits: 6
        });

        console.log('Verification Code:', verificationCode);

        const mailOptions = {
            from: 'dayanisandamali977@gmail.com',
            to: newEmail,
            subject: 'Email Change Verification Code',
            text: `Your verification code to change email is: ${verificationCode}`
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent.');
        req.session.verificationCode = verificationCode;
        req.session.newEmail = newEmail;
        req.session.oldEmail = oldEmail;

        req.session.success = 'Verification code sent to your new email.';
        res.redirect('/changeEmail');
    } catch (err) {
        console.error('Error processing email change request:', err);
        req.session.error = 'Error processing email change request.';
        res.redirect('/changeEmail');
    }
});

router.post('/verify', async (req, res) => {
    const { verificationCode } = req.body;

    if (verificationCode === req.session.verificationCode) {
        const db = getDb();

        try {
            await db.collection('users').updateOne(
                { email: req.session.oldEmail },
                { $set: { email: req.session.newEmail } }
            );

            req.session.verificationCode = null;
            req.session.newEmail = null;
            req.session.oldEmail = null;

            req.session.success = 'Email successfully updated!';
            res.redirect('/changeEmail');
        } catch (err) {
            console.error('Error updating email:', err);
            req.session.error = 'Error updating email.';
            res.redirect('/changeEmail');
        }
    } else {
        req.session.error = 'Invalid verification code.';
        res.redirect('/changeEmail');
    }
});

module.exports = router;
