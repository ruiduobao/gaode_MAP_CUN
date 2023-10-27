var write = require("./write");
var geojson = require("./geojson");
var defaultPrj = require('./prj');
var JSZip = require("jszip");


module.exports = function (
  gj,
  options,
  stream = false
) {
  let zip = new JSZip();
  let zipTarget = zip;
  if (options && options.folder) {
    zipTarget = zip.folder(options.folder);
  }

  var prj = (options && options.prj) ? options.prj : defaultPrj;

  [
    geojson.point(gj),
    geojson.line(gj),
    geojson.polygon(gj),
    geojson.multipolygon(gj),
    geojson.multiline(gj),
  ].forEach(function (l) {
    if (l.geometries.length && l.geometries[0].length) {
      write(
        // field definitions
        l.properties,
        // geometry type
        l.type,
        // geometries
        l.geometries,
        function (err, files) {
          var fileName =
            options && options.types && options.types[l.type.toLowerCase()]
              ? options.types[l.type.toLowerCase()]
              : l.type;
          zipTarget.file(fileName + ".shp", files.shp.buffer, { binary: true });
          zipTarget.file(fileName + ".shx", files.shx.buffer, { binary: true });
          zipTarget.file(fileName + ".dbf", files.dbf, { binary: true });
          zipTarget.file(fileName + ".prj", prj);
        }
      );
    }
  });

  var zipOptions = {};
  if (!options || !options.outputType) {
    zipOptions.type = "base64";
  } else {
    zipOptions.type = options.outputType;
  }

  if (!options || !options.compression) {
    zipOptions.compression = "DEFLATE";
  } else {
    zipOptions.compression = options.compression;
  }

  if (stream) {
    return zip.generateNodeStream({ ...zipOptions, streamFiles: true });
  }

  return zip.generateAsync(zipOptions);
};
