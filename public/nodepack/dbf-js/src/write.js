import { existsSync, unlinkSync, writeFileSync } from 'fs'
import { encode } from 'iconv-lite'
import builder from 'debug'
import { isDate, isString } from 'lodash'

const debug = builder('dbf-js');

const _ = require('lodash');

const Config = { encoding: "gb18030" };

function ensureEncoding(encoding) {
    if(encoding) Config.encoding = encoding;
}

export function write(fields, data, filename, encoding="gb18030") {

    ensureEncoding(encoding);
    ensureFieldSize(fields);

    let now = new Date(), offset=0;
    let fieldDescLength = (32 * fields.length) + 1;
    let bytePerRecord = computeBytePerRec(fields);
    let buffer = new ArrayBuffer(32 + fieldDescLength + (bytePerRecord * data.length) +1 );
    let view   = new DataView(buffer);

    //FILL HEADER
    view.setUint8(0, 0x43); //create dBaseIV table without memo.
    view.setUint8(1, now.getFullYear() - 2000); //year
    view.setUint8(2, now.getMonth() + 1); //month
    view.setUint8(3, now.getDate());  //date
    view.setUint32(4, data.length, true); //record number
    view.setUint16(8, fieldDescLength + 32, true); //header cost
    view.setUint16(10, bytePerRecord, true); //byte cost per record
    //byte 12-31 reserved, fill with 0
    _.forEach(fields, (f, i)=>{ //field description
        writeField(view, 32 + i * 32, f.name, encoding); //field name, max 11 chars
        view.setInt8(32 + i * 32 + 11, f.type.charCodeAt(0)); //field type
        view.setInt8(32 + i * 32 + 16, f.size);
        if(f.type === 'N') view.setInt8(32 + i * 32 + 17, (f.precision ? f.precision : 0));
        //byte 12-15, 18-31 reserved
    });
    view.setUint8(32 + fieldDescLength - 1, 0x0D ); //last 2 bytes 0x0D20
    view.setUint8(32 + fieldDescLength , 0x20 );

    //FILL DATA
    offset = fieldDescLength + 32;
    _.forEach(data, (row, i)=>{
        view.setUint8(offset, 0x20); offset++;     //delete flag=0x20
        _.forEach(fields, (f) => {
            let val = row[f.name];
            if(val === null || typeof val === 'undefined') {
                if(f.type==='C') val = '';
                if(f.type==='N') val = 0;
                if(f.type==='D') val = now;
                if(f.type==='L') val = null;
            }
            switch (f.type) {
                case 'L':
                    view.setUint8(offset, val===true ? 0x54 : (val===false ? 0x46 : 0x3f));
                    offset++;
                    break;
                case 'D':
                    offset = writeDate(view, offset, val);
                    break;
                case 'N':
                    offset = writeNumber(view, offset, val, f.precision, f.size);
                    break;
                case 'C':
                    offset = writeString(view, offset, val, f.size);
                    break;
                default:
                    throw new Error(`Unknown field type: ${f.type}`);
            }
        });
    });
    view.setUint8(offset, 0x1A); //file end flag

    if(!filename)
        return Buffer.from(view.buffer);
    else {
        if(existsSync(filename)) unlinkSync(filename);
        writeFileSync(filename,  Buffer.from(view.buffer));
    }
}

function ensureFieldSize(fields) {
    fields.forEach((field)=>{
        switch (field.type) {
            case 'C':
                field.size = Math.min( (field.size && field.size > 0) ? field.size : 10 , 255 );
                break;
            case 'N':
                field.size = Math.min( (field.size && field.size > 0) ? field.size : 10 , 20 );
                field.precision = Math.min( (field.precision && field.precision >= 0) ? field.precision : 0 , 19 );
                break;
            case 'D':
                field.size = 8;
                break;
            case 'L':
                field.size = 1;
                break;
            default:
                throw new Error(`Type must be one of C, N, L, D`);
        }
    });
}

function computeBytePerRec(fields) {
    return fields.reduce((sum, f) => { return sum + f.size; }, 1);
}

function writeField(view, offset, string) {
    let buf = encode(string, Config.encoding);
    buf.forEach((byte, index)=>{ if(index >= 11) return; view.setUint8(offset + index, byte); });
}

function bufferPadding(src, length, rightPadding = true) {
    let dst = new Uint8Array(new ArrayBuffer(length));
    let valuedSize = src.length > length ? length : src.length;
    let filledSize = length - valuedSize;
    if(rightPadding) {
        for(let i=0; i<valuedSize; i++) dst[i]=src[i];
        for(let i=0; i<filledSize; i++) dst[valuedSize+i] =0x20;
    } else {
        for(let i=0; i<filledSize; i++) dst[i]=0x20;
        for(let i=0; i<valuedSize; i++) dst[filledSize+i]=src[i];
    }
    return dst;
}

function writeString(view, offset, string, length) {
    let strBuf = encode(string, Config.encoding);
    let buf = bufferPadding(strBuf, length, true);
    buf.forEach((byte, index)=>{ view.setUint8(offset+index, byte); });
    return offset + length;
}

function writeNumber(view, offset, value, precision, length) {
    value = new Number(value).toFixed(precision ? precision : 0);
    let valBuf = encode(value, "ASCII");
    let buf = bufferPadding(valBuf, length, false);
    buf.forEach((byte, index)=>{ view.setUint8(offset + index, byte); });
    return offset + length;
}

function writeDate(view, offset, value) {
    let date = '19000001';
    if(isDate(value)) {
        date = `${value.getFullYear() * 10000 + value.getMonth() * 100 + 100 + value.getDate()}`;
    } else if(isString(value)){
        date = value.substr(0, 8);
    }
    return writeString(view, offset, date,8);
}