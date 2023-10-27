var shpwrite = require("@mapbox/shp-write");
var fs = require('fs');  // 引入文件系统模块

const options = {
  folder: "my_internal_shapes_folder",
  filename: "my_zip_filename",
  outputType: "nodebuffer",  // 修改为 'nodebuffer' 以获得一个 Node.js Buffer 对象
  compression: "DEFLATE",
  types: {
    point: "mypoints",
    polygon: "mypolygons",
    polyline: "mylines",
  },
};

// 定义异步函数以处理Promise
async function generateAndSaveZip() {
    try {
        // a GeoJSON bridge for features
        const zipDataBuffer = await shpwrite.zip(
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
            },
            options
        );

        // 指定要保存ZIP文件的路径
        const outputPath = 'D:\\shp_ZIP.zip';

        // 将ZIP数据写入磁盘
        fs.writeFileSync(outputPath, zipDataBuffer);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// 调用函数
generateAndSaveZip();
