const express = require('express');
const router = express.Router();
const { getDb } = require('../db');


router.get('/', (req, res) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Update User - My Node.js App</title>
    <!-- SweetAlert2 CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f4f8;
            color: #03045e;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        header {
            background-color: #C9D2F2;
            color: #7B97D3;
            padding: 20px 0;
            text-align: center;
        }
        h1 {
            margin: 0;
            font-size: 2em;
        }
        main {
            flex-grow: 1;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .update-container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
            padding: 20px;
            width: 100%;
            max-width: 500px;
        }
        h2 {
            color: #03045e;
            text-align: center;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            font-size: 1.1em;
            color: black;
            margin-bottom: 8px;
        }
        input, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #7B97D3;
            border-radius: 5px;
            font-size: 1em;
            margin-bottom: 15px;
        }
        button {
            background-color: #0077b6;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 5px;
            font-size: 1.1em;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #03045e;
        }
        a {
            color: #7B97D3;
            text-decoration: none;
            font-size: 1em;
        }
        a:hover {
            text-decoration: underline;
        }
        footer {
            background-color: #C9D2F2;
            color: #7B97D3;
            text-align: center;
            padding: 10px 0;
            margin-top: auto;
        }
    </style>
</head>
<body>
    <header>
        <h1>Update User Information</h1>
         <a href="/dashboard" style="color: #7B97D3; margin: 0 15px; text-decoration: none; font-size: 1.1em;">Back</a>
    </header>
    <main>
        <section class="update-container">
            <div class="update-card">
                <h2>Update Your Account</h2>
                <form id="updateForm" action="/profile/update" method="POST">
                    <div class="form-group">
                        <label for="oldEmail">Old Email:</label>
                        <input type="email" id="oldEmail" name="oldEmail" placeholder="Enter your old email" required>
                    </div>
                    <div class="form-group">
                        <label for="name">Name:</label>
                        <input type="text" id="name" name="name" placeholder="Enter your name">
                    </div>
                    <div class="form-group">
                        <label for="age">Age:</label>
                        <input type="number" id="age" name="age" placeholder="Enter your age">
                    </div>
                    <div class="form-group">
                        <label for="gender">Gender:</label>
                        <select id="gender" name="gender">
                            <option value="" disabled selected>Select your gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="dob">Date of Birth:</label>
                        <input type="date" id="dob" name="dob">
                    </div>
                    <button type="submit">Update</button>
                </form>
                <p><a href="/changeEmail">Do you want to change your Email address?</a></p>
                <p><a href="/changePassword">Do you want to change your password?</a></p>
            </div>
        </section>
    </main>
    <footer>
        <p>&copy; 2024 My Node.js App</p>
    </footer>

    <!-- SweetAlert2 JS -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
        // Handle form submission with AJAX
        document.getElementById('updateForm').addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission

            const formData = new FormData(this);
            const data = {};
            formData.forEach((value, key) => data[key] = value);

            // Send the POST request to the server
            fetch('/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            .then(response => response.text())
            .then(message => {
                // Display success message with SweetAlert2
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: message,
                });
            })
            .catch(error => {
                // Display error message with SweetAlert2
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Error updating the user. Please try again.',
                });
            });
        });
    </script>
</body>
</html>
    `;
    res.send(htmlContent);
});


router.post('/update', async (req, res) => {
    const { oldEmail, name, age, gender, dob } = req.body;

    const db = getDb();

    try {

        const updateData = {};
        if (name) updateData.name = name;
        if (age) updateData.age = parseInt(age, 10);
        if (gender) updateData.gender = gender;
        if (dob) updateData.dob = new Date(dob);


        const result = await db.collection('users').updateOne(
            { email: oldEmail },
            { $set: updateData }
        );


        if (result.modifiedCount === 0) {
            return res.status(404).send('User not found or no changes made.');
        }

        res.send('User updated successfully.');
    } catch (err) {
        console.error('Error updating the user:', err);
        res.status(500).send('Error updating the user.');
    }
});

module.exports = router;
