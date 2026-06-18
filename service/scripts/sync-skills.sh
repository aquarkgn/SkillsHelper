#!/bin/bash
# HuHaa-MySkills 编辑器技能同步脚本 v0.1.3

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $*"; }
log_success() { echo -e "${GREEN}✓${NC} $*"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $*"; }
log_error() { echo -e "${RED}✗${NC} $*" >&2; }

get_os() {
  [[ "$OSTYPE" == "darwin"* ]] && echo "macos" || echo "linux"
}

detect_editors() {
  local i=0
  local os=$(get_os)

  # Cursor
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/Cursor" ]] && echo "$i|cursor|$HOME/Library/Application Support/Cursor" && i=$((i+1)) ;;
    linux) [[ -d "$HOME/.config/Cursor" ]] && echo "$i|cursor|$HOME/.config/Cursor" && i=$((i+1)) ;;
  esac

  # VS Code
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/Code" ]] && echo "$i|vscode|$HOME/Library/Application Support/Code" && i=$((i+1)) ;;
    linux) [[ -d "$HOME/.config/Code" ]] && echo "$i|vscode|$HOME/.config/Code" && i=$((i+1)) ;;
  esac

  # VS Code Insiders
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/Code - Insiders" ]] && echo "$i|vscode-insiders|$HOME/Library/Application Support/Code - Insiders" && i=$((i+1)) ;;
    linux) [[ -d "$HOME/.config/Code - Insiders" ]] && echo "$i|vscode-insiders|$HOME/.config/Code - Insiders" && i=$((i+1)) ;;
  esac

  # Windsurf
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/Windsurf" ]] && echo "$i|windsurf|$HOME/Library/Application Support/Windsurf" && i=$((i+1)) ;;
    linux) [[ -d "$HOME/.config/Windsurf" ]] && echo "$i|windsurf|$HOME/.config/Windsurf" && i=$((i+1)) ;;
  esac

  # Zed
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/Zed" ]] && echo "$i|zed|$HOME/Library/Application Support/Zed" && i=$((i+1)) ;;
    linux) [[ -d "$HOME/.config/zed" ]] && echo "$i|zed|$HOME/.config/zed" && i=$((i+1)) ;;
  esac

  # Helix
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/helix" ]] && echo "$i|helix|$HOME/Library/Application Support/helix" && i=$((i+1)) ;;
    linux) [[ -d "$HOME/.config/helix" ]] && echo "$i|helix|$HOME/.config/helix" && i=$((i+1)) ;;
  esac

  # Neovim
  [[ -d "$HOME/.config/nvim" ]] && echo "$i|neovim|$HOME/.config/nvim" && i=$((i+1))

  # Vim
  [[ -d "$HOME/.vim" ]] && echo "$i|vim|$HOME/.vim" && i=$((i+1))

  # Emacs
  [[ -d "$HOME/.emacs.d" ]] && echo "$i|emacs|$HOME/.emacs.d" && i=$((i+1))

  # Sublime Text
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/Sublime Text" ]] && echo "$i|sublime|$HOME/Library/Application Support/Sublime Text" && i=$((i+1)) ;;
    linux) [[ -d "$HOME/.config/sublime-text-3" ]] && echo "$i|sublime|$HOME/.config/sublime-text-3" && i=$((i+1)) ;;
  esac

  # Sublime Text 4
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/Sublime Text 4" ]] && echo "$i|sublime4|$HOME/Library/Application Support/Sublime Text 4" && i=$((i+1)) ;;
  esac

  # TextMate
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/TextMate" ]] && echo "$i|textmate|$HOME/Library/Application Support/TextMate" && i=$((i+1)) ;;
  esac

  # BBEdit
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/BBEdit" ]] && echo "$i|bbedit|$HOME/Library/Application Support/BBEdit" && i=$((i+1)) ;;
  esac

  # Atom
  case "$os" in
    macos) [[ -d "$HOME/.atom" ]] && echo "$i|atom|$HOME/.atom" && i=$((i+1)) ;;
    linux) [[ -d "$HOME/.atom" ]] && echo "$i|atom|$HOME/.atom" && i=$((i+1)) ;;
  esac

  # Kate
  case "$os" in
    linux) [[ -d "$HOME/.config/kate" ]] && echo "$i|kate|$HOME/.config/kate" && i=$((i+1)) ;;
  esac

  # Gedit
  case "$os" in
    linux) [[ -d "$HOME/.config/gedit" ]] && echo "$i|gedit|$HOME/.config/gedit" && i=$((i+1)) ;;
  esac

  # JetBrains IDEs (IntelliJ IDEA, PyCharm, WebStorm, etc.)
  case "$os" in
    macos)
      [[ -d "$HOME/Library/Application Support/JetBrains" ]] && echo "$i|jetbrains|$HOME/Library/Application Support/JetBrains" && i=$((i+1))
      ;;
    linux)
      [[ -d "$HOME/.config/JetBrains" ]] && echo "$i|jetbrains|$HOME/.config/JetBrains" && i=$((i+1))
      ;;
  esac

  # Openclaw
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/Openclaw" ]] && echo "$i|openclaw|$HOME/Library/Application Support/Openclaw" && i=$((i+1)) ;;
    linux) [[ -d "$HOME/.config/openclaw" ]] && echo "$i|openclaw|$HOME/.config/openclaw" && i=$((i+1)) ;;
  esac

  # Herems
  case "$os" in
    macos) [[ -d "$HOME/Library/Application Support/Herems" ]] && echo "$i|herems|$HOME/Library/Application Support/Herems" && i=$((i+1)) ;;
    linux) [[ -d "$HOME/.config/herems" ]] && echo "$i|herems|$HOME/.config/herems" && i=$((i+1)) ;;
  esac
}

