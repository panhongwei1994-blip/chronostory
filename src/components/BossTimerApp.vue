<template>
  <div id="app-container">

    <!-- 标头 -->
    <header class="header-banner">
      <div class="header-tag">MAPLESTORY TIMER</div>
      <h1 class="header-title">BOSS 刷新倒计时</h1>
    </header>

    <!-- 服务器选择与 01:00 重置 -->
    <div class="server-bar" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:space-between;">
      <div class="server-selector">
        <button
          class="server-btn"
          :class="{ active: activeServer === 'asia' }"
          @click="selectServer('asia')"
        >
          🌏 亚服
        </button>
        <button
          class="server-btn"
          :class="{ active: activeServer === 'na' }"
          @click="selectServer('na')"
        >
          🗽 美服
        </button>
      </div>

      <div class="cmd-copy-bar">
        <button
          @click="copyCommand('/bossrespawn')"
          style="height:28px; font-size:11px; padding:0 10px; background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; cursor:pointer; font-weight:700; display:flex; align-items:center; gap:5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
          title="点击一键复制指令，在游戏聊天框输入查看Boss刷新剩余时间"
        >
          📋 <span style="font-family:monospace; font-weight:900; letter-spacing:0.5px;">/bossrespawn</span> <span style="opacity:0.8; font-size:10px;">(一键复制)</span>
        </button>
      </div>
    </div>

    <!-- Boss 选项按钮 -->
    <div class="boss-option-selector">
      <button
        class="boss-option-btn"
        :class="{ active: globalBossId === 'yu' }"
        @click="selectBoss('yu')"
      >
        <span>🐟 魚頭/海怒斯</span>
        <span class="time-hint">30 分钟刷新</span>
      </button>
      <button
        class="boss-option-btn"
        :class="{ active: globalBossId === 'hai' }"
        @click="selectBoss('hai')"
      >
        <span>🐉 寒霜冰龍</span>
        <span class="time-hint">10 分钟刷新</span>
      </button>
      <button
        class="boss-option-btn"
        :class="{ active: globalBossId === 'hei' }"
        @click="selectBoss('hei')"
      >
        <span>🦍 葛雷黑金剛</span>
        <span class="time-hint">30 分钟刷新</span>
      </button>
    </div>

    <!-- ⚔️ 频道范围自订动态点选矩阵卡片墙 -->
    <div class="ch-matrix-card" style="margin-bottom: 16px; background:rgba(15, 23, 42, 0.6); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px 14px;">
      <div style="font-size:13px; font-weight:800; color:#60a5fa; margin-bottom:10px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px;">
        <span>⚔️ 频道看守矩阵 (点击一键开启【{{ currentBossName }}】倒计时)</span>
        
        <!-- 自定义频道范围填空 -->
        <div style="display:flex; align-items:center; gap:6px; background:rgba(0,0,0,0.4); padding:3px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.15);">
          <span style="font-size:11px; color:#cbd5e1; font-weight:700;">频道范围: CH</span>
          <input
            type="number"
            v-model.number="matrixStartCh"
            style="width:54px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25); color:#fff; font-weight:900; text-align:center; border-radius:4px; font-size:11px; padding:2px 4px;"
            placeholder="100"
            @change="saveChannelRange"
          />
          <span style="color:#94a3b8; font-size:11px; font-weight:700;">至 CH</span>
          <input
            type="number"
            v-model.number="matrixEndCh"
            style="width:54px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25); color:#fff; font-weight:900; text-align:center; border-radius:4px; font-size:11px; padding:2px 4px;"
            placeholder="130"
            @change="saveChannelRange"
          />
        </div>

        <!-- 截图上传识别双选项按钮 -->
        <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
          <template v-if="!isOcrLoading">
            <button
              class="monitor-action-btn monitor-btn-amber"
              style="height:28px; font-size:11px; padding:0 10px; cursor:pointer;"
              @click="triggerUpload('fresh')"
              title="全新时间段/新画面：删除旧频道，仅基于新截图建立阵列"
            >
              ✨ 全新频道 (覆盖建立)
            </button>
            <button
              class="monitor-action-btn"
              style="height:28px; font-size:11px; padding:0 10px; background:linear-gradient(135deg, #059669, #10b981); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:6px; font-weight:700; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.2);"
              @click="triggerUpload('append')"
              title="同时间段多页翻页：保留现有频道，追加扩展更多频道"
            >
              ➕ 追加更多 (翻页扩展)
            </button>
          </template>

          <span v-else style="font-size:11px; color:#fbbf24; font-weight:700; animation: pulse 1.5s infinite;">
            ⏳ 正在读取频道画面，请稍候...
          </span>

          <input
            ref="channelScreenshotInput"
            type="file"
            accept="image/*"
            multiple
            style="display:none;"
            @change="onScreenshotUploaded"
          />
        </div>
      </div>

      <!-- 动态自适应网格矩阵 (左键一键报时，右键一键删除频道) -->
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); gap:6px;">
        <button
          v-for="ch in matrixChannelList"
          :key="ch"
          class="ch-matrix-item-btn"
          :class="getChMatrixClass(ch)"
          @click="quickSelectCh(ch)"
          @touchstart="onTouchStart(ch)"
          @touchend="onTouchEnd"
          @touchmove="onTouchEnd"
          @contextmenu.prevent="cancelChMatrix(ch)"
          :title="`点击开启/重置倒计时，电脑右键或手机长按删除CH ${ch}频道`"
        >
          <span style="font-size:11px; font-weight:900;">CH {{ ch }}</span>
          <span v-if="getChMatrixTimeText(ch)" style="font-size:9px; opacity:0.9; margin-top:2px;">{{ getChMatrixTimeText(ch) }}</span>
        </button>
      </div>
    </div>

    <!-- ✍️ 原版经典配色设计 - 手动指定频道号提交表单 -->
    <div class="channel-submit-form" style="margin-bottom: 16px;">
      <div class="submit-form-label">✍️ 手动指定频道号提交</div>
      <div class="submit-form-row">
        <div class="submit-input-group">
          <span class="submit-input-prefix">CH</span>
          <input
            type="number"
            class="submit-channel-input"
            v-model.number="newChannelNum"
            placeholder="频道号"
            @keyup.enter="submitNewChannel"
          />
        </div>

        <div class="submit-minutes-group">
          <span class="submit-minutes-prefix">⏱️ 分钟</span>
          <input
            type="number"
            class="submit-minutes-input"
            v-model.number="customMinutes"
            :placeholder="`默认 ${currentBossMinutes}`"
            @keyup.enter="submitNewChannel"
          />
        </div>

        <button class="btn-submit-channel" @click="submitNewChannel">
          🚀 提交看守
        </button>
      </div>
      <div v-if="submitError" class="submit-error-msg">{{ submitError }}</div>
    </div>

    <!-- 看守信息控制栏 -->
    <div class="control-bar" style="margin-bottom:16px;">
      <div style="display:flex; flex-direction:column; gap:2px;">
        <span style="font-size:14px; font-weight:900; color:var(--maple-blue-dark);">
          🎯 当前 Boss: {{ currentBossName }} (刷新率: {{ currentBossMinutes }}分钟)
        </span>
        <span style="font-size:12px; color:var(--text-muted); font-weight:700;">
          正在倒计时看守 <strong style="color:var(--maple-red);">{{ activeCountingChannels.length }}</strong> 个频道
        </span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <button class="btn-clear-channels" @click="clearAllChannels">
          🗑️ 清空所有倒计时
        </button>
        <label class="toggle-switch">
          <input type="checkbox" v-model="soundEnabled" />
          <span>🔔 响铃</span>
        </label>
      </div>
    </div>

    <!-- 📌 正在看守倒计时中的频道快查列表 (若有) -->
    <div v-if="activeCountingChannels.length > 0" style="margin-bottom: 20px;">
      <div style="font-size:13px; font-weight:800; color:#38bdf8; margin-bottom:8px;">
        📌 正在看守倒计时列表
      </div>
      <div class="timer-grid">
        <div
          v-for="item in activeCountingChannels"
          :key="item.id"
          class="channel-card"
          :class="{
            'ready-card': item.remainingSec <= 0 && item.started,
            'about-ready-card': item.remainingSec > 0 && item.remainingSec <= 120 && item.started,
            'cooldown-card': item.cooldown
          }"
          @click="onCardClick(item)"
        >
          <div class="card-main-content">
            <div class="channel-title">
              <span>CH {{ item.channelNum || '?' }}</span>
            </div>

            <div style="text-align:center; flex:1;">
              <div class="timer-digits-text">
                {{ item.cooldown ? '⚔️ 击杀确认...' : (item.remainingSec <= 0 ? '🚨⚡ BOSS已复活！' : formatSeconds(item.remainingSec)) }}
              </div>
              <div>
                <span
                  class="status-badge-text"
                  :class="item.cooldown ? 'status-cooldown' : (item.remainingSec <= 0 ? 'status-ready' : 'status-counting')"
                >
                  {{ item.cooldown ? '💀 确认击杀中...' : (item.remainingSec <= 0 ? '🔥 复活·快打' : '⏳ 倒计时中') }}
                </span>
              </div>
            </div>

            <div class="card-action-bar" @click.stop>
              <button class="btn-mini-reset" @click.stop="triggerTimer(item)">
                ⚔️ 重置
              </button>
              <button class="btn-mini-del" @click.stop="deleteChannel(item.id)">
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

