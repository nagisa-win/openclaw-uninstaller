#!/bin/sh
# OpenClaw Uninstaller - Shell Script
# Supports: sh, bash, zsh, fish
# 使用方法: curl -fsSL https://raw.githubusercontent.com/nagisa-win/openclaw-uninstaller/master/scripts/uninstall.sh | sh

# 终端颜色
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
CYAN='\033[36m'
BOLD='\033[1m'
RESET='\033[0m'

# 中文提示信息
MSG_HEADER="OpenClaw 卸载工具"
MSG_VERSION="v1.0.0"
MSG_PLATFORM="平台"
MSG_ARCH="架构"
MSG_HOME="用户目录"
MSG_SUMMARY="执行摘要"
MSG_REMOVED="成功删除："
MSG_FAILED="删除失败："
MSG_SKIPPED="跳过（未找到）"
MSG_COMPLETE="✨ OpenClaw 已完全卸载！"
MSG_PARTIAL="部分项目无法删除，请尝试手动删除。"
MSG_NOT_FOUND="未在系统中找到 OpenClaw 相关文件。"
MSG_START="🚀 开始卸载..."
MSG_ADMIN_REQ="完全卸载需要管理员权限。"
MSG_PASSWORD="可能需要输入您的密码。"
MSG_ADMIN_FAILED="无法获取管理员权限。"
MSG_CONTINUE="正在以普通权限继续..."
MSG_CHECKING="检查："
MSG_DELETED="已删除"
MSG_NOT_EXIST="不存在"
MSG_DELETE_FAILED="失败"
MSG_PROCESS_FOUND="检测到 OpenClaw 正在运行"
MSG_PROCESS_STOPPING="正在停止进程..."
MSG_PROCESS_STOPPED="进程已停止"
MSG_CONFIRM="即将卸载 OpenClaw 及其所有数据，是否继续？"
MSG_CONFIRM_PROMPT="输入 yes 或 y 确认继续："
MSG_CONFIRM_CANCEL="已取消卸载。"

# 全局计数器（避免子 shell 问题）
DELETED_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0
HAS_SUDO=false

# 检测平台
detect_platform() {
    case "$(uname -s)" in
        Darwin*)    echo "macos" ;;
        Linux*)     echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *)          echo "unknown" ;;
    esac
}

# 打印彩色消息
print_msg() {
    printf "%b\n" "$1"
}

# 打印头部
print_header() {
    print_msg "\n${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${RESET}"
    print_msg "${BOLD}${CYAN}║${RESET}                                                  ${BOLD}${CYAN}║${RESET}"
    print_msg "${BOLD}${CYAN}║${RESET}      ${BOLD}${BLUE}🦀 ${MSG_HEADER} ${MSG_VERSION}${RESET}      ${BOLD}${CYAN}║${RESET}"
    print_msg "${BOLD}${CYAN}║${RESET}                                                  ${BOLD}${CYAN}║${RESET}"
    print_msg "${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${RESET}\n"
    print_msg "${BOLD}${MSG_PLATFORM}:${RESET} ${GREEN}${PLATFORM}${RESET}"
    print_msg "${BOLD}${MSG_ARCH}:${RESET} ${GREEN}$(uname -m)${RESET}"
    print_msg "${BOLD}${MSG_HOME}:${RESET} ${GREEN}${HOME}${RESET}\n"
}

# 展开路径变量
expand_path() {
    echo "$1" | sed "s|\$HOME|${HOME}|g" | sed "s|\${HOME}|${HOME}|g"
}

# 检查路径是否存在（支持通配符）
path_exists() {
    _path="$1"
    _expanded=$(expand_path "$_path")

    if echo "$_expanded" | grep -q '\*'; then
        # 通配符路径
        _dir=$(dirname "$_expanded")
        _pattern=$(basename "$_expanded")
        [ -d "$_dir" ] && ls "$_dir"/$_pattern 1>/dev/null 2>&1
    else
        [ -e "$_expanded" ] || [ -L "$_expanded" ]
    fi
}

# 获取匹配的路径（用于通配符）
get_matching_paths() {
    _path="$1"
    _expanded=$(expand_path "$_path")

    if echo "$_expanded" | grep -q '\*'; then
        _dir=$(dirname "$_expanded")
        _pattern=$(basename "$_expanded")
        if [ -d "$_dir" ]; then
            # 返回匹配文件数量
            ls "$_dir"/$_pattern 2>/dev/null | wc -l | tr -d ' '
        else
            echo "0"
        fi
    else
        echo "1"
    fi
}

