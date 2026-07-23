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

      <div class="reset-timer-info">
        <span class="reset-time-badge">01:00 重置: {{ resetCountDownText }}</span>
      </div>
    </div>

    <!-- Boss 选项按钮 -->
    <div class="boss-option-selector">
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
      <button
        class="boss-option-btn"
        :class="{ active: globalBossId === 'yu' }"
        @click="selectBoss('yu')"
      >
        <span>🐟 魚頭/海怒斯</span>
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

        <!-- 截图上传识别 -->
        <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
          <button
            v-if="!isOcrLoading"
            class="monitor-action-btn monitor-btn-amber"
            style="height:28px; font-size:11px; padding:0 10px;"
            @click="($refs.channelScreenshotInput as HTMLInputElement)?.click()"
          >
            📸 上传截图识别频道
          </button>

          <span v-else style="font-size:11px; color:#fbbf24; font-weight:700; animation: pulse 1.5s infinite;">
            ⏳ 正在读取频道画面，请稍候...
          </span>

          <input
            ref="channelScreenshotInput"
            type="file"
            accept="image/*"
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
          :class="{ 'ready-card': item.remainingSec <= 0 && item.started, 'cooldown-card': item.cooldown }"
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

    <!-- 底部：游戏屏幕 AI 识别捕获面板 (常驻展开，取消折叠隐藏) -->
    <div class="screen-monitor-panel">
      <div class="panel-header-toggle" style="cursor:default;">
        <div class="panel-header-title">
          <span>🎥 游戏屏幕 AI 自动监测 (自动锁频道 / 血条检测 / 频道校准)</span>
          <span v-if="isScanning" class="scan-live-badge">● 正在 AI 监控中</span>
        </div>
      </div>

      <div class="panel-content-body">
        <div class="monitor-controls" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:10px;">
          <button v-if="!isScanning" class="monitor-action-btn monitor-btn-green" @click="startScreenMonitor">
            🎥 绑定窗口
          </button>
          <button v-else class="monitor-action-btn monitor-btn-red" @click="stopScreenMonitor">
            ⏹️ 停止
          </button>

          <button v-if="isScanning" class="monitor-action-btn monitor-btn-amber" @click="ocrChannelPanelNow">
            📸 校准频道
          </button>

          <div v-if="isScanning" style="display:flex; align-items:center; gap:4px; background:rgba(0,0,0,0.4); padding:4px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.15);">
            <span style="font-size:11px; color:#94a3b8; font-weight:700; white-space:nowrap;">锁定CH:</span>
            <input
              type="number"
              v-model.number="boundChannelNum"
              placeholder="1405"
              style="width:56px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25); color:#fff; font-weight:900; text-align:center; border-radius:4px; font-size:12px; padding:3px 4px;"
            />
          </div>
          <span v-if="isScanning && boundChannelNum" style="font-size:11px; color:#34d399; font-weight:700;">🔒 CH {{ boundChannelNum }}</span>
        </div>

        <div v-if="monitorStatus" class="monitor-status-text">
          {{ monitorStatus }}
        </div>

        <div class="monitor-preview-container" v-show="isScanning">
          <video ref="videoRef" autoplay playsinline muted class="monitor-video-preview"></video>
          <canvas ref="canvasRef" style="display: none;"></canvas>

          <div v-if="isScanning" class="hp-bar-bounding-box" :class="{ 'hp-detected': isHpBarPresent }">
            <span class="bounding-box-tag">
              🎯 游戏顶端 BOSS 血条锁定区 {{ isHpBarPresent ? '【全自动血量跟踪中】' : '【未发现 Boss 血条】' }}
            </span>
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
const globalBossId = ref<string>('hai'); // 默认寒霜冰龙
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

onMounted(() => {
  window.addEventListener('ocr-debug-image', (e: Event) => {
    ocrDebugImage.value = (e as CustomEvent).detail;
  });
});

