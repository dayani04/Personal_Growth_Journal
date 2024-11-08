const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'dayanisandamali977@gmail.com',
        pass: 'ogyp vmbk nfow wytw',
    },
});


router.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
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
                    background-color: #C9D2F2;
                    color: #7B97D3;
                    text-align: center;
                    padding: 10px 0;
                    position: relative;
                    width: 100%;
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
                .container {
                    flex-grow: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        </head>
        <body>

        <!-- Navbar -->
        <nav>
            <h1>Change Your Password</h1>
            <a href="/profile" style="color: #7B97D3; margin: 0 15px; text-decoration: none; font-size: 1.1em;">Back</a>
        </nav>

        <!-- Password Change Form -->
        <form action="/changePassword" method="POST">
            <label for="Email">Email:</label>
            <input type="email" id="Email" name="Email" required>
            <br>
            <label for="currentPassword">Current Password:</label>
            <input type="password" id="currentPassword" name="currentPassword" required>
            <br>
            <label for="newPassword">New Password:</label>
            <input type="password" id="newPassword" name="newPassword" required>
            <br>
            <button type="submit">Submit</button>
        </form>

        <!-- Verification Code Form (if applicable) -->
        <div class="container">
            ${req.session.verificationCode ? `
                <h2>Enter Verification Code</h2>
                <form action="/changePassword/verify" method="POST">
                    <label for="verificationCode">Verification Code:</label>
                    <input type="text" id="verificationCode" name="verificationCode" required>
                    <br>
                    <button type="submit">Verify and Update Password</button>
                </form>
            ` : ''}
        </div>

        <!-- Footer -->
        <footer>
            <p>&copy; 2024 My Node.js App</p>
        </footer>

        <script>
            // Alert for success
            ${req.session.successMessage ? `
                Swal.fire({
                    title: 'Success!',
                    text: '${req.session.successMessage}',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                ${req.session.successMessage = null} // Clear success message after showing
            ` : ''}

            // Alert for error
            ${req.session.errorMessage ? `
                Swal.fire({
                    title: 'Error!',
                    text: '${req.session.errorMessage}',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                ${req.session.errorMessage = null} // Clear error message after showing
            ` : ''}
        </script>

        </body>
        </html>
    `);
});

router.post('/', async (req, res) => {
    const { Email, currentPassword, newPassword } = req.body;
    const db = getDb();

    try {

        const user = await db.collection('users').findOne({ email: Email });

        if (!user) {
            req.session.errorMessage = 'No user found with this email.';
            return res.redirect('/changePassword');
        }


        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            req.session.errorMessage = 'Invalid current password.';
            return res.redirect('/changePassword');
        }


        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);


        const verificationCode = speakeasy.totp({
            secret: user.twofa_secret,
            encoding: 'base32',
            digits: 6
        });
        console.log('Verification Code:', verificationCode);


        const mailOptions = {
            from: 'dayanisandamali977@gmail.com',
            to: Email,
            subject: 'Password Change Verification Code',
            text: `Your verification code to change your password is: ${verificationCode}`
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent.');

        req.session.verificationCode = verificationCode;
        req.session.newPassword = hashedNewPassword;
        req.session.Email = Email;

        req.session.successMessage = 'Verification code sent to your email!';
        res.redirect('/changePassword');
    } catch (err) {
        console.error('Error processing password change request:', err);
        req.session.errorMessage = 'Error processing password change request.';
        res.redirect('/changePassword');
    }
});

router.post('/verify', async (req, res) => {
    const { verificationCode } = req.body;

    if (verificationCode === req.session.verificationCode) {
        const db = getDb();

        try {
            await db.collection('users').updateOne(
                { email: req.session.Email },
                { $set: { password: req.session.newPassword } }
            );

            req.session.verificationCode = null;
            req.session.newPassword = null;
            req.session.Email = null;

            req.session.successMessage = 'Password successfully updated!';
            res.redirect('/changePassword');
        } catch (err) {
            console.error('Error updating password:', err);
            req.session.errorMessage = 'Error updating password.';
            res.redirect('/changePassword');
        }
    } else {
        req.session.errorMessage = 'Invalid verification code.';
        res.redirect('/changePassword');
    }
});

module.exports = router;