// 全局 Toast 提示函数
function triggerToast(msg: string) {
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.9);color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);opacity:0;transition:opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);pointer-events:none;text-align:center;max-width:90vw;word-break:break-word;';
  toast.style.transform = 'translate(-50%, -20px)';
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
  });
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
import { getServerTimeInfo, type ServerRegion } from '../utils/timezone';

export interface TeamChannelItem {
  id: string;
  channelNum: number | null;
  bossId: string;
  bossName: string;
  targetEndTime: number;
  totalSec: number;
  remainingSec: number;
  started: boolean;
  cooldown?: boolean;
}

// 状态
const activeServer = ref<ServerRegion>('asia');
const globalBossId = ref<string>('yu'); // 默认鱼头/海怒斯
const soundEnabled = ref<boolean>(false);
const nowMs = ref<number>(Date.now());
const newChannelNum = ref<number | null>(null);
const customMinutes = ref<number | null>(null);
const submitError = ref<string>('');
const showMonitorPanel = ref<boolean>(false);

// 频道范围 (例如 100 至 130)
const matrixStartCh = ref<number>(100);
const matrixEndCh = ref<number>(130);

// 📸 截图识别状态
const screenshotOcrStatus = ref<string>('');
const channelScreenshotInput = ref<HTMLInputElement | null>(null);
const ocrDebugImage = ref<string>('');
const isOcrLoading = ref<boolean>(false);
const lastOcrTime = ref<number>(0);
const currentOcrMode = ref<'fresh' | 'append'>('fresh');

