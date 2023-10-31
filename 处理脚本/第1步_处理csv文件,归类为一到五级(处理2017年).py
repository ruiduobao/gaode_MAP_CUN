import pandas as pd

# 读取CSV文件
input_file = r'E:\个人\博客\锐多宝矢量\data\网站\gaode_MAP_CUN\处理脚本\data\原始csv文件\\area_code_2017(格式不同).csv'  # 替换为您的输入文件路径
output_file = r'E:\个人\博客\锐多宝矢量\data\网站\gaode_MAP_CUN\处理脚本\data\修改后的csv文件\\2.生成的数据位一到五级(含编码)2017.csv'  # 替换为您的输出文件路径

df = pd.read_csv(input_file)

# 初始化输出数据的列表
output_data = []

for index, row in df.iterrows():
    level = row['层级']
    province_name = row['省级']
    city_name = row['市级'] if level >= 2 else None
    county_name = row['县级'] if level >= 3 else None
    township_name = row['乡级'] if level >= 4 else None
    village_name = row['村级'] if level == 5 else None
    
    if level == 1:
        code = str(int(row['省级编码的前两位'])) + '0000'
    elif level == 2:
        code = str(int(row['市级编码']))
    elif level == 3:
        code = str(int(row['县级编码']))
    elif level == 4:
        code = str(int(row['乡级编码']))
    elif level == 5:
        code = str(int(row['村级编码']))
    
    other_info = row.get('其他信息', '\\N')

    output_data.append([province_name, city_name, county_name, township_name, village_name, code, other_info])

# 创建输出的DataFrame
output_df = pd.DataFrame(output_data, columns=['省', '市', '县', '乡', '村', '编码', '其他信息'])

# 保存输出数据到CSV文件
output_df.to_csv(output_file, index=False)

print("数据整理完成，输出文件为:", output_file)
