### A Library for Read, Write DBF File Using Pure Node

This Library can read dbase* and foxpro. It is a better version to [rw-dbaseiv](https://www.npmjs.com/package/rw-dbaseiv).

References & Thanks To:

[DBF File Format](https://www.dbf2002.com/dbf-file-format.html)

[DBF, DBT File Format](http://www.independent-software.com/dbase-dbf-dbt-file-format.html)


### Change Log

* 1.2.1 fix foxpro's null-flag system type
* 1.2.0 rename readHeader function to header
* 1.1.2 append readHeader function 

#### Examples

1. Reader

```
const Accessor = require('dbf-js');
let {header, data} = Accessor.read('./table-foxpro.dbf');

--- OUTPUTS ---
> header
{
  version: 3,
  dateUpdated: 2020-02-28T16:00:00.000Z,
  recordNumbers: 3,
  headerByteCost: 193,
  fieldNumber: 5,
  recordByteCost: 29,
  fields: [
    {
      name: 'A',
      type: 'C',
      address: 1,
      size: 5,
      precision: 0
    },
    {
      name: 'B',
      type: 'D',
      address: 6,
      size: 8,
      precision: 0
    },
    ... other fields ...
  ]
}
> data
[
  {
    '@sequenceNumber': 1,
    '@deleted': false,
    A: '蔡',
    B: 1984-02-01T16:00:00.000Z,
    C: 11,
    D: 1.1,
    E: true
  },
  {
    '@sequenceNumber': 2,
    '@deleted': false,
    A: '杨',
    B: 1981-03-17T16:00:00.000Z,
    C: 12,
    D: 2,
    E: false
  },
  ... other datas ...
]

```

2. Writer

```
const Accessor = require('dbf-js');

let header = [
    {name: 'A', size:5, type:'C'},
    {name: 'B', size:3, precision:1, type:'N'},
    {name: 'C', type:'D'},
    {name: 'D', type:'L'},
    {name: 'E', type:'N', size:3}
];

let body = [
    {
        A: '张三三',
        B: 5.5,
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

Or, you can input null to filename, and this function will return the buffer of dbf, Just like:

let buf = Accessor.write(header, body);
fs.writeFileSync('gened-dbaseiv.dbf', buf);

```
