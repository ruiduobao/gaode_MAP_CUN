const fs = require('fs');
const path = require('path');

function displayDirStructure(dirPath, prefix = '') {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        // 排除 node_modules 文件夹
        if (entry.name === 'node_modules') continue;

        console.log(prefix + (i === entries.length - 1 ? '└── ' : '├── ') + entry.name);

        if (entry.isDirectory()) {
            const nextPrefix = prefix + (i === entries.length - 1 ? '    ' : '│   ');
            displayDirStructure(path.join(dirPath, entry.name), nextPrefix);
        }
    }
}

const rootDir = './'; // 默认为当前目录
displayDirStructure(rootDir);
