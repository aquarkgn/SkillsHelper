import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { inspectChatGptPairingExtensions } from './desktop-core.mjs';

test('ChatGPT 配对扩展只读取文件名并去重编辑器名称', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'skillhelper-chatgpt-pairing-'));
  fs.writeFileSync(path.join(directory, 'Visual Studio Code-6a09ff88-8d51-4d90-b633-40bbd4d3e09c'), '');
  fs.writeFileSync(path.join(directory, 'Visual Studio Code-c7f4d7fd-19f2-4742-87ed-8a2ade9a58e5'), '');
  fs.writeFileSync(path.join(directory, 'Zed-12345678-1234-1234-1234-123456789abc'), '');
  fs.mkdirSync(path.join(directory, '忽略目录'));

  assert.deepEqual(inspectChatGptPairingExtensions(directory), {
    count: 3,
    editorNames: ['Visual Studio Code', 'Zed'],
  });
});
