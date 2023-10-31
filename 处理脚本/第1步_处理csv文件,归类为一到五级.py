#将原始github数据归类为一到五级,各级含有其代码

import pandas as pd


# 读取CSV文件
input_file = r'E:\个人\博客\锐多宝矢量\data\网站\gaode_MAP_CUN\处理脚本\data\原始csv文件\\area_code_2010.csv'  # 替换为您的输入文件路径
output_file = r'E:\个人\博客\锐多宝矢量\data\网站\gaode_MAP_CUN\处理脚本\data\修改后的csv文件\\2.生成的数据位一到五级(含编码)2010.csv'  # 替换为您的输出文件路径

df = pd.read_csv(input_file)

# 初始化输出数据的列表
output_data = []

# 初始化变量用于存储上级编码和层级信息
prev_code = None
prev_level = None

for index, row in df.iterrows():
    code = row['编码']
    level = row['层级']
    name = row['单位名称']
    other_info = row['其他信息']

    if level == 1:
        level1_name = name
        level2_name = None
        level3_name = None
        level4_name = None
        level5_name = None
    elif level == 2:
        level2_name = name
        level3_name = None
        level4_name = None
        level5_name = None
    elif level == 3:
        level3_name = name
        level4_name = None
        level5_name = None
    elif level == 4:
        level4_name = name
        level5_name = None
    elif level == 5:
        level5_name = name

    if prev_code:
        output_data.append([level1_name, level2_name, level3_name, level4_name, level5_name, code, other_info])

    prev_code = code
    prev_level = level

# 创建输出的DataFrame
output_df = pd.DataFrame(output_data, columns=['省', '市', '县', '乡', '村', '编码', '其他信息'])

# 保存输出数据到CSV文件

output_df.to_csv(output_file, index=False)

print("数据整理完成，输出文件为:", output_file)

