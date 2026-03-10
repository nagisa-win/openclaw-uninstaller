#!/usr/bin/env node

/**
 * OpenClaw 卸载工具 - 主入口
 * 支持: macOS, Windows, Linux
 * 执行方式: npx @steven-y/openclaw-uninstaller 或 npm i -g && openclaw-uninstaller
 */

import { Uninstaller } from './uninstaller.js';

const main = async () => {
    const uninstaller = new Uninstaller();
    await uninstaller.run();
};

main().catch(error => {
    console.error('卸载失败:', error.message);
    process.exit(1);
});
