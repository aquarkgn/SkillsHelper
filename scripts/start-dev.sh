#!/bin/bash

# HuHaa-MySkills 智能启动脚本 - 完全后台运行
# 功能：后台启动，自动处理端口占用，重启本服务或切换端口

DEFAULT_PORT=11522
PORT=$DEFAULT_PORT
MAX_ATTEMPTS=5
ATTEMPT=0

# 日志文件
LOG_FILE="/tmp/huhaa-myskills-dev.log"

# 检查端口是否被占用
check_port() {
  lsof -i :$1 >/dev/null 2>&1
  return $?
}

# 获取占用端口的进程信息
get_process_info() {
  lsof -ti :$1 2>/dev/null | head -1
}

# 检查是否为本服务进程
is_our_process() {
  pid=$1
  if [ -z "$pid" ]; then return 1; fi
  ps -p $pid 2>/dev/null | grep -E "huhaa-myskills|node.*bin" >/dev/null 2>&1
  return $?
}

# 主逻辑（后台运行）
{
  ATTEMPT=0
  while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if check_port $PORT; then
      # 端口被占用
      pid=$(get_process_info $PORT)
      if is_our_process $pid; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ Service already running on port $PORT (PID: $pid)"
        # 杀死旧进程并重启
        kill -9 $pid 2>/dev/null
        sleep 1
        nohup npm run start >/dev/null 2>&1 &
        sleep 2
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ Service restarted on port $PORT"
        exit 0
      else
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] ⚠ Port $PORT occupied by other process (PID: $pid), trying $((PORT + 1))..."
        PORT=$((PORT + 1))
        ATTEMPT=$((ATTEMPT + 1))
      fi
    else
      # 端口空闲，启动服务
      echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting HuHaa-MySkills on port $PORT..."
      nohup npm run start >/dev/null 2>&1 &
      sleep 2
      echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ Service started on port $PORT"
      exit 0
    fi
  done

  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✗ Failed to start: no available ports"
  exit 1
} >> $LOG_FILE 2>&1 &

# 立即返回（真正的后台运行）
exec 2>/dev/null
exit 0


