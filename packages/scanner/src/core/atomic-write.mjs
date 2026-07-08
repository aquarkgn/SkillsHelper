/**
 * @file atomic-write.mjs
 * 2026-07 阶段三：实现已迁入 bin/lib/atomic-write.mjs（底层公共模块）。
 * 本文件保留为 re-export，保持 scanner 包内现有引用不变。
 * 新代码可直接引用 ../../../bin/lib/atomic-write.mjs。
 *
 * 原子写工具：临时文件 + rename，保证进程中断不产生半截文件。
 * 详见 bin/lib/atomic-write.mjs。
 */

export { atomicWriteText, atomicWriteBytes, atomicWriteJson } from '../../../../bin/lib/atomic-write.mjs';
