#!/usr/bin/env python3

# 读取文件
with open('src/pages/UsersPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# 找到需要修复的部分
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # 跳过问题行，手动重建结尾
    if i >= 1075 and ')}' in line and '</div>' not in line:
        # 添加正确的结尾结构
        new_lines.append('        </div>')
        new_lines.append('      )}')
        new_lines.append('    </div>')
        new_lines.append('  );')
        new_lines.append('};')
        new_lines.append('')
        new_lines.append('export default CustomersPage;')
        break
    else:
        new_lines.append(line)
        i += 1

# 写回文件
with open('src/pages/UsersPage.jsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("Fixed final structure")