async function onScreenshotUploaded(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  isOcrLoading.value = true;
  screenshotOcrStatus.value = '⏳ 正在加载图片并识别频道号...';

  try {
    // 把图片画到一个临时 canvas 上
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

    // 图像 1：正常灰度（用于捕获浅色背景的频道，如 CH.2, CH.5）
    const canvasNormal = document.createElement('canvas');
    canvasNormal.width = w; canvasNormal.height = h;
    const ctx1 = canvasNormal.getContext('2d');
    if (ctx1) {
      ctx1.imageSmoothingEnabled = true;
      // 提升 150% 亮度，把浅灰色背景直接推到纯白，黑字 (0) 保持纯黑。
      ctx1.filter = 'grayscale(100%) brightness(150%) contrast(150%)';
      ctx1.drawImage(img, 0, 0, w, h);
    }

    // 图像 2：反相灰度（用于捕获深色/高亮背景的频道，如 CH.9, CH.12, CH.16, CH.28）
    const canvasInvert = document.createElement('canvas');
    canvasInvert.width = w; canvasInvert.height = h;
    const ctx2 = canvasInvert.getContext('2d');
    if (ctx2) {
      ctx2.imageSmoothingEnabled = true;
      // 黑科技核心：CH.9 的深灰色背景反相后，会变成偏暗的灰色 (比如 105)。
      // 如果直接交给 Tesseract，Otsu 全局阈值会把它和文字 (0) 一起判定为黑色，导致画面丢失。
      // 因此必须先用 brightness(200%) 将它推过 128 中值，再用 contrast 将其彻底变白！文字因为是 0，乘法后依然是 0。
      ctx2.filter = 'grayscale(100%) invert(100%) brightness(200%) contrast(150%)';
      ctx2.drawImage(img, 0, 0, w, h);
    }

    // 更新调试图像（展示拼接效果供人工查看）
    const debugCanvas = document.createElement('canvas');
    debugCanvas.width = w; debugCanvas.height = h * 2;
    const debugCtx = debugCanvas.getContext('2d');
    if (debugCtx) {
      debugCtx.drawImage(canvasNormal, 0, 0);
      debugCtx.drawImage(canvasInvert, 0, h);
      window.dispatchEvent(new CustomEvent('ocr-debug-image', { detail: debugCanvas.toDataURL('image/jpeg') }));
    }

    screenshotOcrStatus.value = '🔍 已生成多重曝光视图，正在启动 AI 引擎分离识别...';

    // @ts-ignore
    const TesseractLib = window.Tesseract;
    if (!TesseractLib) {
      screenshotOcrStatus.value = '⚠️ Tesseract OCR 引擎未加载，请刷新页面';
      return;
    }

    const worker = await TesseractLib.createWorker('eng');
    await worker.setParameters({
      tessedit_char_whitelist: 'CHch.0123456789/<>: ',
      tessedit_pageseg_mode: '11',
    });

    screenshotOcrStatus.value = '🔍 正在扫描浅色底频道 (1/2)...';
    const ret1 = await worker.recognize(canvasNormal);
    
    screenshotOcrStatus.value = '🔍 正在扫描深色底频道 (2/2)...';
    const ret2 = await worker.recognize(canvasInvert);

    await worker.terminate();

    const rawText = ret1.data.text + ' \n ' + ret2.data.text;
    screenshotOcrStatus.value = `OCR 原文合并: "${rawText.substring(0, 200).replace(/\n/g, ' ')}"`;

    // 提取频道号
    const regex = /(?:[Cc<>]?[.\s_-]*[Hh])[.\s_-]*(\d{1,5})/gi;
    const matches = [...rawText.matchAll(regex)];
    const gameChannels = new Set<number>();
    
    matches.forEach((m) => {
      const val = parseInt(m[1], 10);
      if (!isNaN(val) && val >= 1 && val <= 99999) {
        gameChannels.add(val);
      }
    });

    if (gameChannels.size > 0) {
      const allNumbers = [...gameChannels].sort((a, b) => a - b);
      let filteredNumbers = [...allNumbers];

      // 核心算法：一张截图最多显示 25 个频道，因此合法频段一定紧密贴合中位数。
      // 自动循环剥离头部与尾部与中位数偏离离谱的数字（如误将人数 3/25 误读成 55788 或 5/7）
      while (filteredNumbers.length > 1) {
        const mid = Math.floor(filteredNumbers.length / 2);
        const median = filteredNumbers[mid];
        
        const headDiff = median - filteredNumbers[0];
        const tailDiff = filteredNumbers[filteredNumbers.length - 1] - median;
        
        // 单张截图最多 25 个频道，一页内频道的合理跨度绝不会超过 200
        if (headDiff > 200 || tailDiff > 200) {
          if (headDiff >= tailDiff && headDiff > 200) {
            filteredNumbers.shift(); // 自动忽略头部离谱数字 (例如 CH.5, CH.7)
          } else if (tailDiff > 200) {
            filteredNumbers.pop(); // 自动忽略尾部离谱数字 (例如 CH.55788, CH.36725)
          } else {
            break;
          }
        } else {
          break; // 头尾均处于合理区间
        }
      }

      if (filteredNumbers.length === 0) filteredNumbers = allNumbers;

      const start = filteredNumbers[0];
      const end = filteredNumbers[filteredNumbers.length - 1];

      matrixStartCh.value = start;
      matrixEndCh.value = end;
      saveChannelRange();

      const validChannels = filteredNumbers;

      // 在范围内，删除不存在的频道
      let removedCount = 0;
      hiddenChannels.value = [];
      for (let c = start; c <= end; c++) {
        if (!validChannels.includes(c)) {
          hiddenChannels.value.push(c);
          removedCount++;
        }
      }
      saveHiddenChannels();

      screenshotOcrStatus.value = `🤖 AI 已自动决定频道范围 CH.${start}~CH.${end}！已识别到 ${validChannels.length} 个真实频道 (${validChannels.map(c => 'CH.' + c).join(', ')})，并去除了 ${removedCount} 个空缺/噪点频道。`;
      triggerToast(`✅ 自动决定范围 CH.${start}~CH.${end}`);
    } else {
      screenshotOcrStatus.value = `⚠️ 未识别到频道号。OCR原文: "${rawText.substring(0, 200)}"。请截取完整的 CHANGE CHANNEL 弹窗。`;
    }
  } catch (e: any) {
    screenshotOcrStatus.value = `⚠️ 识别失败: ${e?.message || '未知错误'}`;
    triggerToast(`⚠️ 识别失败: ${e?.message || '未知错误'}`);
  } finally {
    isOcrLoading.value = false;
    if (input) input.value = '';
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
  // 加入隐藏黑名单，频道从矩阵中彻底消失
  if (!hiddenChannels.value.includes(chNum)) {
    hiddenChannels.value.push(chNum);
    saveHiddenChannels();
  }
  saveLocalChannels();
  triggerToast(`CH ${chNum} 已删除`);
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

const matrixChannelList = computed(() => {
  const start = Math.max(1, matrixStartCh.value || 1);
  let end = Math.max(start, matrixEndCh.value || start);
  if (end - start > 400) end = start + 400;
  const list: number[] = [];
  for (let c = start; c <= end; c++) {
    if (!hiddenChannels.value.includes(c)) {
      list.push(c);
    }
  }
  return list;
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

// 🎥 游戏屏幕 AI 监测
function startScreenMonitor() {
  if (!navigator || !navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
    const msg = '⚠️ 当前浏览器或协议不支持窗口截图（需要使用 Chrome / Edge 电脑版浏览器，并使用 HTTPS 安全域名访问）';
    monitorStatus.value = msg;
    alert(msg);
    return;
  }

  monitorStatus.value = '⏳ 正在拉起浏览器权限... 请在屏幕顶部弹出的窗口中选择【枫之谷游戏窗口】！';

  // 使用最标准、无障碍兼容的 { video: true }
  navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false
  }).then(async (stream) => {
    mediaStream = stream;
    await nextTick();
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      videoRef.value.play().catch(() => {});
    }
    isScanning.value = true;
    monitorStatus.value = '🎯 游戏窗口绑定成功！正在自动识别当前频道并监测 Boss 血条。';

    stream.getVideoTracks()[0].onended = () => {
      stopScreenMonitor();
    };

    if (scanTimer) clearInterval(scanTimer);
    scanTimer = setInterval(() => {
      captureAndAnalyzeFrame();
    }, 1200);

    if (channelOcrTimer) clearInterval(channelOcrTimer);
    channelOcrTimer = setInterval(() => {
      autoDetectCurrentChannel();
    }, 2500);
    autoDetectCurrentChannel();
  }).catch((err: any) => {
    isScanning.value = false;
    if (err && err.name === 'NotAllowedError') {
      monitorStatus.value = '⚠️ 您取消了窗口选择。请再次点击按钮，并在浏览器上方弹窗里点击【共享/允许】。';
    } else {
      const errMsg = `⚠️ 窗口绑定失败: ${err?.message || '请确保使用 Chrome/Edge 电脑版浏览器并在 HTTPS 下访问'}`;
      monitorStatus.value = errMsg;
      alert(errMsg);
    }
  });
}

function stopScreenMonitor() {
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
  if (channelOcrTimer) {
    clearInterval(channelOcrTimer);
    channelOcrTimer = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  isScanning.value = false;
  monitorStatus.value = 'AI 画面监测已停止';
}

function captureAndAnalyzeFrame() {
  if (!videoRef.value || !canvasRef.value) return;
  const video = videoRef.value;
  const canvas = canvasRef.value;
  if (video.videoWidth === 0 || video.videoHeight === 0) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const startY = Math.floor(canvas.height * 0.01);
  const endY = Math.floor(canvas.height * 0.14);
  const startX = Math.floor(canvas.width * 0.05);
  const endX = Math.floor(canvas.width * 0.95);
  const width = endX - startX;
  const height = endY - startY;

  try {
    const imgData = ctx.getImageData(startX, startY, width, height);
    const data = imgData.data;
    let redPixelCount = 0;
    const totalSampledPixels = (width * height) / 4;

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 120 && r > g * 1.35 && r > b * 1.35) {
        redPixelCount++;
      }
    }

    const redRatio = redPixelCount / (totalSampledPixels / 4);
    const hpDetected = redRatio > 0.015;
    isHpBarPresent.value = hpDetected;

    if (wasHpBarPresent && !hpDetected) {
      hpBarDisappearCount++;
      if (hpBarDisappearCount >= 1) {
        onHpBarDisappeared();
        wasHpBarPresent = false;
        hpBarDisappearCount = 0;
      }
    } else if (hpDetected) {
      wasHpBarPresent = true;
      hpBarDisappearCount = 0;
    }
  } catch (e) {}
}

