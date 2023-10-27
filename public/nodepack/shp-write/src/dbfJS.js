const accessor =  require('../../dbf-js/dist/index')
// import accessor from dbfjs

/**
 *
 * @param data:Array
 * @param meta:Array
 */
module.exports.structure = function(data, fileName) {
  let field_meta = multi(data)
  let valBody = []
  data.forEach(function(row, num) {
    let val = {}
    field_meta.forEach(field => {
      val[field.name] = row[field.name]
    })
    valBody.push(val)
  })

  return accessor.write(field_meta, valBody, fileName)
}

const fieldSize = {
  // string
  C: 254,
  // boolean
  L: 1,
  // date
  D: 8,
  // number
  N: 18,
  // number
  M: 18,
  // number, float
  F: 18,
  // number
  B: 8
}



function multi(features) {
  var fields = {}
  features.forEach(collect)

  function collect(f) {
    inherit(fields, f)
  }

  return obj(fields)
}

function inherit(a, b) {
  for (var i in b) {
    var isDef = typeof b[i] !== 'undefined' && b[i] !== null
    if (typeof a[i] === 'undefined' || isDef) {
      a[i] = b[i]
    }
  }
  return a
}

function obj(_) {
  var fields = {}, o = []
  var types = {
    string: 'C',
    number: 'N',
    boolean: 'L',
    // type to use if all values of a field are null
    null: 'C'
  };
  for (var p in _) fields[p] = _[p] === null ? 'null' : typeof _[p]
  for (var n in fields) {
    var t = types[fields[n]]
    if (t) {
      o.push({
        name: n,
        type: t,
        size: fieldSize[t]
      })
    }
  }
  return o
}
