// Autenticación JWT
const auth = require('../auth/securityJWT');

// Modelos
const User = require('../models/user.model');
const Role = require('../models/role.model');

// Libreria de encriptación
const bcrypt = require('bcrypt-nodejs');

// Servicio general
const commonService = require('../service/common.service');


const getLogin = async (email, password) => {
    let res = { code: 0, msg: {} };
    const filter = { filters: [['email', email]] };
    // Realizar filtro para buscar el usuario por email
    let listUser = await commonService.listModelsWithFilter(User, filter);

    // Valida si se devolvio un usuario
    if (listUser.resp === false) {
        res.code = 400;
        res.msg = { resp: false, msg: "Unregistered user." }
        return res;
    }

    if (listUser.msg[0].active === false) {
        res.code = 200;
        res.msg = { resp: false, msg: "Inactive User." }
        return res;
    }

    // Valida las credenciales del usuario, se envia la entidad de Datastore
    let validationUser = auth.validateUser(listUser.msg[0], password);
    if (validationUser.resp === true) {
        res.code = 200;
    } else {
        res.code = 400;
    }
    res.msg = validationUser;
    return res;
};


/**
 * @function hashPassword
 * @description Permite guardar la clave de forma segura en la base de datos
 */
async function hashPassword(password) {
    if (!password) return Promise.resolve();
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(5, function onSalt(err, salt) {
            if (err) return reject(err);
            bcrypt.hash(password, salt, null,
                function onHash(error, hash) {
                    if (error) return reject(error);
                    return resolve(hash);
                });
        });
    });
}

// Validar si el id enviado pertenece a un rol existente
async function processRol(dataRole) {
    let res = { code: 400, msg: {} };

    let userData = {};
    let roleId = dataRole; // Obtener el id del rol

    let role = await commonService.getEntityKey(Role, roleId);
    if (!role.resp) {
        res.msg = { resp: false, msg: `El rol con id ${roleId} no existe.` };
        return res;
    }

    // Asignar la entidad rol como una propiedad del usuario
    userData.role = role.msg;
    res.code = 200;
    res.msg = userData;
    return res;
}

const createUser = async (data) => {
    let res = { resp: false, code: 0, msg: {} };

    let userData = data;

    // Validar el rol
    let response = await processRol(data.role);
    if (response.code !== 200) {
        res.code = response.code;
        res.msg = response.msg;
        return res;
    }
    // Asignar llave de rol
    userData.role = response.msg.role;

    // Encriptar contraseña
    let hash = await hashPassword(data.password);
    userData.password = hash;

    const user = new User(userData);
    await user.save()
        .then((entity) => {
            res.resp = true;
            res.code = 200;
            res.msg = entity.plain();
        })
        .catch((err) => {
            res.code = 500;
            res.msg = err;
        })
    return res;
}

const updateUser = async (data, id) => {
    let res = { code: 0, resp: false, msg: {} };
    let newUserData = data;
    // Si se recibe una contraseña se encripta
    if (data.password) {
        let hash = await hashPassword(data.password);
        newUserData.password = hash;
    }

    let userId = Number(id);
    // Actualizar información del usuario
    await User.update(userId, newUserData)
        .then((entity) => {
            res.resp = true;
            res.code = 200;
            res.msg = entity.plain();
        })
        .catch((err) => {
            res.code = 500;
            res.msg = err;
        })
    return res;
}

const findByEmail = async (email) => {
    let res;
    // Buscar si existe un usuario asociado al correo electronico
    await User.list({ filters: [['email', email]] })
        .then((entityUser) => {
            res = entityUser.entities;
        })
        .catch(err => { res = err })
    return res;
}

module.exports = {
    getLogin,
    createUser,
    updateUser,
    findByEmail
}
