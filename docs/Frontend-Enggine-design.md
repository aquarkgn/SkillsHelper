# Node.js 后台系统前端工程规范文档

项目类型：Node.js / Next.js 后台管理系统
推荐名称：Cockpit Tools Admin
视觉方案：Blue Ice Admin 浅色后台主题
核心目标：避免从零开发、统一布局、统一配色、统一组件、方便 AI 辅助迭代、方便长期维护

---

# 1. 最终技术决策

## 1.1 技术栈

本项目统一使用：

```txt id="g9l3sv"
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
shadcn/ui Blocks
lucide-react
Zod
React Hook Form
ESLint
Prettier
Vercel
```

## 1.2 后台 UI 方案

本项目不从零手写完整后台 UI。

最终选择：

```txt id="b0sgs5"
主方案：shadcn/ui + shadcn/ui Blocks
视觉方案：Blue Ice Admin 浅色主题
部署方案：Vercel
页面结构：左侧固定侧边栏 + 右侧后台内容区
```

## 1.3 不采用方案

```txt id="cfxz20"
不采用纯手写 UI
不采用大而全商业模板作为主架构
不采用传统重型企业后台视觉
不采用每个页面单独设计样式
```

## 1.4 可参考但不作为主框架的方案

```txt id="9p4jdr"
TailAdmin：可以参考页面组织和后台常见模块
Ant Design Pro：仅在复杂企业权限、复杂表格、复杂表单场景参考
其他 shadcn admin starter：可以参考，但必须经过代码审查
```

---

# 2. 开源主题与框架使用规范

## 2.1 使用原则

```txt id="nrg708"
优先使用开源组件和区块
不重复造基础 UI 轮子
不直接照搬模板业务结构
引入后必须统一主题
引入后必须清理无用页面
引入后必须整理目录
引入后必须检查依赖
```

## 2.2 shadcn/ui 使用范围

允许直接使用或改造：

```txt id="te11y3"
Button
Input
Textarea
Select
Dialog
Sheet
DropdownMenu
Tabs
Card
Badge
Table
Switch
Separator
Tooltip
Popover
Command
Form
Sidebar
```

## 2.3 shadcn/ui Blocks 使用范围

优先使用：

```txt id="e2rmus"
Dashboard Block
Sidebar Block
Login Block
Settings/Form Layout Block
Table/Data Block
Chart Block
```

## 2.4 引入组件后的处理规则

所有从 shadcn/ui 或开源模板引入的组件必须处理：

```txt id="pfwfqc"
1. 修改为项目目录结构
2. 替换为 Blue Ice Admin 主题变量
3. 删除无用示例数据
4. 删除无用页面
5. 删除无用依赖
6. 统一命名
7. 统一中文文案
8. 确认移动端表现
9. 确认 lint 和 build 通过
```

## 2.5 禁止事项

```txt id="n2g0tz"
禁止直接复制多个后台模板混用
禁止一个页面用 TailAdmin 风格，另一个页面用 Ant Design 风格
禁止引入大型 UI 框架后只使用一两个组件
禁止为了解决小问题引入重型依赖
禁止保留模板里的假菜单、假页面、假接口
```

---

# 3. Blue Ice Admin 视觉方案

## 3.1 视觉关键词

```txt id="qovvx8"
浅色后台
低饱和蓝灰背景
蓝色主色
左侧固定导航
白色半透明卡片
圆角面板
轻阴影
清晰表单
状态可见
信息密度适中
```

## 3.2 主色选择

本项目固定主色为：

```txt id="gsking"
Primary Blue：#2563EB
```

不再反复调整主色。

## 3.3 主题颜色

```txt id="kz6ois"
页面背景：#F5F7FB
页面背景辅助蓝：#EEF4FF
页面背景辅助绿：#ECFDF5

主色：#2563EB
主色 Hover：#1D4ED8
主色 Pressed：#1E40AF
主色浅背景：#DBEAFE
主色弱背景：#EFF6FF

卡片背景：rgba(255, 255, 255, 0.86)
卡片实色背景：#FFFFFF
侧边栏背景：rgba(239, 244, 255, 0.78)
侧边栏选中背景：#DBE5FF

主文字：#0F172A
次级文字：#475569
弱文字：#94A3B8
反白文字：#FFFFFF

边框色：#E2E8F0
弱边框色：#EEF2F7
输入框边框：#CBD5E1

成功色：#10B981
成功浅背景：#D1FAE5
警告色：#F59E0B
警告浅背景：#FEF3C7
错误色：#EF4444
错误浅背景：#FEE2E2
信息色：#0EA5E9
信息浅背景：#E0F2FE
```

## 3.4 阴影

