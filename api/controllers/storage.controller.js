/**
 * @version 1.0.0
 * @author Sebastian Cardona Loaiza <sebastian.cardona@gruponetw.com>
 * @copyright 2021 Todos los derechos reservados.
 */

/**
* @controller Controlador de empleado
* @description Script principal para el manejo de archivos
*/


const fs = require('fs'); // Dependencia para lectura de archivos temporales
//const Image = require('../models/image.model'); // Modelo de imagen
const storageService = require('../service/storage.service'); // Servicio de storage
const commonService = require('../service/common.service'); // Servicio general
const validateData = require('../tools/utils/validateData'); // Scripts de validaciones
const util = require('../tools/utils/general'); // Scripts generales
const config = require('../config/config'); // Configuración de api


/**
 * @function uploadToStorage
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite subir un archivo de imagen en base64
 */
const uploadToStorage = async (req, res) => {
    let resp = { code: 400, msg: '' };
    try {
        let generalData = req.body;
        // Validar si se envio imagen
        let imageBase64 = generalData.imageBase64;
        if (validateData.isEmpty(imageBase64)) return res.status(400).send({ resp: false, msg: 'Debe enviar la imagen.' });

        // Validar si se enviaron datos de imagen
        let imageData = {
            type: generalData.type,
            nameFile: generalData.nameFile,
            routeFile: generalData.routeFile,
            nameUser: generalData.nameUser
        }

        let response = validateDataImage(imageData, isStandard); // VALIDAR VARIOS CODIGOS SAP
        if (!response.resp) return res.status(400).send(response);

        imageData = response.msg; // Arreglo con datos de imagen
        imageData.imageBase64 = imageBase64;
        // Cargar imagen
        resp = await storageService.uploadToStorage(imageData);
        return res.status(resp.code).send(resp.msg);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send(error.message);
    }
}

/**
 * @function uploadMassiveToStorage
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite subir varios archivos de imagen
 */
const uploadMassiveToStorage = async (req, res) => {
    let resp = { code: 400, msg: '' };
    try {
        // Validar si se enviaron archivos
        let files = req.files.file;
        if (!files) return res.status(400).send({ resp: false, msg: 'Debe enviar las imágenes.' });

        // Validar si se enviaron los datos de las imágenes
        let generalData = req.body;
        if (validateData.isEmpty(generalData.routeFile)) return res.status(400).send({ resp: false, msg: 'Debe enviar los datos de las imágenes.' });

        // Valida si se envio el dato para identificar si es con o sin estandar
        let responseIsStandard = validateIsStandard(generalData.isTemporalRole);
        if (!responseIsStandard.resp) return res.status(400).send(responseIsStandard);

        let isStandard = responseIsStandard.msg; // Booleano para identificar si se carga con estandar o no

        let listFiles = []; // Lista de imágenes
        // Validar si hay al menos más de un archivo
        if (!files.length) {
            // Se crea una nueva lista de una posicion con la imagen enviada
            listFiles.push(files);
        }
        else {
            // Se conserva la lista de imágenes enviadas
            listFiles = files;
        }

        // Validar datos de cada imagen
        let response = {};
        let allImages = []; // Lista con todas las imágenes a subir
        let allBad = [];
        for (let index = 0; index < listFiles.length; index++) {
            const element = listFiles[index];
            let codesSAPArray = JSON.parse(generalData.codSap).filter((elem) => {
                return elem.newNameImage === element.originalFilename.split('.')[0];
            }).map(function(obj) { return obj.data; });
            let imageData = {
                type: element.type.split('/')[1], // Obtener tipo de archivo
                nameFile: element.originalFilename.split('.')[0], // Obtener nombre del archivo
                routeFile: generalData.routeFile,
                codSap: codesSAPArray, // ACTUALIZAR POR ARREGLO
                comments: generalData.comments,
                effectiveEndDate: generalData.effectiveEndDate,
                nameUser: generalData.nameUser,
                commercialDescription: generalData.commercialDescription
            }
            // Validar datos de imagen
            response = validateDataImage(imageData, isStandard);
            imageData = response.msg;
            if (!response.resp) {
                // Guardar nombre y motivo de imagen que no cumple
                allBad.push({ nameFile: imageData.nameFile, motive: response.msg });
            }
            else {
                const pathTemp = element.path;
                const bitmap = fs.readFileSync(pathTemp); // Leer archivo de ruta tempooral
                const imageBase64 = new Buffer.from(bitmap, 'base64'); // Generar base64
                imageData.imageBase64 = imageBase64;
                allImages.push(imageData);
                fs.unlinkSync(pathTemp); // Eliminar archivo temporal permanentemente
            }
        }
        // Si al menos una imagen no cumple no se sube ninguna
        if (!response.resp) return res.status(400).send({ resp: false, msg: allBad });

        // Subir imágenes
        resp = await storageService.uploadMassiveToStorage(allImages);
        return res.status(resp.code).send(resp.msg);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ resp: false, msg: error.message });
    }
}