function triggerUpload(mode: 'fresh' | 'append') {
  currentOcrMode.value = mode;
  if (channelScreenshotInput.value) {
    channelScreenshotInput.value.click();
  }
}

onMounted(() => {
  window.addEventListener('ocr-debug-image', (e: Event) => {
    ocrDebugImage.value = (e as CustomEvent).detail;
  });
});

async function onScreenshotUploaded(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  if (files.length === 0) return;

  await processScreenshotFiles(files);
  if (input) input.value = '';
}

// 核心函数：处理一张或多张频道截图（支持多文件选择、Ctrl+V 粘贴累加）
async function processScreenshotFiles(files: File[]) {
  if (files.length === 0) return;

  isOcrLoading.value = true;
  screenshotOcrStatus.value = `⏳ 正在处理 ${files.length} 张频道截图，请稍候...`;

  try {
    const newlyScannedChannels = new Set<number>();
    let detectedServerName = '';

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const img = new Image();
      const url = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = url;
      });

      const scale = 3;
      const w = img.width * scale;
      const h = img.height * scale;

      const canvasNormal = document.createElement('canvas');
      canvasNormal.width = w; canvasNormal.height = h;
      const ctx1 = canvasNormal.getContext('2d');
      if (ctx1) {
        ctx1.imageSmoothingEnabled = true;
        ctx1.filter = 'grayscale(100%) brightness(150%) contrast(150%)';
        ctx1.drawImage(img, 0, 0, w, h);
      }

      const canvasInvert = document.createElement('canvas');
      canvasInvert.width = w; canvasInvert.height = h;
      const ctx2 = canvasInvert.getContext('2d');
      if (ctx2) {
        ctx2.imageSmoothingEnabled = true;
        ctx2.filter = 'grayscale(100%) invert(100%) brightness(200%) contrast(150%)';
        ctx2.drawImage(img, 0, 0, w, h);
      }

      // @ts-ignore
      const TesseractLib = window.Tesseract;
      if (!TesseractLib) continue;

      const worker = await TesseractLib.createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: 'CHch.0123456789/<>: ASNAEUTokyoOregonPlayers',
        tessedit_pageseg_mode: '11',
      });

      const ret1 = await worker.recognize(canvasNormal);
      const ret2 = await worker.recognize(canvasInvert);
      await worker.terminate();

      const rawText = ret1.data.text + ' \n ' + ret2.data.text;

      // 提取服务器标签信息
      if (/AS|Tokyo/i.test(rawText)) detectedServerName = 'asia';
      else if (/NA|Oregon/i.test(rawText)) detectedServerName = 'na';

      const regex = /(?:[Cc<>]?[.\s_-]*[Hh])[.\s_-]*(\d{1,5})/gi;
      const matches = [...rawText.matchAll(regex)];

      const singleImgChannels: number[] = [];
      matches.forEach((m) => {
        const val = parseInt(m[1], 10);
        if (!isNaN(val) && val >= 1 && val <= 99999) {
          singleImgChannels.push(val);
        }
      });

      // 过滤单张截图中的头尾离群噪点
      if (singleImgChannels.length > 0) {
        const sorted = [...singleImgChannels].sort((a, b) => a - b);
        let filtered = [...sorted];
        while (filtered.length > 1) {
          const mid = Math.floor(filtered.length / 2);
          const median = filtered[mid];
          const headDiff = median - filtered[0];
          const tailDiff = filtered[filtered.length - 1] - median;
          if (headDiff > 200 || tailDiff > 200) {
            if (headDiff >= tailDiff && headDiff > 200) filtered.shift();
            else if (tailDiff > 200) filtered.pop();
            else break;
          } else break;
        }
        if (filtered.length === 0) filtered = sorted;
        filtered.forEach((ch) => newlyScannedChannels.add(ch));
      }
    }

    if (newlyScannedChannels.size > 0) {
      const sortedNew = [...newlyScannedChannels].sort((a, b) => a - b);
      const combinedChannels = new Set<number>();

      // 用户明确选择模式：
      // 'append' (追加更多/翻页扩展) ➔ 保留已有矩阵频道并合并新频道
      // 'fresh' (全新频道/覆盖建立) ➔ 清空旧频道，仅基于新截图重建
      if (currentOcrMode.value === 'append') {
        matrixChannelList.value.forEach((ch) => combinedChannels.add(ch));
        sortedNew.forEach((ch) => combinedChannels.add(ch));
      } else {
        // 全新频道重置：连同手动追加的额外频道一并彻底清空！
        extraCustomChannels.value = [];
        saveExtraChannels();
        sortedNew.forEach((ch) => combinedChannels.add(ch));
      }

      const sortedAll = [...combinedChannels].sort((a, b) => a - b);
      const start = sortedAll[0];
      const end = sortedAll[sortedAll.length - 1];

      matrixStartCh.value = start;
      matrixEndCh.value = end;
      saveChannelRange();

      // 剔除不在任何已识别集合里的缺失频道
      const validChannels = sortedAll;
      hiddenChannels.value = [];
      for (let c = start; c <= end; c++) {
        if (!validChannels.includes(c)) {
          hiddenChannels.value.push(c);
        }
      }
      saveHiddenChannels();

      if (currentOcrMode.value === 'append') {
        triggerToast(`➕ 【翻页扩展成功】已成功追加扩展矩阵！当前共 ${validChannels.length} 个频道 (CH.${start}~CH.${end})`);
      } else {
        triggerToast(`✨ 【全新频道重置】已基于新截图重建矩阵！包含 ${validChannels.length} 个频道 (CH.${start}~CH.${end})`);
      }
    } else {
      triggerToast('⚠️ 未识别到有效频道号，请检查截图');
    }
  } catch (e: any) {
    triggerToast(`⚠️ 识别失败: ${e?.message || '未知错误'}`);
  } finally {
    isOcrLoading.value = false;
  }
}

