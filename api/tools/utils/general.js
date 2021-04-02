/**
 * @version 2.0.0
 * @author Equipo Newinntech <sebastian.cardona@gruponetw.com>
 * @copyright 2020 Todos los derechos reservados.
 * @description Script para declarar funciones de proposito general
 */

const fs = require('fs'); // Manejo de File System
const util = require('util'); // Forzar promesas en funciones sincronas
const excel = require('excel4node'); // Generar archivo excel
const uniqid = require('uniqid'); // Genera un nombre unico
const crypto = require('crypto'); // Encriptación
const config = require('../../config/config'); // Configuración

/**
 * @function fileToBase64
 * @description Permite descargar un archivo loca
 */
const fileToBase64 = async (fileName) => {
    let res = {};
    try {
        let pathFile = config.localPath + fileName; // Ruta de archivo local
        let data = fs.readFileSync(pathFile); // Leer data del archivo excel
        fs.unlinkSync(pathFile); // Eliminar archivo permanentemente
        let strBase64 = data.toString('base64'); // Convertir base64 a string
        res = { resp: true, msg: strBase64 };
        console.log(`Archivo convertido a base64: ${fileName}`);
        return res;
    } catch (error) {
        res = { resp: false, msg: 'El archivo no existe.', error };
        console.log(res);
        return res;
    }
}

/**
 * @function getDateWithFormatDatastore
 * @param {Date} date Campo opcional de fecha a organizar
 * @description Obtener fecha con formato m/d/y para facilitar registro en Datastore
 */
const getDateWithFormatDatastore = (date) => {
    let formatDate;
    // Si no se envia una fecha se retorna la fecha actual
    if (!date) {
        formatDate = new Date();
    } else {
        formatDate = date;
    }
    let dd = formatDate.getDate();
    let mm = formatDate.getMonth() + 1;
    let yyyy = formatDate.getFullYear();

    dd = addZero(dd);
    mm = addZero(mm);
    formatDate = mm + '/' + dd + '/' + yyyy;
    return formatDate;

    function addZero(i) {
        if (i < 10) i = '0' + i;
        return i;
    }
}

/**
 * @function getDateWithFormatDMY
 * @param {Date} date Fecha para validar
 * @description Asigna formato de d/m/y a una fecha
 */
const getDateWithFormatDMY = (date) => {
    let dd = date.getDate();
    let mm = date.getMonth() + 1;
    let yyyy = date.getFullYear();

    dd = addZero(dd);
    mm = addZero(mm);

    // Formato para archivo excel
    let newDate = dd + '/' + mm + '/' + yyyy;
    return newDate;

    function addZero(i) {
        if (i < 10) i = '0' + i;
        return i;
    }
}

/**
 * @function createReport
 * @param {Array} headers Lista con los títulos de cada columna
 * @param {Array} listData Lista de datos a mostrar en informe
 * @param {String} nameSheet Nombre de la hoja de excel
 * @description Crea un reporte en un archivo de excel
 */
const createReport = async (headers, listData, nameSheet) => {
    let res = { resp: false, msg: '' };
    try {
        let workbook = new excel.Workbook(); // Crear instancia de la clase Workbook
        let worksheet = workbook.addWorksheet(nameSheet); // Agregar hoja al archivo excel
        let style = workbook.createStyle({ font: { bold: true, size: 14 } }); // Crear estilo para cabecera

        let cell = 1;
        let row = 1;
        headers.forEach(element => {
            worksheet.cell(row, cell).string(element).style(style); // Título de la columna
            cell++;
        });

        // Escribir datos de cada registro
        listData.forEach(register => {
            cell = 1;
            row++;
            // Escribir datos de cada registro
            register.forEach(data => {
                worksheet.cell(row, cell).string(data); // Dato por cada columna y registro
                cell++;
            });
        });

        let fileName = uniqid() + crypto.randomBytes(4).toString('hex') + '.xlsx'; // Nombre único del archivo
        let pathFile = config.localPath + fileName; // Ruta para guardar el archivo
        workbook.writeP = util.promisify(workbook.write); // Asignar la función de escritura como una promesa
        await workbook.writeP(pathFile);
        res = { resp: true, msg: fileName };
        return res;
    } catch (error) {
        res = { resp: false, msg: 'Error al generar reporte.', error };
        return res;
    }
}

module.exports = {
    getDateWithFormatDMY,
    getDateWithFormatDatastore,
    fileToBase64,
    createReport
};