```txt id="slm29j"
卡片阴影：0 8px 24px rgba(15, 23, 42, 0.08)
面板阴影：0 12px 32px rgba(15, 23, 42, 0.08)
浮层阴影：0 18px 48px rgba(15, 23, 42, 0.14)
按钮阴影：0 4px 12px rgba(37, 99, 235, 0.22)
```

## 3.5 圆角

```txt id="nxoewr"
页面卡片：16px
大型面板：18px
按钮：10px
输入框：10px
导航项：12px
徽标：999px
弹窗：20px
```

## 3.6 字体层级

```txt id="xe13hi"
页面标题：text-2xl font-bold tracking-tight
页面副标题：text-sm text-muted
区块标题：text-lg font-semibold
卡片标题：text-sm font-medium
数据数字：text-2xl font-bold
正文：text-sm
辅助说明：text-xs
表格文字：text-sm
按钮文字：text-sm font-medium
```

---

# 4. CSS 变量规范

## 4.1 变量文件位置

主题变量统一写入：

```txt id="b8swsv"
src/app/globals.css
```

## 4.2 主题变量

```css id="uvehmz"
:root {
  --admin-bg: #f5f7fb;
  --admin-bg-blue: #eef4ff;
  --admin-bg-mint: #ecfdf5;

  --admin-primary: #2563eb;
  --admin-primary-hover: #1d4ed8;
  --admin-primary-pressed: #1e40af;
  --admin-primary-soft: #dbeafe;
  --admin-primary-weak: #eff6ff;

  --admin-card: rgba(255, 255, 255, 0.86);
  --admin-card-solid: #ffffff;

  --admin-sidebar: rgba(239, 244, 255, 0.78);
  --admin-sidebar-active: #dbe5ff;

  --admin-text: #0f172a;
  --admin-text-secondary: #475569;
  --admin-text-muted: #94a3b8;
  --admin-text-inverse: #ffffff;

  --admin-border: #e2e8f0;
  --admin-border-soft: #eef2f7;
  --admin-input-border: #cbd5e1;

  --admin-success: #10b981;
  --admin-success-soft: #d1fae5;

  --admin-warning: #f59e0b;
  --admin-warning-soft: #fef3c7;

  --admin-danger: #ef4444;
  --admin-danger-soft: #fee2e2;

  --admin-info: #0ea5e9;
  --admin-info-soft: #e0f2fe;

  --admin-radius-card: 16px;
  --admin-radius-panel: 18px;
  --admin-radius-button: 10px;
  --admin-radius-input: 10px;
  --admin-radius-nav: 12px;

  --admin-shadow-card: 0 8px 24px rgba(15, 23, 42, 0.08);
  --admin-shadow-panel: 0 12px 32px rgba(15, 23, 42, 0.08);
  --admin-shadow-popover: 0 18px 48px rgba(15, 23, 42, 0.14);
  --admin-shadow-button: 0 4px 12px rgba(37, 99, 235, 0.22);
}
```

## 4.3 页面背景

所有后台页面统一使用：

```tsx id="u3w4iy"
<div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#ecfdf5_0,#f5f7fb_36%,#eef4ff_100%)] text-[var(--admin-text)]">
  {children}
</div>
```

## 4.4 禁止硬编码颜色

禁止：

```tsx id="wko1gq"
<div className="bg-blue-600 text-gray-900" />
```

推荐：

```tsx id="uwuppw"
<div className="bg-[var(--admin-primary)] text-[var(--admin-text-inverse)]" />
```

例外：图标、状态徽标可以使用少量 Tailwind 颜色，但必须保持一致。

---

# 5. 应用地址规范

## 5.1 本地地址

```txt id="vchict"
本地页面：http://localhost:3000
本地后台：http://localhost:3000/dashboard
本地 API：http://localhost:3000/api
```

## 5.2 预览地址

```txt id="nye2go"
Vercel Preview URL：用于每次功能分支验证
```

## 5.3 正式地址

```txt id="iohvmm"
Production Domain：正式用户访问地址
```

## 5.4 地址配置文件

统一写入：

```txt id="ig3mkv"
src/config/site.ts
```

```ts id="mgfuoe"
export const siteConfig = {
  name: "Cockpit Tools",
  description: "AI 工具账号与平台管理后台",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
}
```

禁止在页面组件中直接写正式域名。

---

# 6. 项目目录结构

## 6.1 推荐目录