# 删除项目（更新全局计数器）
delete_item() {
    _path="$1"
    _require_sudo="$2"
    _expanded_path=$(expand_path "$_path")

    # 检查通配符
    if echo "$_expanded_path" | grep -q '\*'; then
        _dir=$(dirname "$_expanded_path")
        _pattern=$(basename "$_expanded_path")

        if [ ! -d "$_dir" ]; then
            print_msg "  ${YELLOW}→ ${MSG_NOT_EXIST}${RESET}"
            SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
            return 0
        fi

        _found=0
        _deleted=0
        for _file in "$_dir"/$_pattern; do
            if [ -e "$_file" ] || [ -L "$_file" ]; then
                _found=$((_found + 1))
                if [ "$_require_sudo" = "true" ] && [ "$HAS_SUDO" = "true" ]; then
                    if sudo rm -rf "$_file" 2>/dev/null; then
                        _deleted=$((_deleted + 1))
                    fi
                else
                    if rm -rf "$_file" 2>/dev/null; then
                        _deleted=$((_deleted + 1))
                    elif [ "$HAS_SUDO" = "true" ]; then
                        if sudo rm -rf "$_file" 2>/dev/null; then
                            _deleted=$((_deleted + 1))
                        fi
                    fi
                fi
            fi
        done

        if [ $_found -eq 0 ]; then
            print_msg "  ${YELLOW}→ ${MSG_NOT_EXIST}${RESET}"
            SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        elif [ $_deleted -gt 0 ]; then
            print_msg "  ${GREEN}✓ ${MSG_DELETED} (${_deleted} 项)${RESET}"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        else
            print_msg "  ${RED}✗ ${MSG_DELETE_FAILED}${RESET}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
        return 0
    fi

    if ! path_exists "$_path"; then
        print_msg "  ${YELLOW}→ ${MSG_NOT_EXIST}${RESET}"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        return 0
    fi

    if [ "$_require_sudo" = "true" ] && [ "$HAS_SUDO" = "true" ]; then
        if sudo rm -rf "$_expanded_path" 2>/dev/null; then
            print_msg "  ${GREEN}✓ ${MSG_DELETED}${RESET}"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        else
            print_msg "  ${RED}✗ ${MSG_DELETE_FAILED}${RESET}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        if rm -rf "$_expanded_path" 2>/dev/null; then
            print_msg "  ${GREEN}✓ ${MSG_DELETED}${RESET}"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        elif [ "$HAS_SUDO" = "true" ] && sudo rm -rf "$_expanded_path" 2>/dev/null; then
            print_msg "  ${GREEN}✓ ${MSG_DELETED}${RESET}"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        else
            print_msg "  ${RED}✗ ${MSG_DELETE_FAILED}${RESET}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    fi
}

# 请求 sudo 权限
request_sudo() {
    if command -v sudo >/dev/null 2>&1; then
        if sudo -n true 2>/dev/null; then
            HAS_SUDO=true
            return 0
        fi

        print_msg "\n${YELLOW}${MSG_ADMIN_REQ}${RESET}"
        print_msg "${MSG_PASSWORD}\n"

        if sudo -v 2>/dev/null; then
            HAS_SUDO=true
            return 0
        else
            print_msg "${RED}${MSG_ADMIN_FAILED}${RESET}"
            return 1
        fi
    fi
    return 0
}

# 检查并停止运行中的进程
check_and_stop_process() {
    _found_process=false

    if [ "$PLATFORM" = "macos" ] || [ "$PLATFORM" = "linux" ]; then
        if pgrep -i "openclaw" >/dev/null 2>&1; then
            _found_process=true
        fi
    fi

    if [ "$_found_process" = "true" ]; then
        print_msg "\n${YELLOW}${MSG_PROCESS_FOUND}${RESET}"
        print_msg "${CYAN}${MSG_PROCESS_STOPPING}${RESET}"

        if [ "$HAS_SUDO" = "true" ]; then
            sudo pkill -9 -i "openclaw" 2>/dev/null || true
        else
            pkill -9 -i "openclaw" 2>/dev/null || true
        fi

        print_msg "${GREEN}  ✓ ${MSG_PROCESS_STOPPED}${RESET}\n"
    fi
}

# 用户确认
confirm() {
    if [ -t 0 ]; then
        print_msg "\n${YELLOW}${MSG_CONFIRM}${RESET}"
        printf "${BOLD}${MSG_CONFIRM_PROMPT}${RESET}"
        read -r _answer
        case "$_answer" in
            [yY]|[yY][eE][sS])
                return 0
                ;;
            *)
                print_msg "\n${YELLOW}${MSG_CONFIRM_CANCEL}${RESET}\n"
                exit 0
                ;;
        esac
    fi
}

