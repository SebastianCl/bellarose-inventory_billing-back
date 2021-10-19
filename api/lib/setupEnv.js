require('dotenv').config();
// Configuración de api
const config = require('../config/config');

function getKeyPath() { return config.keyPath + config.key; }

function getFront() { return config.front; }

function getBucketName() { return config.bucketName; }

function getConfigEmail() {
    return {
        email: process.env.email,
        password: process.env.password
    }
}

module.exports = {
    getKeyPath,
    getFront,
    getConfigEmail,
    getBucketName
}
