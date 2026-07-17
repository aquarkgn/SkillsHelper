// Bun 编译 sidecar 的独立入口。用户参数从 process.argv[2] 起传入。
process.env.SKILLHELPER_DESKTOP_SIDECAR = '1';
const { runDesktopCoreCli } = await import('./desktop-core.mjs');

runDesktopCoreCli(process.argv.slice(2))
  .then((result) => process.stdout.write(`${JSON.stringify({ ok: true, result })}\n`))
  .catch((error) => {
    process.stdout.write(`${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  });
