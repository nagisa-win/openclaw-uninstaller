# OpenClaw 卸载工具

<div align="center">
    <img src="banner.jpg" alt="OpenClaw Uninstaller Banner" width="600"/>
    <br/>
    <h2>跨平台 OpenClaw 完全卸载工具</h2>
    <br/>
</div>

<p align="center">
    <a href="https://www.npmjs.com/package/@steven-y/openclaw-uninstaller">
        <img src="https://img.shields.io/npm/v/@steven-y/openclaw-uninstaller
    </a>
    <a href="https://www.npmjs.com/package/@steven-y/openclaw-uninstaller">
        <img src="https://img.shields.io/npm/dm/@steven-y/openclaw-uninstaller.svg?style=flat-square&logo=npm" alt="npm downloads"/>
    </a>
    <a href="https://github.com/nagisa-win/openclaw-uninstaller/stargazers">
        <img src="https://img.shields.io/github/stars/nagisa-win/openclaw-uninstaller.svg?style=flat-square&logo=github" alt="GitHub stars"/>
    </a>
    <a href="https://github.com/nagisa-win/openclaw-uninstaller/network/members">
        <img src="https://img.shields.io/github/forks/nagisa-win/openclaw-uninstaller.svg?style=flat-square&logo=github" alt="GitHub forks"/>
    </a>
    <a href="https://github.com/nagisa-win/openclaw-uninstaller/issues">
        <img src="https://img.shields.io/github/issues/nagisa-win/openclaw-uninstaller.svg?style=flat-square&logo=github" alt="GitHub issues"/>
    </a>
    <a href="https://github.com/nagisa-win/openclaw-uninstaller/blob/master/LICENSE">
        <img src="https://img.shields.io/github/license/nagisa-win/openclaw-uninstaller.svg?style=flat-square&logo=github" alt="GitHub license"/>
    </a>
    <a href="https://github.com/nagisa-win/openclaw-uninstaller/commits/master">
        <img src="https://img.shields.io/github/last-commit/nagisa-win/openclaw-uninstaller.svg?style=flat-square&logo=github" alt="GitHub last commit"/>
    </a>
    <a href="https://nodejs.org/">
        <img src="https://img.shields.io/node/v/@steven-y/openclaw-uninstaller.svg?style=flat-square&logo=node.js" alt="Node.js Version"/>
    </a>
</p>

---

## ✨ 特性

- 🌍 **跨平台支持** - macOS、Windows、Linux
- 🔄 **进程管理** - 自动检测并停止运行中的 OpenClaw 进程
- 🔒 **权限处理** - 自动请求管理员权限
- 🧹 **完全卸载** - 清理文件、配置、启动项、注册表等
- 📦 **双模式运行** - 支持 NPX 和 Bash 一键执行
- ⚡ **通配符支持** - 自动匹配多个相关文件（如 LaunchAgents）
- 🎨 **美观输出** - 彩色终端输出，清晰展示进度
- ⚠️ **安全确认** - 执行前需要用户确认

## 🖥️ 支持平台

| 平台    | 架构                            | 状态 |
|---------|--------------------------------|------|
| macOS   | x86_64, arm64 (Apple Silicon)  | ✅    |
| Windows | x86_64, x86                    | ✅    |
| Linux   | x86_64, arm64                  | ✅    |

## 🚀 快速开始

⚠️ **特别提醒**：本项目由 Coding Agent 编写，仅供学习交流使用。执行前请备份重要数据，本项目和作者不承担任何责任。

### NPX（推荐）

无需安装，直接运行：

```bash
npx @steven-y/openclaw-uninstaller
```

### NPM 全局安装

```bash
npm install -g @steven-y/openclaw-uninstaller
openclaw-uninstaller
```

### Bash 一键卸载

```bash
curl -fsSL https://raw.githubusercontent.com/nagisa-win/openclaw-uninstaller/master/scripts/uninstall.sh | sh
```

## 📋 卸载内容

### macOS

| 路径 | 说明 | 需要权限 |
|------|------|:-------:|
| `~/.openclaw` | 用户数据目录 | ❌ |
| `~/Library/Application Support/OpenClaw` | 应用支持文件 | ❌ |
| `~/Library/Caches/com.openclaw.app` | 缓存文件 | ❌ |
| `~/Library/Preferences/com.openclaw.app.plist` | 偏好设置 | ❌ |
| `~/Library/Logs/OpenClaw` | 日志文件 | ❌ |
| `~/Library/WebKit/com.openclaw.app` | WebKit 数据 | ❌ |
| `~/Library/Saved Application State/com.openclaw.app.savedState` | 应用状态 | ❌ |
| `~/Library/LaunchAgents/com.openclaw.*.plist` | 用户启动项 | ❌ |
| `/Library/LaunchDaemons/com.openclaw.*.plist` | 系统启动项 | ✅ |
| `/Applications/OpenClaw.app` | 应用程序 | ✅ |

### Windows

| 路径 | 说明 | 需要权限 |
|------|------|:-------:|
| `%APPDATA%/OpenClaw` | AppData 目录 | ❌ |
| `%LOCALAPPDATA%/OpenClaw` | Local AppData 目录 | ❌ |
| `%LOCALAPPDATA%/Programs/OpenClaw` | 本地程序目录 | ❌ |
| `%PROGRAMFILES%/OpenClaw` | Program Files | ✅ |
| `%PROGRAMFILES(x86)%/OpenClaw` | Program Files (x86) | ✅ |
| `%USERPROFILE%/.openclaw` | 用户主目录 | ❌ |
| `%APPDATA%/Microsoft/Windows/Start Menu/Programs/OpenClaw` | 开始菜单快捷方式 | ❌ |
| 注册表 `HKCU\Software\OpenClaw` | 用户注册表 | ❌ |
| 注册表 `HKLM\SOFTWARE\OpenClaw` | 系统注册表 | ✅ |

### Linux

| 路径 | 说明 | 需要权限 |
|------|------|:-------:|
| `~/.openclaw` | 用户数据目录 | ❌ |
| `~/.config/openclaw` | 配置目录 | ❌ |
| `~/.local/share/openclaw` | 数据目录 | ❌ |
| `~/.cache/openclaw` | 缓存目录 | ❌ |
| `~/.local/share/applications/openclaw.desktop` | 用户桌面入口 | ❌ |
| `/usr/share/applications/openclaw.desktop` | 系统桌面入口 | ✅ |
| `/opt/openclaw` | 安装目录 | ✅ |
| `/usr/local/bin/openclaw` | 本地二进制链接 | ✅ |
| `/usr/bin/openclaw` | 系统二进制 | ✅ |
| `/etc/systemd/system/openclaw*.service` | systemd 服务 | ✅ |

## 🔐 管理员权限

部分文件需要管理员权限才能删除：

- **macOS/Linux**：脚本会自动请求 `sudo` 权限，按提示输入密码即可
- **Windows**：需要以管理员身份运行终端

## ⚙️ 配置说明

卸载路径定义在 `src/config.json` 中，可根据需要自定义：

```json
{
    "macos": [
        {
            "path": "$HOME/.openclaw",
            "operation": "delete",
            "description": "OpenClaw 用户数据目录",
            "requireSudo": false
        }
    ]
}
```

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/nagisa-win/openclaw-uninstaller.git
cd openclaw-uninstaller

# 本地运行
node src/index.js

# 赋予脚本执行权限
chmod +x scripts/uninstall.sh
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<p align="center">
    如果这个项目对你有帮助，请给一个 ⭐️ Star！
    <br/>
    Made with GLM-5 by <a href="https://github.com/nagisa-win">渚酱</a>
</p>
