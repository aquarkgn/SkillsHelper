#!/usr/bin/env bash
set -euo pipefail

# 清理 npm 旧命令包。
# 默认只 deprecate；只有显式传 --unpublish 才尝试删除旧包版本。

TARGET_PACKAGE="skillhelper"
OLD_PACKAGES=("skillshelper" "huhaa-myskills")
MESSAGE="已迁移到 skillhelper：请使用 npm install -g skillhelper@latest && skillhelper start"
UNPUBLISH=false
TEMP_NPMRC=""

for arg in "$@"; do
  case "$arg" in
    --unpublish)
      UNPUBLISH=true
      ;;
    *)
      echo "未知参数: $arg" >&2
      echo "用法: $0 [--unpublish]" >&2
      exit 2
      ;;
  esac
done

if [[ -z "${NODE_AUTH_TOKEN:-}" && -n "${NPM_TOKEN:-}" ]]; then
  export NODE_AUTH_TOKEN="$NPM_TOKEN"
fi

if [[ -n "${NODE_AUTH_TOKEN:-}" ]]; then
  TEMP_NPMRC="$(mktemp)"
  trap 'rm -f "$TEMP_NPMRC"' EXIT
  {
    echo "registry=https://registry.npmjs.org/"
    echo "//registry.npmjs.org/:_authToken=\${NODE_AUTH_TOKEN}"
  } > "$TEMP_NPMRC"
  export NPM_CONFIG_USERCONFIG="$TEMP_NPMRC"
fi

if ! npm whoami >/dev/null 2>&1; then
  echo "npm 未登录。请先执行 npm login，或设置 NODE_AUTH_TOKEN/NPM_TOKEN。" >&2
  exit 1
fi

echo "当前 npm 账号: $(npm whoami)"

if ! npm view "$TARGET_PACKAGE" version >/dev/null 2>&1; then
  echo "目标包 $TARGET_PACKAGE 尚未发布。请先发布新包，再清理旧包。" >&2
  exit 1
fi

for pkg in "${OLD_PACKAGES[@]}"; do
  if ! npm view "$pkg" version >/dev/null 2>&1; then
    echo "跳过 $pkg：远端不存在或当前账号不可见。"
    continue
  fi

  echo "deprecate $pkg: $MESSAGE"
  if ! npm deprecate "$pkg" "$MESSAGE"; then
    # 旧包可能已被废弃；该维护动作失败不能阻断新包的正式发布。
    echo "警告：$pkg 废弃状态未更新，继续处理其余旧包。" >&2
    continue
  fi

  if $UNPUBLISH; then
    echo "尝试 unpublish $pkg --force"
    npm unpublish "$pkg" --force
  fi
done

echo "npm 旧包清理完成。"
