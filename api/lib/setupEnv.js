require('dotenv').config();
// Configuración de api
const config = require('../config/config');

function getKeyPath() {
    if (process.env.NODE_ENV === 'production') return config.keyPath + process.env.name_sa;
    return config.keyPath + config.key_dev;
}

function getFront() {
    if (process.env.NODE_ENV === 'production') return process.env.front;
    return config.front_dev;
}

function getConfigEmail() {
    return {
        email: process.env.email,
        password: process.env.password
    }
}

module.exports = {
    getKeyPath,
    getFront,
    getConfigEmail
}
