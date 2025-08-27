# 商城小程序云函数自动部署脚本
# 使用方法：在PowerShell中运行 .\deploy.ps1

Write-Host "=== 商城小程序云函数部署脚本 ===" -ForegroundColor Green
Write-Host "正在检查环境..." -ForegroundColor Yellow

# 检查是否安装了 @cloudbase/cli
try {
    $cliVersion = tcb --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CloudBase CLI 已安装: $cliVersion" -ForegroundColor Green
    } else {
        throw "CLI not found"
    }
} catch {
    Write-Host "❌ 未检测到 CloudBase CLI，正在安装..." -ForegroundColor Red
    Write-Host "请手动运行: npm install -g @cloudbase/cli" -ForegroundColor Yellow
    Write-Host "安装完成后重新运行此脚本" -ForegroundColor Yellow
    exit 1
}

# 检查是否已登录
Write-Host "检查登录状态..." -ForegroundColor Yellow
try {
    tcb env:list 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 未登录腾讯云，请先登录" -ForegroundColor Red
        Write-Host "运行命令: tcb login" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ 已登录腾讯云" -ForegroundColor Green
} catch {
    Write-Host "❌ 登录检查失败" -ForegroundColor Red
    exit 1
}

# 定义云函数列表（按优先级排序）
$coreFunctions = @(
    "login",
    "syncUser", 
    "getShopProducts"
)

$shopFunctions = @(
    "getProductDetail",
    "getBanners",
    "getCategories",
    "submitOrder",
    "getUserOrders"
)

$cartFunctions = @(
    "getUserCart",
    "updateUserCart"
)

$couponFunctions = @(
    "getActiveCoupons",
    "claimCoupon",
    "getUserCouponCount"
)

$adminFunctions = @(
    "updateOrderStatus",
    "manageBanners",
    "manageHomepageConfig",
    "cleanupImageUrls"
)

# 部署函数的通用方法
function Deploy-CloudFunction {
    param(
        [string]$functionName,
        [string]$category
    )
    
    Write-Host "正在部署 $category : $functionName" -ForegroundColor Cyan
    
    # 检查云函数目录是否存在
    $functionPath = "./cloudfunctions/$functionName"
    if (-not (Test-Path $functionPath)) {
        Write-Host "⚠️  跳过 $functionName (目录不存在)" -ForegroundColor Yellow
        return $false
    }
    
    try {
        # 部署云函数
        tcb functions:deploy $functionName --force
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $functionName 部署成功" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $functionName 部署失败" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $functionName 部署异常: $_" -ForegroundColor Red
        return $false
    }
}

# 开始部署
Write-Host "\n=== 开始部署云函数 ===" -ForegroundColor Green

$successCount = 0
$totalCount = 0

# 部署核心功能云函数
Write-Host "\n📦 部署核心功能云函数..." -ForegroundColor Magenta
foreach ($func in $coreFunctions) {
    $totalCount++
    if (Deploy-CloudFunction -functionName $func -category "核心功能") {
        $successCount++
    }
    Start-Sleep -Seconds 2
}

# 部署商城功能云函数
Write-Host "\n🛒 部署商城功能云函数..." -ForegroundColor Magenta
foreach ($func in $shopFunctions) {
    $totalCount++
    if (Deploy-CloudFunction -functionName $func -category "商城功能") {
        $successCount++
    }
    Start-Sleep -Seconds 2
}

# 部署购物车功能云函数
Write-Host "\n🛍️ 部署购物车功能云函数..." -ForegroundColor Magenta
foreach ($func in $cartFunctions) {
    $totalCount++
    if (Deploy-CloudFunction -functionName $func -category "购物车功能") {
        $successCount++
    }
    Start-Sleep -Seconds 2
}

# 询问是否部署可选功能
$deployOptional = Read-Host "\n是否部署优惠券和管理功能？(y/N)"
if ($deployOptional -eq 'y' -or $deployOptional -eq 'Y') {
    # 部署优惠券功能云函数
    Write-Host "\n🎫 部署优惠券功能云函数..." -ForegroundColor Magenta
    foreach ($func in $couponFunctions) {
        $totalCount++
        if (Deploy-CloudFunction -functionName $func -category "优惠券功能") {
            $successCount++
        }
        Start-Sleep -Seconds 2
    }
    
    # 部署管理功能云函数
    Write-Host "\n⚙️ 部署管理功能云函数..." -ForegroundColor Magenta
    foreach ($func in $adminFunctions) {
        $totalCount++
        if (Deploy-CloudFunction -functionName $func -category "管理功能") {
            $successCount++
        }
        Start-Sleep -Seconds 2
    }
}

# 部署结果统计
Write-Host "\n=== 部署完成 ===" -ForegroundColor Green
Write-Host "成功部署: $successCount/$totalCount 个云函数" -ForegroundColor Green

if ($successCount -eq $totalCount) {
    Write-Host "🎉 所有云函数部署成功！" -ForegroundColor Green
} elseif ($successCount -gt 0) {
    Write-Host "⚠️  部分云函数部署成功，请检查失败的函数" -ForegroundColor Yellow
} else {
    Write-Host "❌ 所有云函数部署失败，请检查配置" -ForegroundColor Red
}

# 提供后续操作建议
Write-Host "\n=== 后续操作建议 ===" -ForegroundColor Cyan
Write-Host "1. 在微信开发者工具中检查云函数状态" -ForegroundColor White
Write-Host "2. 运行测试数据初始化脚本" -ForegroundColor White
Write-Host "3. 测试商城页面功能" -ForegroundColor White
Write-Host "4. 查看详细部署指南: 一键部署脚本.md" -ForegroundColor White

Write-Host "\n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")