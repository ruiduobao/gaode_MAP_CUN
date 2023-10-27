const fs = require('fs');
const Accessor = require('../dist');

let header = [
    {name: 'A', size:300, type:'C'},
    {name: 'B', size:3, precision:1, type:'N'},
    {name: 'C', type:'D'},
    {name: 'D', type:'L'},
    {name: 'E', type:'N', size:3}
];

let body = [
    {
        A: '一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十',
        C: new Date(),
        D: true,
        E: 30
    },
    {
        A: '王',
        B: 6.0,
        C: new Date(1984,2,2),
        D: true,
        E: 26.2
    }
];

Accessor.write(header, body, 'gened-dbaseiv.dbf');
//fs.unlinkSync('gened-dbaseiv.dbf');
//fs.writeFileSync('gened-dbaseiv.dbf', buf);