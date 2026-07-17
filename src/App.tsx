import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Bot,
  Boxes,
  Cable,
  CheckCircle2,
  CircleAlert,
  Command,
  Languages,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

type View = "overview" | "skills" | "mcp" | "plugins" | "cli" | "translation" | "settings";
type CatalogKind = "app" | "skill" | "mcp" | "plugin" | "cli";

interface CatalogItem {
  id: string;
  app: "chatgpt" | "claude";
  kind: CatalogKind;
  name: string;
  description?: string;
  path: string;
  status: "available" | "discovered" | "pending_format";
}

interface CatalogScanResult {
  items: CatalogItem[];
  issues: string[];
}

interface NavigationItem {
  id: View;
  label: string;
  icon: LucideIcon;
}

const navigation: NavigationItem[] = [
  { id: "overview", label: "扫描总览", icon: LayoutDashboard },
  { id: "skills", label: "技能", icon: Sparkles },
  { id: "mcp", label: "MCP 工具", icon: Cable },
  { id: "plugins", label: "插件与 Agent", icon: Boxes },
  { id: "cli", label: "CLI 命令", icon: Command },
  { id: "translation", label: "中文翻译", icon: Languages },
  { id: "settings", label: "设置", icon: Settings },
];

const titles: Record<View, { title: string; description: string }> = {
  overview: { title: "本地 AI 资产总览", description: "只读扫描 ChatGPT 与 Claude 的本机资产，不读取或展示敏感配置。" },
  skills: { title: "技能", description: "发现本地技能并保留原始路径、来源和解析状态。" },
  mcp: { title: "MCP 工具", description: "只显示服务名称和配置来源，不将令牌或环境变量发送到界面。" },
  plugins: { title: "插件与 Agent", description: "统一查看 Claude 插件与 Agent；ChatGPT 格式确认后接入。" },
  cli: { title: "CLI 命令", description: "只探测已安装命令，不自动执行命令或修改编辑器配置。" },
  translation: { title: "中文翻译", description: "翻译缓存、人工修订和离线回退将在扫描内核迁移完成后接入。" },
  settings: { title: "设置", description: "桌面主题与本地扫描策略。配置写入功能将单独经过备份与确认设计。" },
};

function App() {
  const [activeView, setActiveView] = useState<View>("overview");
  const [scanResult, setScanResult] = useState<CatalogScanResult>({ items: [], issues: [] });
  const [isScanning, setIsScanning] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  const refresh = useCallback(async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const result = await invoke<CatalogScanResult>("scan_catalog");
      setScanResult(result);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const itemsForView = useMemo(() => {
    const kindMap: Partial<Record<View, CatalogKind[]>> = {
      skills: ["skill"],
      mcp: ["mcp"],
      plugins: ["plugin"],
      cli: ["cli"],
    };
    const acceptedKinds = kindMap[activeView];
    return acceptedKinds ? scanResult.items.filter((item) => acceptedKinds.includes(item.kind)) : scanResult.items;
  }, [activeView, scanResult.items]);

  const counts = useMemo(() => {
    return scanResult.items.reduce<Record<CatalogKind, number>>(
      (total, item) => ({ ...total, [item.kind]: total[item.kind] + 1 }),
      { app: 0, skill: 0, mcp: 0, plugin: 0, cli: 0 },
    );
  }, [scanResult.items]);

  const content = titles[activeView];

  return (
    <main className="flex h-screen min-h-0 overflow-hidden bg-background text-foreground">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card/70 px-3 pb-4 pt-10">
        <div className="mb-8 flex items-center gap-3 px-3" data-tauri-drag-region>
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-primary/25">
            <img src="/skillhelper-mark.svg" alt="SkillHelper" className="size-9" />
          </div>
          <div>
            <p className="font-semibold leading-none">SkillHelper</p>
            <p className="mt-1 text-xs text-muted-foreground">本地 AI 资产管理</p>
          </div>
        </div>

        <nav className="space-y-1" aria-label="主导航">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeView;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-medium text-foreground"><Bot size={14} /> 首期品牌</div>
          <p>ChatGPT、Claude</p>
          <p className="mt-1">其他编辑器将通过适配器接入。</p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-20 items-center justify-between border-b border-border px-8 pt-7">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{content.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{content.description}</p>
          </div>
          <Button onClick={() => void refresh()} disabled={isScanning} className="gap-2">
            {isScanning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            重新扫描
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {activeView === "overview" && (
            <Overview counts={counts} items={scanResult.items} issues={scanResult.issues} isScanning={isScanning} scanError={scanError} />
          )}
          {(["skills", "mcp", "plugins", "cli"] as View[]).includes(activeView) && (
            <CatalogList items={itemsForView} isScanning={isScanning} scanError={scanError} />
          )}
          {activeView === "translation" && <TranslationPanel />}
          {activeView === "settings" && <SettingsPanel theme={theme} onThemeChange={setTheme} />}
        </div>
      </section>
    </main>
  );
}

function Overview({ counts, items, issues, isScanning, scanError }: {
  counts: Record<CatalogKind, number>;
  items: CatalogItem[];
  issues: string[];
  isScanning: boolean;
  scanError: string | null;
}) {
  const cards = [
    { label: "技能", value: counts.skill, icon: Sparkles },
    { label: "MCP 工具", value: counts.mcp, icon: Cable },
    { label: "插件与 Agent", value: counts.plugin, icon: Boxes },
    { label: "CLI 命令", value: counts.cli, icon: Command },
  ];
  const chatgpt = items.find((item) => item.app === "chatgpt");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return <div key={card.label} className="glass-card rounded-xl p-5"><Icon size={18} className="text-primary" /><p className="mt-5 text-3xl font-semibold">{card.value}</p><p className="mt-1 text-sm text-muted-foreground">{card.label}</p></div>;
        })}
      </div>
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /><h2 className="font-semibold">应用适配状态</h2></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <StatusCard name="Claude" detail="技能、Agent、插件、MCP 名称和 CLI 探测已接入只读扫描。" state="已发现" />
          <StatusCard name="ChatGPT Desktop" detail={chatgpt?.description ?? "尚未发现本地数据目录。"} state={chatgpt ? "格式待确认" : "未发现"} />
        </div>
      </div>
      {(scanError || issues.length > 0) && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300"><div className="flex items-center gap-2 font-medium"><CircleAlert size={16} />扫描提示</div><p className="mt-2">{scanError ?? issues.join("；")}</p></div>}
      {isScanning && <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />正在读取本地目录…</div>}
    </div>
  );
}

