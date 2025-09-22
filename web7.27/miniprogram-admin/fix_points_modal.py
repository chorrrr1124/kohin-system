#!/usr/bin/env python3
import re

# 读取文件
with open('src/pages/UsersPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找积分管理模态框的开始和结束
lines = content.split('\n')
new_lines = []
i = 0

while i < len(lines):
    line = lines[i]
    
    # 如果找到积分管理模态框的开始
    if '{/* 积分管理模态框 */}' in line:
        new_lines.append(line)  # 添加注释行
        i += 1
        
        # 添加条件渲染开始行，并确保正确的语法
        if i < len(lines) and '{showPointsModal && selectedCustomerForPoints && (' in lines[i]:
            new_lines.append('      {showPointsModal && selectedCustomerForPoints && (')
            i += 1
            
            # 添加模态框内容，直到找到结束
            modal_depth = 1
            while i < len(lines) and modal_depth > 0:
                current_line = lines[i]
                new_lines.append(current_line)
                
                # 计算模态框的嵌套深度
                if '<div' in current_line:
                    modal_depth += current_line.count('<div')
                if '</div>' in current_line:
                    modal_depth -= current_line.count('</div>')
                
                i += 1
                
                # 如果这是模态框的最后一个 </div>，添加条件渲染的闭合
                if modal_depth == 0:
                    new_lines.append('      )}')
                    break
    else:
        new_lines.append(line)
        i += 1

# 写回文件
with open('src/pages/UsersPage.jsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("Fixed points modal syntax")