```txt id="tban8z"
src/
  app/
    globals.css
    layout.tsx
    page.tsx

    (admin)/
      layout.tsx
      dashboard/
        page.tsx
      platforms/
        page.tsx
      accounts/
        page.tsx
      two-factor/
        page.tsx
      logs/
        page.tsx
      settings/
        page.tsx

    api/

  components/
    ui/
      button.tsx
      input.tsx
      card.tsx
      select.tsx
      switch.tsx
      table.tsx
      dialog.tsx
      sheet.tsx
      badge.tsx

    admin/
      admin-layout.tsx
      admin-sidebar.tsx
      admin-topbar.tsx
      admin-page-header.tsx
      admin-page-shell.tsx
      admin-card.tsx
      admin-section.tsx
      admin-empty-state.tsx
      admin-error-state.tsx
      admin-loading-state.tsx
      stat-card.tsx
      platform-panel.tsx
      settings-card.tsx

    layout/
      root-provider.tsx

  features/
    dashboard/
      components/
      services/
      types.ts

    platforms/
      components/
      services/
      types.ts

    accounts/
      components/
      services/
      types.ts

    logs/
      components/
      services/
      types.ts

    settings/
      components/
      services/
      types.ts

  config/
    site.ts
    nav.ts
    theme.ts

  constants/
    index.ts

  hooks/
    use-mobile.ts
    use-toast.ts

  lib/
    utils.ts
    fetcher.ts
    validations.ts
    format.ts

  types/
    global.ts

public/
  images/
  icons/

docs/
  frontend-engineering-spec.md
  bug-report-template.md
  release-checklist.md
```

## 6.2 目录职责

```txt id="j4k413"
app/：路由、页面、布局、API
components/ui/：shadcn/ui 基础组件
components/admin/：后台系统通用组件
features/：具体业务模块
config/：站点、导航、主题配置
lib/：工具函数、请求封装、校验函数
hooks/：通用 React Hooks
types/：全局类型
docs/：工程规范文档
```

---

# 7. 路由规范

## 7.1 后台路由组

后台路由统一放入：

```txt id="bug6wo"
src/app/(admin)/
```

这样可以把后台布局和前台页面隔离。

## 7.2 标准页面路径

```txt id="r6eo6g"
/dashboard：仪表盘
/platforms：平台管理
/accounts：账号管理
/two-factor：2FA 管理
/logs：日志
/settings：设置
```

## 7.3 页面职责

```txt id="fn471z"
page.tsx 只负责组合组件
不在 page.tsx 中写复杂业务逻辑
不在 page.tsx 中写大量表格列配置
不在 page.tsx 中写复杂表单逻辑
```

---

# 8. 后台主布局规范

## 8.1 桌面端结构

```txt id="bhuejv"
左侧固定侧边栏
右侧顶部操作栏
右侧主内容区域
```

尺寸固定：

```txt id="o7wvh7"
侧边栏宽度：220px
顶部栏高度：72px
主内容左右边距：24px
主内容底部边距：32px
内容最大宽度：不限制，使用自适应
```

## 8.2 布局组件

文件：

```txt id="rbezfp"
src/components/admin/admin-layout.tsx
```

```tsx id="jvghll"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"

type AdminLayoutProps = {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#ecfdf5_0,#f5f7fb_36%,#eef4ff_100%)] text-[var(--admin-text)]">
      <AdminSidebar />

      <div className="min-w-0 lg:pl-[220px]">
        <AdminTopbar />

        <main className="min-h-[calc(100vh-72px)] px-4 pb-8 pt-4 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## 8.3 后台 layout 文件

文件：

```txt id="eu56xq"
src/app/(admin)/layout.tsx
```

```tsx id="qob3zz"
import { AdminLayout } from "@/components/admin/admin-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
```

---

# 9. 侧边栏规范

## 9.1 尺寸

```txt id="ab97pl"
宽度：220px
Logo 区高度：104px
主导航区内边距：16px
导航项高度：44px
导航项间距：6px
底部功能区高度：自动
```

## 9.2 视觉

```txt id="hsacp9"
背景：var(--admin-sidebar)
右边框：var(--admin-border)
毛玻璃：backdrop-blur-xl
导航默认文字：var(--admin-text-secondary)
导航选中文字：var(--admin-primary)
导航选中背景：var(--admin-sidebar-active)
导航 hover 背景：rgba(255,255,255,0.7)
```

## 9.3 导航配置

文件：

```txt id="u1aax1"
src/config/nav.ts
```

```ts id="bgn3hl"
import {
  LayoutDashboard,
  Grid2X2,
  Users,
  ShieldCheck,
  FileText,
  Settings,
} from "lucide-react"

