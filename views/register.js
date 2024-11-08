const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'dayanisandamali977@gmail.com',
        pass: 'ogyp vmbk nfow wytw',
    },
});


router.get('/', (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Registration - My Node.js App</title>
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
            // Client-side validation for strong password
            function validatePassword() {
                const password = document.getElementById('password').value;
                const passwordError = document.getElementById('password-error');
                
                // Regular expression for strong password
                const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;
                
                if (!strongPasswordRegex.test(password)) {
                    passwordError.style.display = 'block';
                    return false; // Prevent form submission
                }
                
                passwordError.style.display = 'none';
                return true; // Allow form submission
            }
        </script>
    </body>
    </html>
    `;
    res.send(htmlContent);
});


router.post('/', async (req, res) => {
    const { name, email, password } = req.body;


    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!strongPasswordRegex.test(password)) {
        return res.send('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.');
    }

    const secret = speakeasy.generateSecret({ length: 20 });
    console.log('Generated Secret (base32):', secret.base32);

    const db = getDb();

    try {

        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.send('This email is already registered. Please use a different email.');
        }

        const salt = await bcrypt.genSalt(saltRounds);

        const hashedPassword = await bcrypt.hash(password, salt);


        const result = await db.collection('users').insertOne({
            email,
            password: hashedPassword,
            salt,
            name,
            twofa_secret: secret.base32,
            emailVerified: false,
            verificationToken: "",
        });


        const verificationToken = result.insertedId.toString();

        await db.collection('users').updateOne(
            { _id: result.insertedId },
            { $set: { verificationToken } }
        );


        const mailOptions = {
            from: 'dayanisandamali977@gmail.com',
            to: email,
            subject: 'Email Verification for Your Account',
            html: `
                <h1>Verify Your Email</h1>
                <p>Thank you for registering! Please click the button below to verify your email address and complete your registration.</p>
                <a href="http://localhost:3000/verify-email?token=${verificationToken}"
                   style="display:inline-block; padding: 10px 20px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px;">
                   Verify Email
                </a>
                <p>If the button above doesn't work, please copy and paste this link into your browser:</p>
                <p>http://localhost:3000/verify-email?token=${verificationToken}</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);

        const data_url = await qrcode.toDataURL(secret.otpauth_url);

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Registration Successful</title>
                <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
            </head>
            <body>
                <script>
                    Swal.fire({
                        title: 'Registration Successful!',
                        text: 'A verification email has been sent to ${email}.',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(function() {
                        window.location.href = '/';
                    });
                </script>
            </body>
            </html>
        `;
        res.send(htmlContent);

    } catch (err) {
        console.error('Error saving the user:', err);
        res.send('Error saving the user.');
    }
});

module.exports = router;
