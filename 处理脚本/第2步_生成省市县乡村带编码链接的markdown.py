import pandas as pd
from tqdm import tqdm

# 对照信息字典
info_dict = {
    "111": "主城区",
    "112": "城乡结合区",
    "121": "镇中心区",
    "122": "镇乡结合区",
    "123": "特殊区域",
    "210": "乡中心区",
    "220": "村庄"
}

# 从CSV文件读取数据
PATH = r"E:\个人\博客\锐多宝矢量\data\网站\gaode_MAP_CUN\处理脚本\data\修改后的csv文件\2.生成的数据位一到五级(含编码)2017.csv"

df = pd.read_csv(PATH)

# 按照省、市、县、乡的层次结构对数据进行排序
df = df.sort_values(['省', '市', '县', '乡'])

# 获取唯一的省份列表
provinces = df['省'].unique()

for province in tqdm(provinces):
    # 创建Markdown文档
    OUT_PATH = fr"E:\个人\博客\锐多宝矢量\data\网站\gaode_MAP_CUN\处理脚本\data\生成的markdown文件\2017年/{province}.md"
    
    with open(OUT_PATH, "w", encoding="utf-8") as file:
        
        province_code = str(df[df['省'] == province].iloc[0]['编码'])[:2] + "0000"
        file.write(f"# [{province}]({province_code})\n")
        
        province_data = df[df['省'] == province]

        for city, city_data in province_data.groupby('市'):
            city_code = str(city_data.iloc[0]['编码'])[:4] + "00"
            file.write(f"## [{city}]({city_code})\n")
            for county, county_data in city_data.groupby('县'):
                county_code = str(county_data.iloc[0]['编码'])[:6]
                file.write(f"- [{county}]({county_code})\n")
                for town, town_data in county_data.groupby('乡'):
                    town_code = str(town_data.iloc[0]['编码'])
                    file.write(f"  - [{town}]({town_code})\n")
                    for _, row in town_data.iterrows():
                        village = row['村']
                        # 检查village是否为nan
                        if pd.isna(village):
                            continue
                        village_code = f"{province}{city}{county}{town}{village}"  # 修改为省市县乡+村的形式
                        other_info = info_dict.get(str(row['其他信息']), "")
                        village_desc = f"{village}    {other_info}"
                        file.write(f"    - [{village_desc}]({village_code})\n")