import { readFileSync } from 'fs'
import { decode } from 'iconv-lite'
import builder from 'debug'

const debug = builder('dbf-js');
const Config = { encoding: "gb18030" };

const Versions = {
    0x02: 'FoxBase 1.0',
    0x03: 'FoxBase 2.x / dBaseIII',
    0x83: 'FoxBase 2.x / dBaseIII with memo file',
    0x30: 'Visual FoxPro',
    0x31: 'Visual FoxPro with auto increment',
    0x32: 'Visual FoxPro with varchar/varbinary',
    0x43: 'dBASE IV SQL Table, no memo file',
    0x63: 'dBASE IV SQL System, no memo file',
    0x8b: 'dBASE IV with memo file',
    0xcb: 'dBASE IV SQL Table with memo file',
    0xfb: 'FoxPro 2',
    0xf5: 'FoxPro 2 with memo file'
};

function ensureEncoding(encoding) {
    if(encoding) Config.encoding = encoding;
}

/**
 * read multi version dbf file header.
 *
 * @param filename
 * @param encoding
 *
 * reference link:
 *   http://www.independent-software.com/dbase-dbf-dbt-file-format.html
 *   https://www.dbf2002.com/dbf-file-format.html
 */
function parseHeader(filename, encoding = "gb18030") {

    let header = {};

    ensureEncoding(encoding);
    let buffer = readFileSync(filename);
    header.version = bufferToInteger(buffer.slice(0,1));              //bits 00
    debug('[INFO ] dbf version %o', Versions[header.version]);
    header.dataOffset = 0;
    if(header.version===0x30 || header.version===0x31 || header.version===0x32) header.dataOffset = 263;

    header.dateUpdated = bufferToDate(buffer.slice(1,4));             //bits 01-03
    header.recordNumbers = bufferToInteger(buffer.slice(4,8));        //bits 04-07
    header.headerByteCost = bufferToInteger(buffer.slice(8,10));      //bits 08-09
    header.fieldNumber = (header.headerByteCost - header.dataOffset - 32 -1) / 32;
    header.recordByteCost = bufferToInteger(buffer.slice(10,12));     //bits 10-11
    //header.reserved1 = bufferToInteger(buffer.slice(12,14));        //bits 12-13
    //header.unfinishedOp = bufferToInteger(buffer.slice(14,15));     //bits 14
    //header.encryption = bufferToInteger(buffer.slice(15,16));       //bits 15
    //header.multiUsers = bufferToInteger(buffer.slice(16,28));       //bits 16-27
    header.mdxFlag = bufferToInteger(buffer.slice(28,29));            //bits 28
    header.codePage = bufferToInteger(buffer.slice(29,30));           //bits 29
    //debug('[DEBUG] code page = %o', header.codePage);
    //header.reserved2 = bufferToInteger(buffer.slice(30,31));        //bits 30-31
    let fields = [];                                                  //bits 32 - X
    for(let i=0; i<header.fieldNumber; i++) {
        fields.push(buffer.slice(32 + i * 32, 32 + i * 32 + 32));
    }
    header.fields = fields.map(parseField);
    header.endFlag = bufferToInteger(buffer.slice(header.headerByteCost-header.dataOffset-1, header.headerByteCost-header.dataOffset)); //bits X + 1
    if(header.endFlag !== 0x0d) {
        debug('[WARN ] end flag is not 0x0d, = %o', header.endFlag);
    }
    return header;
}


/**
 * read multi version dbf file.
 *
 * @param filename
 * @param encoding
 *
 * reference link:
 *   http://www.independent-software.com/dbase-dbf-dbt-file-format.html
 *   https://www.dbf2002.com/dbf-file-format.html
 */
function parse(filename, encoding="gb18030") {

    ensureEncoding(encoding);
    let header = parseHeader(filename);
    let data = [];
    let buffer = readFileSync(filename);
    //DATA
    let sequenceNumber = 0;
    for(let i=0; i<header.recordNumbers; i++) {
        let offset = header.headerByteCost;
        let rowBuf = buffer.slice(offset + i * header.recordByteCost, offset + (i+1) * header.recordByteCost);
        data.push(parseRecord(++sequenceNumber, rowBuf, header));
    }
    return {header, data};
}

function bufferToInteger(buffer) {
    return buffer.readUIntLE(0, buffer.length);
}

function bufferToDouble(buffer) {
    return buffer.readDoubleLE(0, buffer.length);
}

function bufferToBoolean(buffer) {
    return (buffer.readUIntLE(0, buffer.length)===1 ? true : false);

}

function bufferToString(buffer) {
    return decode(buffer, Config.encoding).replace(/[\u0000]+$/, '').trim();
}

function bufferToDate(buffer, fix= false) {
    let year  = bufferToInteger(buffer.slice(0, 1)) + 2000;
    let month = bufferToInteger(buffer.slice(1, 2)) - 1;
    let date  = bufferToInteger(buffer.slice(2, 3));
    return new Date(year, month, date);
}

function parseField(buffer) {
    let title = {};
    title.name = bufferToString(buffer.slice(0,11));          //bits 00-10
    title.type = bufferToString(buffer.slice(11,12));         //bits 11
    title.address = bufferToInteger(buffer.slice(12, 16));    //bits 12-15
    title.size = bufferToInteger(buffer.slice(16,17));        //bits 16
    title.precision = bufferToInteger(buffer.slice(17,18));   //bits 17
    //title.reserved =                                        //bits 18-19, 21-30
    title.workAreaId = bufferToInteger(buffer.slice(20, 21)); //bits 20
    title.mdxFlag =    bufferToInteger(buffer.slice(31, 32)); //bits 31
    return title;
}

function parseRecord(sequenceNumber, buffer, header) {
    let record = {
        '@sequenceNumber': sequenceNumber,
        '@deleted': buffer[0]===0x2a || buffer[0]==='*'
    };
    buffer = buffer.slice(1, buffer.length);
    for(let i=0; i<header.fieldNumber; i++) {
        let field = header.fields[i];
        record[field.name] = parseValue(field, buffer.slice(0, field.size));
        buffer = buffer.slice(field.size, buffer.length);
    }
    return record;
}

function parseValue(field, buffer) {
    let originValue = decode(buffer, Config.encoding).trim();

    switch (field.type) {
        case 'C': //char
        case 'M': //memo
            return originValue;
        case 'D': //date
            return new Date(
                parseInt( originValue.substr(0, 4)),
                parseInt(originValue.substr(4, 2)) - 1,
                parseInt( originValue.substr(6, 2))
            );
        case 'F': //float
        case 'N': //number
            return parseFloat(originValue);
        case 'L': //logical
            if(['Y', 'y', 'T', 't'].includes(originValue)) return true;
            else if(['N', 'n', 'F', 'f'].includes(originValue)) return false;
            else return null;
        case 'T': //timestamp in vfp
            return parseInt(originValue);
        case 'I': //integer in vfp
            return bufferToInteger(buffer);
        case 'Y': //currency in vfp
            return bufferToDouble(buffer);
        case '0': //null flag. ignore.
            return '';
        default:
            throw new Error(`Unknown Field Type[${field.type}]`);
    }
}

export {parseHeader as header, parse as read}