# 打印摘要
print_summary() {
    print_msg "\n${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${RESET}"
    print_msg "${BOLD}${CYAN}║${RESET}              ${BOLD}📊 ${MSG_SUMMARY}${RESET}              ${BOLD}${CYAN}║${RESET}"
    print_msg "${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${RESET}\n"

    if [ "$DELETED_COUNT" -gt 0 ]; then
        print_msg "${GREEN}${MSG_REMOVED}${RESET}"
        print_msg "  ${GREEN}✓${RESET} 已删除 ${DELETED_COUNT} 项"
    fi

    if [ "$FAILED_COUNT" -gt 0 ]; then
        print_msg "\n${RED}${MSG_FAILED}${RESET}"
        print_msg "  ${RED}✗${RESET} 删除失败 ${FAILED_COUNT} 项"
    fi

    if [ "$SKIPPED_COUNT" -gt 0 ]; then
        print_msg "\n${YELLOW}${MSG_SKIPPED}: ${SKIPPED_COUNT} 项${RESET}"
    fi

    print_msg "\n${BOLD}${CYAN}══════════════════════════════════════════════════${RESET}"

    if [ "$FAILED_COUNT" -eq 0 ] && [ "$DELETED_COUNT" -gt 0 ]; then
        print_msg "${GREEN}${BOLD}${MSG_COMPLETE}${RESET}\n"
    elif [ "$DELETED_COUNT" -eq 0 ] && [ "$FAILED_COUNT" -eq 0 ]; then
        print_msg "${YELLOW}${MSG_NOT_FOUND}${RESET}\n"
    else
        print_msg "${YELLOW}${MSG_PARTIAL}${RESET}\n"
    fi
}

# 主函数
main() {
    PLATFORM=$(detect_platform)

    print_header

    if [ "$PLATFORM" = "unknown" ]; then
        print_msg "${RED}不支持的操作系统: $(uname -s)${RESET}"
        exit 1
    fi

    if [ "$PLATFORM" != "windows" ]; then
        request_sudo || print_msg "${YELLOW}${MSG_CONTINUE}${RESET}\n"
    fi

    # 用户确认
    confirm

    # 检查并停止进程
    check_and_stop_process

    print_msg "${BOLD}${MSG_START}${RESET}\n"

    # 根据平台处理配置项
    case "$PLATFORM" in
        macos)
            print_msg "${MSG_CHECKING}OpenClaw 用户数据目录"
            delete_item "$HOME/.openclaw" "false"

            print_msg "${MSG_CHECKING}OpenClaw 应用支持"
            delete_item "$HOME/Library/Application Support/OpenClaw" "false"

            print_msg "${MSG_CHECKING}OpenClaw 缓存"
            delete_item "$HOME/Library/Caches/com.openclaw.app" "false"

            print_msg "${MSG_CHECKING}OpenClaw 偏好设置"
            delete_item "$HOME/Library/Preferences/com.openclaw.app.plist" "false"

            print_msg "${MSG_CHECKING}OpenClaw 日志"
            delete_item "$HOME/Library/Logs/OpenClaw" "false"

            print_msg "${MSG_CHECKING}OpenClaw WebKit 数据"
            delete_item "$HOME/Library/WebKit/com.openclaw.app" "false"

            print_msg "${MSG_CHECKING}OpenClaw 应用状态"
            delete_item "$HOME/Library/Saved Application State/com.openclaw.app.savedState" "false"

            print_msg "${MSG_CHECKING}OpenClaw 用户启动项"
            delete_item "$HOME/Library/LaunchAgents/com.openclaw.*.plist" "false"

            print_msg "${MSG_CHECKING}OpenClaw 系统启动项"
            delete_item "/Library/LaunchDaemons/com.openclaw.*.plist" "true"

            print_msg "${MSG_CHECKING}OpenClaw 应用程序"
            delete_item "/Applications/OpenClaw.app" "true"
            ;;

        linux)
            print_msg "${MSG_CHECKING}OpenClaw 用户数据目录"
            delete_item "$HOME/.openclaw" "false"

            print_msg "${MSG_CHECKING}OpenClaw 配置目录"
            delete_item "$HOME/.config/openclaw" "false"

            print_msg "${MSG_CHECKING}OpenClaw 数据目录"
            delete_item "$HOME/.local/share/openclaw" "false"

            print_msg "${MSG_CHECKING}OpenClaw 缓存目录"
            delete_item "$HOME/.cache/openclaw" "false"

            print_msg "${MSG_CHECKING}OpenClaw 桌面入口"
            delete_item "$HOME/.local/share/applications/openclaw.desktop" "false"

            print_msg "${MSG_CHECKING}OpenClaw 系统桌面入口"
            delete_item "/usr/share/applications/openclaw.desktop" "true"

            print_msg "${MSG_CHECKING}OpenClaw 安装目录"
            delete_item "/opt/openclaw" "true"

            print_msg "${MSG_CHECKING}OpenClaw 二进制链接"
            delete_item "/usr/local/bin/openclaw" "true"

            print_msg "${MSG_CHECKING}OpenClaw 系统二进制"
            delete_item "/usr/bin/openclaw" "true"

            print_msg "${MSG_CHECKING}OpenClaw systemd 服务"
            delete_item "/etc/systemd/system/openclaw*.service" "true"
            ;;

        *)
            print_msg "${YELLOW}Windows 平台请使用 NPX 版本${RESET}"
            ;;
    esac

    print_summary
}

main