function onHpBarDisappeared() {
  const ch = boundChannelNum.value || 100;
  quickSelectCh(ch);
  monitorStatus.value = `💀 血条消失，已自动判定 CH ${ch}【${currentBossName.value}】被击杀并开启倒计时。`;
}

function getOcrCropRect(mode: 'channel-panel' | 'full') {
  const video = videoRef.value;
  const width = video?.videoWidth || 1280;
  const height = video?.videoHeight || 720;

  if (mode === 'channel-panel') {
    return {
      x: Math.floor(width * 0.02),
      y: Math.floor(height * 0.26),
      width: Math.floor(width * 0.96),
      height: Math.floor(height * 0.6),
    };
  }

  return { x: 0, y: 0, width, height };
}

function drawOcrFrame(mode: OcrMode = 'channel-panel', forcedCrop?: OcrCrop) {
  if (!videoRef.value || !canvasRef.value) {
    return null;
  }

  const video = videoRef.value;
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let crop = forcedCrop || getOcrCropRect(mode === 'current-tile' || mode === 'channel-tile' ? 'channel-panel' : mode);
  if (mode === 'current-tile') {
    const currentCrop = findCurrentChannelTile(crop);
    if (!currentCrop) return null;
    crop = currentCrop;
  }

  const scale = mode === 'current-tile' ? 5 : mode === 'channel-panel' ? 3 : 1;
  canvas.width = crop.width * scale;
  canvas.height = crop.height * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.filter = mode === 'full'
    ? 'contrast(1.3) brightness(1.08) saturate(0.2)'
    : 'contrast(1.75) brightness(1.16) saturate(0.05)';
  ctx.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';
  normalizeOcrCanvas(canvas, mode);
  return canvas;
}

