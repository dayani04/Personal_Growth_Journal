const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const bcrypt = require('bcrypt');

router.get('/', async (req, res) => {
    const { token } = req.query;
    const db = getDb();

    try {
        // Find the pending user with the provided verification token
        const pendingUser = await db.collection('pendingUsers').findOne({ verificationToken: token });

        if (!pendingUser) {
            return res.status(400).send('Invalid token or user not found.');
        }

        // Hash the password (it was already hashed, but we confirm it here just in case)
        const hashedPassword = await bcrypt.hash(pendingUser.password, 10);

        // Move the pending user to the 'users' collection
        const newUser = {
            email: pendingUser.email,
            password: hashedPassword,
            name: pendingUser.name,
            emailVerified: true, // Set the email as verified
            twofa_secret: pendingUser.twofa_secret, // Retain the 2FA secret
        };

        // Insert the user data into the 'users' collection
        const result = await db.collection('users').insertOne(newUser);

        // Remove the user from the 'pendingUsers' collection
        await db.collection('pendingUsers').deleteOne({ _id: pendingUser._id });

        // Inform the user about successful verification
        res.send(`
            <h1>Email Verified Successfully!</h1>
            <p>Your email has been verified. You can now <a href="/login">login here</a>.</p>
        `);
        
    } catch (err) {
        console.error('Error verifying email:', err);
        res.status(500).send('Error verifying email.');
    }
});

module.exports = router;
