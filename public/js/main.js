//JavaScript脚本

//设置dataCode和address为全局变量
let dataCode;
let address;
//iframe为全局变量
let iframe
// 在这个函数的最开始声明Year和Province
let Year, Province; 
// 在页面加载时为每个下载格式li元素添加点击事件监听器
window.onload = function() {
    const formatItems = document.querySelectorAll("#formatSelect li");
    formatItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除其他li的selected类
            formatItems.forEach(i => i.classList.remove('selected'));
            // 为所选的li添加selected类
            item.classList.add('selected');
        });
    });
    // 默认选中SHP
    const defaultSelected = document.querySelector("#formatSelect li[data-value='shp']");
    if (defaultSelected) {
        defaultSelected.classList.add('selected');
    }
}

//添加JavaScript来监听下载链接的点击事件
document.getElementById('downloadVectorBtn').addEventListener('click', function(e) {
e.preventDefault(); // 阻止默认的下载行为
showPasswordModal(); // 显示模态对话框
});

function showPasswordModal() {
    const modal = document.getElementById('passwordModal');
    modal.style.display = 'flex';
}

function hidePasswordModal() {
    const modal = document.getElementById('passwordModal');
    modal.style.display = 'none';
}
//检查密码
function checkPassword() {
    const input = document.getElementById('passwordInput');

    const selectedFormatItem = document.querySelector("#formatSelect li.selected");
    // 如果没有选中的格式，返回或给出警告
    if (!selectedFormatItem) {
        alert("请选择一个格式");
        return;
    }
    const selectedFormat = selectedFormatItem.getAttribute('data-value');
    
    if (input.value === '4444') {
        hidePasswordModal();
        // 使用全局变量dataCode构建下载链接
        let id = dataCode || address;  // 从全局变量或其他地方获取dataCode和address
        if (address) {
            id = encodeURIComponent(address);  // 对地址进行编码以确保URL正确
        }
        const downloadUrl = `/downloadVector/${id}?format=${selectedFormat}`;
        window.location.href = downloadUrl;
    } else {
        alert('密码错误。关注公众号"遥感之家"回复密码');
    }
}


// 定义地图层
let basicLayer = new AMap.TileLayer();
let satelliteLayer = new AMap.TileLayer.Satellite();
let roadNetLayer = new AMap.TileLayer.RoadNet();
let satelliteAndRoadNetLayer = [new AMap.TileLayer.Satellite(), new AMap.TileLayer.RoadNet()];
//定义星图地球
let XINGTU = new AMap.TileLayer({
    getTileUrl: function(x, y, z) {
        return 'https://tiles.geovisearth.com/base/v1/img/' + z + '/' + x + '/' + y + '.webp?format=webp&tmsIds=w&token=0aeb02f29320b060c2e2d0c04eb4887c6b8d5a8ed479b3aacff2b6a273b0d38d';
    },
    tileSize: 256,
    zIndex: 100
    });
// 初始化地图
const map = new AMap.Map('mapContainer', {
    zoom: 2,
    // center: [<%= longitude %>, <%= latitude %>],
    center: [<%= longitude %>, <%= latitude %>],
    // zoom: 15,
    // center: [105, 42],
    layers: [XINGTU]  // 默认显示遥感图层
});
//加载历年来行政区划关系图
iframe == null
iframe = document.getElementById('provinceData');
const QUHUA_20102023='2010年-2023年全国省级'
iframe.src = `/others/${encodeURIComponent(QUHUA_20102023)}.html`;
const titleDiv = document.getElementById('MAP_title');
titleDiv.innerHTML = `全国五级行政区划查询与下载`;



function switchMapLayer() {
    const selectedLayer = document.getElementById('mapLayer').value;
    if (selectedLayer === 'satellite') {
        switchToSatelliteMap();
    } else if (selectedLayer === 'basic') {
        switchToBasicMap();
    } else if (selectedLayer === 'satellite_road') {
        switchToSatelliteAndRoadNetMap();            
    }else if (selectedLayer === 'star_map') {
        switchToStarMap();
    }
}
    

function switchToSatelliteMap() {
    map.setLayers([satelliteLayer]);
}

function switchToBasicMap() {
    map.setLayers([basicLayer]);
}
function switchToSatelliteAndRoadNetMap() {
    map.setLayers(satelliteAndRoadNetLayer);
}
function switchToStarMap() {
    map.setLayers([XINGTU]);
    }
