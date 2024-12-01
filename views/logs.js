const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const isAuthenticated = require('../middleware/isAuthenticated');


router.get('/',isAuthenticated, async (req, res) => {
    const db = getDb();
    
    try {
        const logs = await db.collection('logs').find({}).toArray();
        let logsHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>User Login/Logout Logs</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color:  #f9f9f9;
                    color: #03045e;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                header {
                    background-color: #C9D2F2;
                    color: white;
                    padding: 20px 0;
                    text-align: center;
                }
                h1 {
                    margin: 0;
                    font-size: 2em;
                }
                table {
                    width: 80%;
                    margin: 20px auto;
                    border-collapse: collapse;
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                }
                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #7B97D3;
                }
                th {
                    background-color: #7B97D3;
                    color: white;
                }
                td {
                    background-color: #f9f9f9;
                }
                tr:nth-child(even) td {
                    background-color: #e3e9f0;
                }
                tr:hover td {
                    background-color: #d6d6e6;
                }
                footer {
                    background-color:  #C9D2F2;
                    color: white;
                    text-align: center;
                    padding: 10px 0;
                    position: fixed;
                    width: 100%;
                    bottom: 0;
                }
            </style>
        </head>
        <body>
            <header>
                <h1>User Login/Logout Logs</h1>
                <a href="/dashboard" style="color: #7B97D3; margin: 0 15px; text-decoration: none; font-size: 1.1em;">Back</a>
            </header>
            <main>
                <table>
                    <tr>
                        <th>Login Time</th>
                        <th>Logout Time</th>
                        <th>Device</th>
                    </tr>`;
        logs.forEach(log => {
            logsHtml += `<tr>
                <td>${log.loginTime}</td>
                <td>${log.logoutTime ? log.logoutTime : 'Still logged in'}</td>
                <td>${log.device}</td>
            </tr>`;
        });

        logsHtml += `</table>
            </main>
            <footer>
                <p>&copy; 2024 My Node.js App</p>
            </footer>
        </body>
        </html>`;

        res.send(logsHtml);
    } catch (err) {
        console.error('Error retrieving logs:', err);
        res.status(500).send('Error retrieving logs');
    }
});

module.exports = router;
