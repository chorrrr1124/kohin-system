import re

# 读取文件
with open('src/pages/ShopPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 读取替换内容
with open('temp_table_replacement.jsx', 'r', encoding='utf-8') as f:
    replacement = f.read()

# 找到表格部分并替换
pattern = r'<div className="overflow-x-auto">\s*<table className="table table-zebra w-full">.*?</table>\s*</div>'
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# 写回文件
with open('src/pages/ShopPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("表格替换完成")