// 监听iframe传来的消息并处理
window.addEventListener('message', async (event) => {

console.log(event);
switch(event.data.type) {
case 'updateMapByAddress': 
    address = event.data.address;  //// 更新全局变量address
    dataCode = null;  // 清除dataCode的值
    console.log(event.data.address);
    Codegson(address)
    .then(() => {
        console.log('Successfully completed exportgsontoDIR FROM OAMP!'); // 打印 exportgsontoDIR 完成状态
    })
    .catch(error => {
        console.log('exportgsontoDIR! failed'); // 打印 exportgsontoDIR 完成状态
        console.error('Error in the sequence:', error);
    });
    break;
case 'updateMapByCode':
    dataCode = event.data.code;  //// 更新全局变量dataCode
    address = null;  // 清除address的值
    exportgsontoDIR(dataCode)
        .then(() => {
            console.log('Successfully completed exportgsontoDIR!'); // 打印 exportgsontoDIR 完成状态
        })
        .catch(error => {
            console.log('exportgsontoDIR! failed'); // 打印 exportgsontoDIR 完成状态
            console.error('Error in the sequence:', error);
        });
    break;
//首页的消息接收
case 'updateMapByYearsheng':
    Province=null
    Year=null
    Yearsheng = event.data.yearsheng;  //// 更新全局变量dataCode
    //拆分Year和省份
    const match = Yearsheng.match(/(\D+)(\d+年)/);
    if (match) {
        Province = match[1];
        Year = match[2];
        console.log('Province:', Province); // 输出: Province: 安徽省
        console.log('Year:', Year);         // 输出: Year: 2010年
        } else {
        console.error('从首页输入字符串不符合预期格式');
    }
    //加载对应的year和省份的html到网页中
    //清楚iframe的值
    iframe == null
    iframe = document.getElementById('provinceData');
    iframe.src = `/year/${encodeURIComponent(Year)}/${encodeURIComponent(Province)}.html`;
    const titleDiv = document.getElementById('MAP_title');
    titleDiv.innerHTML = `${Year}${Province}五级行政区划`;
    //加载对应省份的代码到地图中
    const provinceCodes = {
        '北京市': '110000',
        '天津市': '120000',
        '河北省': '130000',
        '山西省': '140000',
        '内蒙古自治区': '150000',
        '辽宁省': '210000',
        '吉林省': '220000',
        '黑龙江省': '230000',
        '上海市': '310000',
        '江苏省': '320000',
        '浙江省': '330000',
        '安徽省': '340000',
        '福建省': '350000',
        '江西省': '360000',
        '山东省': '370000',
        '河南省': '410000',
        '湖北省': '420000',
        '湖南省': '430000',
        '广东省': '440000',
        '广西壮族自治区': '450000',
        '海南省': '460000',
        '重庆市': '500000',
        '四川省': '510000',
        '贵州省': '520000',
        '云南省': '530000',
        '西藏自治区': '540000',
        '陕西省': '610000',
        '甘肃省': '620000',
        '青海省': '630000',
        '宁夏回族自治区': '640000',
        '新疆维吾尔自治区': '650000',
        '香港特别行政区': '810000',
        '澳门特别行政区': '820000',
        '台湾省': '710000'
        };
    const SHENG_datacode = provinceCodes[Province] || '省份名字不正确';
    exportgsontoDIR(SHENG_datacode)
    break;
    }
});

//将数据库中查询到的矢量导出到文件夹中
function exportgsontoDIR(dataCode) {
    return fetch(`/getGsonDB?code=${dataCode}`)
        .then(response => response.json())
        .then(data => {
            console.log('Data exported successfully:', data);
            if(data.status === 'success') {
                //显示SVG
                const SVGLI_LI = document.getElementById('SVGLI');
                SVGLI_LI.style.display = 'inline-block';
                checkAndShowDownloadButton(dataCode);
                loadGeoJSONfromPath(data.filepath);  // 使用返回的路径来加载GeoJSON
            }
        })
        .catch(error => {
            console.error('Error exporting gjson data:', error);
            throw error;
        });
    }

//将地理编码查询到的矢量进行显示和下载
function Codegson(address) {
    return fetch(`/getGeoAddress?address=${address}`)
        .then(response => response.json())
        .then(data => {
            console.log('GEOCODE TO GSON successfully:', data);
            if(data.status === 'success') {
                checkAndShowDownloadButton(address);
                //不显示村级下载svg数据
                const SVGLI_LI = document.getElementById('SVGLI');
                SVGLI_LI.style.display = 'none';
                loadGeoPointJSONfromPath(data.filepath) // 使用返回的路径来加载村级点GeoJSON
            }
        })
        .catch(error => {
            console.error('GEOCODE TO GSON error', error);
            throw error;
        });
}

// 高德显示点矢量
function loadGeoPointJSONfromPath(filepath) {
            map.clearMap();  // 清除地图上的所有覆盖物
            fetch(filepath)
                .then(response => response.json())
                .then(geojsonData => {
                    const geojson = new AMap.GeoJSON({
                        geoJSON: geojsonData,
                        getMarker: function(geojson, lnglats) {
                            // 创建一个红色的标记
                            return new AMap.Marker({
                                position: lnglats,
                                icon: new AMap.Icon({
                                    size: new AMap.Size(40, 50),  // 图标尺寸
                                    image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png"  // 红色标记的图标URL
                                })
                            });
                        }
                    });
                    geojson.setMap(map);
                    
                    // 根据GeoJSON覆盖物自动调整地图视野
                    map.setFitView();

                })
                .catch(error => {
                    console.error('Error loading GeoJSON data to the map:', error);
                });
        }

