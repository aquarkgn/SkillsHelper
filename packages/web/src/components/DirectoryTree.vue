<script setup>
import { computed, reactive, ref } from 'vue';
import { useSkillsStore } from '../stores/skills.js';

const store = useSkillsStore();
const expandedPaths = reactive(new Set());
const selectedPath = ref(null);

const directoryTree = computed(() => {
  const tree = new Map();

  for (const skill of store.filtered) {
    if (!skill.paths?.abs) continue;

    const parts = skill.paths.abs.split('/');
    let current = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.has(part)) {
        current.set(part, new Map());
      }
      current = current.get(part);
    }

    if (!current.has('__skills__')) {
      current.set('__skills__', []);
    }
    current.get('__skills__').push(skill);
  }

  return tree;
});

function togglePath(path) {
  if (expandedPaths.has(path)) {
    expandedPaths.delete(path);
  } else {
    expandedPaths.add(path);
  }
}

function selectPath(path) {
  selectedPath.value = selectedPath.value === path ? null : path;
}

function countSkills(tree) {
  let count = 0;
  for (const [key, value] of tree.entries()) {
    if (key === '__skills__') {
      count += value.length;
    } else if (value instanceof Map) {
      count += countSkills(value);
    }
  }
  return count;
}

function getSkillsInPath(path) {
  let current = directoryTree.value;
  const parts = path.split('/');

  for (const part of parts) {
    if (!current.has(part)) return [];
    current = current.get(part);
  }

  return current.get('__skills__') || [];
}

const flatTree = computed(() => {
  const dirs = [];

  function traverse(tree, depth = 0, pathPrefix = '') {
    for (const [key, value] of tree.entries()) {
      if (key === '__skills__') continue;

      const currentPath = pathPrefix ? `${pathPrefix}/${key}` : key;
      const isExpanded = expandedPaths.has(currentPath);

      dirs.push({
        name: key,
        path: currentPath,
        depth,
        expanded: isExpanded,
        skillCount: countSkills(value),
      });

      if (isExpanded) {
        traverse(value, depth + 1, currentPath);
      }
    }
  }

  traverse(directoryTree.value);
  return dirs;
});

function getPaddingLeft(depth) {
  return `${depth * 16 + 8}px`;
}

function getSkillPaddingLeft(depth) {
  return `${(depth + 1) * 16 + 24}px`;
}
</script>

<template>
  <div class="directory-tree">
    <div v-if="store.filtered.length === 0" class="empty-tree">
      <p>没有找到匹配的技能</p>
    </div>

    <template v-else>
      <!-- Directory structure -->
      <div v-for="dir in flatTree" :key="dir.path" class="tree-item">
        <button
          class="tree-dir"
          :style="{ paddingLeft: getPaddingLeft(dir.depth) }"
          :class="{ expanded: dir.expanded, selected: dir.path === selectedPath }"
          @click="selectPath(dir.path)"
          @dblclick="togglePath(dir.path)"
          :title="`单击选择，双击展开`"
        >
          <span class="tree-arrow">{{ dir.expanded ? '▼' : '▶' }}</span>
          <span class="tree-icon">📁</span>
          <span class="tree-name">{{ dir.name }}</span>
          <span class="tree-count">{{ dir.skillCount }}</span>
        </button>

        <!-- Skills in this directory -->
        <div v-if="dir.expanded" class="tree-skills">
          <button
            v-for="skill in getSkillsInPath(dir.path)"
            :key="skill.id"
            class="tree-skill-item"
            :style="{ paddingLeft: getSkillPaddingLeft(dir.depth) }"
            :class="{ active: skill.id === store.selectedId }"
            @click.stop="store.loadDetail(skill.id)"
            :title="skill.description"
          >
            <span class="tree-icon">📄</span>
            <span class="tree-name">{{ skill.name }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.directory-tree {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  font-size: 13px;
  user-select: none;
}

.tree-item {
  display: flex;
  flex-direction: column;
}

.tree-dir {
  padding: 6px 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  text-align: left;
  color: inherit;
  transition: background-color 0.1s ease;
  width: 100%;
  justify-content: flex-start;
}

.tree-dir:hover {
  background: #f0f0f0;
}

.tree-dir.selected {
  background: #e8f4f8;
  color: #0d5a7c;
  font-weight: 500;
}

.tree-arrow {
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  font-size: 10px;
  color: #666;
}

.tree-icon {
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  font-size: 12px;
}

.tree-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.tree-count {
  margin-left: auto;
  padding: 0 4px;
  background: #e8e8e8;
  border-radius: 2px;
  font-size: 10px;
  color: #666;
  flex-shrink: 0;
}

.tree-skills {
  display: flex;
  flex-direction: column;
}

.tree-skill-item {
  padding: 6px 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  text-align: left;
  color: inherit;
  transition: background-color 0.1s ease;
  width: 100%;
  justify-content: flex-start;
}

.tree-skill-item:hover {
  background: #f5f5f5;
}

.tree-skill-item.active {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.empty-tree {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #999;
  font-size: 12px;
}
</style>
