const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const isAuthenticated = require('../middleware/isAuthenticated');


router.get('/',isAuthenticated, async (req, res) => {
    const db = getDb();
    try {

        const goalsCollection = db.collection('goals');
        const goals = await goalsCollection.find({}).toArray();


        let goalsList = goals.map(goal => `<li>${goal.goal}</li>`).join('');

        const htmlContent = `
        <html>
        <head>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #f0f4f8;
                    color: #03045e;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                nav {
                    background-color: #C9D2F2;
                    padding: 10px 0;
                    text-align: center;
                }
                nav a {
                    color: #03045e;
                    text-decoration: none;
                    margin: 0 20px;
                    font-size: 1.2em;
                }
                nav a:hover {
                    text-decoration: underline;
                }
                .container {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                footer {
                    background-color: #C9D2F2;
                    color: #7B97D3;
                    text-align: center;
                    padding: 15px 0;
                    position: relative;
                    width: 100%;
                    margin-top: auto;
                }
                button {
                    background-color: #0077b6;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    font-size: 1.1em;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                    width: 200px;
                    margin-top: 20px;
                }
                button:hover {
                    background-color: #03045e;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    max-width: 500px;
                }
                label, input {
                    font-size: 1.1em;
                    margin-bottom: 15px;
                    width: 100%;
                    padding: 10px;
                    border-radius: 5px;
                    border: 1px solid #ccc;
                }
                ul {
                    list-style-type: none;
                    padding: 0;
                    width: 100%;
                    margin-top: 20px;
                }
                li {
                    background-color: #fff;
                    margin: 10px 0;
                    padding: 15px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }
                hr {
                    border: 0;
                    border-top: 1px solid #ccc;
                    margin: 10px 0;
                }
                .goals-list {
                    width: 100%;
                    max-width: 600px;
                    margin-top: 20px;
                }
            </style>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Goals Management - My Node.js App</title>
        </head>
        <body>
            <nav>
                <a href="/dashboard">Dashboard</a>
                <a href="/goalsManagement">Goals</a>
                <a href="/settings">Settings</a>
            </nav>
            <main class="container">
                <form action="/goalsManagement" method="POST">
                    <label for="goal">Add New Goal:</label>
                    <input type="text" id="goal" name="goal" placeholder="Enter your new goal" required>
                    <button type="submit">Add Goal</button>
                </form>
                <div class="goals-list">
                    <h2>Your Goals</h2>
                    <ul id="goals-list">
                        ${goalsList}
                    </ul>
                </div>
            </main>
            <footer>
                <p>&copy; 2024 My Node.js App - All rights reserved</p>
            </footer>
        </body>
        </html>
        `;
        res.send(htmlContent);
    } catch (err) {
        console.error('Error retrieving goals:', err);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/',isAuthenticated, async (req, res) => {
    const { goal } = req.body;
    const db = getDb();
    try {

        const goalsCollection = db.collection('goals');
        await goalsCollection.insertOne({
            goal: goal,
            date: new Date()
        });

        res.redirect('/goalsManagement');
    } catch (err) {
        console.error('Error saving goal:', err);
        res.status(500).send('Failed to save the goal');
    }
});

module.exports = router;
