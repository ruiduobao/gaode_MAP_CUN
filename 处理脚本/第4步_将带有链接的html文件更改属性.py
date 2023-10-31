#第三步_将带有链接的MD文件更改属性
# 将data-code的属性值不是纯数字，就把data-code这个属性名字改为data-address，属性值不变

import re
import os

# 文件夹路径
folder_path = r"E:\个人\博客\锐多宝矢量\data\网站\gaode_MAP_CUN\处理脚本\data\生成的html文件\2017年"
print("hello,world")
# 获取文件夹中的所有文件
for filename in os.listdir(folder_path):
    # 检查是否为.html文件
    if filename.endswith('.html'):
        file_path = os.path.join(folder_path, filename)

        # 读取HTML文件内容
        with open(file_path, 'r', encoding='utf-8') as file:
            html_content = file.read()

        # 使用正则表达式进行匹配和替换，为<a>标签添加data-code属性
        pattern = r'<a href=\\"(.*?)\\">(.*?)<\/a>'
        replacement = r"<a href='#' data-code='\1'>\2</a>"
        modified_html = re.sub(pattern, replacement, html_content)

        # 检查data-code的值是否为纯数字，如果不是，则更改为data-address
        pattern_non_numeric = r"<a href='#' data-code='(\D+?)'>"
        replacement_non_numeric = r"<a href='#' data-address='\1'>"
        modified_html = re.sub(pattern_non_numeric, replacement_non_numeric, modified_html)

        # 将处理后的HTML内容写回文件
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(modified_html)
        print("finish")