// 🎥 AI 画面监控核心状态
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isScanning = ref<boolean>(false);
const monitorStatus = ref<string>('');
const boundChannelNum = ref<number | null>(100);
const isHpBarPresent = ref<boolean>(false);

let wasHpBarPresent = false;
let hpBarDisappearCount = 0;
let mediaStream: MediaStream | null = null;
let scanTimer: any = null;
let channelOcrTimer: any = null;
let isChannelOcrRunning = false;
let lastChannelOcrAt = 0;
const missingChannelVotes = new Map<number, number>();
const validChannelVotes = new Map<number, number>();
type OcrMode = 'current-tile' | 'channel-tile' | 'channel-panel' | 'full';
type OcrCrop = { x: number; y: number; width: number; height: number };

const teamChannels = ref<TeamChannelItem[]>([]);

// 已删除抹去的频道黑名单
const hiddenChannels = ref<number[]>([]);

function saveHiddenChannels() {
  try {
    localStorage.setItem(`maple_hidden_channels_${activeServer.value}`, JSON.stringify(hiddenChannels.value));
  } catch (e) {}
}

function loadHiddenChannels() {
  try {
    const raw = localStorage.getItem(`maple_hidden_channels_${activeServer.value}`);
    if (raw) {
      hiddenChannels.value = JSON.parse(raw);
    } else {
      hiddenChannels.value = [];
    }
  } catch (e) {
    hiddenChannels.value = [];
  }
}

