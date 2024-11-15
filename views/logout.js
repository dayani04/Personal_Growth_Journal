const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

router.get('/', async (req, res) => {
    if (req.session.user) {
        const db = getDb();
        const userId = req.session.user.id;
        const sessionCode = req.session.user.sessionCode;

        console.log(`Attempting to log out user: ${userId} with sessionCode: ${sessionCode}`);

        try {
            // Convert userId string to MongoDB ObjectId
            const objectIdUserId = new ObjectId(userId);

            // Update the log with logoutTime for the current session
            const result = await db.collection('logs').updateOne(
                { userId: objectIdUserId, sessionCode: sessionCode },
                { $set: { logoutTime: new Date() } }
            );

            if (result.matchedCount === 0) {
                console.error(`No log entry found for userId: ${userId}, sessionCode: ${sessionCode}.`);
            } else if (result.modifiedCount === 0) {
                console.error(`Log entry for userId: ${userId}, sessionCode: ${sessionCode} was not updated.`);
            } else {
                console.log(`Successfully logged out user: ${userId}`);
            }

            // Destroy the session
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                    return res.status(500).send('Error logging out. Please try again.');
                }
                console.log(`Session destroyed for user: ${userId}`);
                res.redirect('/login');
            });

        } catch (error) {
            console.error('Error during logout:', error);
            res.status(500).send('An error occurred while logging out. Please try again.');
        }
    } else {
        console.warn('No active session found. Redirecting to login.');
        res.redirect('/login');
    }
});

module.exports = router;
