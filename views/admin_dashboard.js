const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const isAuthenticated = require('../middleware/isAuthenticated'); // Adjust the path based on your file structure

// Admin dashboard GET route
router.get('/', isAuthenticated, (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard - My Node.js App</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f1f5f9;
                margin: 0;
                padding: 0;
            }
            header {
                background-color: #0077b6;
                color: white;
                text-align: center;
                padding: 20px;
            }
            header h1 {
                margin: 0;
                font-size: 2em;
            }
            nav {
                background-color: #0077b6;
                padding: 15px;
                text-align: center;
            }
            nav button {
                background-color: #005f8a;
                color: white;
                border: none;
                padding: 10px 20px;
                font-size: 1em;
                cursor: pointer;
                border-radius: 5px;
                margin: 10px;
                transition: background-color 0.3s ease;
            }
            nav button:hover {
                background-color: #003f74;
            }
            main {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 30px;
            }
            form {
                background-color: #ffffff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
                margin-bottom: 20px;
            }
            label {
                font-size: 1.2em;
                margin-bottom: 10px;
                display: block;
                color: #333;
            }
            input[type="text"] {
                width: 100%;
                padding: 12px;
                margin-bottom: 20px;
                border-radius: 5px;
                border: 1px solid #ddd;
                font-size: 1em;
            }
            button[type="submit"] {
                width: 100%;
                background-color: #0077b6;
                color: white;
                padding: 12px;
                border: none;
                border-radius: 5px;
                font-size: 1.1em;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            button[type="submit"]:hover {
                background-color: #003f74;
            }
            footer {
                background-color: #0077b6;
                color: white;
                text-align: center;
                padding: 10px 0;
                position: relative;
                width: 100%;
            }
        </style>
    </head>
    <body>
        <header>
            <h1>Admin Dashboard</h1>
        </header>
        <nav>
            <button onclick="window.location.href='/'">Home</button>
            <button onclick="window.location.href='/admin_register'">Add New Admin</button>
            <button onclick="window.location.href='/admin_profile'">Profile</button>
        </nav>
        <main>
            <h2>Add New Category</h2>
            <form action="/admin_dashboard/addCategory" method="POST">
                <label for="categoryName">Category Name:</label>
                <input type="text" id="categoryName" name="categoryName" required>
                <button type="submit">Add Category</button>
            </form>
        </main>
        <footer>
            <p>&copy; 2024 Grow Your Journey</p>
        </footer>
    </body>
    </html>
    `;
    res.send(htmlContent);
});

// Admin dashboard POST route for adding a category
router.post('/addCategory', isAuthenticated, async (req, res) => {
    const { categoryName } = req.body;

    if (!categoryName || categoryName.trim() === '') {
        return res.status(400).send('Category name cannot be empty');
    }

    try {
        const db = getDb();
        const categoriesCollection = db.collection('categories');
        await categoriesCollection.insertOne({ name: categoryName });

        res.redirect('/admin_dashboard');
    } catch (err) {
        console.error('Error adding category:', err);
        res.status(500).send('Error adding category');
    }
});

module.exports = router;
