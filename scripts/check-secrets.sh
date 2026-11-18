#!/usr/bin/env bash
# 提交前扫描常见凭据，命中即失败。
# 用法：bash scripts/check-secrets.sh            # 扫描工作区已跟踪文件
#       bash scripts/check-secrets.sh --staged   # 只扫描已 git add 的内容（pre-commit 用）
set -uo pipefail

PATTERNS='gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|sk-[A-Za-z0-9]{32,}|xox[baprs]-[A-Za-z0-9-]{10,}'
SELF='scripts/check-secrets.sh'

fail=0
found=''

if [ "${1:-}" = "--staged" ]; then
  # 只检查将要提交的内容，避免误报未暂存的文件
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ "$f" = "$SELF" ] && continue
    case "$f" in node_modules/*|dist/*) continue ;; esac
    if git show ":$f" 2>/dev/null | grep -nEI "$PATTERNS" >/dev/null 2>&1; then
      found="$found\n  $f"
      fail=1
    fi
  done < <(git diff --cached --name-only --diff-filter=ACMR)
else
  hits=$(git grep -nEI "$PATTERNS" -- . ':!node_modules' ':!dist' ":!$SELF" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    echo "$hits" | sed -E 's/(gh[pousr]_|github_pat_|sk-)[A-Za-z0-9_]+/\1***REDACTED***/g' | head -20
    fail=1
  fi
fi

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "✗ 检测到疑似凭据（上面的文件）："
  printf "%b\n" "$found"
  echo ""
  echo "  处理方式：把 Token 换成占位符（如 ghp_YOUR_TOKEN_HERE）或改用环境变量，"
  echo "  已提交进历史的还需要用 git filter-repo 清洗。"
  exit 1
fi

echo "✓ 未发现疑似凭据"
exit 0