/**
 * @function downloadAllFolder
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite generar todas las imágenes de una ruta en formato zip
 */
const downloadAllFolder = async (req, res) => {
    try {
        // Se envia desde la invocacion del servicio la ruta de las carpetas
        let ruta = req.headers['ruta'];
        // Validar si se enviaron todos los datos necesarios
        if (validateData.isEmpty(ruta)) {
            return res.status(400).send({ resp: false, msg: "Debe definir una ruta." });
        }
        let response = await storageService.downloadAllFolder(ruta);
        return res.status(response.code).send(response.msg);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send(error.message);
    }
}

/**
 * @function validateConvert
 * @description Valida el tipo, ancho y alto de una imagen para convertir
 */
function validateConvert(type, width, higth) {
    // Validar si se enviaron todos los datos necesarios
    if (validateData.isEmpty(type) || validateData.isEmpty(width) || validateData.isEmpty(higth)) {
        return { resp: false, msg: 'Faltan campos en la solicitud.' };
    }
    if (type !== 'image/png' && type !== 'image/jpeg') {
        return { resp: false, msg: 'Solo se permite convertir en PNG o JPEG.' };
    }
    if (!validateData.isOnlyNumbers(width) || !validateData.isOnlyNumbers(higth)) {
        return { resp: false, msg: 'El ancho y alto deben ser números.' };
    }
    width = Number(width);
    higth = Number(higth);
    if (width > 2000 || higth > 2000) {
        return { resp: false, msg: 'El tamaño maximo es 2000x2000' };
    }
    return { resp: true, msg: 'Campos validos.' };
}

/**
 * @function imgConvert
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite convertir el formato y dimensiones de imagen
 */
const imgConvert = async (req, res) => {
    try {
        let filename = req.body.filename;
        let route = req.body.route;
        let type = req.body.type;
        let width = req.body.width;
        let higth = req.body.higth;

        // Validar si se envio el nombre de imagen y la ruta
        if (validateData.isEmpty(filename) || validateData.isEmpty(route)) {
            return res.status(400).send({ resp: false, msg: 'Debe indicar la ruta y nombre de imagen.' });
        }
        // Validar si se enviaron todos los datos necesarios
        let response = validateConvert(type, width, higth);
        if (!response.resp) {
            return res.status(400).send(response);
        }
        // Convertir imagen
        response = await storageService.imgConvert(filename, type, width, higth, route);
        return res.status(response.code).send(response.msg);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send(error.message);
    }
}

/**
 * @function imgConvertAll
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Permite convertir el formato y dimensiones de varias imágenes
 */