function StatusCard({ name, detail, state }: { name: string; detail: string; state: string }) {
  return <div className="rounded-lg border border-border bg-background/60 p-4"><div className="flex items-center justify-between"><p className="font-medium">{name}</p><span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{state}</span></div><p className="mt-2 text-sm text-muted-foreground">{detail}</p></div>;
}

function CatalogList({ items, isScanning, scanError }: { items: CatalogItem[]; isScanning: boolean; scanError: string | null }) {
  if (isScanning) return <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground"><Loader2 size={18} className="animate-spin" />正在扫描本地资产…</div>;
  if (scanError) return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">扫描失败：{scanError}</div>;
  if (items.length === 0) return <div className="glass-card rounded-xl py-16 text-center"><p className="font-medium">尚未发现此类资产</p><p className="mt-2 text-sm text-muted-foreground">请确认对应应用已安装，或等待该应用适配器完成。</p></div>;
  return <div className="mx-auto max-w-6xl space-y-3">{items.map((item) => <article key={item.id} className="glass-card rounded-xl p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{item.name}</p><p className="mt-1 text-sm text-muted-foreground">{item.description ?? "未提供说明"}</p><p className="mt-3 break-all font-mono text-xs text-muted-foreground">{item.path}</p></div><span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{item.app === "claude" ? "Claude" : "ChatGPT"}</span></div></article>)}</div>;
}

function TranslationPanel() {
  return <div className="mx-auto max-w-3xl glass-card rounded-xl p-8"><Languages size={24} className="text-primary" /><h2 className="mt-5 text-lg font-semibold">中文本地化迁移中</h2><p className="mt-2 leading-6 text-muted-foreground">下一切片将把现有的语言识别、MD5 缓存、代码段跳过、网络超时和原文回退规则迁入 Tauri 服务。当前界面不会调用旧 Fastify 服务。</p></div>;
}

function SettingsPanel({ theme, onThemeChange }: { theme: "light" | "dark" | "system"; onThemeChange: (theme: "light" | "dark" | "system") => void }) {
  return <div className="mx-auto max-w-3xl glass-card rounded-xl p-8"><h2 className="text-lg font-semibold">桌面显示</h2><p className="mt-2 text-sm text-muted-foreground">主题偏好仅存储在本地设备。</p><div className="mt-5 flex gap-2">{(["system", "light", "dark"] as const).map((item) => <Button key={item} type="button" variant={theme === item ? "default" : "outline"} onClick={() => onThemeChange(item)}>{item === "system" ? "跟随系统" : item === "light" ? "浅色" : "深色"}</Button>)}</div></div>;
}

export default App;