function normalizeOcrCanvas(canvas: HTMLCanvasElement, mode: OcrMode) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let coloredPixels = 0;
  let warmPixels = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    const r = img.data[i];
    const g = img.data[i + 1];
    const b = img.data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min > 45) coloredPixels++;
    if (r > 105 && g > 45 && g < 150 && b > 35 && b < 150 && r > g * 1.06 && r > b * 1.06) {
      warmPixels++;
    }
  }
  const coloredRatio = coloredPixels / Math.max(1, canvas.width * canvas.height);
  const warmRatio = warmPixels / Math.max(1, canvas.width * canvas.height);
  const isColoredTile = mode === 'current-tile' || warmRatio > 0.08 || coloredRatio > 0.12;

  for (let i = 0; i < img.data.length; i += 4) {
    const r = img.data[i];
    const g = img.data[i + 1];
    const b = img.data[i + 2];
    const brightness = (r + g + b) / 3;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;
    const darkInk = brightness < 135;
    const lightInkOnColoredTile = isColoredTile && brightness > 150 && saturation < 80;
    const isInk = mode === 'full' ? darkInk : darkInk || lightInkOnColoredTile;
    const v = isInk ? 0 : 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function findCurrentChannelTile(baseCrop: OcrCrop) {
  if (!videoRef.value || !canvasRef.value) return null;

  const video = videoRef.value;
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = baseCrop.width;
  canvas.height = baseCrop.height;
  ctx.drawImage(video, baseCrop.x, baseCrop.y, baseCrop.width, baseCrop.height, 0, 0, baseCrop.width, baseCrop.height);

  const image = ctx.getImageData(0, 0, baseCrop.width, baseCrop.height);
  let minX = baseCrop.width;
  let minY = baseCrop.height;
  let maxX = 0;
  let maxY = 0;
  let warmPixelCount = 0;

  for (let y = 0; y < baseCrop.height; y += 2) {
    for (let x = 0; x < baseCrop.width; x += 2) {
      const i = (y * baseCrop.width + x) * 4;
      const r = image.data[i];
      const g = image.data[i + 1];
      const b = image.data[i + 2];
      const warmCurrent = r > 105 && g > 45 && g < 145 && b > 40 && b < 145 && r > g * 1.08 && r > b * 1.08;
      const blueTarget = b > 115 && g > 80 && r < 120;
      if (warmCurrent && !blueTarget) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        warmPixelCount++;
      }
    }
  }

  if (warmPixelCount < 60 || minX >= maxX || minY >= maxY) return null;

  const padX = Math.floor(baseCrop.width * 0.02);
  const padY = Math.floor(baseCrop.height * 0.035);
  const tileX = Math.max(0, minX - padX);
  const tileY = Math.max(0, minY - padY);
  const tileWidth = Math.min(baseCrop.width - tileX, maxX - minX + padX * 2);
  const tileHeight = Math.min(baseCrop.height - tileY, maxY - minY + padY * 2);

  const textWidth = Math.floor(tileWidth * 0.7);
  const textHeight = Math.floor(tileHeight * 0.58);
  return {
    x: baseCrop.x + tileX,
    y: baseCrop.y + tileY,
    width: Math.max(40, textWidth),
    height: Math.max(18, textHeight),
  };
}

