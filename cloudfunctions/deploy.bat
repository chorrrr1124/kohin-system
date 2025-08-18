@echo off
echo 正在部署云函数到腾讯云开发...
echo.

echo 检查tcb-cli是否已安装...
tcb --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到tcb-cli，请先安装:
    echo npm install -g @cloudbase/cli
    pause
    exit /b 1
)

echo tcb-cli已安装
echo.

echo 开始部署云函数...
tcb functions:deploy

if %errorlevel% equ 0 (
    echo.
    echo 部署成功！
    echo.
    echo 重要提醒：
    echo 1. 请登录腾讯云开发控制台
    echo 2. 进入环境 cloudbase-3g4w6lls8a5ce59b
    echo 3. 在云函数管理中找到 getCosSts 和 uploadImageToCos
    echo 4. 分别设置环境变量：
    echo    - TENCENTCLOUD_SECRETID: 您的腾讯云SecretId
    echo    - TENCENTCLOUD_SECRETKEY: 您的腾讯云SecretKey
    echo 5. 重启云函数使环境变量生效
    echo.
) else (
    echo.
    echo 部署失败，请检查错误信息
    echo.
)

pause