export const adminNavItems = [
  {
    label: "仪表盘",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "平台管理",
    href: "/platforms",
    icon: Grid2X2,
  },
  {
    label: "账号管理",
    href: "/accounts",
    icon: Users,
  },
  {
    label: "2FA 管理",
    href: "/two-factor",
    icon: ShieldCheck,
  },
  {
    label: "日志",
    href: "/logs",
    icon: FileText,
  },
  {
    label: "设置",
    href: "/settings",
    icon: Settings,
  },
]
```

## 9.4 侧边栏组件

```tsx id="ar2a5o"
import Link from "next/link"
import { adminNavItems } from "@/config/nav"

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)] backdrop-blur-xl lg:flex lg:flex-col">
      <div className="flex h-[104px] items-center gap-3 px-6">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--admin-primary)] text-white shadow-[var(--admin-shadow-button)]">
          CT
        </div>
        <div>
          <div className="text-base font-bold text-[var(--admin-text)]">
            Cockpit Tools
          </div>
          <div className="text-xs text-[var(--admin-text-muted)]">
            Admin Console
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {adminNavItems.map((item) => {
          const Icon = item.icon
          const isActive = false

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex h-11 items-center gap-3 rounded-[var(--admin-radius-nav)] px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--admin-sidebar-active)] text-[var(--admin-primary)]"
                  : "text-[var(--admin-text-secondary)] hover:bg-white/70 hover:text-[var(--admin-primary)]",
              ].join(" ")}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[var(--admin-border)] p-4">
        <button className="flex h-10 w-full items-center gap-3 rounded-[var(--admin-radius-nav)] px-3 text-sm font-medium text-[var(--admin-text-secondary)] hover:bg-white/70">
          收起菜单
        </button>
      </div>
    </aside>
  )
}
```

---

# 10. 顶部栏规范

## 10.1 尺寸

```txt id="tsoxrr"
高度：72px
左右内边距：24px
右侧按钮高度：36px
通知按钮尺寸：40px
```

## 10.2 内容

```txt id="v6nb8p"
左侧：移动端菜单按钮 / 可选面包屑
右侧：通知、重置、保存更改、用户菜单
```

## 10.3 顶部栏组件

```tsx id="g4gjbc"
import { Bell } from "lucide-react"

export function AdminTopbar() {
  return (
    <header className="flex h-[72px] items-center justify-between px-4 sm:px-6">
      <div className="lg:hidden">
        <button className="inline-flex size-10 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-white/80">
          菜单
        </button>
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <button className="relative inline-flex size-10 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-white/80 text-[var(--admin-text-secondary)] shadow-sm backdrop-blur hover:bg-white">
          <Bell className="size-4" />
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--admin-danger)] text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <button className="hidden h-9 rounded-xl border border-[var(--admin-border)] bg-white/80 px-4 text-sm font-medium text-[var(--admin-text-secondary)] shadow-sm hover:bg-white sm:inline-flex sm:items-center">
          重置
        </button>

        <button className="inline-flex h-9 items-center rounded-xl bg-[var(--admin-primary)] px-4 text-sm font-medium text-white shadow-[var(--admin-shadow-button)] hover:bg-[var(--admin-primary-hover)]">
          保存更改
        </button>
      </div>
    </header>
  )
}
```

---

# 11. 页面容器规范

## 11.1 页面外壳

文件：

```txt id="xwq471"
src/components/admin/admin-page-shell.tsx
```

```tsx id="dhpbpb"
type AdminPageShellProps = {
  children: React.ReactNode
}

export function AdminPageShell({ children }: AdminPageShellProps) {
  return <div className="space-y-6">{children}</div>
}
```

## 11.2 页面标题

文件：

```txt id="e6cbbd"
src/components/admin/admin-page-header.tsx
```

```tsx id="se4jc0"
type AdminPageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--admin-text)]">
          {title}
        </h1>

        {description ? (
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  )
}
```

---

# 12. 后台卡片规范

## 12.1 普通卡片

```tsx id="l26pmu"
type AdminCardProps = {
  children: React.ReactNode
  className?: string
}

