const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Grow Your Journey</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <header>
                <h1>Empower Yourself and Grow Your Journey</h1>
                <nav>
                    <button onclick="window.location.href='/register'">Register</button>
                    <button onclick="window.location.href='/login'">Login</button>
                </nav>
            </header>
            <main>
                <section class="hero">
                <div class="hero-text">
                        <p>Welcome to Grow Your Journey, the ultimate tool for personal growth and self-improvement. Our platform is designed to help you reflect on your experiences, set meaningful goals, and track your progress as you navigate life’s journey. Whether you're looking to build better habits, achieve personal milestones, or simply reflect on daily moments, this app is your space to cultivate growth at your own pace.

By providing a simple yet powerful journaling and goal management system, Grow Your Journey empowers you to take control of your life’s direction. Start writing your story today, set clear goals for tomorrow, and monitor your transformation along the way. Your journey of personal development begins here!</p>
                    </div>
                </section>
                <section class="features">
    <div class="feature-content">
        <div class="feature">
            <img src="/images/image5.png" alt="Feature 1" />
            <h3>Set Goals</h3>
            <p>Define your personal and professional goals and track your progress.</p>
        </div>
        <div class="feature">
            <img src="/images/image1.png" alt="Feature 2" />
            <h3>Reflect</h3>
            <p>Take time to reflect on your daily experiences and insights.</p>
        </div>
        <div class="feature">
            <img src="/images/image4.png" alt="Feature 3" />
            <h3>Track Progress</h3>
            <p>Monitor your achievements and milestones on your growth journey.</p>
        </div>
        
    </div>
</section>


            </main>
            <footer>
                <p>&copy; 2024 Grow Your Journey</p>
            </footer>
        </body>
        </html>
    `);
});

module.exports = router;
