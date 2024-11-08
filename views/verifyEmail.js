const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', async (req, res) => {
    const { token } = req.query;
    const db = getDb();

    try {

        const user = await db.collection('users').findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).send('Invalid token or user not found.');
        }


        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { emailVerified: true }, $unset: { verificationToken: "" } }
        );

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
