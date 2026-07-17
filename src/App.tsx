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
type Editor = "all" | "chatgpt" | "claude";

interface CatalogItem {
  id: string;
  app: Exclude<Editor, "all">;
  kind: CatalogKind;
  name: string;
  description: string;
  path: string;
  source: string;
  status: "available" | "discovered" | "pending_format" | "needs_attention";
}

interface CatalogScanResult {
  items: CatalogItem[];
  issues: string[];
}

interface TranslationResult {
  result: string;
  status: "source" | "cached" | "translated" | "unchanged" | "failed" | "timeout";
  provider: string;
  error?: string;
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
  overview: { title: "本地 AI 资产总览", description: "按编辑器查看扫描结果；扫描全程只读，不启动浏览器服务。" },
  skills: { title: "技能", description: "显示技能的原始描述，并按需生成中文本地化译文。" },
  mcp: { title: "MCP 工具", description: "只显示安全的服务名称、命令摘要和配置来源；凭据已在扫描内核中脱敏。" },
  plugins: { title: "插件与 Agent", description: "Claude 插件与 Agent 共用扫描与翻译流程。" },
  cli: { title: "CLI 命令", description: "仅探测 PATH 中的命令文件，不自动执行任何 CLI。" },
  translation: { title: "中文翻译", description: "翻译从单条资产详情主动触发，保留原有缓存、超时与原文回退规则。" },
  settings: { title: "设置", description: "桌面主题和本地扫描策略。编辑器写入能力将在备份与确认流程完成后再开放。" },
};

