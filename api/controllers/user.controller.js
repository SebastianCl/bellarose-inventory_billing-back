/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de usuarios
* @description Script NODEJS que permite realizar operaciones sobre los usuarios registrados. Utilizamos 
*              como servicio la base de datos no relacional Google Cloud DataStore.
*/

/**************************
 * INCIO DEPENDENCIAS     *
 **************************/
const User = require('../models/user.model');
const Role = require('../models/role.model');
/**************************
 * FIN DEPENDENCIAS       *
 **************************/
//Autenticación JWT
const auth = require('../auth/securityJWT');

// Servicio
const commonService = require('../service/common.service');
const userService = require('../service/user.service');

/**
 * @function getLogin
 * @description Permite autenticar al usuario con la clave. Se retorna un token valido
 */
const getLogin = async (req, res) => {
    try {
        // Obtener credenciales
        const email = req.body.user; // email del usuario
        const password = req.body.password; // clave de usuario
        const resp = await userService.getLogin(email, password);
        res.status(resp.code).send(resp.msg);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function createUser
 * @description Permite crear un usuario nuevo en el DataStore
 */
const createUser = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        //if (!resToken.resp) return res.status(401).send(resToken);

        let response = {};
        let data = req.body;
        let email = data.email;
        let role = data.role;
        let password = data.password;
        // Validar el email 
        if (email === undefined) return res.status(400).send({ resp: false, msg: 'Debe indicar el email del usuario.' });
        // Validar el rol
        if (role === undefined) return res.status(400).send({ resp: false, msg: 'Debe indicar el rol del usuario.' });
        // Validar el email 
        if (password === undefined) return res.status(400).send({ resp: false, msg: 'Debe indicar la clave del usuario.' });
        // Buscar si existe un usuario registrado con el correo enviado
        let user = await userService.findByEmail(email);
        if (user.length > 0) return res.status(400).send({ resp: false, msg: `El email ${email} esta en uso.` });

        const entityData = User.sanitize(data);
        response = await userService.createUser(entityData);
        res.status(response.code).send({ resp: response.resp, msg: response.msg });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message || error.msg });
    }
};

/**
 * @function updateUser
 * @description Permite actualizar un usuario especifico por ID
 */
const updateUser = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);

        let id = req.headers['id'];
        // Validar si se envio el id
        if (id === undefined) return res.status(400).send({ resp: false, msg: 'Debe indicar el id del usuario.' });
        let me = await commonService.getModel(User, id);
        // Valida que exista el usuario
        if (me.resp === false) return res.status(400).send({ resp: false, msg: `No existe usuario con id: ${id}.` });

        const entityData = req.body;

        let email = entityData['email'];
        // Valida el email 
        if (email) {
            // Validar si se va a cambiar de email
            if (me.msg.email !== email) {
                let user = await userService.findByEmail(req.body.email);
                // Validar si el nuevo email no esta en uso
                if (user.length > 0) return res.status(400).send({ resp: false, msg: `El email ${email} esta en uso.` });
            }
        }

        const response = await userService.updateUser(entityData, id);
        res.status(response.code).send({ resp: response.resp, msg: response.msg });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getUsers
 * @description Permite listar todos los usuarios registrados
 */
const getUsers = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);
        const userList = await commonService.getModels(User);
        res.status(200).send(userList);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getUser
 * @description Permite obtener un usuario filtrado por ID. Para este proyecto no sera necesario utilizarlo
 */
const getUser = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);
        let id = req.headers['id'];
        const response = await commonService.getModel(User, id);
        if (!response.resp) {
            res.status(400).send(response);
        }
        res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function deleteUser
 * @description Permite eliminar un usuario especifico por ID
 */
const deleteUser = async (req, res) => {
    try {
        // Validar el token 
        let resToken = auth.verifyToken(req);
        if (!resToken.resp) return res.status(401).send(resToken);
        let id = req.headers['id'];
        const user = await commonService.deleteModel(User, id);
        res.status(200).send(user);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getRoles
 * @description Permite obtener la lista de roles
 */
const getRoles = async (req, res) => {
    try {
        const roleList = await commonService.getModels(Role);
        return res.status(200).send(roleList);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function getRole
 * @description Permite obtener un rol filtrado por ID.
 */
const getRole = async (req, res) => {
    try {
        let id = req.headers['id'];
        const response = await commonService.getModel(Role, id);
        if (!response.resp) return res.status(400).send(response);
        return res.status(200).send(response);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};

/**
 * @function createRole
 * @description Permite crear un rol nuevo en DataStore
 */
const createRole = async (req, res) => {
    try {
        const data = Role.sanitize(req.body);
        const role = await commonService.createModel(Role, data);
        return res.status(200).send(role);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};


/**
 * @function deleteRole
 * @description Permite eliminar un rol especifico por ID
 */
const deleteRole = async (req, res) => {
    try {
        let id = req.headers['id'];
        const user = await commonService.deleteModel(Role, id);
        return res.status(200).send(user);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ resp: false, msg: error.message });
    }
};


//Exportar funciones
module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getLogin,
    getRoles,
    getRole,
    createRole,
    deleteRole
};
