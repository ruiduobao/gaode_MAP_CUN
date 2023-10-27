var types = require('./types');
var dbf = require('./dbfJS');
var prj = require('./prj');
var pointWriter = require('./points');
var polyWriter = require('./poly');

var writers = {
    1: pointWriter,
    5: polyWriter,
    3: polyWriter
};

module.exports = write;

// Low-level writing interface
function write(rows, geometry_type, geometries, callback) {

    var TYPE = types.geometries[geometry_type];
    var writer = writers[TYPE];
    var parts = writer.parts(geometries, TYPE);
    var shpLength = 100 + (parts - geometries.length) * 4 + writer.shpLength(geometries);
    var shxLength = 100 + writer.shxLength(geometries);
    var shpBuffer = new ArrayBuffer(shpLength);
    var shpView = new DataView(shpBuffer);
    var shxBuffer = new ArrayBuffer(shxLength);
    var shxView = new DataView(shxBuffer);
    var extent = writer.extent(geometries);

    writeHeader(shpView, TYPE);
    writeHeader(shxView, TYPE);
    writeExtent(extent, shpView);
    writeExtent(extent, shxView);

    writer.write(geometries, extent,
        new DataView(shpBuffer, 100),
        new DataView(shxBuffer, 100),
        TYPE);

    shpView.setInt32(24, shpLength / 2);
    shxView.setInt32(24, (50 + geometries.length * 4));

    var dbfBuf = dbf.structure(rows);

    callback(null, {
        shp: shpView,
        shx: shxView,
        dbf: dbfBuf,
        prj: prj
    });
}

function writeHeader(view, TYPE) {
    view.setInt32(0, 9994);
    view.setInt32(28, 1000, true);
    view.setInt32(32, TYPE, true);
}

function writeExtent(extent, view) {
    view.setFloat64(36, extent.xmin, true);
    view.setFloat64(44, extent.ymin, true);
    view.setFloat64(52, extent.xmax, true);
    view.setFloat64(60, extent.ymax, true);
}