export function AdminCard({ children, className = "" }: AdminCardProps) {
  return (
    <div
      className={[
        "rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-[var(--admin-shadow-card)] backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  )
}
```

## 12.2 设置卡片

```tsx id="z1sv64"
type SettingsCardProps = {
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

export function SettingsCard({
  title,
  description,
  icon,
  children,
}: SettingsCardProps) {
  return (
    <section className="rounded-[var(--admin-radius-panel)] border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-[var(--admin-shadow-panel)] backdrop-blur">
      <div className="mb-5 flex items-start gap-3">
        {icon ? (
          <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--admin-primary-weak)] text-[var(--admin-primary)]">
            {icon}
          </div>
        ) : null}

        <div>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">
            {title}
          </h2>

          {description ? (
            <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  )
}
```

---

# 13. 仪表盘页面规范

## 13.1 页面结构

仪表盘固定结构：

```txt id="woi86t"
页面标题
数据概览卡片
平台状态面板
日志和提醒
```

## 13.2 数据卡片网格

```txt id="tehbd6"
手机：1 列
平板：2 列
桌面：4 列
卡片高度：86px
卡片圆角：16px
图标容器：48px
```

```tsx id="itgg25"
<section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
  {items.map((item) => (
    <StatCard key={item.name} {...item} />
  ))}
</section>
```

## 13.3 数据卡片组件

```tsx id="qyvtey"
type StatCardProps = {
  name: string
  value: number | string
  icon: React.ReactNode
  badge?: string
}

export function StatCard({ name, value, icon, badge }: StatCardProps) {
  return (
    <div className="relative flex h-[86px] items-center gap-4 rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 shadow-[var(--admin-shadow-card)] backdrop-blur">
      <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--admin-info-soft)] text-[var(--admin-primary)]">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-[var(--admin-text-secondary)]">
          {name}
        </div>
        <div className="mt-1 text-2xl font-bold leading-none text-[var(--admin-text)]">
          {value}
        </div>
      </div>

      {badge ? (
        <div className="absolute right-3 top-3 rounded-full bg-[var(--admin-primary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--admin-primary)]">
          {badge}
        </div>
      ) : null}
    </div>
  )
}
```

---

# 14. 设置页面规范

## 14.1 页面定位

设置页用于管理：

```txt id="tquw8o"
基础设置
主题与布局
通知设置
安全设置
平台配置
备份与更新
```

## 14.2 设置页面布局

```txt id="t8f48z"
桌面：2 列卡片
平板：1 列或 2 列
手机：1 列
卡片间距：20px
卡片内边距：20px
底部固定或普通操作栏
```

## 14.3 设置页面结构

```tsx id="l01xeu"
import {
  Bell,
  Database,
  LinkIcon,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { SettingsCard } from "@/components/admin/settings-card"

export default function SettingsPage() {
  return (
    <AdminPageShell>
      <AdminPageHeader
        title="设置"
        description="系统配置、主题、通知与安全设置"
      />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SettingsCard title="基础设置" icon={<SlidersHorizontal className="size-4" />}>
          基础设置表单
        </SettingsCard>

        <SettingsCard title="主题与布局" icon={<Palette className="size-4" />}>
          主题与布局表单
        </SettingsCard>

        <SettingsCard title="通知设置" icon={<Bell className="size-4" />}>
          通知设置表单
        </SettingsCard>

        <SettingsCard title="安全设置" icon={<ShieldCheck className="size-4" />}>
          安全设置表单
        </SettingsCard>

        <SettingsCard title="平台配置" icon={<LinkIcon className="size-4" />}>
          平台配置表单
        </SettingsCard>

        <SettingsCard title="备份与更新" icon={<Database className="size-4" />}>
          备份与更新表单
        </SettingsCard>
      </section>

      <div className="flex justify-end gap-3">
        <button className="h-10 rounded-xl border border-[var(--admin-border)] bg-white/80 px-5 text-sm font-medium text-[var(--admin-text-secondary)] shadow-sm hover:bg-white">
          恢复默认设置
        </button>

        <button className="h-10 rounded-xl bg-[var(--admin-primary)] px-5 text-sm font-medium text-white shadow-[var(--admin-shadow-button)] hover:bg-[var(--admin-primary-hover)]">
          保存配置
        </button>
      </div>
    </AdminPageShell>
  )
}
```

---

# 15. 表单控件规范

## 15.1 表单行结构

设置页表单统一使用左右结构：

```txt id="zw21ce"
左侧：字段名
右侧：输入控件
字段名宽度：140px
控件最大宽度：360px
移动端：上下排列
```

## 15.2 表单行组件

```tsx id="mvx0a8"
type SettingRowProps = {
  label: string
  description?: string
  children: React.ReactNode
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
      <div>
        <div className="text-sm font-medium text-[var(--admin-text)]">
          {label}
        </div>

        {description ? (
          <div className="mt-1 text-xs text-[var(--admin-text-muted)]">
            {description}
          </div>
        ) : null}
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  )
}
```

## 15.3 输入框样式

```txt id="g1dpg0"
高度：36px
圆角：10px
边框：#CBD5E1
背景：白色 80%
文字：#0F172A
placeholder：#94A3B8
focus：蓝色边框 + 轻微蓝色阴影
```

```tsx id="rfq5b3"
<input className="h-9 w-full rounded-[var(--admin-radius-input)] border border-[var(--admin-input-border)] bg-white/80 px-3 text-sm text-[var(--admin-text)] outline-none transition focus:border-[var(--admin-primary)] focus:ring-4 focus:ring-blue-100" />
```

## 15.4 Select 样式

```txt id="iu2vy8"
高度：36px
圆角：10px
背景：白色 80%
右侧箭头
focus 状态同输入框
```

## 15.5 Switch 样式

```txt id="k66tf6"
开启：蓝色
关闭：灰蓝色
尺寸：40px x 22px
圆角：999px
```

---

# 16. 按钮规范

## 16.1 按钮类型

```txt id="r99u0t"
Primary：主操作，例如保存、创建、确认
Secondary：次操作，例如重置、取消、查看详情
Ghost：弱操作，例如更多、展开
Danger：危险操作，例如删除、禁用
Icon：纯图标操作
```

## 16.2 按钮尺寸

```txt id="kpt8pw"
小按钮：h-8 px-3 text-xs
普通按钮：h-9 px-4 text-sm
主要按钮：h-10 px-5 text-sm
图标按钮：size-9 / size-10
```

## 16.3 主按钮

```tsx id="ifbcmq"
<button className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--admin-primary)] px-5 text-sm font-medium text-white shadow-[var(--admin-shadow-button)] transition hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-pressed)]">
  保存配置
