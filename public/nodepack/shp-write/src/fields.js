var types = require('./types').jstypes;

module.exports.geojson = geojson;
module.exports.obj = obj;

function geojson(features) {
    var fields = {};
    features.forEach(collect);
    function collect(f) { inherit(fields, f.properties); }
    return obj(fields);
}

function inherit(a, b) {
    for (var i in b) { a[i] = b[i]; }
    return a;
}

function obj(_) {
    var fields = {}, o = [];
    for (var p in _) fields[p] = typeof _[p];
    for (var n in fields) {
        o.push({
            name: n,
            type: types[fields[n]]
        });
    }
    return o;
}