function getVisibleChannelTileCrops(baseCrop: OcrCrop) {
  const crops: OcrCrop[] = [];
  const columns = 5;
  const rows = 5;
  const gapX = Math.floor(baseCrop.width * 0.012);
  const gapY = Math.floor(baseCrop.height * 0.022);
  const tileWidth = Math.floor((baseCrop.width - gapX * (columns - 1)) / columns);
  const tileHeight = Math.floor((baseCrop.height - gapY * (rows - 1)) / rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = baseCrop.x + col * (tileWidth + gapX);
      const y = baseCrop.y + row * (tileHeight + gapY);
      crops.push({
        x,
        y,
        width: tileWidth,
        height: tileHeight,
      });
    }
  }

  return crops;
}

function extractChannelNumbers(text: string) {
  const channels = new Set<number>();
  const normalized = text
    .replace(/[ＯOo]/g, '0')
    .replace(/[ＩIl|]/g, '1')
    .replace(/[ＺZz]/g, '2')
    .replace(/[ＳSs]/g, '5')
    .replace(/[Ｇg]/g, '6')
    .replace(/[Ｔt]/g, '7')
    .replace(/[Ｂb]/g, '8')
    .replace(/[Ｃｃ]/g, 'C')
    .replace(/[Ｈｈ]/g, 'H');

  // 只匹配明确带 CH 前缀的频道号，不再匹配裸数字，避免把 HP/EXP/人数误识别为频道
  const patterns = [
    /CH[\s:._-]*(\d{3,5})/gi,
    /\bC[Hh][\s:._-]*(\d{3,5})\b/g,
  ];

  const range = getWatchRange();

  patterns.forEach((regex) => {
    const matches = [...normalized.matchAll(regex)];
    matches.forEach((m) => {
      const num = parseInt(m[1], 10);
      if (!isNaN(num) && num >= 1 && num <= 99999) {
        // 只保留在频道范围内的数字，进一步排除噪音
        if (isChannelInWatchRange(num, range)) {
          channels.add(num);
        }
      }
    });
  });

  return [...channels];
}

