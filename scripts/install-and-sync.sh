#!/bin/bash

###############################################################################
# HuHaa-MySkills 远程安装与技能同步入口 (v0.1.5)
#
# 用法：
#   curl -fsSL https://raw.githubusercontent.com/aquarkgn/HuHaa-MySkills/main/install-and-sync.sh | bash
#   或
#   curl -fsSL https://raw.githubusercontent.com/aquarkgn/HuHaa-MySkills/main/install-and-sync.sh | bash -s -- --sync-only
#
# 参数：
#   --sync-only    只执行同步，不安装
#   --local PATH   使用本地项目路径
#   --branch NAME  指定分支（默认 main）
#
###############################################################################

set -euo pipefail

# 配置
REPO_URL="https://github.com/aquarkgn/HuHaa-MySkills.git"
REPO_RAW="https://raw.githubusercontent.com/aquarkgn/HuHaa-MySkills"
BRANCH="main"
SYNC_ONLY=false
LOCAL_PATH=""

# 颜色定义
readonly BLUE='\033[0;34m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}ℹ${NC} $*"; }
log_success() { echo -e "${GREEN}✓${NC} $*"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $*"; }
log_error() { echo -e "${RED}✗${NC} $*" >&2; }

# 解析命令行参数
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --sync-only)
        SYNC_ONLY=true
        shift
        ;;
      --local)
        LOCAL_PATH="$2"
        SYNC_ONLY=true
        shift 2
        ;;
      --branch)
        BRANCH="$2"
        shift 2
        ;;
      *)
        log_error "未知参数: $1"
        exit 1
        ;;
    esac
  done
}

# 获取临时目录
get_temp_dir() {
  if command -v mktemp &>/dev/null; then
    mktemp -d
  else
    local tmpdir="/tmp/huhaa-myskills-$$"
    mkdir -p "$tmpdir"
    echo "$tmpdir"
  fi
}

# 检查依赖
check_deps() {
  if ! command -v curl &>/dev/null; then
    log_error "需要 curl，请先安装"
    exit 1
  fi

  if ! $SYNC_ONLY && ! command -v git &>/dev/null; then
    log_error "需要 git，请先安装"
    exit 1
  fi
}

# 下载并执行同步脚本
download_and_sync() {
  local sync_script_url="$REPO_RAW/$BRANCH/service/scripts/sync-skills.sh"

  log_info "下载同步脚本..."

  local temp_script
  temp_script=$(mktemp)
  trap "rm -f '$temp_script'" EXIT

  if ! curl -fsSL "$sync_script_url" -o "$temp_script"; then
    log_error "下载失败: $sync_script_url"
    return 1
  fi

  if [[ -n "$LOCAL_PATH" ]]; then
    export HUHAA_LOCAL_PATH="$LOCAL_PATH"
  fi

  log_success "同步脚本已下载"

  # 执行同步脚本
  bash "$temp_script"
}

# 本地安装（git clone）
local_install() {
  local temp_dir
  temp_dir=$(get_temp_dir)
  trap "rm -rf '$temp_dir'" EXIT

  log_info "克隆项目仓库..."

  if ! git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$temp_dir"; then
    log_error "克隆失败"
    return 1
  fi

  local_path="$temp_dir"
  log_success "项目已克隆到临时目录"

  # 执行同步
  export HUHAA_LOCAL_PATH="$local_path"
  download_and_sync
}

# 检查 npm 全局安装
npm_install() {
  if ! command -v npm &>/dev/null; then
    log_warn "未安装 npm，跳过全局安装"
    return 0
  fi

  log_info "正在进行 npm 全局安装..."

  if npm install -g "github:aquarkgn/HuHaa-MySkills#$BRANCH"; then
    log_success "npm 全局安装完成"

    # 获取安装位置
    local npm_prefix
    npm_prefix=$(npm prefix -g)
    export HUHAA_LOCAL_PATH="$npm_prefix/node_modules/huhaa-myskills"

    return 0
  else
    log_warn "npm 全局安装失败，将使用远程脚本"
    return 1
  fi
}

# 主函数
main() {
  echo -e "\n${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║     HuHaa-MySkills v0.1.5 - 编辑器技能自动同步        ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}\n"

  parse_args "$@"
  check_deps

  if $SYNC_ONLY; then
    log_info "执行同步模式"
    if [[ -z "$LOCAL_PATH" ]]; then
      # 只下载并执行远程脚本
      download_and_sync
    else
      # 使用本地路径
      if [[ ! -d "$LOCAL_PATH" ]]; then
        log_error "本地路径不存在: $LOCAL_PATH"
        exit 1
      fi
      export HUHAA_LOCAL_PATH="$LOCAL_PATH"
      download_and_sync
    fi
  else
    log_info "执行完整安装 + 同步流程"

    # 尝试 npm 全局安装
    if ! npm_install; then
      # 如果 npm 安装失败，使用 git clone
      log_info "使用 git clone 方式安装"
      local_install
    else
      # npm 安装成功，执行同步
      download_and_sync
    fi
  fi

  echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                   ✨ 同步完成！ ✨                    ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}\n"

  log_info "后续步骤："
  echo "  1. 启动 HuHaa: npm start"
  echo "  2. 查看技能中心: http://localhost:11520"
  echo "  3. 在编辑器中使用你的技能"
  echo -e "\n更多信息: https://github.com/aquarkgn/HuHaa-MySkills\n"
}

# 执行主程序
main "$@"
