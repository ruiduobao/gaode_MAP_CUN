import re

# 文件路径
file_path = r"海南省添加链接 copy.html"

# 读取HTML文件内容
with open(file_path, 'r', encoding='utf-8') as file:
    html_content = file.read()

# 使用正则表达式进行匹配和替换
pattern = r'<a href=\\"(.*?)\\">(.*?)<\/a>'
replacement = r"<a href='#' data-code='\1'>\2</a>"
modified_html = re.sub(pattern, replacement, html_content)

# 将处理后的HTML内容写回文件
with open(file_path, 'w', encoding='utf-8') as file:
    file.write(modified_html)