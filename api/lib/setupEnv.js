require('dotenv').config();
// Configuración de api
const config = require('../config/config');

function getKeyPath() {
    // if (process.env.PORT !== 3435) return config.key2Path + config.key_dev;
    return config.keyPath + config.key_dev;
}

function getFront() {
    // if (process.env.PORT !== 3435) return config.front_qa;
    return config.front_dev;
}

function getBucketName() {
    // if (process.env.PORT !== 3435) return process.env.bucketName;
    return config.bucketName_dev;
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
    getConfigEmail,
    getBucketName
}
