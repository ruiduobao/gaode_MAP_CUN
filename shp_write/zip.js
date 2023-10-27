var shpwrite = require("@mapbox/shp-write");
var fs = require('fs');  // 引入文件系统模块
async function generateAndSaveZip() {
  try {
      // a GeoJSON bridge for features
      const zipData = await shpwrite.zip(
          {
              type: "FeatureCollection",
              features: [
                  {
                      type: "Feature",
                      geometry: {
                          type: "Point",
                          coordinates: [0, 0],
                      },
                      properties: {
                          name: "Foo",
                      },
                  },
                  {
                      type: "Feature",
                      geometry: {
                          type: "Point",
                          coordinates: [0, 10],
                      },
                      properties: {
                          name: "Bar",
                      },
                  },
              ],
          }
      );

      // 指定要保存ZIP文件的路径
      const outputPath = 'D:\\my_shapefiles.zip';

      // 将ZIP数据写入磁盘
      fs.writeFileSync(outputPath, zipData);

  } catch (error) {
      console.error('Error:', error.message);
  }
}

// 调用函数
generateAndSaveZip();