function resetHiddenChannels() {
  hiddenChannels.value = [];
  saveHiddenChannels();
}

// 移动端 0.6 秒长按触发删除频道
let longTouchTimer: any = null;

function onTouchStart(chNum: number) {
  if (longTouchTimer) clearTimeout(longTouchTimer);
  longTouchTimer = setTimeout(() => {
    cancelChMatrix(chNum);
  }, 600);
}

function onTouchEnd() {
  if (longTouchTimer) {
    clearTimeout(longTouchTimer);
    longTouchTimer = null;
  }
}

// 电脑端右键或手机端长按删除该频道
function cancelChMatrix(chNum: number) {
  teamChannels.value = teamChannels.value.filter(
    (i) => !(Number(i.channelNum) === Number(chNum) && String(i.bossId) === String(globalBossId.value))
  );

  if (extraCustomChannels.value.includes(chNum)) {
    extraCustomChannels.value = extraCustomChannels.value.filter(c => c !== chNum);
    saveExtraChannels();
  }

  // 加入隐藏黑名单，频道从矩阵中彻底消失
  if (!hiddenChannels.value.includes(chNum)) {
    hiddenChannels.value.push(chNum);
    saveHiddenChannels();
  }
  saveLocalChannels();
  triggerToast(`CH ${chNum} 已删除`);
}

function copyCommand(cmd: string) {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cmd).then(() => {
      triggerToast(`📋 已复制指令 ${cmd} 到剪贴板！`);
    }).catch(() => {
      triggerToast(`📋 指令: ${cmd}`);
    });
  } else {
    triggerToast(`📋 指令: ${cmd}`);
  }
}

const currentBossName = computed(() => {
  if (globalBossId.value === 'hai') return '寒霜冰龍';
  if (globalBossId.value === 'hei') return '葛雷黑金剛';
  if (globalBossId.value === 'yu') return '魚頭/海怒斯';
  return '寒霜冰龍';
});

const currentBossMinutes = computed(() => {
  if (globalBossId.value === 'hai') return 10;
  if (globalBossId.value === 'hei') return 30;
  if (globalBossId.value === 'yu') return 30;
  return 10;
});

const serverInfo = computed(() => getServerTimeInfo(activeServer.value, nowMs.value));
const resetCountDownText = computed(() => formatSeconds(serverInfo.value.secondsUntilReset));

// 正在倒计时的有效频道列表
const activeCountingChannels = computed(() => {
  return [...teamChannels.value]
    .filter((item) => item.bossId === globalBossId.value && item.started)
    .sort((a, b) => a.remainingSec - b.remainingSec);
});

// 额外手动添加的频道列表
const extraCustomChannels = ref<number[]>([]);

function saveExtraChannels() {
  localStorage.setItem(`maple_extra_channels_${activeServer.value}`, JSON.stringify(extraCustomChannels.value));
}

