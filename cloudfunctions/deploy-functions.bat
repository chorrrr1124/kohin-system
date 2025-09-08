@echo off
echo 开始部署云函数...

REM 检查是否安装了tcb-cli
where tcb >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 未找到tcb-cli，请先安装
    echo 运行: npm install -g @cloudbase/cli
    pause
    exit /b 1
)

REM 登录云开发（如果需要）
echo 检查登录状态...
tcb login --check
if %errorlevel% neq 0 (
    echo 需要登录云开发，请按照提示完成登录...
    tcb login
)

REM 部署所有云函数
echo 部署云函数...
tcb functions:deploy

if %errorlevel% equ 0 (
    echo 云函数部署成功！
    echo.
    echo 接下来请执行以下步骤：
    echo 1. 在腾讯云开发控制台配置环境变量
    echo 2. 运行数据库初始化函数
    echo 3. 测试图片保存功能
) else (
    echo 云函数部署失败，请检查错误信息
)

pause
