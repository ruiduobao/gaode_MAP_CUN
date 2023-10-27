module.exports.point = justType("Point", "POINT");
module.exports.line = justType("LineString", "POLYLINE");
module.exports.multiline = justType("MultiLineString", "POLYLINE");
module.exports.polygon = justType("Polygon", "POLYGON");
module.exports.multipolygon = justType("MultiPolygon", "POLYGON");

/**
 * Generate a function that returns an object with the geometries, properties, and type of the given GeoJSON type
 * @param {string} type the GeoJSON type
 * @param {string} TYPE the Shapefile type
 * @returns {(gj: { features: Feature[] }) => { geometries: number[] | number[][] | number[][][] | number[][][][], properties: {Object.<string, string>}, type: string }}
 */
function justType(gjType, shpType) {
  return function (gj) {
    var oftype = gj.features.filter(isType(gjType));
    return {
      geometries: shpType === 'POLYLINE' ? [oftype.map(justCoords)] : oftype.map(justCoords),
      properties: oftype.map(justProps),
      type: shpType,
    };
  };
}

/**
 * 
 * @param {Feature} feature The feature to get the coordinates from
 * @returns {number[] | number[][] | number[][][] | number[][][][]}
 */
function justCoords(feature) {
  return feature.geometry.coordinates;
}

/**
 * 
 * @param {Feature} feature The feature to get the properties from 
 * @returns {Object.<string, string>}
 */
function justProps(feature) {
  return feature.properties;
}

/**
 * Generate a function that filters features based on their geometry.type
 * @param {string | string[]} type the GeoJSON type to filter with
 * @returns {(f: Feature) => boolean} a function that returns true if the feature's type is in {@link type}
 */
function isType(type) {
  if (Array.isArray(type))
    return function (f) {
      return type.includes(f.geometry.type);
    };
  else
    return function (f) {
      return f.geometry.type === type;
    };
}
