var zip = require('./zip');
var saveAs = require("file-saver").saveAs;

/**
 * @deprecated may be removed in a future version, please use an external 
 * download library
 */
module.exports = function (gj, options) {
  let filename = 'download';

  // since we only need a single filename object, we can use either the folder or
  // filename, depending on what was passed in
  if (options && (options.filename || options.folder)) {
    filename = (options.filename || options.folder);
  }
  zip(gj, options).then(function (blob) { saveAs(blob, filename + '.zip'); });
};