function loadExtraChannels() {
  const raw = localStorage.getItem(`maple_extra_channels_${activeServer.value}`);
  if (raw) {
    try { extraCustomChannels.value = JSON.parse(raw); } catch (e) { extraCustomChannels.value = []; }
  } else {
    extraCustomChannels.value = [];
  }
}

const matrixChannelList = computed(() => {
  const start = Math.max(1, matrixStartCh.value || 1);
  let end = Math.max(start, matrixEndCh.value || start);
  if (end - start > 400) end = start + 400;

  const set = new Set<number>();
  for (let c = start; c <= end; c++) {
    if (!hiddenChannels.value.includes(c)) {
      set.add(c);
    }
  }

  extraCustomChannels.value.forEach((c) => {
    if (!hiddenChannels.value.includes(c)) {
      set.add(c);
    }
  });

  return [...set].sort((a, b) => a - b);
});

function selectBoss(bossId: string) {
  globalBossId.value = bossId;
  triggerToast(`已切换看守 Boss 为【${currentBossName.value}】`);
}

function selectServer(server: ServerRegion) {
  if (activeServer.value === server) return;
  activeServer.value = server;
  loadChannelRange();
  loadLocalChannels();
  const label = server === 'asia' ? '🌏 亚服' : server === 'na' ? '🗽 美服' : '🏰 欧服';
  triggerToast(`已切换服务器为【${label}】`);
}

function saveChannelRange() {
  try {
    localStorage.setItem(`maple_ch_range_${activeServer.value}`, JSON.stringify({
      start: matrixStartCh.value,
      end: matrixEndCh.value
    }));
  } catch (e) {}
}