async function recognizeChannelsFromScreen(mode: OcrMode = 'channel-panel') {
  const frame = drawOcrFrame(mode);
  if (!frame) return { channels: [] as number[], text: '' };

  // @ts-ignore
  const TesseractLib = window.Tesseract;
  if (!TesseractLib) {
    throw new Error('Tesseract OCR 引擎未加载，请刷新页面重试');
  }

  const worker = await TesseractLib.createWorker('eng');
  await worker.setParameters({
    tessedit_char_whitelist: 'CHch.0123456789',
    tessedit_pageseg_mode: mode === 'current-tile' ? '7' : '6',
  });
  const ret = await worker.recognize(frame);
  await worker.terminate();

  const text = ret.data.text || '';
  return {
    channels: extractChannelNumbers(text),
    text,
  };
}

async function recognizeChannelTilesFromScreen() {
  if (!videoRef.value || !canvasRef.value) return { channels: [] as number[], text: '' };

  // @ts-ignore
  const TesseractLib = window.Tesseract;
  if (!TesseractLib) {
    throw new Error('Tesseract OCR 引擎未加载，请刷新页面重试');
  }

  const baseCrop = getOcrCropRect('channel-panel');
  const tileCrops = getVisibleChannelTileCrops(baseCrop);
  const worker = await TesseractLib.createWorker('eng');
  await worker.setParameters({
    tessedit_char_whitelist: 'CHch.0123456789',
    tessedit_pageseg_mode: '7',
  });

  const channels = new Set<number>();
  const texts: string[] = [];
  for (const tileCrop of tileCrops) {
    const textCrop = {
      x: tileCrop.x + Math.floor(tileCrop.width * 0.04),
      y: tileCrop.y + Math.floor(tileCrop.height * 0.08),
      width: Math.floor(tileCrop.width * 0.55),
      height: Math.floor(tileCrop.height * 0.42),
    };
    const frame = drawOcrFrame('channel-tile', textCrop);
    if (!frame) continue;
    const ret = await worker.recognize(frame);
    const text = ret.data.text || '';
    texts.push(text.trim());
    extractChannelNumbers(text).forEach((ch) => channels.add(ch));
  }

  await worker.terminate();
  return {
    channels: [...channels],
    text: texts.join(' '),
  };
}

function lockDetectedChannel(ch: number) {
  if (!ch || ch <= 0) return;
  const previous = boundChannelNum.value;
  boundChannelNum.value = ch;
  if (previous !== ch) {
    monitorStatus.value = `🔒 已从游戏画面自动锁定当前频道 CH ${ch}。打死 Boss 后会自动给 CH ${ch} 开倒计时。`;
  }
}

async function autoDetectCurrentChannel() {
  if (!isScanning.value || isChannelOcrRunning) return;
  if (Date.now() - lastChannelOcrAt < 2200) return;

  isChannelOcrRunning = true;
  lastChannelOcrAt = Date.now();
  try {
    const currentResult = await recognizeChannelsFromScreen('current-tile');
    const channels = currentResult.channels;
    if (channels.length === 0) return;

    const range = getWatchRange();
    const inRange = channels.filter((ch) => isChannelInWatchRange(ch, range));
    const candidate = inRange.length > 0 ? inRange[inRange.length - 1] : channels[channels.length - 1];
    lockDetectedChannel(candidate);
  } catch (e) {
    // 自动识别失败时不打断血条监测，手动校准按钮会显示具体错误。
  } finally {
    isChannelOcrRunning = false;
  }
}

