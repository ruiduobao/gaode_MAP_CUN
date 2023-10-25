const bodyParser = require('body-parser');
const axios = require('axios');
const express = require('express');
const app = express();

//设置一个数据库连接方式
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
    res.render('index');
});
//在app.js中设置public文件夹为静态文件夹
app.use(express.static('public'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
app.post('/place', async (req, res) => {
    const placeName = req.body.placeName;
    // 检查place参数是否有效
    if (!placeName || placeName.trim() === '') {
        const error = new Error('Invalid place parameter.');
        return next(error);
    }

    const GAODE_API_KEY = 'b6ba147ffd1e49158d12f7cb16d0f381';
    const GAODE_GEOCODE_URL = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(placeName)}&key=${GAODE_API_KEY}`;

    let location = null; // 定义location变量在try块之前

    try {
        const response = await axios.get(GAODE_GEOCODE_URL);
        if (response.data && response.data.geocodes && response.data.geocodes.length > 0) {
            location = response.data.geocodes[0].location;
        } else {
            throw new Error('Unable to geocode the provided place.');
        }
    } catch (error) {
        return next(error); // 使用next()将错误传递给下一个中间件
    }
    
    if (location) {
        const [longitude, latitude] = location.split(',');
        res.render('map', { latitude: latitude, longitude: longitude });
    } else {
        res.send(`Unable to find location for ${placeName}`);
    }
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
            throw new Error('该地区地理编码失败');
        }
    } catch (error) {
        return next(error);
    }

    if (location) {
        const [longitude, latitude] = location.split(',');
        res.json({ latitude: latitude, longitude: longitude });
    } else {
        res.json({ error: `未发现该地区 ${placeName}` });
    }
});

//获取矢量文件路径
app.get('/getGsonFile', (req, res) => {
    //日志
    console.log('getGsonFile route called with code:', req.query.code);
    const dataCode = req.query.code;
    const gsonFilePath = path.join(__dirname, 'public', 'shp', `${dataCode}.gson`);

    if (fs.existsSync(gsonFilePath)) {
        const gsonData = fs.readFileSync(gsonFilePath, 'utf8');
        res.json(JSON.parse(gsonData));
    } else {
        res.status(404).send('矢量未找到');
    }
});

// 在app.js中添加新的路由来提供矢量文件的下载
app.get('/downloadVector/:code', (req, res, next) => {
    const dataCode = req.params.code;
    const vectorFilePath = path.join(__dirname, 'public', 'shp', `${dataCode}.gson`);

    if (fs.existsSync(vectorFilePath)) {
        res.download(vectorFilePath);  // 使用Express的download方法
    } else {
        const error = new Error('矢量文件未找到');
        return next(error);
    }
});

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
