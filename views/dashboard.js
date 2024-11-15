const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', async (req, res) => {

        if (req.session.user) {
            // Render the dashboard page with user data
            res.render('dashboard', { user: req.session.user });
        } else {
            res.redirect('/login');  // Redirect if user is not logged in
        }
    const db = getDb();
    let categoriesList = '';

    try {
        const categoriesCollection = db.collection('categories');
        const categories = await categoriesCollection.find({}).toArray();


        categoriesList = categories.map(category => `
            <div class="category-card">
                <h3>${category.name}</h3>
                <button class="view-category">View</button>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error fetching categories:', err);
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Dashboard - My Node.js App</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f1f5f9;
                margin: 0;
                padding: 0;
            }
            header {
                background-color: #C9D2F2;
                color: white;
                text-align: center;
                padding: 20px;
            }
            header h1 {
                margin: 0;
                font-size: 2em;
            }
            nav {
                background-color:#C9D2F2;
                padding: 15px;
                text-align: center;
            }
            button {
                background-color: #0077b6;
                color: white;
                border: none;
                padding: 10px 20px;
                font-size: 1em;
                cursor: pointer;
                border-radius: 5px;
                margin: 10px;
                transition: background-color 0.3s ease;
            }
            button:hover {
                background-color: #003f74;
            }
            main {
                padding: 30px;
            }
            .category-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            .category-card {
                background-color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                transition: transform 0.3s ease;
            }
            .category-card:hover {
                transform: translateY(-10px);
            }
            .category-card h3 {
                font-size: 1.4em;
                margin-bottom: 10px;
                color: #0366d6;
            }
            .category-card button {
                background-color: #36b37e;
                color: white;
                border: none;
                padding: 12px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1.1em;
            }
            .category-card button:hover {
                background-color: #2d9c60;
            }
            footer {
                background-color: #C9D2F2;
                color: #7B97D3;
                text-align: center;
                padding: 10px 0;
                position: relative;
                width: 100%;
            }
        </style>
    </head>
    <body>
        <header>
            <h1>Welcome to Your Dashboard</h1>
        </header>
        <nav>
            <button onclick="window.location.href='/profile'">Profile</button>
            <button onclick="window.location.href='/logs'">Activity</button>
            <button onclick="window.location.href='/logout'">Logout</button>
            <button onclick="window.location.href='/'">Home</button>
        </nav>
        <main>
            <p>You are logged in!</p>
            <h2>Categories</h2>
            <div class="category-grid">
                ${categoriesList}
            </div>
            <div>
                <button onclick="window.location.href='/journalEntry'">Journal Entry</button>
                <button onclick="window.location.href='/goalsManagement'">Goals Management</button>
            </div>
        </main>
        <footer>
            <p>&copy; 2024 Grow Your Journey</p>
        </footer>
    </body>
    </html>
    `;
    res.send(htmlContent);
});

module.exports = router;
