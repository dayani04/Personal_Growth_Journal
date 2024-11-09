const express = require('express');
const router = express.Router();
const { getDb } = require('../db'); // MongoDB Atlas connection
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const { ObjectID } = require('mongodb');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'dayanisandamali977@gmail.com', // your email address
        pass: 'ogyp vmbk nfow wytw', // your email password (use app-specific password if using Gmail)
    },
});

// Route for user registration form
router.get('/', (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Registration - My Node.js App</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                color: #333;
            }

            header {
                background-color: #C9D2F2;
                padding: 20px;
                text-align: center;
                color: white;
            }

            h1 {
                font-size: 2.5em;
                margin: 0;
            }

            a {
                text-decoration: none;
                color: white;
                font-size: 1.1em;
            }

            a:hover {
                text-decoration: underline;
            }

            .register-container {
                display: flex;
                justify-content: center;
                padding: 50px 0;
            }

            .register-card {
                background-color: #ffffff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
                text-align: center;
            }

            h2 {
                color: black;
            }

            .form-group {
                margin-bottom: 20px;
                text-align: left;
            }

            label {
                font-weight: bold;
                color: black;
            }

            input[type="text"],
            input[type="email"],
            input[type="password"] {
                width: 100%;
                padding: 10px;
                margin-top: 5px;
                border: 1px solid black;
                border-radius: 5px;
            }

            input[type="checkbox"] {
                margin-right: 10px;
            }

            button {
                background-color: #0077b6;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1.1em;
            }

            button:hover {
                background-color:  #03045e;
            }

            footer {
                background-color: #C9D2F2;
                color: white;
                text-align: center;
                padding: 10px;
                position: fixed;
                width: 100%;
                bottom: 0;
            }

            footer p {
                margin: 0;
            }

            .register-form {
                text-align: left;
            }

            p {
                font-size: 0.9em;
            }

            a {
                color: black;
            }
        </style>
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
                    <form action="/register" method="POST" class="register-form">
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
                        </div>
                        <div class="form-group">
                            <input type="checkbox" id="show-password" onclick="togglePassword()"> 
                            <label for="show-password">Show Password</label>
                        </div>
                        <button type="submit">Register</button>
                    </form>
                    <p>Already have an account? <a href="/login" style="color: #7B97D3;">Login here</a></p>
                </div>
            </section>
        </main>
        <footer>
            <p>&copy; 2024 My Node.js App</p>
        </footer>

        <script>
            function togglePassword() {
                var passwordField = document.getElementById("password");
                var checkBox = document.getElementById("show-password");
                if (checkBox.checked) {
                    passwordField.type = "text"; // Show the password
                } else {
                    passwordField.type = "password"; // Hide the password
                }
            }
        </script>
    </body>
    </html>
    `;
    res.send(htmlContent);
});

// Handle user registration
router.post('/', async (req, res) => {
    const { name, email, password } = req.body;

    const db = getDb(); // Get the MongoDB database instance

    try {
        // Check if the email already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.send('This email is already registered. Please use a different email.');
        }

        // Hash the password and generate a salt
        const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the salt

        // Insert the user into MongoDB with hashed password and salt
        const result = await db.collection('users').insertOne({
            email,
            password: hashedPassword,  // Store hashed password
            salt,  // Optionally, store the salt if needed for specific use cases
            name,
            twofa_secret: speakeasy.generateSecret({ length: 20 }).base32,
            emailVerified: false, // Field to track email verification
            verificationToken: "" // Initialize it as empty
        });

        // After insertion, update with the verification token (which is the insertedId)
        const verificationToken = result.insertedId.toString();

        await db.collection('users').updateOne(
            { _id: result.insertedId },
            { $set: { verificationToken } }
        );

        // Send verification email with token
        const mailOptions = {
            from: 'dayanisandamali977@gmail.com',
            to: email,
            subject: 'Email Verification for Your Account',
            html: `
                <h1>Verify Your Email</h1>
                <p>Thank you for registering! Please click the button below to verify your email address and complete your registration.</p>
                <a href="https://personal-growth-journal.alexlanka.com/verify-email?token=${verificationToken}" 
                   style="display:inline-block; padding: 10px 20px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px;">
                   Verify Email
                </a>
                <p>If the button above doesn't work, please copy and paste this link into your browser:</p>
                <p>https://personal-growth-journal.alexlanka.com/verify-email?token=${verificationToken}</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);

        // QR Code generation for 2FA
        const secret = speakeasy.generateSecret({ length: 20 });
        const data_url = await qrcode.toDataURL(secret.otpauth_url);

        // Respond with SweetAlert2 for success message
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
    } catch (error) {
        console.error('Error during registration:', error);
        res.send('An error occurred during registration. Please try again later.');
    }
});

module.exports = router;