function loadChannelRange() {
  try {
    const raw = localStorage.getItem(`maple_ch_range_${activeServer.value}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.start && parsed.end) {
        matrixStartCh.value = parsed.start;
        matrixEndCh.value = parsed.end;
        return;
      }
    }
  } catch (e) {}

  if (activeServer.value === 'asia') {
    matrixStartCh.value = 100;
    matrixEndCh.value = 130;
  } else {
    matrixStartCh.value = 100;
    matrixEndCh.value = 130;
  }
}

function saveLocalChannels() {
  try {
    localStorage.setItem(`maple_single_channels_${activeServer.value}`, JSON.stringify(teamChannels.value));
  } catch (e) {}
}

function loadLocalChannels() {
  try {
    const data = localStorage.getItem(`maple_single_channels_${activeServer.value}`);
    if (data) {
      const list: TeamChannelItem[] = JSON.parse(data);
      const now = Date.now();
      teamChannels.value = list.map((item) => {
        if (item.targetEndTime > 0) {
          const left = Math.max(0, Math.floor((item.targetEndTime - now) / 1000));
          return {
            ...item,
            remainingSec: left,
            started: left > 0 ? true : item.started,
          };
        }
        return item;
      });
    } else {
      teamChannels.value = [];
    }
  } catch (e) {
    teamChannels.value = [];
  }
}

function submitNewChannel() {
  submitError.value = '';
  if (!newChannelNum.value || newChannelNum.value <= 0) {
    submitError.value = '请输入有效的频道号（如 105）';
    return;
  }

  const ch = newChannelNum.value;
  const mins = customMinutes.value && customMinutes.value > 0 ? customMinutes.value : currentBossMinutes.value;

  // 保持系统识别的频道范围 (matrixStartCh ~ matrixEndCh) 绝对不变
  // 若该频道在范围之外，单独加入 extraCustomChannels，使它直接挂载在频道阵列中！
  if (ch < matrixStartCh.value || ch > matrixEndCh.value) {
    if (!extraCustomChannels.value.includes(ch)) {
      extraCustomChannels.value.push(ch);
      saveExtraChannels();
    }
  }

  // 若该频道曾被隐藏，自动解除隐藏
  if (hiddenChannels.value.includes(ch)) {
    hiddenChannels.value = hiddenChannels.value.filter(c => c !== ch);
    saveHiddenChannels();
  }

  let item = teamChannels.value.find(
    (i) => i.channelNum === ch && i.bossId === globalBossId.value
  );

  if (!item) {
    item = {
      id: 'ch_' + ch + '_' + globalBossId.value,
      channelNum: ch,
      bossId: globalBossId.value,
      bossName: currentBossName.value,
      targetEndTime: 0,
      totalSec: mins * 60,
      remainingSec: 0,
      started: false,
    };
    teamChannels.value.push(item);
  }

  triggerTimerWithMinutes(item, mins);
  triggerToast(`⚡ 手动提交 CH ${ch} 【${currentBossName.value}】开启 ${mins} 分钟倒计时`);
  newChannelNum.value = null;
  customMinutes.value = null;
}

// 矩阵按钮点击一键开启/重置倒计时 (击杀确认 1 秒)
function quickSelectCh(chNum: number) {
  let item = teamChannels.value.find(
    (i) => i.channelNum === chNum && i.bossId === globalBossId.value
  );

  if (!item) {
    item = {
      id: 'ch_' + chNum + '_' + globalBossId.value,
      channelNum: chNum,
      bossId: globalBossId.value,
      bossName: currentBossName.value,
      targetEndTime: 0,
      totalSec: currentBossMinutes.value * 60,
      remainingSec: 0,
      started: false,
    };
    teamChannels.value.push(item);
  }

  triggerTimerWithMinutes(item, currentBossMinutes.value);
  triggerToast(`⚡ CH ${chNum} 【${currentBossName.value}】开启 ${currentBossMinutes.value} 分钟倒计时`);
}

function getChMatrixItem(chNum: number) {
  return teamChannels.value.find(
    (i) => i.channelNum === chNum && i.bossId === globalBossId.value
  );
}

function getChMatrixClass(chNum: number) {
  const item = getChMatrixItem(chNum);
  if (!item || !item.started) return 'ch-idle';
  if (item.cooldown) return 'ch-cooldown';
  if (item.remainingSec <= 0) return 'ch-ready';
  if (item.remainingSec <= 120) return 'ch-about-ready'; // 🔥 倒计时 <= 2 分钟进入【快刷新微红预警】
  return 'ch-counting';
}

function getChMatrixTimeText(chNum: number): string {
  const item = getChMatrixItem(chNum);
  if (!item || !item.started) return '';
  if (item.cooldown) return '击杀..';
  if (item.remainingSec <= 0) return '已复活';
  return formatSeconds(item.remainingSec);
}

function triggerTimer(item: TeamChannelItem) {
  triggerTimerWithMinutes(item, currentBossMinutes.value);
}

function onCardClick(item: TeamChannelItem) {
  triggerTimerWithMinutes(item, currentBossMinutes.value);
}

function triggerTimerWithMinutes(item: TeamChannelItem, minutes: number) {
  const itemBossId = item.bossId || globalBossId.value;
  const itemBossName = item.bossName || currentBossName.value;
  const sec = minutes * 60;
  const now = Date.now();

  // 0ms 瞬间响应：立刻高亮并开启倒计时
  item.cooldown = false;
  item.bossId = itemBossId;
  item.bossName = itemBossName;
  item.totalSec = sec;
  item.targetEndTime = now + sec * 1000;
  item.remainingSec = sec;
  item.started = true;

  saveLocalChannels();
}

function deleteChannel(id: string) {
  teamChannels.value = teamChannels.value.filter((i) => i.id !== id);
  saveLocalChannels();
  triggerToast('🗑️ 已删除频道记录');
}

function clearAllChannels() {
  teamChannels.value = [];
  saveLocalChannels();
  triggerToast('🗑️ 已清空所有看守频道');
}

function formatSeconds(totalSec: number): string {
  if (totalSec <= 0) return '00:00';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function playAlertSound() {
  if (!soundEnabled.value) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

let timerInterval: any = null;

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items) return;
  const imageFiles: File[] = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      if (file) imageFiles.push(file);
    }
  }
  if (imageFiles.length > 0) {
    processScreenshotFiles(imageFiles);
  }
}

onMounted(() => {
  loadChannelRange();
  loadLocalChannels();
  loadHiddenChannels();
  loadExtraChannels();

  window.addEventListener('paste', handlePaste);

  timerInterval = setInterval(() => {
    const current = Date.now();
    nowMs.value = current;

    teamChannels.value.forEach((item) => {
      if (item.started && item.targetEndTime > 0) {
        const left = Math.max(0, Math.floor((item.targetEndTime - current) / 1000));
        if (item.remainingSec > 0 && left <= 0) {
          playAlertSound();
        }
        item.remainingSec = left;
      }
    });
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  window.removeEventListener('paste', handlePaste);
});
</script>
