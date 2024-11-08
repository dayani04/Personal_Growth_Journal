// models/User.js
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('personal_growth_journal', 'your_username', 'your_password', {
    host: 'localhost',
    dialect: 'mysql',
});

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Sync the model with the database (this will create the table if it does not exist)
sequelize.sync();

module.exports = User;