</button>
```

## 16.4 次按钮

```tsx id="hcblsv"
<button className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-white/80 px-5 text-sm font-medium text-[var(--admin-text-secondary)] shadow-sm transition hover:bg-white">
  取消
</button>
```

---

# 17. 平台面板规范

## 17.1 使用场景

```txt id="rxif0r"
平台账号状态
推荐账号
平台同步结果
平台操作入口
```

## 17.2 面板结构

```txt id="zked3j"
头部：平台图标 + 平台名称 + 操作按钮
内容：当前账号 + 推荐账号
底部：可选状态或日志
```

## 17.3 面板尺寸

```txt id="e5pvuq"
圆角：18px
头部高度：60px
内容最小高度：260px
桌面：2 列
移动端：1 列
```

---

# 18. 表格规范

## 18.1 使用页面

```txt id="frdesh"
账号管理
平台管理
日志
2FA 管理
```

## 18.2 表格视觉

```txt id="gdi2m0"
表格外层：白色半透明卡片
表头背景：白色 50%
行高：52px
表格文字：14px
边框：只保留横向分割线
操作列：右对齐
```

## 18.3 表格页面结构

```txt id="ns0res"
页面标题
筛选工具栏
表格卡片
分页
空状态
错误状态
```

---

# 19. 状态组件规范

## 19.1 Loading

```tsx id="agsx08"
export function AdminLoadingState() {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-[var(--admin-radius-card)] border border-[var(--admin-border)] bg-[var(--admin-card)] text-sm text-[var(--admin-text-muted)]">
      加载中...
    </div>
  )
}
```

## 19.2 Empty

```tsx id="x6y9y0"
type AdminEmptyStateProps = {
  title?: string
  description?: string
}

export function AdminEmptyState({
  title = "暂无数据",
  description = "当前没有可展示的内容。",
}: AdminEmptyStateProps) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-slate-50/80 p-6 text-center">
      <div className="text-sm font-medium text-[var(--admin-text-muted)]">
        {title}
      </div>
      <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
        {description}
      </p>
    </div>
  )
}
```

## 19.3 Error

```tsx id="qrth6a"
type AdminErrorStateProps = {
  title?: string
  description?: string
}

