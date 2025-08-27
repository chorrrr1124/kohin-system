# Deploy Key 设置指南

## 已生成的 Deploy Key

**公钥文件位置**: `C:\Users\chor\.ssh\deploy_key_kohin.pub`
**私钥文件位置**: `C:\Users\chor\.ssh\deploy_key_kohin`

## 公钥内容

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOpXa9fs8iVLnHwxl0SN02JcUUMSknsnUD/7HRsJGhNU deploy-key-kohin-system
```

## 如何在 GitHub 上设置 Deploy Key

1. 打开你的 GitHub 仓库页面: https://github.com/chorrrr1124/kohin-system
2. 点击 **Settings** 选项卡
3. 在左侧菜单中点击 **Deploy keys**
4. 点击 **Add deploy key** 按钮
5. 填写以下信息：
   - **Title**: `Deploy Key for Kohin System`
   - **Key**: 复制上面的公钥内容
   - **Allow write access**: ✅ 勾选（如果需要推送权限）
6. 点击 **Add key** 保存

## 使用 Deploy Key 推送代码

### 方法1: 临时使用
```bash
# 设置 SSH 配置使用特定的私钥
export GIT_SSH_COMMAND="ssh -i C:/Users/chor/.ssh/deploy_key_kohin"
git push origin master
```

### 方法2: 配置 SSH config
在 `C:\Users\chor\.ssh\config` 文件中添加：
```
Host github-deploy
    HostName github.com
    User git
    IdentityFile C:/Users/chor/.ssh/deploy_key_kohin
    IdentitiesOnly yes
```

然后修改远程仓库 URL：
```bash
git remote set-url origin git@github-deploy:chorrrr1124/kohin-system.git
git push origin master
```

## 注意事项

- Deploy Key 是只读的，除非在 GitHub 上勾选了 "Allow write access"
- 每个 Deploy Key 只能用于一个仓库
- 私钥文件请妥善保管，不要泄露给他人
- 如果不再需要，可以在 GitHub 仓库设置中删除对应的 Deploy Key

## 故障排除

如果遇到连接问题，可能是网络或防火墙限制。可以尝试：
1. 使用 HTTPS 方式推送
2. 检查网络连接
3. 联系网络管理员检查防火墙设置