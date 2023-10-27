const Accessor = require('../dist');

let {header, data} = Accessor.read('./table-foxpro.dbf');

console.log(header);
console.log(data);

console.log('----');

header = Accessor.header('./table-dbase4.dbf');

console.log(header);