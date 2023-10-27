const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const shpwrite = require('@mapbox/shp-write');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


app.post('/convert', (req, res) => {
  const geojsonData = req.body.geojson;
  const dataCode = 'output';

  const outputDirectory = path.join(__dirname, 'public', 'vectordata');
  const gsonFilePath = path.join(outputDirectory, `${dataCode}.gson`);
  const fileBaseName = dataCode;

  fs.writeFileSync(gsonFilePath, geojsonData);
  
  CovertShpFromGson(dataCode, res);
});

async function CovertShpFromGson(dataCode, res) {
  // ...（此处填入你之前的CovertShpFromGson函数代码）
  const outputDirectory = path.join(__dirname, 'public', 'vectordata');
  const gsonFilePath = path.join(outputDirectory, `${dataCode}.gson`);
  const fileBaseName = dataCode;

  // 读取 GeoJSON 数据
  let geojsonData;
  try {
      const gsonData = fs.readFileSync(gsonFilePath, 'utf8');
      geojsonData = JSON.parse(gsonData);
  } catch (err) {
      console.error(`Error reading or parsing GeoJSON data: ${err.message}`);
      res.status(500).send('Internal server error');
      return;
  }

  // 转换 GeoJSON 数据为 Shapefile 格式，并保存到指定目录
  const outputShapefilePath = path.join(outputDirectory, fileBaseName);

  //添加一个Geojson检查函数
  // 确保 geojsonData 是一个对象
  if (typeof geojsonData !== 'object' || geojsonData === null) {
      console.error('GeoJSON data is not an object');
      res.status(501).send('GeoJSON data is not an object');
      return;
  }

  // 确保 geojsonData 有一个 features 属性，它是一个数组
  if (!Array.isArray(geojsonData.features)) {
      console.error('GeoJSON data does not have a features array');
      res.status(502).send('GeoJSON data does not have a features array');
      return;
  }

  // 确保每个特征都有一个 geometry 属性，它是一个对象
  // 并且该 geometry 对象有一个 coordinates 属性
  for (const feature of geojsonData.features) {
      if (typeof feature !== 'object' || feature === null || typeof feature.geometry !== 'object' || feature.geometry === null) {
          console.error('One or more features are missing a geometry object');
          res.status(503).send('One or more features are missing a geometry object');
          return;
      }
      if (!Array.isArray(feature.geometry.coordinates)) {
          console.error('A geometry object is missing the coordinates array');
          res.status(504).send('A geometry object is missing the coordinates array');
          return;
      }
  }

  try {
      await shpwrite.write(
          geojsonData.features,
          { folder: outputShapefilePath, types: { point: 'POINT', polygon: 'POLYGON', line: 'LINESTRING' } }
      );
  } catch (err) {
      console.error(`Error converting GeoJSON to Shapefile: ${err.message}`);
      res.status(500).send('Internal server error');
      return;
  }

  // 创建一个 ZIP 归档
  const archive = archiver('zip', { zlib: { level: 9 } });
  const outputZipPath = path.join(outputDirectory, `${fileBaseName}.zip`);
  const output = fs.createWriteStream(outputZipPath);
  archive.pipe(output);

  // 添加 Shapefile 及其相关文件到 ZIP 归档
  const shpFileExtensions = ['.shp', '.shx', '.dbf', '.prj', '.cpg'];
  shpFileExtensions.forEach(ext => {
      const filePath = `${outputShapefilePath}${ext}`;
      if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: `${fileBaseName}${ext}` });
      }
  });

  // 监听所有资源都被打包
  archive.on('end', () => {
      console.log('Archive wrote %d bytes', archive.pointer());
      // 删除临时文件
      shpFileExtensions.forEach(ext => {
          const filePath = `${outputShapefilePath}${ext}`;
          if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
          }
      });
      console.log('Shapefiles have been zipped and saved to vectordata folder.');
      res.download(outputZipPath); // 提供下载
  });

  // 完成归档
  archive.finalize();
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.get('/', (req, res) => {
    const errorMessage = "这里是错误信息"; // 假设这里存储着你的错误信息
    res.render('map2', { errorMessage: errorMessage });
  });