export function AdminErrorState({
  title = "加载失败",
  description = "请稍后重试。",
}: AdminErrorStateProps) {
  return (
    <div className="rounded-[var(--admin-radius-card)] border border-red-200 bg-red-50/80 p-5">
      <div className="text-sm font-semibold text-[var(--admin-danger)]">
        {title}
      </div>
      <p className="mt-1 text-xs text-red-500">{description}</p>
    </div>
  )
}
```

---

# 20. 响应式规范

## 20.1 断点策略

```txt id="zjcr9a"
默认：移动端
sm：小屏增强
md：平板
lg：桌面，显示侧边栏
xl：宽屏，使用 2 列或 4 列
```

## 20.2 侧边栏

```txt id="asz0hq"
< 1024px：隐藏固定侧边栏，使用顶部菜单按钮
>= 1024px：显示固定侧边栏
```

## 20.3 卡片网格

```txt id="nb1j18"
手机：1 列
平板：2 列
桌面：2 列或 4 列
```

## 20.4 禁止横向溢出

所有主内容容器必须包含：

```txt id="dnkzw8"
min-w-0
```

所有表格外层必须考虑：

```txt id="cmedm2"
overflow-x-auto
```

---

# 21. TypeScript 规范

## 21.1 类型位置

```txt id="jgd00n"
全局类型：src/types/
模块类型：src/features/模块名/types.ts
组件 Props：组件文件内部
```

## 21.2 Props 命名

```tsx id="f09p0k"
type UserCardProps = {
  name: string
  description?: string
}
```

## 21.3 禁止 any

默认禁止：

```ts id="ysuh2l"
const data: any = {}
```

临时允许时必须写注释：

```ts id="yf2868"
// TODO: 等后端接口稳定后替换为 Account 类型
const data: any = response
```

---

# 22. 文件和函数大小规范

## 22.1 文件行数

```txt id="d07avr"
page.tsx：建议小于 120 行
普通组件：建议小于 200 行
复杂业务组件：最多 300 行
工具函数文件：建议小于 200 行
配置文件：建议小于 200 行
```

## 22.2 函数行数

```txt id="huxhq8"
单函数建议小于 40 行
单组件建议小于 120 行
```

## 22.3 必须拆分的情况

```txt id="srd4eu"
组件同时处理请求、布局、表单、弹窗、状态
同一段 UI 重复出现 2 次
props 超过 8 个
单文件超过 300 行
函数里有大量 if/else
页面滚动超过 2 屏仍看不清结构
```

---

# 23. API 请求规范

## 23.1 请求封装

文件：

```txt id="f54dxc"
src/lib/fetcher.ts
```

```ts id="k2vubj"
export async function fetcher<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error("请求失败")
  }

  return response.json()
}
```

## 23.2 请求状态

所有请求页面必须处理：

```txt id="sg81io"
loading
empty
error
success
```

## 23.3 禁止

```txt id="ffpe15"
禁止在组件里散落多个 fetch
禁止硬编码 API 域名
禁止忽略错误状态
禁止 loading 时页面空白
```

---

# 24. 表单规范

## 24.1 推荐组合

```txt id="eapmux"
React Hook Form + Zod
```

## 24.2 表单必须包含

```txt id="empbro"
字段校验
错误提示
提交中状态
成功反馈
失败反馈
防重复提交
```

## 24.3 设置页表单提交

```txt id="myoh7g"
修改后保存按钮显示可点击
提交中按钮禁用
提交成功显示 toast
提交失败显示错误提示
离开页面前可提醒未保存
```

---

# 25. 状态管理规范

## 25.1 默认优先级

```txt id="fyqiir"
组件内部状态：useState
复杂局部状态：useReducer
服务端数据：fetch / SWR / TanStack Query
表单状态：React Hook Form
全局轻量状态：Zustand
```

## 25.2 不进入全局状态

```txt id="ycpe24"
弹窗打开关闭
输入框临时内容
局部 loading
局部 tab
局部筛选条件
```

## 25.3 可以进入全局状态

```txt id="p5xsry"
登录用户信息
主题设置
侧边栏折叠状态
全局平台选择
全局通知数量
```

---

# 26. Git 规范

## 26.1 分支命名

```txt id="rs0p9j"
main：正式分支
dev：开发分支
feature/功能名
fix/问题名
refactor/模块名
docs/文档名
```

## 26.2 提交信息

```txt id="vbt5pd"
feat: 新增功能
fix: 修复问题
docs: 文档修改
style: 样式调整
refactor: 重构
test: 测试
chore: 工程配置
```

示例：

```txt id="sa7j87"
feat: add settings page
fix: resolve sidebar active state
docs: update frontend engineering spec
```

---

# 27. 开发流程

## 27.1 新功能流程

```txt id="dou2gd"
1. 确认页面路径
2. 确认页面结构
3. 确认数据来源
4. 先找 shadcn/ui 或 blocks 是否已有组件
5. 引入或改造组件
6. 套用 Blue Ice Admin 主题变量
7. 拆分业务组件
8. 接入数据
9. 补齐 loading / empty / error
10. 本地验证
11. 提交代码
12. Vercel Preview 验证
13. 合并发布
```

## 27.2 样式开发流程

```txt id="slf5tw"
1. 先使用现有 admin 组件
2. 现有组件不满足再扩展组件
3. 不允许页面单独写一套卡片样式
4. 不允许随意新增颜色
5. 不允许破坏响应式规则
```

---

# 28. Bug 修复规范

## 28.1 修复流程

```txt id="w72ouc"
1. 复现问题
2. 记录访问地址
3. 记录复现步骤
4. 定位原因
5. 最小修改
6. 本地验证
7. 预览环境验证
8. 检查相关页面
9. 记录修复说明
```

## 28.2 Bug 记录模板

```txt id="l3acdd"
问题标题：
影响页面：
访问地址：
复现步骤：
预期结果：
实际结果：
原因分析：
修改文件：
验证方式：
验证结果：
是否影响旧功能：
```

## 28.3 禁止

```txt id="tck5ie"
禁止修 Bug 时大范围重构
禁止顺手改无关页面
禁止删除看不懂的代码
禁止只在桌面端验证
禁止不验证构建
```

---

# 29. 验证规范

## 29.1 本地启动

```bash id="f0jfsq"
npm install
npm run dev
```

访问：

```txt id="gyo6cu"
http://localhost:3000
```

## 29.2 提交前检查

```bash id="j85r81"
npm run lint
npm run build
```

有测试时执行：

```bash id="qh9g3i"
npm run test
```

## 29.3 页面检查清单

```txt id="im3i6w"
页面是否能打开
刷新是否正常
直接访问路由是否正常
移动端是否正常
是否有横向滚动
按钮是否能点击
表单是否能提交
loading 是否显示
empty 是否显示
error 是否显示
控制台是否无明显报错
```

---

# 30. 发布规范

## 30.1 发布前检查

```txt id="up2glb"
lint 通过
build 通过
核心页面可访问
移动端检查完成
环境变量配置完成
无明显控制台错误
Vercel Preview 验证完成
```

## 30.2 发布流程

```txt id="v4dcg9"
1. 本地开发
2. 推送 feature 分支
3. 生成 Preview
4. 预览环境验证
5. 合并到 main
6. 自动发布正式环境
7. 正式环境回归检查
```

## 30.3 回滚流程

```txt id="g7626r"
1. Vercel 回滚到上一个稳定版本
2. 记录问题
3. 新建 fix 分支
4. 修复并验证
5. 重新发布
```

---

# 31. AI 辅助开发规范

## 31.1 AI 写代码前必须提供

```txt id="aylz64"
当前技术栈
目标页面
需要修改的文件
当前目录结构
是否允许新增依赖
目标视觉规范：Blue Ice Admin
是否需要移动端适配
```

## 31.2 AI 生成页面提示词

```txt id="ssmpky"
请基于 Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui 编写后台页面。

