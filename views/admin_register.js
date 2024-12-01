const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { getDb } = require('../db');
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthenticated');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'dayanisandamali977@gmail.com',
        pass: 'ogyp vmbk nfow wytw',
    },
});

router.get('/',isAuthenticated,  (req, res) => {
    const htmlContent = `
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Register - My Node.js App</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #f9fafb;
                    color: #334155;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                h1 {
                    color: #4f6d7a;
                    font-size: 2em;
                    text-align: center;
                    margin-bottom: 10px;
                }
                nav {
                    background-color:  #7B97D3;
                    padding: 15px;
                    text-align: center;
                    color: white;
                }
                nav a {
                    color: #f1f5f9;
                    margin: 0 15px;
                    text-decoration: none;
                    font-size: 1.1em;
                }
                nav a:hover {
                    text-decoration: underline;
                }
                footer {
                    background-color:  #7B97D3;
                    color: #f1f5f9;
                    text-align: center;
                    padding: 12px 0;
                    position: relative;
                    width: 100%;
                    margin-top: auto;
                }
                form {
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                    max-width: 450px;
                    width: 100%;
                    margin: 30px auto;
                }
                label {
                    font-size: 1.1em;
                    margin-bottom: 8px;
                    display: block;
                    color: #333;
                }
                input[type="email"], input[type="text"], input[type="password"] {
                    width: 100%;
                    padding: 12px;
                    margin: 12px 0 20px 0;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 1em;
                    box-sizing: border-box;
                    background-color: #f9fafb;
                }
                button {
                    background-color: #3498db;
                    color: white;
                    padding: 14px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 1.1em;
                    cursor: pointer;
                    width: 100%;
                    transition: background-color 0.3s ease;
                }
                button:hover {
                    background-color: #2980b9;
                }
                .container {
                    flex-grow: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                p {
                    text-align: center;
                    font-size: 1em;
                    color: #555;
                }
                a {
                    color: #3498db;
                    text-decoration: none;
                    font-weight: bold;
                }
                a:hover {
                    text-decoration: underline;
                }
                #password-warning {
                    color: #e74c3c;
                    font-size: 0.9em;
                    display: none;
                    text-align: center;
                    margin-top: -10px;
                }
                #email-warning {
                    color: #e74c3c;
                    font-size: 0.9em;
                    display: none;
                    text-align: center;
                    margin-top: -10px;
                }
            </style>
        </head>
        <body>
            <header>
                <h1>ADD NEW ADMINS</h1>
            </header>

            <nav>
                <a href="/">Home</a>
            </nav>

            <main class="container">
                <form action="/admin_register" method="POST" onsubmit="return validatePassword()">
                    <label for="name">Full Name</label>
                    <input type="text" name="name" id="name" placeholder="Enter your name" required>

                    <label for="email">Email Address</label>
                    <input type="email" name="email" id="email" placeholder="Enter your email" required>
                    <p id="email-warning">This email is already registered. Please use a different email.</p>

                    <label for="password">Password</label>
                    <input type="password" name="password" id="password" placeholder="Enter a strong password" required>
                    <p id="password-warning">Password must be at least 8 characters long, contain a mix of uppercase, lowercase, numbers, and special characters.</p>

                    <button type="submit">Register</button>
                </form>
            </main>

            <footer>
                <p>&copy; 2024 My Node.js App. All Rights Reserved.</p>
            </footer>

            <script>
                function validatePassword() {
                    const password = document.getElementById("password").value;
                    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
                    if (!strongPassword.test(password)) {
                        document.getElementById("password-warning").style.display = "block";
                        return false;
                    }
                    return true;
                }
            </script>
        </body>
    </html>
    `;
    res.send(htmlContent);
});

router.post('/',isAuthenticated, async (req, res) => {
    const { name, email, password } = req.body;

    const db = getDb();

    try {
        const existingAdmin = await db.collection('admins').findOne({ email });
        if (existingAdmin) {
            return res.send('<script>document.getElementById("email-warning").style.display = "block";</script>');
        }
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await db.collection('admins').insertOne({
            name: name,
            email: email,
            password: hashedPassword,
            salt: salt,
        });
        
        const mailOptions = {
            from: 'dayanisandamali977@gmail.com',
            to: email,
            subject: 'Welcome to the Admin Panel',
            html: `
                <h1>Welcome to your Admin Journey!</h1>
                <p>Dear ${name},</p>
                <p>Congratulations on becoming an admin. You're now part of an amazing team that will help drive our mission forward!</p>
                <p>Your journey is just beginning, and we're excited to have you on board. Let’s build something incredible together!</p>
                <p>Best Regards,<br/> The Team</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.redirect('/login');
    } catch (err) {
        console.error('Error saving the admin:', err);
        res.send('Error saving the admin. Please try again.');
    }
});

module.exports = router;