const imgConvertAll = async (req, res) => {
    try {
        let routes = req.body.routes;
        let type = req.body.type;
        let width = req.body.width;
        let higth = req.body.higth;

        // Validar si se enviaron las rutas de imágenes
        if (validateData.isEmpty(routes)) {
            return res.status(400).send({ resp: false, msg: 'Debe enviar las rutas.' });
        }
        if (routes.length === 0) {
            return res.status(400).send({ resp: false, msg: 'Debe indicar la lista de rutas.' });
        }
        // Validar si se paso del limite permitido para redimensionar
        const limitConvert = config.limitConvert;
        if (routes.length > limitConvert) {
            return res.status(400).send({ resp: false, msg: `Solo se pueden redimensionar ${limitConvert} imágenes.` });
        }
        // Validar si se enviaron todos los datos necesarios
        let response = validateConvert(type, width, higth);
        if (!response.resp) {
            return res.status(400).send(response);
        }
        // Convertir varias imágenes
        response = await storageService.imgConvertAll(type, width, higth, routes);
        return res.status(response.code).send(response.msg);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ resp: false, msg: '' });
    }
}

/**
 * @function findImagesWithFilter
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Busca los registro de imágenes por filtro
 */
const findImagesWithFilter = async (req, res) => {
    try {
        let filter = validateData.validateFilter(req.body);
        // Buscar imágenes
        const imageList = await commonService.listModelsWithFilter(Image, filter);
        return res.status(200).send(imageList);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send(error.message);
    }
}

/**
 * @function generateReport
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Genera un reporte en excel con la lista de imágenes en storage
 */
const generateReport = async (req, res) => {
    try {
        let resp = await storageService.generateReport();
        return res.status(200).send(resp);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send(error.message);
    }
}

/**
 * @function generateReportOfFilter
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Genera un reporte en excel con la lista de imágenes en storage por filtro
 */
const generateReportOfFilter = async (req, res) => {
    try {
        let resp = { resp: true, msg: 'Debe indicar los filtros.' };
        // Obtener arreglo de filtros
        let filter = validateData.validateFilter(req.body);
        if (filter.filters.length === 0) return res.status(400).send(resp);

        let response = await storageService.generateReportOfFilter(filter);
        return res.status(response.code).send(response.msg);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send(error.message);
    }
}

/**
 * @function deleteFiles
 * @param {Request} req Obtener parametros de cabecera
 * @param {Response} res Obtener valores del Body
 * @description Elimina imágenes de Storage
 */
const deleteImages = async (req, res) => {
    try {
        let listImagesID = req.body['listImagesID'];
        // Validar si se enviaron todos los datos necesarios
        if (validateData.isEmpty(listImagesID)) {
            return res.status(400).send({ resp: false, msg: 'Debe indicar la lista de imágenes.' });
        }
        if (listImagesID.length === 0) {
            return res.status(400).send({ resp: false, msg: 'Debe enviar la lista de imágenes.' });
        }

        // Validar si existen los ID
        let sw, badID, listImages = [];
        let response;
        for (let i = 0; i < listImagesID.length; i++) {
            let imageID = listImagesID[i];

            response = await commonService.getModel(Image, imageID);
            if (!response.resp) {
                sw = false;
                badID = imageID;
                break
            }
            sw = true;
            // Guardar información de la imagen
            let image = {
                id: response.msg.id,
                name: `${response.msg.category}/${response.msg.line}/${response.msg.brand}/${response.msg.gtin}/${response.msg.name}`
            }
            listImages.push(image);
        }
        if (!sw) {
            return res.status(400).send({ resp: false, msg: `No existe imagen con id: ${badID}` });
        }

        response = await storageService.deleteAndBackup(listImages);
        return res.status(response.code).send(response.msg);
    } catch (error) {
        console.log(error.message);
        return res.status(500).send(error.message);
    }
}

// Exportar funciones
module.exports = {
    uploadToStorage,
    uploadMassiveToStorage,
    downloadAllFolder,
    generateReportOfFilter,
    findImagesWithFilter,
    deleteImages
};