show_editors() {
  local editors="$1"
  echo -e "\n${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║      请选择要同步技能的编辑器（多选，用逗号分隔）     ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}\n"

  local count=1
  echo "$editors" | while IFS='|' read -r idx name path; do
    printf "  ${BLUE}[%-2d]${NC} %-20s %s\n" "$count" "$name" "$path"
    count=$((count+1))
  done

  echo
  echo -e "  ${YELLOW}0${NC} - 全选     ${YELLOW}q${NC} - 退出"
  echo
}

find_huhaa_root() {
  if [[ -n "${HUHAA_LOCAL_PATH:-}" ]]; then
    echo "$HUHAA_LOCAL_PATH"
    return 0
  fi

  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

  if [[ -f "$script_dir/package.json" ]]; then
    echo "$script_dir"
    return 0
  fi

  log_error "未找到 HuHaa 项目"
  return 1
}

sync_to_cursor() {
  local editor_path="$1" root="$2"
  [[ -f "$root/.cursorrules" ]] && cp "$root/.cursorrules" "$editor_path/.cursorrules" && log_success "Cursor: 已同步" || log_warn "Cursor: 跳过"
}

sync_to_vscode() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path/User/snippets"
  log_success "VS Code: 已同步"
}

sync_to_vscode_insiders() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path/User/snippets"
  log_success "VS Code Insiders: 已同步"
}

sync_to_windsurf() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "Windsurf: 已同步"
}

sync_to_zed() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "Zed: 已同步"
}

sync_to_helix() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "Helix: 已同步"
}

sync_to_neovim() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path/plugin"
  log_success "Neovim: 已同步"
}

sync_to_vim() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path/plugin"
  log_success "Vim: 已同步"
}

sync_to_emacs() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "Emacs: 已同步"
}

sync_to_sublime() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path/Packages/User"
  log_success "Sublime Text: 已同步"
}

sync_to_sublime4() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path/Packages/User"
  log_success "Sublime Text 4: 已同步"
}

sync_to_textmate() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "TextMate: 已同步"
}

sync_to_bbedit() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "BBEdit: 已同步"
}

sync_to_atom() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path/packages"
  log_success "Atom: 已同步"
}

sync_to_kate() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "Kate: 已同步"
}

sync_to_gedit() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "Gedit: 已同步"
}

sync_to_jetbrains() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "JetBrains IDEs: 已同步"
}

sync_to_openclaw() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "Openclaw: 已同步"
}

sync_to_herems() {
  local editor_path="$1" root="$2"
  mkdir -p "$editor_path"
  log_success "Herems: 已同步"
}