//高德显示面矢量
function loadGeoJSONfromPath(filepath) {
    map.clearMap();
    fetch(filepath)
        .then(response => response.json())
        .then(geojsonData => {
            const geojson = new AMap.GeoJSON({
                geoJSON: geojsonData,
                getPolygon: function(geojson, lnglats) {
                    return new AMap.Polygon({
                        path: lnglats,
                        strokeColor: '#ff33cc',
                        fillColor: '#ffc3a0',
                        fillOpacity: 0.5
                    });
                }
            });
            geojson.setMap(map);
            
            // 根据GeoJSON覆盖物自动调整地图视野
            map.setFitView();

        })
        .catch(error => {
            console.error('Error loading GeoJSON data to the map:', error);
        });
}

//是否展示下载按钮函数
function checkAndShowDownloadButton(dataCode) {
    const btn = document.getElementById('downloadVectorBtn');
    const formatSelect = document.getElementById('formatSelect');
    const downloadDIV_DIV = document.getElementById('downloadDIV');
    const downloadDIV_DIV2 = document.getElementById('downloadVectorBtn_DIV');
    btn.style.display = 'block';
    formatSelect.style.display = 'block';
    downloadDIV_DIV.style.display='block'
    downloadDIV_DIV2.style.display='block'
    
    console.log(btn.href);
    }

// 获取并填充年份
async function loadYears() {
    const response = await fetch('/get-years');
    const years = await response.json();
    const yearSelect = document.getElementById('year');
    
    yearSelect.innerHTML = years.map(year => `<option value="${year}">${year}</option>`).join('');
}

// 根据选择的年份获取并填充省份
async function loadProvinces() {
    const selectedYear = document.getElementById('year').value;
    const response = await fetch(`/get-provinces/${selectedYear}`);
    const provinces = await response.json();
    const provinceSelect = document.getElementById('province');
    
    provinceSelect.innerHTML = provinces.map(province => `<option value="${province}">${province}</option>`).join('');
}

// 当用户点击查询按钮，加载对应年份和省份的HTML文件到左侧A部分的iframe中并更新标题
function loadProvinceData() {
        const province = document.getElementById('province').value;
        const year = document.getElementById('year').value;
        iframe=null
        iframe = document.getElementById('provinceData');
        iframe.src = `/year/${encodeURIComponent(year)}/${encodeURIComponent(province)}.html`;
        
        const titleDiv = document.getElementById('MAP_title');
        titleDiv.innerHTML = `${year}${province}五级行政区划`;
}

// 初始加载年份，并设置事件监听器
loadYears().then(() => {
    loadProvinces();  // 初始加载省份
});
//添加拖动条
let isResizing = false;
// 当拖动开始时，动态地创建这个覆盖层，并在拖动结束时移除它
document.getElementById('resizer').addEventListener('mousedown', (event) => {
    isResizing = true;
    
    // 添加iframe覆盖层
    const overlay = document.createElement('div');
    overlay.id = 'frameOverlay';
    document.body.appendChild(overlay);
    
    // 为新创建的覆盖层添加mouseup事件监听器
    overlay.addEventListener('mouseup', function handleMouseUp() {
        isResizing = false;
        overlay.removeEventListener('mouseup', handleMouseUp); // 移除这个特定的mouseup监听器
        if (overlay) {
            overlay.parentElement.removeChild(overlay);
        }
        document.removeEventListener('mousemove', handleMouseMove);
    });

    // 监听文档上的鼠标释放事件，确保释放鼠标按钮时停止拖动
    document.addEventListener('mouseup', function stopResizing() {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        if (overlay) {
            overlay.parentElement.removeChild(overlay);
        }
    });

    // 监听鼠标移动事件
    document.addEventListener('mousemove', handleMouseMove);
    event.preventDefault();
});


overlay.addEventListener('mouseup', () => {
    isResizing = false;
    // 移除iframe覆盖层
    const overlay = document.getElementById('frameOverlay');
    if (overlay) {
        overlay.parentElement.removeChild(overlay);
    }
    document.removeEventListener('mousemove', handleMouseMove);
});


document.addEventListener('mouseleave', () => {
    isResizing = false;
    document.removeEventListener('mousemove', handleMouseMove);
});

function handleMouseMove(event) {
    // 判断拖动状态和鼠标左键是否按下
    if (!isResizing || (event.buttons !== 1)) {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        
        // 移除iframe覆盖层
        const overlay = document.getElementById('frameOverlay');
        if (overlay) {
            overlay.parentElement.removeChild(overlay);
        }
        return;
    }

    const leftPanel = document.getElementById('provinceData');
    const container = document.querySelector("div[style='height: 90%; display: flex; width: 100%;']");
    const resizerWidth = 5;  // 拖动条的宽度
    let leftWidth = event.clientX - container.getBoundingClientRect().left;

    // 约束leftWidth的值
    leftWidth = Math.max(leftWidth, 100); // 最小宽度为100px
    leftWidth = Math.min(leftWidth, container.offsetWidth - resizerWidth - 100); // 考虑到拖动条和右边面板的最小宽度

    leftPanel.style.flex = `0 0 ${leftWidth}px`;
}

