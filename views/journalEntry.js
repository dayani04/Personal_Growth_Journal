const express = require('express');
const router = express.Router();
const { getDb } = require('../db');


router.get('/', async (req, res) => {
    const db = getDb();
    try {

        const journalCollection = db.collection('journalEntries');
        const journalEntries = await journalCollection.find({}).toArray();


        let entriesList = journalEntries.map(entry => `
            <li>
                <h3>${entry.title}</h3>
                <p>${entry.content}</p>
                <hr>
            </li>
        `).join('');

        const htmlContent = `
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
                    font-size: 2.5em;
                    text-align: center;
                    padding-top: 20px;
                }
                nav {
                    background-color: #7B97D3;
                    padding: 15px;
                    text-align: center;
                    color: white;
                    position: fixed;
                    top: 0;
                    width: 100%;
                    z-index: 10;
                }
                nav a {
                    color: white;
                    margin: 0 15px;
                    text-decoration: none;
                    font-size: 1.2em;
                    padding: 10px;
                }
                nav a:hover {
                    background-color: #03045e;
                    border-radius: 5px;
                }
                footer {
                    background-color: #C9D2F2;
                    color: #7B97D3;
                    text-align: center;
                    padding: 10px;
                    margin-top: auto;
                }
                button {
                    background-color: #0077b6;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    font-size: 1.2em;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                    margin-bottom: 20px;
                }
                button:hover {
                    background-color: #03045e;
                }
                .container {
                    flex-grow: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 500px;
                }
                label, input, textarea {
                    font-size: 1.1em;
                    margin-bottom: 15px;
                    width: 100%;
                    max-width: 450px;
                }
                input, textarea {
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }
                textarea {
                    resize: vertical;
                }
                ul {
                    list-style-type: none;
                    padding: 0;
                    margin-top: 20px;
                    width: 100%;
                    max-width: 600px;
                }
                li {
                    background-color: #ffffff;
                    margin: 15px 0;
                    padding: 15px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
                }
                h3 {
                    margin: 0;
                    color: #0077b6;
                }
                hr {
                    border: 0;
                    border-top: 1px solid #ccc;
                    margin: 15px 0;
                }
            </style>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Journal Entry - My Node.js App</title>
        </head>
        <body>
            <header>
                <nav>
                    <a href="/dashboard">Dashboard</a>
                    <a href="/journalEntry">Journal Entries</a>
                </nav>
                <h1>Your Journal</h1>
            </header>
            <main class="container">
                <form action="/journalEntry" method="POST">
                    <label for="entryTitle">Title:</label>
                    <input type="text" id="entryTitle" name="entryTitle" required>
                    <label for="entryContent">Content:</label>
                    <textarea id="entryContent" name="entryContent" rows="10" required></textarea>
                    <button type="submit">Add Journal Entry</button>
                </form>
                <h2>Your Previous Entries</h2>
                <ul id="journal-list">
                    ${entriesList}
                </ul>
            </main>
            <footer>
                <p>&copy; 2024 My Node.js App. All rights reserved.</p>
            </footer>
        </body>
        </html>
        `;
        res.send(htmlContent);
    } catch (err) {
        console.error('Error retrieving journal entries:', err);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/', async (req, res) => {
    const { entryTitle, entryContent } = req.body;
    const db = getDb();
    try {

        const journalCollection = db.collection('journalEntries');
        await journalCollection.insertOne({
            title: entryTitle,
            content: entryContent,
            date: new Date()
        });


        res.redirect('/journalEntry');
    } catch (err) {
        console.error('Error saving journal entry:', err);
        res.status(500).send('Failed to save the journal entry');
    }
});

module.exports = router;