项目视觉规范：
Blue Ice Admin 浅色后台主题。

要求：
1. 使用 src/components/admin 下的通用组件
2. 不从零手写重复样式
3. 优先使用 shadcn/ui 组件
4. 页面使用左侧后台布局
5. 卡片使用统一圆角、边框、阴影
6. 主色使用 #2563EB
7. 背景使用浅灰蓝渐变
8. 支持移动端
9. 包含 loading / empty / error 状态
10. page.tsx 只负责组合组件
11. 单文件不超过 200 行
12. 输出完整代码
```

## 31.3 AI 修 Bug 提示词

```txt id="gk1u1d"
请修复以下 Bug。

技术栈：
Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui

视觉规范：
Blue Ice Admin

问题描述：
填写问题

复现步骤：
1.
2.
3.

预期结果：
填写预期

实际结果：
填写实际

要求：
1. 先分析原因
2. 只做最小修改
3. 不重构无关代码
4. 不破坏统一主题
5. 给出修改文件
6. 给出完整代码
7. 给出验证步骤
```

---

# 32. 初始化落地步骤

## 32.1 创建项目

```bash id="sc5sdf"
npx create-next-app@latest cockpit-tools-admin
```

建议选择：

```txt id="mvd21k"
TypeScript：Yes
ESLint：Yes
Tailwind CSS：Yes
src/ directory：Yes
App Router：Yes
import alias：Yes
```

## 32.2 初始化 shadcn/ui

```bash id="vqp3o4"
npx shadcn@latest init
```

配置选择：

```txt id="kxib4m"
style：new-york
base color：slate
css variables：yes
```

## 32.3 添加基础组件

```bash id="uvtqnj"
npx shadcn@latest add button input card select switch table dialog sheet badge dropdown-menu tabs form separator tooltip popover
```

## 32.4 添加后台区块

```bash id="qicyh9"
npx shadcn@latest add sidebar-01
npx shadcn@latest add dashboard-01
```

添加后必须整理到本项目目录，不允许保留原始示例结构。

## 32.5 建立后台目录

```txt id="qbxgky"
src/app/(admin)/
src/components/admin/
src/features/
src/config/
docs/
```

---

# 33. 最小可用版本

第一阶段只做这些页面：

```txt id="mfze43"
/dashboard
/platforms
/accounts
/logs
/settings
```

第一阶段只做这些组件：

```txt id="r8ycld"
AdminLayout
AdminSidebar
AdminTopbar
AdminPageHeader
AdminPageShell
AdminCard
SettingsCard
StatCard
AdminEmptyState
AdminLoadingState
AdminErrorState
```

第一阶段必须完成：

```txt id="mx23rc"
统一主题
统一侧边栏
统一顶部栏
统一设置页
统一仪表盘卡片
移动端可访问
Vercel 可部署
```

---

# 34. 最终禁止清单

```txt id="oneqch"
禁止从零手写完整后台 UI
禁止混用多个后台模板风格
禁止硬编码正式域名
禁止硬编码颜色
禁止散乱 style
禁止 page.tsx 堆几百行代码
禁止组件超过 300 行
禁止忽略移动端
禁止没有 loading / empty / error
禁止引入不必要大型依赖
禁止提交 .env.local
禁止修 Bug 时大范围重构
禁止模板假数据进入正式业务代码
```

---

# 35. 最终标准

本项目所有后台页面最终应保持以下统一效果：

```txt id="if3cc3"
左侧固定浅色导航
右侧浅灰蓝渐变背景
页面标题清晰
内容使用白色半透明卡片
主色固定 #2563EB
圆角统一
阴影轻量
按钮统一
表单统一
状态统一
移动端可用
代码结构清晰
组件可复用
可持续迭代
```

本规范优先级高于临时样式偏好。
任何新页面、新组件、Bug 修复、AI 生成代码，都必须遵守本规范。
