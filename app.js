const bodyParser = require('body-parser');
const axios = require('axios');
const express = require('express');
const app = express();


//设置一个数据库属性
const pgp = require('pg-promise')();
const dbConfig = {
    host: 'localhost',
    port: 5434,
    database: 'postgis_34_sample',
    user: 'postgres',
    password: '12345678'
};

const db = pgp(dbConfig);


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    // res.render('index');
    res.render('index', { latitude: 35, longitude: 108});
});
//在app.js中设置public文件夹为静态文件夹
app.use(express.static('public'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// app.post('/place', async (req, res) => {
//     const placeName = req.body.placeName;
//     // 检查place参数是否有效
//     if (!placeName || placeName.trim() === '') {
//         const error = new Error('Invalid place parameter.');
//         return next(error);
//     }

//     const GAODE_API_KEY = 'b6ba147ffd1e49158d12f7cb16d0f381';
//     const GAODE_GEOCODE_URL = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(placeName)}&key=${GAODE_API_KEY}`;

//     let location = null; // 定义location变量在try块之前

//     try {
//         const response = await axios.get(GAODE_GEOCODE_URL);
//         if (response.data && response.data.geocodes && response.data.geocodes.length > 0) {
//             location = response.data.geocodes[0].location;
//         } else {
//             throw new Error('Unable to geocode the provided place.');
//         }
//     } catch (error) {
//         return next(error); // 使用next()将错误传递给下一个中间件
//     }
    
//     if (location) {
//         const [longitude, latitude] = location.split(',');
//         res.render('map', { latitude: latitude, longitude: longitude });
//         // 调用函数来创建并保存 GeoJSON 文件
//         try {
//             const filepath = await createAndSaveGeoJSON(placeName, longitude, latitude);
//             console.log('GeoJSON file created successfully at:', filepath);
//         } catch (err) {
//             console.error('Error writing GeoJSON file:', err);
//             // 也可以选择通过 next(err) 将错误传递给错误处理中间件
//         }

//     } else {
//         res.send(`Unable to find location for ${placeName}`);
//     }
// });

//添加一个禁止用户下载次数

const downloadCounts = {};  // 用于跟踪每个IP地址的下载次数
const downloadCounts_number=20 // 下载次数
app.use((req, res, next) => {
    const ip = req.ip;
    if (!downloadCounts[ip]) {
        downloadCounts[ip] = 0;
    }
    next();
});

//在app.js的底部，添加以下代码来创建一个错误处理中间件：
app.use((err, req, res, next) => {
    console.error(err.stack); // 打印错误堆栈到控制台
    res.status(500).send('Something went wrong! ' + err.message);
});


//在Express应用中提供两个新的路由来返回年份和省份的数据，然后在前端使用AJAX请求这些数据
const fs = require('fs');
const path = require('path');

app.use('/year/:year/:province.html', (req, res) => {
    const year = decodeURIComponent(req.params.year);
    const province = decodeURIComponent(req.params.province);
    res.sendFile(path.join(__dirname, 'year', year, `${province}.html`));
});

app.get('/get-years', (req, res) => {
    const years = fs.readdirSync(path.join(__dirname, 'year'));
    res.json(years);
});

app.get('/get-provinces/:year', (req, res) => {
    const provinces = fs.readdirSync(path.join(__dirname, 'year', req.params.year))
                        .map(file => file.replace('.html', ''));
    res.json(provinces);
});

// 新增路由来处理地理编码请求
app.get('/getGeoAddress', async (req, res, next) => {
    const placeName = req.query.address; // 从查询参数中获取地址

    // 检查place参数是否有效
    if (!placeName || placeName.trim() === '') {
        const error = new Error('Invalid place parameter.');
        return next(error);
    }

    const GAODE_API_KEY = 'b6ba147ffd1e49158d12f7cb16d0f381';
    const GAODE_GEOCODE_URL = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(placeName)}&key=${GAODE_API_KEY}`;

    let location = null;

    try {
        const response = await axios.get(GAODE_GEOCODE_URL);
        if (response.data && response.data.geocodes && response.data.geocodes.length > 0) {
            location = response.data.geocodes[0].location;
        } else {
            throw new Error('geo code failed');
        }
    } catch (error) {
        return next(error);
    }

    if (location) {
        const [longitude, latitude] = location.split(',');
        // 调用函数来创建并保存 GeoJSON 文件
        try {
            const filepath = await createAndSaveGeoJSON(placeName, longitude, latitude);
            console.log('GeoJSON file created successfully at:', filepath);
            // 构造文件 URL
            const fileUrl = `/vectordata/${encodeURIComponent(placeName)}.gson`;  // 相对于服务器根目录的URL路径
            // 返回成功消息和文件 URL
            // 返回成功消息和文件 URL
            const responseData = { status: 'success', message: 'Data exported successfully', filepath: fileUrl };
            console.log('Response data:', responseData);  // 打印响应数据
            console.log('hello，world0'); 
            res.json(responseData);
        } catch (err) {
            console.error('Error writing GeoJSON file:', err);
            res.status(500).json({ status: 'error', message: 'Internal Server Error', filepath: null });
        }
    } else {
        res.status(404).json({ status: 'error', message: `Not found gson for ${placeName}`, filepath: null });
    }
});


// 从数据库中导出矢量文件到路径
app.get('/getGsonDB', async (req, res) => {
    const dataCode = req.query.code;

    if (!dataCode) {
        return res.status(400).send('dataCode is required');
    }

    try {
        // 6位数字且后4位为0000
        if (/^\d{2}0000$/.test(dataCode)) {
            const sql = 'SELECT ST_AsGeoJSON(geom) as geojson_geom, * FROM "SHENG"."CHN_sheng_2023" WHERE first_gid = $1';
            const results = await db.any(sql, [dataCode]);
            return sendResults(res, dataCode, results);
        }
        // 6位数字且后2位为00
        else if (/^\d{4}00$/.test(dataCode)) {
            const results = await queryLatestYearData('SHI', 'CHN_shi', dataCode);
            return sendResults(res, dataCode, results);
        }
        // 6位数字且后两位不为00
        else if (/^\d{6}$/.test(dataCode) && !/00$/.test(dataCode)) {
            const results = await queryLatestYearData('XIAN', 'CHN_xian', dataCode);
            return sendResults(res, dataCode, results);
        }
        // 12位数字
        else if (/^\d{12}$/.test(dataCode)) {
            const sql = 'SELECT ST_AsGeoJSON(geom) as geojson_geom, * FROM "XIANG"."CHN_xiang_2020" WHERE code = $1';
            const results = await db.any(sql, [dataCode]);
            return sendResults(res, dataCode, results);
        }
        else {
            return res.status(400).send('Invalid dataCode format');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

async function queryLatestYearData(schema, baseTableName, dataCode) {
    const years = Array.from({ length: 11 }, (_, i) => 2023 - i);
    for (let year of years) {
        const tableName = `${baseTableName}_${year}`;
        const sql = `SELECT ST_AsGeoJSON(geom) as geojson_geom, * FROM "${schema}"."${tableName}" WHERE code = $1`;
        const results = await db.any(sql, [dataCode]);
        if (results.length > 0) {
            return results;
        }
    }
    return [];
}

function sendResults(res, dataCode, results) {
    if (results.length > 0) {
        const geojsonFeatureCollection = {
            type: "FeatureCollection",
            features: results.map(result => {
                const geojsonGeom = JSON.parse(result.geojson_geom);
                delete result.geojson_geom;
                delete result.geom;
                return {
                    type: "Feature",
                    geometry: geojsonGeom,
                    properties: result
                };
            })
        };
        const gsonFilePath = path.join(__dirname, 'public', 'vectordata', `${dataCode}.gson`);
        fs.writeFileSync(gsonFilePath, JSON.stringify(geojsonFeatureCollection));
        const gsonFileUrl = `/vectordata/${dataCode}.gson`;
        res.json({ status: 'success', message: 'Data exported successfully', filepath: gsonFileUrl });
    } else {
        res.status(404).send('Data not found');
    }
}



//获取矢量文件路径
app.get('/getGsonFile', (req, res, next) => {
    const dataCode = req.query.code;
    const gsonFilePath = path.join(__dirname, 'public', 'vectordata', `${dataCode}.gson`);

    if (fs.existsSync(gsonFilePath)) {
        const gsonData = fs.readFileSync(gsonFilePath, 'utf8');
        res.json(JSON.parse(gsonData));
    } else {
        res.status(404).send('not find gson');
    }
});

// 在app.js中添加新的路由来提供矢量文件的下载
//下载的路由
const { exec } = require('child_process');
app.get('/downloadVector/:id', async (req, res, next) => {
    const ip = req.ip;
    if (downloadCounts[ip] >= downloadCounts_number) {
        return res.status(429).send('该网站非盈利网站，流量有限，请勿大量下载数据');
    }
    const id = req.params.id;
    const format = req.query.format;

    // 判断id是否为dataCode
    const isDataCode = /\d/.test(id);  // 假设dataCode包含数字

    if (isDataCode) {
        if (format === 'shp') {
            await CovertShpFromGson(id, res);
        } else if (format === 'svg') {
            await CovertSVGFromGson(id, res);
        } else if (format === 'gson') {
            const vectorFilePath = path.join(__dirname, 'public', 'vectordata', `${id}.gson`);
            if (fs.existsSync(vectorFilePath)) {
                res.download(vectorFilePath);
            } else {
                const error = new Error('File not found');
                return next(error);
            }
        } else {
            res.status(400).send('Invalid format');
        }
    } else {  // 处理address情况
        if (format === 'gson') {
            // const encodedId = encodeURIComponent(id);
            const encodedId = id;
            const vectorFilePath = path.join(__dirname, 'public', 'vectordata', `${encodedId}.gson`);
            console.log('CUN Vector File Path:', vectorFilePath);  // 添加此行来查看文件路径
            if (fs.existsSync(vectorFilePath)) {
                res.download(vectorFilePath);
            } else {
                const error = new Error('File not found JSON');
                return next(error);
            }
        } 
        if (format === 'shp') {
            await CovertShpFromGson(id, res)
        } 
        else {
                       // const encodedId = encodeURIComponent(id);
                       const encodedId = id;
                       const vectorFilePath = path.join(__dirname, 'public', 'vectordata', `${encodedId}.gson`);
                       console.log('CUN Vector File Path:', vectorFilePath);  // 添加此行来查看文件路径
                       if (fs.existsSync(vectorFilePath)) {
                           res.download(vectorFilePath);
                       } else {
                           const error = new Error('File not found JSON');
                           return next(error);
                       }
        }
    }

    res.on('finish', () => {
        downloadCounts[ip]++;
    });
});


//转换gson数据为shp
// const shpwrite = require('@mapbox/shp-write');
const shpwrite =  require('./public/nodepack/shp-write/dist/index.js')

async function CovertShpFromGson(dataCode, res) {
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

    try {
        const options = {
            folder: "请关注公众号遥感之家",
            outputType: "nodebuffer",  // 确保得到一个 Node.js Buffer 对象
            compression: "DEFLATE",
            // types: { polygon: 'polygon' }  // 'polygon' 是文件名前缀，不是几何类型
        };

        const zipDataBuffer = await shpwrite.zip(geojsonData, options);
        const zipFilePath = `${outputShapefilePath}.zip`;

        fs.writeFileSync(zipFilePath, zipDataBuffer);

        res.download(zipFilePath);  // 提供下载
    } catch (err) {
        console.error(`Error converting GeoJSON to Shapefile: ${err.message}`);
        res.status(500).send('Internal server error');
        return;
    }

    res.download(`${outputShapefilePath}.zip`);  // 提供下载
}
//进行从gson到svg图片的生成
const { GeoJSON2SVG } = require('geojson2svg');
// 计算 GeoJSON 数据的边界
const geojsonExtent = require('geojson-extent');

async function CovertSVGFromGson(dataCode, res) {
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
    // 计算 GeoJSON 数据的边界
    const extent = geojsonExtent(geojsonData);

    // 初始化 geojson2svg 实例，并设置一些基本参数
    const converter = new GeoJSON2SVG({
        mapExtent: { left: extent[0], bottom: extent[1], right: extent[2], top: extent[3] },
        viewportSize: { width: 200, height: 100 },
        attributes: { class: 'mapstyle', stroke: 'blue', fill: 'none', 'stroke-width': '0.3'},  // 设置线条颜色为红色，矢量内部为空心
        r: 2,
        output: 'svg'
    });

    // 转换 GeoJSON 数据为 SVG 字符串
    let svgStrings;
    try {
        svgStrings = converter.convert(geojsonData);
    } catch (err) {
        console.error(`Error converting GeoJSON to SVG: ${err.message}`);
        res.status(500).send('Internal server error');
        return;
    }

    // 将 SVG 字符串合并为一个字符串
    const svgStr = svgStrings.join('\n');

    // 创建一个完整的 SVG 文件内容
    const fullSvgStr = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
            ${svgStr}
        </svg>
    `;

    // 保存 SVG 数据到指定目录
    const outputSVGPath = path.join(outputDirectory, `${fileBaseName}.svg`);

    try {
        fs.writeFileSync(outputSVGPath, fullSvgStr);
        res.download(outputSVGPath);  // 提供下载
    } catch (err) {
        console.error(`Error writing SVG file: ${err.message}`);
        res.status(500).send('Internal server error');
        return;
    }
}


//添加一个新的路由来检查矢量文件是否存在
app.get('/checkVectorExistence', (req, res) => {
    const dataCode = req.query.code;
    const gsonFilePath = path.join(__dirname, 'public', 'shp', `${dataCode}.gson`);

    if (fs.existsSync(gsonFilePath)) {
        res.json({status: 200, message: "Exists"});
    } else {
        res.json({status: 404, message: "Not Found"});
    }
});

//添加一个定时清除器清除掉shp文件夹
function clearShpFolder() {
    const shpFolderPath = path.join(__dirname, 'public', 'vectordata');
    fs.readdir(shpFolderPath, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(shpFolderPath, file), err => {
                if (err) throw err;
            });
        }
        console.log('Shp folder cleared!');
    });
}

// 设置一个每小时执行一次的定时器 setInterval(clearShpFolder, 1000 * 60 * 60);的意思是每隔1000毫秒60秒60分
setInterval(clearShpFolder, 1000 * 60 * 60);

// 定义一个函数来创建并保存地理编码获取到的经纬度的GeoJSON文件 
async function createAndSaveGeoJSON(placeName, longitude, latitude) {
    return new Promise((resolve, reject) => {
        // 创建 GeoJSON 对象
        const geojson = {
            type: "FeatureCollection",
            features: [{
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                properties: {
                    name: placeName
                }
            }]
        };
        
        // 构建文件路径
        const filepath = path.join(__dirname, 'public', 'vectordata', `${placeName}.gson`);
        
        // 将 GeoJSON 对象写入文件
        fs.writeFile(filepath, JSON.stringify(geojson), (err) => {
            if (err) {
                reject(err);  // 如果发生错误，拒绝 Promise
            } else {
                resolve(filepath);  // 如果成功，解析 Promise 并返回文件路径
            }
        });
    });
}
