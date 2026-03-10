/**
 * OpenClaw 卸载工具核心逻辑
 * 支持 macOS, Windows, Linux 完全卸载
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI 颜色代码
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
};

// 中文提示信息
const messages = {
    header: 'OpenClaw 卸载工具',
    version: 'v1.0.0',
    platform: '平台',
    architecture: '架构',
    homeDir: '用户目录',
    summary: '执行摘要',
    successfullyRemoved: '成功删除：',
    failedToRemove: '删除失败：',
    skipped: '跳过（未找到）：项',
    completelyUninstalled: 'OpenClaw 已完全卸载！',
    someFailed: '部分项目无法删除，请尝试手动删除。',
    noOpenClaw: '未在系统中找到 OpenClaw 相关文件。',
    startingUninstall: '开始卸载...',
    adminRequired: '完全卸载需要管理员权限。',
    runAsAdmin: '请以管理员身份重新运行此脚本：',
    runAsAdminWin: '右键点击终端 → 以管理员身份运行',
    passwordPrompt: '可能需要输入您的密码。',
    adminFailed: '无法获取管理员权限。',
    continueWithoutAdmin: '正在以普通权限继续...',
    noRules: '未找到平台卸载规则：',
    checkFile: '检查：',
    removed: '已删除',
    notFound: '不存在',
    failed: '失败',
    error: '错误',
    processFound: '检测到 OpenClaw 正在运行',
    processStopping: '正在停止进程...',
    processStopped: '进程已停止',
    processStopFailed: '进程停止失败',
    confirmPrompt: '即将卸载 OpenClaw 及其所有数据，是否继续？',
    confirmYes: '输入 yes 或 y 确认继续：',
    confirmCancelled: '已取消卸载。',
    cleaningRegistry: '清理 Windows 注册表...',
    registryCleaned: '注册表清理完成',
};

export class Uninstaller {
    constructor() {
        this.platform = this.detectPlatform();
        this.config = this.loadConfig();
        this.deletedItems = [];
        this.failedItems = [];
        this.hasAdminPrivilege = false;
    }

    /**
     * 检测当前平台
     */
    detectPlatform() {
        const platform = os.platform();
        if (platform === 'darwin') return 'macos';
        if (platform === 'win32') return 'windows';
        if (platform === 'linux') return 'linux';
        throw new Error(`不支持的操作系统: ${platform}`);
    }

    /**
     * 加载卸载配置
     */
    loadConfig() {
        const configPath = path.join(__dirname, 'config.json');
        const rawConfig = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(rawConfig);
    }

    /**
     * 展开路径中的环境变量
     */
    expandPath(filePath) {
        let expanded = filePath;

        // 处理 $HOME 和 ${HOME}
        expanded = expanded.replace(/\$HOME|\${HOME}/g, os.homedir());

        // 处理 Windows $env:VAR 风格
        if (this.platform === 'windows') {
            expanded = expanded.replace(/\$env:(\w+)/g, (_, varName) => {
                return process.env[varName] || '';
            });
            expanded = expanded.replace(/\$\{(\w+)\}/g, (_, varName) => {
                return process.env[varName] || '';
            });
        }

        // 处理 Unix ${VAR} 风格
        expanded = expanded.replace(/\$\{(\w+)\}/g, (_, varName) => {
            return process.env[varName] || '';
        });

        // 处理 $VAR 风格（无花括号）
        expanded = expanded.replace(/\$(\w+)/g, (_, varName) => {
            return process.env[varName] || '';
        });

        return expanded;
    }

    /**
     * 检查路径是否存在（支持通配符）
     */
    exists(itemPath) {
        const expandedPath = this.expandPath(itemPath);

        // 检查是否包含通配符
        if (expandedPath.includes('*')) {
            try {
                const dir = path.dirname(expandedPath);
                const pattern = path.basename(expandedPath);

                if (!fs.existsSync(dir)) return false;

                const files = fs.readdirSync(dir);
                const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
                return files.some(file => regex.test(file));
            } catch {
                return false;
            }
        }

        try {
            fs.accessSync(expandedPath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取匹配通配符的所有路径
     */
    getMatchingPaths(itemPath) {
        const expandedPath = this.expandPath(itemPath);

        if (!expandedPath.includes('*')) {
            return [expandedPath];
        }

        try {
            const dir = path.dirname(expandedPath);
            const pattern = path.basename(expandedPath);

            if (!fs.existsSync(dir)) return [];

            const files = fs.readdirSync(dir);
            const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');

            return files.filter(file => regex.test(file)).map(file => path.join(dir, file));
        } catch {
            return [];
        }
    }

    /**
     * 检查是否需要管理员权限
     */
    checkPrivilegeRequirement() {
        const platformConfig = this.config[this.platform] || [];
        return platformConfig.some(item => item.requireSudo || item.requireAdmin);
    }

    /**
     * 请求管理员权限
     */
    async requestPrivileges() {
        if (this.platform === 'windows') {
            try {
                execSync('net session', { stdio: 'ignore' });
                this.hasAdminPrivilege = true;
                return true;
            } catch {
                console.log(
                    `\n${colors.yellow}${messages.adminRequired}${colors.reset}`
                );
                console.log(`${messages.runAsAdmin}`);
                console.log(
                    `${colors.bold}${messages.runAsAdminWin}${colors.reset}\n`
                );
                return false;
            }
        } else {
            try {
                execSync('sudo -n true', { stdio: 'ignore' });
                this.hasAdminPrivilege = true;
                return true;
            } catch {
                console.log(
                    `\n${colors.yellow}${messages.adminRequired}${colors.reset}`
                );
                console.log(`${messages.passwordPrompt}\n`);

                try {
                    execSync('sudo -v', { stdio: 'inherit' });
                    this.hasAdminPrivilege = true;
                    return true;
                } catch {
                    console.log(
                        `${colors.red}${messages.adminFailed}${colors.reset}`
                    );
                    return false;
                }
            }
        }
    }

    /**
     * 检查并停止运行中的 OpenClaw 进程
     */
    async checkAndStopProcess() {
        const processNames = ['openclaw', 'OpenClaw', 'OpenClaw.app'];

        try {
            let runningProcesses = [];

            if (this.platform === 'windows') {
                // Windows: 使用 tasklist
                try {
                    const output = execSync('tasklist /FI "IMAGENAME eq openclaw.exe" /FO CSV', {
                        encoding: 'utf-8',
                        stdio: ['pipe', 'pipe', 'pipe']
                    });
                    if (output.toLowerCase().includes('openclaw')) {
                        runningProcesses.push('openclaw.exe');
                    }
                } catch {
                    // 忽略错误
                }
            } else {
                // macOS/Linux: 使用 pgrep
                for (const name of processNames) {
                    try {
                        execSync(`pgrep -i "${name}"`, { stdio: 'pipe' });
                        runningProcesses.push(name);
                    } catch {
                        // 进程不存在
                    }
                }
            }

            if (runningProcesses.length > 0) {
                console.log(`\n${colors.yellow}${messages.processFound}${colors.reset}`);
                console.log(`  发现进程: ${runningProcesses.join(', ')}`);
                console.log(`${colors.cyan}${messages.processStopping}${colors.reset}`);

                if (this.platform === 'windows') {
                    try {
                        execSync('taskkill /F /IM openclaw.exe', { stdio: 'pipe' });
                        console.log(`${colors.green}  ✓ ${messages.processStopped}${colors.reset}\n`);
                    } catch {
                        // 尝试以管理员权限停止
                        if (this.hasAdminPrivilege) {
                            try {
                                execSync('taskkill /F /IM openclaw.exe', {
                                    shell: 'powershell.exe',
                                    stdio: 'pipe'
                                });
                                console.log(`${colors.green}  ✓ ${messages.processStopped}${colors.reset}\n`);
                            } catch {
                                console.log(`${colors.red}  ✗ ${messages.processStopFailed}${colors.reset}\n`);
                            }
                        }
                    }
                } else {
                    for (const name of runningProcesses) {
                        try {
                            execSync(`pkill -9 -i "${name}"`, { stdio: 'pipe' });
                        } catch {
                            // 尝试 sudo
                            if (this.hasAdminPrivilege) {
                                try {
                                    execSync(`sudo pkill -9 -i "${name}"`, { stdio: 'pipe' });
                                } catch {
                                    // 忽略
                                }
                            }
                        }
                    }
                    console.log(`${colors.green}  ✓ ${messages.processStopped}${colors.reset}\n`);
                }
            }
        } catch (error) {
            // 忽略进程检查错误
        }
    }

    /**
     * 清理 Windows 注册表
     */
    async cleanWindowsRegistry() {
        if (this.platform !== 'windows') return;

        console.log(`${colors.cyan}${messages.cleaningRegistry}${colors.reset}`);

        const registryPaths = [
            'HKCU\\Software\\OpenClaw',
            'HKLM\\SOFTWARE\\OpenClaw',
            'HKLM\\SOFTWARE\\WOW6432Node\\OpenClaw',
        ];

        for (const regPath of registryPaths) {
            try {
                execSync(`reg delete "${regPath}" /f`, {
                    shell: 'cmd.exe',
                    stdio: 'pipe'
                });
                console.log(`  ${colors.green}✓${colors.reset} 已删除: ${regPath}`);
                this.deletedItems.push(`注册表: ${regPath}`);
            } catch {
                // 注册表项不存在或无权限
            }
        }

        console.log(`${colors.green}${messages.registryCleaned}${colors.reset}\n`);
    }

    /**
     * 用户确认
     */
    async confirm() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            console.log(`\n${colors.yellow}${messages.confirmPrompt}${colors.reset}`);
            rl.question(`${colors.bold}${messages.confirmYes}${colors.reset}`, (answer) => {
                rl.close();
                const confirmed = answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
                if (!confirmed) {
                    console.log(`\n${colors.yellow}${messages.confirmCancelled}${colors.reset}\n`);
                }
                resolve(confirmed);
            });
        });
    }

    /**
     * 删除文件或目录
     */
    async deleteItem(itemPath, requirePrivilege = false) {
        // 首先检查路径是否存在
        if (!this.exists(itemPath)) {
            return { success: true, skipped: true, path: this.expandPath(itemPath) };
        }

        const matchingPaths = this.getMatchingPaths(itemPath);

        if (matchingPaths.length === 0) {
            return { success: true, skipped: true, path: this.expandPath(itemPath) };
        }

        let allSuccess = true;
        let anyDeleted = false;
        let lastError = null;

        for (const expandedPath of matchingPaths) {
            try {
                if (this.platform === 'windows') {
                    if (requirePrivilege && !this.hasAdminPrivilege) {
                        // 尝试以管理员权限删除
                        try {
                            execSync(`Remove-Item -Path "${expandedPath}" -Recurse -Force -ErrorAction SilentlyContinue`, {
                                shell: 'powershell.exe',
                                stdio: 'pipe'
                            });
                            anyDeleted = true;
                        } catch {
                            allSuccess = false;
                            lastError = '需要管理员权限';
                        }
                    } else {
                        if (fs.statSync(expandedPath).isDirectory()) {
                            fs.rmSync(expandedPath, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(expandedPath);
                        }
                        anyDeleted = true;
                    }
                } else {
                    if (requirePrivilege) {
                        if (this.hasAdminPrivilege) {
                            execSync(`sudo rm -rf "${expandedPath}"`, { stdio: 'pipe' });
                            anyDeleted = true;
                        } else {
                            // 尝试无权限删除
                            try {
                                if (fs.statSync(expandedPath).isDirectory()) {
                                    fs.rmSync(expandedPath, { recursive: true, force: true });
                                } else {
                                    fs.unlinkSync(expandedPath);
                                }
                                anyDeleted = true;
                            } catch (error) {
                                allSuccess = false;
                                lastError = '需要管理员权限';
                            }
                        }
                    } else {
                        if (fs.statSync(expandedPath).isDirectory()) {
                            fs.rmSync(expandedPath, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(expandedPath);
                        }
                        anyDeleted = true;
                    }
                }
            } catch (error) {
                allSuccess = false;
                lastError = error.message;
            }
        }

        return {
            success: allSuccess,
            skipped: false,
            path: matchingPaths.length > 1 ? `${itemPath} (${matchingPaths.length} 项)` : matchingPaths[0],
            error: lastError
        };
    }

    /**
     * 打印卸载头部
     */
    printHeader() {
        console.log(
            `\n${colors.bold}${colors.cyan}╔══════════════════════════════════════════════════╗${colors.reset}`
        );
        console.log(
            `${colors.bold}${colors.cyan}║${colors.reset}                                                  ${colors.bold}${colors.cyan}║${colors.reset}`
        );
        console.log(
            `${colors.bold}${colors.cyan}║${colors.reset}      ${colors.bold}${colors.blue}🦀 OpenClaw 卸载工具 ${messages.version}${colors.reset}      ${colors.bold}${colors.cyan}║${colors.reset}`
        );
        console.log(
            `${colors.bold}${colors.cyan}║${colors.reset}                                                  ${colors.bold}${colors.cyan}║${colors.reset}`
        );
        console.log(
            `${colors.bold}${colors.cyan}╚══════════════════════════════════════════════════╝${colors.reset}\n`
        );
        console.log(`${colors.bold}${messages.platform}:${colors.reset} ${colors.green}${this.platform}${colors.reset}`);
        console.log(`${colors.bold}${messages.architecture}:${colors.reset} ${colors.green}${os.arch()}${colors.reset}`);
        console.log(`${colors.bold}${messages.homeDir}:${colors.reset} ${colors.green}${os.homedir()}${colors.reset}\n`);
    }

    /**
     * 打印操作摘要
     */
    printSummary() {
        console.log(
            `\n${colors.bold}${colors.cyan}╔══════════════════════════════════════════════════╗${colors.reset}`
        );
        console.log(
            `${colors.bold}${colors.cyan}║${colors.reset}              ${colors.bold}📊 ${messages.summary}${colors.reset}              ${colors.bold}${colors.cyan}║${colors.reset}`
        );
        console.log(
            `${colors.bold}${colors.cyan}╚══════════════════════════════════════════════════╝${colors.reset}\n`
        );

        if (this.deletedItems.length > 0) {
            console.log(`${colors.green}${messages.successfullyRemoved}${colors.reset}`);
            this.deletedItems.forEach(item => {
                console.log(`  ${colors.green}✓${colors.reset} ${item}`);
            });
        }

        if (this.failedItems.length > 0) {
            console.log(`\n${colors.red}${messages.failedToRemove}${colors.reset}`);
            this.failedItems.forEach(item => {
                console.log(`  ${colors.red}✗${colors.reset} ${item.path}`);
                if (item.error) {
                    console.log(`    ${colors.red}${messages.error}: ${item.error}${colors.reset}`);
                }
            });
        }

        const totalItems = this.config[this.platform].length;
        const processedItems = this.deletedItems.length + this.failedItems.length;
        const skippedCount = totalItems - processedItems;

        if (skippedCount > 0) {
            console.log(
                `\n${colors.yellow}${messages.skipped.replace('项', skippedCount + ' 项')}${colors.reset}`
            );
        }

        console.log(
            `\n${colors.bold}${colors.cyan}══════════════════════════════════════════════════${colors.reset}`
        );

        if (this.failedItems.length === 0 && this.deletedItems.length > 0) {
            console.log(
                `${colors.green}${colors.bold}✨ ${messages.completelyUninstalled}${colors.reset}\n`
            );
        } else if (this.deletedItems.length === 0 && this.failedItems.length === 0) {
            console.log(
                `${colors.yellow}${messages.noOpenClaw}${colors.reset}\n`
            );
        } else {
            console.log(
                `${colors.yellow}${messages.someFailed}${colors.reset}\n`
            );
        }
    }

    /**
     * 主执行方法
     */
    async run() {
        this.printHeader();

        // 检查是否需要管理员权限
        if (this.checkPrivilegeRequirement()) {
            const hasPrivilege = await this.requestPrivileges();
            if (!hasPrivilege) {
                console.log(
                    `${colors.yellow}${messages.continueWithoutAdmin}${colors.reset}\n`
                );
            }
        }

        // 用户确认
        const confirmed = await this.confirm();
        if (!confirmed) {
            process.exit(0);
        }

        // 检查并停止运行中的进程
        await this.checkAndStopProcess();

        // Windows 注册表清理
        if (this.platform === 'windows') {
            await this.cleanWindowsRegistry();
        }

        const platformConfig = this.config[this.platform] || [];

        if (platformConfig.length === 0) {
            console.log(
                `${colors.yellow}${messages.noRules}${this.platform}${colors.reset}`
            );
            return;
        }

        console.log(`${colors.bold}🚀 ${messages.startingUninstall}${colors.reset}\n`);

        // 处理每个配置项
        for (const item of platformConfig) {
            const requirePrivilege = item.requireSudo || item.requireAdmin || false;
            console.log(`${messages.checkFile}${item.description || item.path}`);

            const result = await this.deleteItem(item.path, requirePrivilege);

            if (result.skipped) {
                console.log(`  ${colors.yellow}→ ${messages.notFound}${colors.reset}`);
            } else if (result.success) {
                console.log(`  ${colors.green}✓ ${messages.removed}${colors.reset}`);
                this.deletedItems.push(result.path);
            } else {
                console.log(`  ${colors.red}✗ ${messages.failed}${colors.reset}`);
                this.failedItems.push({ path: result.path, error: result.error || '' });
            }
        }

        this.printSummary();
    }
}