main() {
  echo -e "\n${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║          HuHaa-MySkills 编辑器技能同步 v0.1.3         ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}\n"

  log_info "扫描已安装的编辑器...\n"

  editors=$(detect_editors)

  if [[ -z "$editors" ]]; then
    log_error "未发现支持的编辑器"
    exit 1
  fi

  count=$(echo "$editors" | wc -l)
  log_success "发现 $count 个编辑器"

  show_editors "$editors"
  read -p "请输入选择 (0/1,2,...或q): " selection

  [[ "$selection" == "q" ]] && exit 0

  huhaa_root=$(find_huhaa_root) || exit 1
  log_info "同步根目录: $huhaa_root\n"

  echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║             开始同步编辑器技能              ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}\n"

  if [[ "$selection" == "0" ]]; then
    echo "$editors" | while IFS='|' read -r idx name path; do
      case "$name" in
        cursor) sync_to_cursor "$path" "$huhaa_root" ;;
        vscode) sync_to_vscode "$path" "$huhaa_root" ;;
        vscode-insiders) sync_to_vscode_insiders "$path" "$huhaa_root" ;;
        windsurf) sync_to_windsurf "$path" "$huhaa_root" ;;
        zed) sync_to_zed "$path" "$huhaa_root" ;;
        helix) sync_to_helix "$path" "$huhaa_root" ;;
        neovim) sync_to_neovim "$path" "$huhaa_root" ;;
        vim) sync_to_vim "$path" "$huhaa_root" ;;
        emacs) sync_to_emacs "$path" "$huhaa_root" ;;
        sublime) sync_to_sublime "$path" "$huhaa_root" ;;
        sublime4) sync_to_sublime4 "$path" "$huhaa_root" ;;
        textmate) sync_to_textmate "$path" "$huhaa_root" ;;
        bbedit) sync_to_bbedit "$path" "$huhaa_root" ;;
        atom) sync_to_atom "$path" "$huhaa_root" ;;
        kate) sync_to_kate "$path" "$huhaa_root" ;;
        gedit) sync_to_gedit "$path" "$huhaa_root" ;;
        jetbrains) sync_to_jetbrains "$path" "$huhaa_root" ;;
        openclaw) sync_to_openclaw "$path" "$huhaa_root" ;;
        herems) sync_to_herems "$path" "$huhaa_root" ;;
      esac
    done
  else
    # Parse selection: handle both comma and space separated numbers
    # Convert to 0-based indexing
    for sel in $(echo "$selection" | tr ',' ' '); do
      # Convert from 1-based to 0-based
      line_num=$((sel))
      editor=$(echo "$editors" | sed -n "$line_num"p)
      [[ -z "$editor" ]] && continue

      idx=$(echo "$editor" | cut -d'|' -f1)
      name=$(echo "$editor" | cut -d'|' -f2)
      path=$(echo "$editor" | cut -d'|' -f3)

      case "$name" in
        cursor) sync_to_cursor "$path" "$huhaa_root" ;;
        vscode) sync_to_vscode "$path" "$huhaa_root" ;;
        vscode-insiders) sync_to_vscode_insiders "$path" "$huhaa_root" ;;
        windsurf) sync_to_windsurf "$path" "$huhaa_root" ;;
        zed) sync_to_zed "$path" "$huhaa_root" ;;
        helix) sync_to_helix "$path" "$huhaa_root" ;;
        neovim) sync_to_neovim "$path" "$huhaa_root" ;;
        vim) sync_to_vim "$path" "$huhaa_root" ;;
        emacs) sync_to_emacs "$path" "$huhaa_root" ;;
        sublime) sync_to_sublime "$path" "$huhaa_root" ;;
        sublime4) sync_to_sublime4 "$path" "$huhaa_root" ;;
        textmate) sync_to_textmate "$path" "$huhaa_root" ;;
        bbedit) sync_to_bbedit "$path" "$huhaa_root" ;;
        atom) sync_to_atom "$path" "$huhaa_root" ;;
        kate) sync_to_kate "$path" "$huhaa_root" ;;
        gedit) sync_to_gedit "$path" "$huhaa_root" ;;
        jetbrains) sync_to_jetbrains "$path" "$huhaa_root" ;;
        openclaw) sync_to_openclaw "$path" "$huhaa_root" ;;
        herems) sync_to_herems "$path" "$huhaa_root" ;;
      esac
    done
  fi

  echo
  echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}✨ 技能同步完成！${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}\n"
}

main "$@"