function getWatchRange() {
  const start = Math.max(1, matrixStartCh.value || 1);
  const end = Math.max(start, matrixEndCh.value || start);
  return {
    start,
    end,
    expandedStart: start < 1000 && end < 1000 ? start * 10 : start,
    expandedEnd: start < 1000 && end < 1000 ? end * 10 + 9 : end,
    compact: start < 1000 && end < 1000,
  };
}

function isChannelInWatchRange(ch: number, range = getWatchRange()) {
  return (ch >= range.start && ch <= range.end) || (ch >= range.expandedStart && ch <= range.expandedEnd);
}

function applyChannelCalibration(gameChannels: number[]) {
  const range = getWatchRange();
  const start = range.start;
  const end = range.end;
  const rangeChannels: number[] = [];
  for (let c = start; c <= end; c++) rangeChannels.push(c);

  const recognizedInRange = new Set(gameChannels.filter((ch) => isChannelInWatchRange(ch, range)));
  recognizedInRange.forEach((ch) => {
    validChannelVotes.set(ch, (validChannelVotes.get(ch) || 0) + 1);
    missingChannelVotes.delete(ch);
  });

  let removedCount = 0;
  if (!range.compact) {
    rangeChannels.forEach((ch) => {
      if (recognizedInRange.has(ch) || hiddenChannels.value.includes(ch)) return;
      const nextVotes = (missingChannelVotes.get(ch) || 0) + 1;
      missingChannelVotes.set(ch, nextVotes);

      if (nextVotes >= 2 && validChannelVotes.has(ch)) {
        hiddenChannels.value.push(ch);
        missingChannelVotes.delete(ch);
        validChannelVotes.delete(ch);
        removedCount++;
      }
    });
  }

  if (removedCount > 0) saveHiddenChannels();
  return {
    removedCount,
    recognizedCount: recognizedInRange.size,
    rawRecognizedCount: gameChannels.length,
    start,
    end,
    compact: range.compact,
    expandedStart: range.expandedStart,
    expandedEnd: range.expandedEnd,
  };
}

// 📸 识别游戏换线面板，对比当前频道范围，保守删除多次确认不存在的频道
async function ocrChannelPanelNow() {
  if (!videoRef.value || !canvasRef.value) {
    monitorStatus.value = '⚠️ 请先绑定游戏窗口';
    return;
  }

  monitorStatus.value = '📸 正在校准游戏换线面板频道，请保持 CHANGE CHANNEL 窗口在画面中间...';

  try {
    const currentResult = await recognizeChannelsFromScreen('current-tile');
    if (currentResult.channels.length > 0) {
      lockDetectedChannel(currentResult.channels[currentResult.channels.length - 1]);
    }

    const centerResult = await recognizeChannelTilesFromScreen();
    let channels = centerResult.channels;
    let text = centerResult.text;

    if (channels.length === 0) {
      const fullResult = await recognizeChannelsFromScreen('channel-panel');
      channels = fullResult.channels;
      text = fullResult.text;
    }

    if (channels.length > 0) {
      const result = applyChannelCalibration(channels);
      const rangeText = result.compact
        ? `范围 CH ${result.start}~${result.end}（自动按 CH ${result.expandedStart}~${result.expandedEnd} 匹配四位频道）`
        : `范围 CH ${result.start}~${result.end}`;
      monitorStatus.value = `🎉 原始识别到 ${result.rawRecognizedCount} 个频道，匹配范围内 ${result.recognizedCount} 个。${rangeText}。为避免误删，频道需连续两次确认；本次删除 ${result.removedCount} 个。`;
    } else {
      monitorStatus.value = `⚠️ 未检测到频道号。OCR 原文: "${text.substring(0, 150)}"。请确保游戏内已打开 CHANGE CHANNEL 窗口且画面清晰。`;
    }
  } catch (e: any) {
    monitorStatus.value = `⚠️ 识别异常: ${e?.message || '未知错误'}，请确保画面清晰后重试`;
  }
}

let timerInterval: any = null;

onMounted(() => {
  loadChannelRange();
  loadLocalChannels();
  loadHiddenChannels();

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
  stopScreenMonitor();
});
</script>
