/**
 * @version 2.0.0
 * @author Sebastian Cardona Loaiza <cardonaloaizasebastian112@gmail.com>
 * @copyright 2021 Todos los derechos reservados.
 * @description Script principal para las operaciones con imágenes
 */

const stream = require('stream'); // Manejo de archivo
const env = require('../lib/setupEnv'); // Cargar configuración de api
const gcp = require('../lib/connectGCP'); // Conexión con Google

// Cliente Storage
const bucketName = env.getBucketName(); // Obtener nombre del bucket
const storage = gcp.conectionStorage(); // Conexion a storage
const bucket = storage.bucket(bucketName); // Conexión al bucket

/**************************
 * FUNCIONES SUBIR ARCHIVO  *
 **************************/

/**
 * @function subirArchivoBase64
 * @description Permite subir un archivo de imagen a Storage
 */
async function subirArchivoBase64(imageData) {
    let res = { resp: false, code: 400, msg: '' };
    try {
        let image = imageData.imageBase64;
        let formatImg = 'png'; // imageData.formatImg;
        let nameFile = imageData.nameFile;
        let routeFile = imageData.routeFile;

        let bufferStream = new stream.PassThrough(); // Armamos las propiedades del archivo base64
        let fileFullName = nameFile + "." + formatImg;
        bufferStream.end(Buffer.from(image, 'base64'));

        let file = bucket.file(routeFile + "/" + fileFullName); // Definir el nombre del archivo
        // Metadata del archivo
        let configMetadata = {
            metadata: {
                contentType: 'image/' + formatImg,
                metadata: {
                    custom: 'metadata'
                }
            },
            public: true, // Validacion para hacer pública la URL de la imagen
            resumable: true,
            validation: 'crc32c'
        };
        let write = new Promise(function (resolve, reject) {
            bufferStream.pipe(file.createWriteStream(configMetadata))
                .on('error', async function (err) {
                    reject(err);
                })
                .on('finish', async function () {
                    let routeFileStorage = file.name; // Ruta de Storage de la imagen
                    res.resp = true;
                    res.msg = routeFileStorage;
                    resolve();
                });
        });
        await write;
        return res;
    } catch (error) {
        console.log(error);
        res.msg = error;
        return res;
    }
}

/**
 * @function suggestionsList
 * @description Subir imagen nueva o versionada
 */
const uploadToStorage = async (imageData) => {
    let res = { code: 400, msg: '' };

    let response = await subirArchivoBase64(imageData);

    // Valida si subio la nueva imagen
    if (!response.resp) {
        res.msg = { resp: false, msg: response.msg };
        return res;
    }

    const routeFileStorage = response.msg;
    res.msg = { resp: true, msg: routeFileStorage };
    res.resp = true;
    return res;
}
/**************************
 * fin FUNCIONES SUBIR ARCHIVO  *
 **************************/

/**
* @function renameFile
* @description Permite renombrar un archivo de Storage
*/
async function renameFile(srcFilename, destFilename) {
    let res = { resp: false, msg: '' };
    try {
        await bucket.file(srcFilename).move(destFilename); // Renombrar imagen
        const file = bucket.file(destFilename); // Hacer pública la URL de la imagen
        await file.makePublic();

        res = { resp: true, msg: 'Imagen renombrada.' };
        return res;
    } catch (error) {
        res.msg = 'Fallo al renombrar.';
        return res;
    }
}

/**
 * @function deleteFile
 * @description Permite eliminar un archivo de Storage
 */
async function deleteFile(filePathName) {
    let res = { resp: false, msg: '' };
    try {
        await bucket.file(filePathName).delete();
        res = { resp: true, msg: 'Imagen eliminada' };
        console.log(`Imagen eliminada de: ${filePathName}`);
        return res;
    } catch (error) {
        res = { msg: error };
        return res;
    }
}

module.exports = {
    uploadToStorage,
    renameFile,
    deleteFile
}
