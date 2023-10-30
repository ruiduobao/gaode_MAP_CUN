# 设置输入和输出目录
$markdownDirectory = "D:\KESHAN\markdown"
$outputDirectory = "D:\KESHAN\html"

# 确保输出目录存在，如果不存在则创建
if (-not (Test-Path -Path $outputDirectory)) {
    New-Item -Path $outputDirectory -ItemType Directory
}

# 获取所有的 .md 文件并遍历它们
$markdownFiles = Get-ChildItem -Path $markdownDirectory -Filter *.md
foreach ($file in $markdownFiles) {
    $outputFileName = Join-Path -Path $outputDirectory -ChildPath ($file.BaseName + ".html")
    
    # 使用 markmap 命令转换 Markdown 文件为 Markmap
    & markmap $file.FullName --output $outputFileName
}