function App() {
  const [activeView, setActiveView] = useState<View>("overview");
  const [activeEditor, setActiveEditor] = useState<Editor>("all");
  const [scanResult, setScanResult] = useState<CatalogScanResult>({ items: [], issues: [] });
  const [isScanning, setIsScanning] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, TranslationResult>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  const refresh = useCallback(async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const result = await invoke<CatalogScanResult>("scan_skillhelper_catalog");
      setScanResult(result);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsScanning(false);
    }
  }, []);

  const translate = useCallback(async (item: CatalogItem) => {
    if (!item.description) return;
    setTranslatingId(item.id);
    try {
      const result = await invoke<TranslationResult>("translate_skillhelper_text", { text: item.description });
      setTranslations((current) => ({ ...current, [item.id]: result }));
    } finally {
      setTranslatingId(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const editorItems = useMemo(
    () => activeEditor === "all" ? scanResult.items : scanResult.items.filter((item) => item.app === activeEditor),
    [activeEditor, scanResult.items],
  );

  const itemsForView = useMemo(() => {
    const kindMap: Partial<Record<View, CatalogKind[]>> = {
      skills: ["skill"],
      mcp: ["mcp"],
      plugins: ["plugin"],
      cli: ["cli"],
    };
    const acceptedKinds = kindMap[activeView];
    return acceptedKinds ? editorItems.filter((item) => acceptedKinds.includes(item.kind)) : editorItems;
  }, [activeView, editorItems]);

  const counts = useMemo(() => editorItems.reduce<Record<CatalogKind, number>>(
    (total, item) => ({ ...total, [item.kind]: total[item.kind] + 1 }),
    { app: 0, skill: 0, mcp: 0, plugin: 0, cli: 0 },
  ), [editorItems]);

  const content = titles[activeView];

  return (
    <main className="flex h-screen min-h-0 overflow-hidden bg-background text-foreground">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card/70 px-3 pb-4 pt-10">
        <div className="mb-8 flex items-center gap-3 px-3" data-tauri-drag-region>
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-primary/25">
            <img src="/skillhelper-mark.svg" alt="SkillHelper" className="size-9" />
          </div>
          <div><p className="font-semibold leading-none">SkillHelper</p><p className="mt-1 text-xs text-muted-foreground">本地 AI 资产管理</p></div>
        </div>

        <nav className="space-y-1" aria-label="主导航">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeView;
            return <button key={item.id} type="button" onClick={() => setActiveView(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}><Icon size={17} />{item.label}</button>;
          })}
        </nav>

        <div className="mt-6 border-t border-border pt-4">
          <p className="px-3 pb-2 text-xs font-medium text-muted-foreground">按编辑器筛选</p>
          <div className="space-y-1">
            {(["all", "chatgpt", "claude"] as const).map((editor) => {
              const label = editor === "all" ? "全部编辑器" : editor === "chatgpt" ? "ChatGPT Desktop" : "Claude";
              return <button key={editor} type="button" onClick={() => setActiveEditor(editor)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${activeEditor === editor ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent/60"}`}>{label}</button>;
            })}
          </div>
        </div>

        <div className="mt-auto rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground"><div className="mb-2 flex items-center gap-2 font-medium text-foreground"><Bot size={14} /> 首期范围</div><p>ChatGPT Desktop、Claude</p><p className="mt-1">其他编辑器已明确延后。</p></div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-20 items-center justify-between border-b border-border px-8 pt-7"><div><h1 className="text-xl font-semibold tracking-tight">{content.title}</h1><p className="mt-1 text-sm text-muted-foreground">{content.description}</p></div><Button onClick={() => void refresh()} disabled={isScanning} className="gap-2">{isScanning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}重新扫描</Button></header>
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {activeView === "overview" && <Overview counts={counts} items={editorItems} issues={scanResult.issues} isScanning={isScanning} scanError={scanError} />}
          {(["skills", "mcp", "plugins", "cli"] as View[]).includes(activeView) && <CatalogList items={itemsForView} isScanning={isScanning} scanError={scanError} translations={translations} translatingId={translatingId} onTranslate={translate} />}
          {activeView === "translation" && <TranslationPanel translations={translations} />}
          {activeView === "settings" && <SettingsPanel theme={theme} onThemeChange={setTheme} />}
        </div>
      </section>
    </main>
  );
}

function Overview({ counts, items, issues, isScanning, scanError }: { counts: Record<CatalogKind, number>; items: CatalogItem[]; issues: string[]; isScanning: boolean; scanError: string | null }) {
  const cards = [{ label: "技能", value: counts.skill, icon: Sparkles }, { label: "MCP 工具", value: counts.mcp, icon: Cable }, { label: "插件与 Agent", value: counts.plugin, icon: Boxes }, { label: "CLI 命令", value: counts.cli, icon: Command }];
  const chatgpt = items.find((item) => item.id === "chatgpt:desktop");
  return <div className="mx-auto max-w-6xl space-y-6"><div className="grid gap-4 md:grid-cols-4">{cards.map((card) => { const Icon = card.icon; return <div key={card.label} className="glass-card rounded-xl p-5"><Icon size={18} className="text-primary" /><p className="mt-5 text-3xl font-semibold">{card.value}</p><p className="mt-1 text-sm text-muted-foreground">{card.label}</p></div>; })}</div><div className="glass-card rounded-xl p-6"><div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /><h2 className="font-semibold">编辑器适配状态</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2"><StatusCard name="Claude" detail="技能、Agent、插件、MCP 名称和 CLI 探测已接入现有扫描内核。" state="已接入" /><StatusCard name="ChatGPT Desktop" detail={chatgpt?.description || "尚未发现本地数据目录。"} state={chatgpt ? "格式待确认" : "未发现"} /></div></div>{(scanError || issues.length > 0) && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300"><div className="flex items-center gap-2 font-medium"><CircleAlert size={16} />扫描提示</div><p className="mt-2">{scanError || issues.join("；")}</p></div>}{isScanning && <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />正在读取本地目录…</div>}</div>;
}

function StatusCard({ name, detail, state }: { name: string; detail: string; state: string }) {
  return <div className="rounded-lg border border-border bg-background/60 p-4"><div className="flex items-center justify-between"><p className="font-medium">{name}</p><span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{state}</span></div><p className="mt-2 text-sm text-muted-foreground">{detail}</p></div>;
}

function CatalogList({ items, isScanning, scanError, translations, translatingId, onTranslate }: { items: CatalogItem[]; isScanning: boolean; scanError: string | null; translations: Record<string, TranslationResult>; translatingId: string | null; onTranslate: (item: CatalogItem) => void }) {
  if (isScanning) return <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground"><Loader2 size={18} className="animate-spin" />正在扫描本地资产…</div>;
  if (scanError) return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">扫描失败：{scanError}</div>;
  if (items.length === 0) return <div className="glass-card rounded-xl py-16 text-center"><p className="font-medium">尚未发现此类资产</p><p className="mt-2 text-sm text-muted-foreground">请确认对应编辑器已安装，或等待该编辑器适配器完成。</p></div>;
  return <div className="mx-auto max-w-6xl space-y-3">{items.map((item) => { const translation = translations[item.id]; return <article key={item.id} className="glass-card rounded-xl p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.name}</p><span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{item.app === "claude" ? "Claude" : "ChatGPT"}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.description || "未提供说明"}</p>{translation && <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm"><p className="mb-1 font-medium text-primary">中文</p><p>{translation.result}</p>{translation.error && <p className="mt-1 text-xs text-destructive">{translation.error}</p>}</div>}<p className="mt-3 break-all font-mono text-xs text-muted-foreground">{item.path}</p></div>{item.description && <Button type="button" variant="outline" size="sm" disabled={translatingId === item.id} onClick={() => void onTranslate(item)}>{translatingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}{translation ? "重新翻译" : "翻译中文"}</Button>}</div></article>; })}</div>;
}

function TranslationPanel({ translations }: { translations: Record<string, TranslationResult> }) {
  const values = Object.values(translations);
  return <div className="mx-auto max-w-3xl glass-card rounded-xl p-8"><Languages size={24} className="text-primary" /><h2 className="mt-5 text-lg font-semibold">按需中文本地化</h2><p className="mt-2 leading-6 text-muted-foreground">在技能、MCP、插件或 CLI 页面点击“翻译中文”即可生成译文。扫描不会触发翻译请求；译文会使用现有本地缓存。</p><p className="mt-5 text-sm text-muted-foreground">本次会话已处理 {values.length} 条，其中成功或缓存命中 {values.filter((item) => item.status === "translated" || item.status === "cached").length} 条。</p></div>;
}

function SettingsPanel({ theme, onThemeChange }: { theme: "light" | "dark" | "system"; onThemeChange: (theme: "light" | "dark" | "system") => void }) {
  return <div className="mx-auto max-w-3xl glass-card rounded-xl p-8"><h2 className="text-lg font-semibold">桌面显示</h2><p className="mt-2 text-sm text-muted-foreground">主题偏好仅存储在本地设备。</p><div className="mt-5 flex gap-2">{(["system", "light", "dark"] as const).map((item) => <Button key={item} type="button" variant={theme === item ? "default" : "outline"} onClick={() => onThemeChange(item)}>{item === "system" ? "跟随系统" : item === "light" ? "浅色" : "深色"}</Button>)}</div></div>;
}

export default App;
