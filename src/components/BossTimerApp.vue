<template>
  <div id="app-container">
    <!-- Toast 反馈通知 -->
    <div v-if="toastMsg" class="toast-notification">
      <span>{{ toastMsg }}</span>
    </div>

    <!-- 标头 (恢复标准经典标头) -->
    <header class="header-banner">
      <div class="header-tag">MAPLESTORY BOSS WATCH</div>
      <h1 class="header-title">MAPLESTORY BOSS 刷新倒计时看守看板</h1>
    </header>

    <!-- 服务器、模式选择与 01:00 重置 -->
    <div class="server-bar" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:space-between;">
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
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

        <!-- 模式切换：战队协同 vs 个人单刷 -->
        <div class="mode-selector" style="display:flex; gap:3px; background:#e2e8f0; padding:3px; border-radius:8px;">
          <button
            class="server-btn"
            :class="{ active: isTeamMode }"
            @click="toggleMode(true)"
          >
            🤝 战队协同
          </button>
          <button
            class="server-btn"
            :class="{ active: !isTeamMode }"
            @click="toggleMode(false)"
          >
            👤 个人单刷
          </button>
        </div>
      </div>

      <div class="reset-timer-info">
        <span class="reset-time-badge">01:00 重置: {{ resetCountDownText }}</span>
      </div>
    </div>

    <!-- 经典 Boss 选项按钮 -->
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

    <!-- ⚔️ 频道范围自订动态点选矩阵 -->
    <div class="ch-matrix-card" style="margin-bottom: 14px; background:rgba(15, 23, 42, 0.6); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:10px 14px;">
      <div style="font-size:12px; font-weight:800; color:#60a5fa; margin-bottom:10px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px;">
        <span>⚔️ 频道看守卡片墙 (点击一键秒报【{{ currentBossName }}】倒计时)</span>
        
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
      </div>

      <!-- 动态自适应网格渲染频道列表 -->
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)); gap:6px;">
        <button
          v-for="ch in matrixChannelList"
          :key="ch"
          class="ch-matrix-item-btn"
          :class="getChMatrixClass(ch)"
          @click="quickSelectCh(ch)"
        >
          <span style="font-size:11px; font-weight:900;">CH {{ ch }}</span>
          <span v-if="getChMatrixTimeText(ch)" style="font-size:9px; opacity:0.85;">{{ getChMatrixTimeText(ch) }}</span>
        </button>
      </div>
    </div>

    <!-- ★ 核心交互：顶部分栏 - 频道自定义提交表单 ★ -->
    <div class="channel-submit-form" style="margin-bottom: 14px;">
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

    <!-- 信息栏 -->
    <div class="control-bar">
      <div style="display:flex; flex-direction:column; gap:2px;">
        <span style="font-size:14px; font-weight:900; color:var(--maple-blue-dark);">
          🎯 当前看守: {{ currentBossName }} (刷新率: {{ currentBossMinutes }}分钟)
        </span>
        <span style="font-size:12px; color:var(--text-muted); font-weight:700;">
          独立看守 <strong style="color:var(--maple-red);">{{ sortedTeamChannels.length }}</strong> 个频道
        </span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <button class="btn-clear-channels" @click="clearAllChannels">
          🗑️ 清空频道
        </button>
        <label class="toggle-switch">
          <input type="checkbox" v-model="soundEnabled" />
          <span>🔔 响铃</span>
        </label>
      </div>
    </div>

    <!-- 团队协同看板列表 -->
    <div style="margin-bottom: 20px;">
      <div class="timer-grid" v-if="teamChannels.length > 0">
        <div
          v-for="item in sortedTeamChannels"
          :key="item.id"
          class="channel-card"
          :class="{ 'ready-card': item.remainingSec <= 0 && item.started, 'cooldown-card': item.cooldown }"
          @click="onCardClick(item)"
        >
          <div class="card-main-content">
            <!-- 频道号 -->
            <div class="channel-title">
              <span>CH {{ item.channelNum || '?' }}</span>
            </div>

            <!-- 爆闪已复活与倒计时 -->
            <div style="text-align:center; flex:1;">
              <div class="timer-digits-text">
                {{ item.cooldown ? '⚔️ 已击杀...' : (item.remainingSec <= 0 ? (item.started ? '🚨⚡ BOSS已复活！' : '等待报时') : formatSeconds(item.remainingSec)) }}
              </div>
              <div>
                <span
                  class="status-badge-text"
                  :class="item.cooldown ? 'status-cooldown' : (item.remainingSec <= 0 && item.started ? 'status-ready' : (item.started ? 'status-counting' : 'status-idle'))"
                >
                  {{ item.cooldown ? '💀 确认击杀中...' : (item.remainingSec <= 0 ? (item.started ? '🔥 复活·快打' : '⚪ 暂无记录') : '⏳ 倒计时') }}
                </span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="card-action-bar" @click.stop>
              <button
                class="btn-mini-reset"
                @click.stop="triggerTimer(item)"
              >
                ⚔️ 报时
              </button>
              <button
                class="btn-mini-del"
                @click.stop="deleteChannel(item.id)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else style="text-align:center; padding:28px 16px; color:rgba(255,255,255,0.6); background:rgba(255,255,255,0.05); border-radius:10px; font-size:13px; font-weight:700;">
        暂无看守频道，在上方输入频道号开始 ⬆️
      </div>
    </div>

    <!-- 🎥 游戏屏幕 AI 自动捕获监测面板 (放置在最底部 & 默认折叠隐藏) -->
    <div class="screen-monitor-panel" style="margin-top: 28px;">
      <div class="monitor-header" style="cursor:pointer;" @click="showMonitorPanel = !showMonitorPanel">
        <div style="display:flex; align-items:center; gap:8px;">
          <span v-if="isMonitoring" class="status-dot-recording"></span>
          <span style="font-size:13px; font-weight:800; color:#ffffff;">
            {{ isMonitoring ? '🎥 游戏屏幕 AI 自动监测 (运行中)' : '🎥 游戏屏幕自动 AI 监测 (高级功能)' }}
          </span>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
          <button
            class="btn-monitor-toggle"
            :class="{ active: isMonitoring }"
            @click.stop="toggleScreenMonitor"
          >
            <span>{{ isMonitoring ? '⏹️ 停止监测' : '🎥 绑定游戏窗口' }}</span>
          </button>
          <span style="font-size:12px; color:rgba(255,255,255,0.7); font-weight:800; user-select:none;">
            {{ showMonitorPanel ? '▲ 隐藏面板' : '▼ 展开面板' }}
          </span>
        </div>
      </div>

      <!-- 视频流抓取与血条监测区 (折叠可隐藏) -->
      <div v-show="showMonitorPanel" style="padding-top: 10px;">
        <div class="video-preview-box" style="display:flex; align-items:center; gap:12px;">
          <!-- 画布视频与高亮红框锁定区域 -->
          <div style="position:relative; width:140px; height:80px; border-radius:6px; overflow:hidden; border:1.5px solid rgba(255,255,255,0.2); flex-shrink:0; background:#000;">
            <video ref="videoElement" class="video-preview-element" autoplay playsinline muted style="width:100%; height:100%; object-fit:cover;"></video>
            <!-- 🎯 AI 自动锁定血条扫描框 -->
            <div style="position:absolute; top:2%; left:5%; width:90%; height:25%; border:1.5px dashed #ef4444; background:rgba(239,68,68,0.25); pointer-events:none; display:flex; align-items:center; justify-content:center;">
              <span style="font-size:8px; color:#ffffff; font-weight:900; background:rgba(0,0,0,0.7); padding:0 3px; border-radius:2px; letter-spacing:0.5px;">🎯 血条锁定区</span>
            </div>
          </div>

          <div style="font-size:11px; color:#cbd5e1; flex:1; font-weight:700; display:flex; flex-direction:column; gap:4px;">
            <div style="color:#94a3b8;">🎯 已全自动精准锚定游戏顶部 Boss 血量槽</div>
            <div style="color:#60a5fa;">
              最新状态: {{ ocrStatusText || (isMonitoring ? '正在进行血条与画面扫描...' : '未开启监控，点击绑定按钮开启') }}
            </div>
            <!-- 血条检测实时显示 -->
            <div v-if="detectedHpPercent !== null || isHpBarPresent" style="display:flex; align-items:center; gap:6px; background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.4); padding:3px 8px; border-radius:6px; margin-top:2px;">
              <span style="color:#ef4444; font-weight:900;">❤️ Boss血条状态:</span>
              <span v-if="detectedHpPercent !== null" style="color:#fecdd3; font-weight:800;">
                剩余 {{ detectedHpPercent.toFixed(2) }}%
              </span>
              <span v-else style="color:#fecdd3; font-weight:800;">
                已锁定顶部血条 {{ isHpBarPresent ? ' (监控中)' : ' (已消失/倒计时开启)' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

export interface PublicTimerRecord {
  id: string;
  server: ServerRegion;
  channel: string;
  boss_id: string;
  boss_name: string;
  respawn_minutes: number;
  killed_at: number;
  respawn_at: number;
  reporter_name: string;
}

// 状态
const activeServer = ref<ServerRegion>('asia');
const isTeamMode = ref<boolean>(true); // 🤝 战队协同 (true) vs 👤 个人单刷 (false)
const globalBossId = ref<string>('hai'); // 默认寒霜冰龙
const soundEnabled = ref<boolean>(false); // 默认不发出声音提示
const nowMs = ref<number>(Date.now());
const toastMsg = ref<string>('');
const newChannelNum = ref<number | null>(null);
const customMinutes = ref<number | null>(null);
const submitError = ref<string>('');

function toggleMode(mode: boolean) {
  isTeamMode.value = mode;
  try {
    localStorage.setItem('maple_is_team_mode', JSON.stringify(mode));
  } catch (e) {}
  if (mode) {
    fetchCloudRecords();
    triggerToast('🤝 已切换为【战队协同模式】(实时同步全队报时)');
  } else {
    triggerToast('👤 已切换为【个人单刷模式】(本地独立看守，不触发云端同步)');
  }
}

function loadModePreference() {
  try {
    const raw = localStorage.getItem('maple_is_team_mode');
    if (raw !== null) {
      isTeamMode.value = JSON.parse(raw);
    }
  } catch (e) {}
}

// 底部画面 AI 监测面板折叠隐藏控制 (默认隐藏)
const showMonitorPanel = ref<boolean>(false);

// 自定义频道展示范围 (例如 100 至 130)
const matrixStartCh = ref<number>(100);
const matrixEndCh = ref<number>(130);

const matrixChannelList = computed(() => {
  const start = Math.max(1, matrixStartCh.value || 1);
  let end = Math.max(start, matrixEndCh.value || start);
  if (end - start > 100) end = start + 100; // 最多单次展示 100 个频道
  const list: number[] = [];
  for (let c = start; c <= end; c++) {
    list.push(c);
  }
  return list;
});

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

  // 默认区间兜底
  if (activeServer.value === 'asia') {
    matrixStartCh.value = 100;
    matrixEndCh.value = 130;
  } else {
    matrixStartCh.value = 100;
    matrixEndCh.value = 140;
  }
}

// 画面监测状态
const isMonitoring = ref<boolean>(false);
const videoElement = ref<HTMLVideoElement | null>(null);
const ocrStatusText = ref<string>('');
const detectedHpPercent = ref<number | null>(null);
const isHpBarPresent = ref<boolean>(false);

let wasHpBarPresent = false;
let hpBarDisappearCount = 0;

const teamChannels = ref<TeamChannelItem[]>([]);
const cloudRecords = ref<PublicTimerRecord[]>([]);

let mediaStream: MediaStream | null = null;
let scanTimer: any = null;

let toastTimer: any = null;
function triggerToast(msg: string) {
  toastMsg.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMsg.value = '';
  }, 2500);
}

function selectBoss(bossId: string) {
  globalBossId.value = bossId;
  syncCloudToLocal();
  triggerToast(`已切换看守 Boss 为【${currentBossName.value}】`);
}

function onRoomChange() {
  fetchCloudRecords();
  triggerToast(`🔑 战队房间暗号更新为【${roomCode.value || '公共大厅'}】`);
}

// ⚔️ CH 1 - CH 30 矩阵点击快速切换 / 报时
function quickSelectCh(chNum: number) {
  let targetItem = teamChannels.value.find(
    (i) => i.channelNum === chNum && i.bossId === globalBossId.value
  );

  if (!targetItem) {
    targetItem = {
      id: 'ch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      channelNum: chNum,
      bossId: globalBossId.value,
      bossName: currentBossName.value,
      targetEndTime: 0,
      totalSec: currentBossMinutes.value * 60,
      remainingSec: 0,
      started: false,
    };
    teamChannels.value.push(targetItem);
  }

  triggerTimerWithMinutes(targetItem, currentBossMinutes.value);
  triggerToast(`⚡ 一键开启 CH ${chNum} 【${currentBossName.value}】${currentBossMinutes.value} 分钟倒计时！`);
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
const serverTimeFormatted = computed(() => serverInfo.value.formattedCurrentTime);
const resetCountDownText = computed(() => formatSeconds(serverInfo.value.secondsUntilReset));

const sortedTeamChannels = computed(() => {
  return [...teamChannels.value]
    .filter((item) => item.bossId === globalBossId.value)
    .sort((a, b) => a.remainingSec - b.remainingSec);
});

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
  // 根据用户需求：不需要语音，不需要声音提示
  return;
}



// 🎥 开启 / 停止游戏窗口屏幕监测
async function toggleScreenMonitor() {
  if (isMonitoring.value) {
    stopScreenMonitor();
  } else {
    await startScreenMonitor();
  }
}

async function startScreenMonitor() {
  try {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'window',
      } as any,
      audio: false,
    });

    if (videoElement.value && mediaStream) {
      videoElement.value.srcObject = mediaStream;
      videoElement.value.play();
    }

    isMonitoring.value = true;
    showMonitorPanel.value = true;
    detectedHpPercent.value = null;
    isHpBarPresent.value = false;
    wasHpBarPresent = false;
    hpBarDisappearCount = 0;

    ocrStatusText.value = '屏幕捕获绑定成功，开始全自动 Boss 血条与画面分析...';
    triggerToast('🎥 绑定成功！AI 现已支持监控顶部 Boss 血条残血及血条消失自动击杀！');

    // 处理用户主动在窗口顶部点击“停止共享”
    const track = mediaStream.getVideoTracks()[0];
    track.onended = () => {
      stopScreenMonitor();
    };

    // 开启后台 1.5 秒轮询扫描处理 Canvas 帧
    startFrameScanner();
  } catch (err: any) {
    console.warn('取消或屏幕捕获失败:', err);
    triggerToast('⚠️ 未能绑定屏幕窗口：' + (err.message || '用户取消操作'));
    isMonitoring.value = false;
  }
}

function stopScreenMonitor() {
  if (scanTimer) clearInterval(scanTimer);
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  isMonitoring.value = false;
  ocrStatusText.value = '';
  detectedHpPercent.value = null;
  isHpBarPresent.value = false;
  wasHpBarPresent = false;
  triggerToast('⏹️ 已停止游戏屏幕监测');
}

// 顶部 Boss 血条像素级分析（画面 0% ~ 25% 高度区域）
function analyzeHpBarPixels(ctx: CanvasRenderingContext2D, width: number, height: number) {
  try {
    const topHeight = Math.floor(height * 0.25);
    const imageData = ctx.getImageData(0, 0, width, topHeight);
    const data = imageData.data;
    let redPixelCount = 0;

    // 采样像素，匹配 Boss 红色血条颜色 (R 通道显著高于 G 和 B)
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 120 && r > g * 1.35 && r > b * 1.35) {
        redPixelCount++;
      }
    }

    const currentHpPresent = redPixelCount > 20; // 超过阈值判定顶部血条存在
    isHpBarPresent.value = currentHpPresent;

    // 检测血条从“存在”变为“消失”
    if (wasHpBarPresent && !currentHpPresent) {
      hpBarDisappearCount++;
      if (hpBarDisappearCount >= 2) { // 连续 2 帧消失，确认 Boss 已被击杀
        wasHpBarPresent = false;
        hpBarDisappearCount = 0;
        triggerHpKillEvent('Boss 顶部血条消失');
      }
    } else if (currentHpPresent) {
      wasHpBarPresent = true;
      hpBarDisappearCount = 0;
    }
  } catch (e) {}
}

// 自动触发击杀与倒计时报时
let lastTriggerTime = 0;
function triggerHpKillEvent(reason: string) {
  const now = Date.now();
  if (now - lastTriggerTime < 10000) return; // 10秒防抖
  lastTriggerTime = now;

  let targetChNum: number | null = null;
  if (teamChannels.value.length > 0) {
    // 优先选择匹配当前 Boss 且处于“等待报时”或“复活中”的频道
    const available = teamChannels.value.find((i) => i.bossId === globalBossId.value);
    if (available && available.channelNum) {
      targetChNum = available.channelNum;
    } else if (teamChannels.value[0].channelNum) {
      targetChNum = teamChannels.value[0].channelNum;
    }
  }

  if (!targetChNum) {
    targetChNum = 120; // 默认频道
  }

  let targetItem = teamChannels.value.find(
    (i) => i.channelNum === targetChNum && i.bossId === globalBossId.value
  );
  if (!targetItem) {
    targetItem = {
      id: 'ch_auto_' + targetChNum,
      channelNum: targetChNum,
      bossId: globalBossId.value,
      bossName: currentBossName.value,
      targetEndTime: 0,
      totalSec: currentBossMinutes.value * 60,
      remainingSec: 0,
      started: false,
    };
    teamChannels.value.push(targetItem);
  }

  triggerTimer(targetItem);
  playAlertSound();
  triggerToast(`⚔️ [AI屏幕检测] 识别到 ${reason}！已自动开启 CH ${targetChNum} 【${currentBossName.value}】 倒计时！`);
}

// 后台扫描抽取视频帧，调用 OCR 文本对比
function startFrameScanner() {
  if (scanTimer) clearInterval(scanTimer);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  scanTimer = setInterval(async () => {
    if (!isMonitoring.value || !videoElement.value) return;

    const video = videoElement.value;
    if (video.readyState < 2) return; // 视频未加载就绪

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;

    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 1. 进行顶部血条像素检测
    analyzeHpBarPixels(ctx, canvas.width, canvas.height);

    // 2. 尝试调用 Tesseract.js 识别
    const tesseract = (window as any).Tesseract;
    if (tesseract) {
      try {
        ocrStatusText.value = '正在扫描捕获日志与血条文本...';
        const result = await tesseract.recognize(canvas, 'chi_sim+eng', {
          logger: () => {},
        });
        const text = result?.data?.text || '';
        ocrStatusText.value = `扫描完成: ${text.slice(0, 30)}...`;

        analyzeOcrTextAndTrigger(text);
      } catch (e) {
        ocrStatusText.value = '画面分析检测中...';
      }
    } else {
      ocrStatusText.value = '画面监测运行中 (血条像素+广播识别模式)';
    }
  }, 1500);
}

// 解析文本中的 Boss 击杀、血量比率及百分比，自动触发残血与击杀
function analyzeOcrTextAndTrigger(text: string) {
  let hpPercentFound: number | null = null;

  // 1. 尝试匹配形如 1,228,335 / 30,000,000 的血量数值比
  const ratioMatch = text.match(/([\d\,]+)\s*\/\s*([\d\,]+)/);
  if (ratioMatch) {
    const currentHp = parseInt(ratioMatch[1].replace(/,/g, ''), 10);
    const maxHp = parseInt(ratioMatch[2].replace(/,/g, ''), 10);
    if (!isNaN(currentHp) && !isNaN(maxHp) && maxHp > 0) {
      hpPercentFound = (currentHp / maxHp) * 100;
    }
  }

  // 2. 如果数值比未匹配成功，尝试正则提取 (4.09%) 或 4.09%
  if (hpPercentFound === null) {
    const percentMatch = text.match(/(\d+(?:[\.\,]\d+)?)\s*%/);
    if (percentMatch) {
      const parsed = parseFloat(percentMatch[1].replace(',', '.'));
      if (!isNaN(parsed) && parsed <= 100) {
        hpPercentFound = parsed;
      }
    }
  }

  // 处理提取到的血量百分比
  if (hpPercentFound !== null && hpPercentFound >= 0 && hpPercentFound <= 100) {
    detectedHpPercent.value = hpPercentFound;

    if (hpPercentFound <= 5.0 && hpPercentFound > 0) {
      // 触发残血预警
      triggerToast(`⚠️ [Boss残血警告] 当前剩余血量 ${hpPercentFound.toFixed(2)}%，请准备报时击杀！`);
    } else if (hpPercentFound === 0) {
      // 血量清空触发击杀
      triggerHpKillEvent('Boss 血量为 0% (已清空)');
      return;
    }
  }

  const now = Date.now();
  // 防抖 10 秒内不重复自动触发
  if (now - lastTriggerTime < 10000) return;

  const lowerText = text.toLowerCase();
  let matchedBossId = '';
  let matchedBossName = '';
  let matchedMinutes = 10;

  if (text.includes('寒霜') || text.includes('冰龍') || text.includes('冰龙') || lowerText.includes('frost')) {
    matchedBossId = 'hai';
    matchedBossName = '寒霜冰龍';
    matchedMinutes = 10;
  } else if (text.includes('黑金剛') || text.includes('黑金刚') || text.includes('葛雷')) {
    matchedBossId = 'hei';
    matchedBossName = '葛雷黑金剛';
    matchedMinutes = 30;
  } else if (text.includes('魚頭') || text.includes('鱼头') || text.includes('海怒斯') || lowerText.includes('pianus')) {
    matchedBossId = 'yu';
    matchedBossName = '魚頭/海怒斯';
    matchedMinutes = 30;
  }

  if (matchedBossId) {
    // 匹配频道号
    const chMatch = text.match(/(?:ch|频道|頻道)\s*([0-9]{1,3})/i);
    let targetChNum = chMatch ? parseInt(chMatch[1], 10) : null;

    if (!targetChNum && teamChannels.value.length > 0) {
      targetChNum = teamChannels.value[0].channelNum;
    }

    if (targetChNum) {
      let targetItem = teamChannels.value.find((i) => i.channelNum === targetChNum);
      if (!targetItem) {
        targetItem = {
          id: 'ch_auto_' + targetChNum,
          channelNum: targetChNum,
          bossId: matchedBossId,
          bossName: matchedBossName,
          targetEndTime: 0,
          totalSec: matchedMinutes * 60,
          remainingSec: 0,
          started: false,
        };
        teamChannels.value.push(targetItem);
      }

      // 触发自动计时
      triggerHpKillEvent(`画面广播检测到【${matchedBossName}】击杀`);
    }
  }
}

function getNextUniqueChannelNum(): number {
  const existingNums = new Set(
    teamChannels.value.map((i) => i.channelNum).filter((n): n is number => n !== null && n > 0)
  );
  let candidate = 120;
  if (existingNums.size > 0) {
    const maxVal = Math.max(...Array.from(existingNums));
    candidate = maxVal + 1;
  }
  while (existingNums.has(candidate)) {
    candidate++;
  }
  return candidate;
}

function submitNewChannel() {
  submitError.value = '';

  if (!newChannelNum.value || newChannelNum.value <= 0) {
    submitError.value = '请输入有效的频道号（如 120）';
    return;
  }

  const chNum = newChannelNum.value;
  const minutesToUse =
    customMinutes.value && customMinutes.value > 0
      ? customMinutes.value
      : currentBossMinutes.value;

  let targetItem = teamChannels.value.find(
    (i) => i.channelNum === chNum && i.bossId === globalBossId.value
  );

  const isNew = !targetItem;

  if (!targetItem) {
    targetItem = {
      id: 'ch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      channelNum: chNum,
      bossId: globalBossId.value,
      bossName: currentBossName.value,
      targetEndTime: 0,
      totalSec: minutesToUse * 60,
      remainingSec: 0,
      started: false,
    };
    teamChannels.value.push(targetItem);
  } else {
    targetItem.totalSec = minutesToUse * 60;
  }

  saveLocalChannels();
  triggerTimerWithMinutes(targetItem, minutesToUse);

  newChannelNum.value = null;
  customMinutes.value = null;

  if (isNew) {
    triggerToast(`✅ CH ${chNum} 已提交并开始【${currentBossName.value}】${minutesToUse} 分钟倒计时！`);
  } else {
    triggerToast(`🔄 CH ${chNum} 已重复提交，刷新为【${currentBossName.value}】最新的 ${minutesToUse} 分钟倒计时！`);
  }
}

async function deleteChannel(id: string) {
  const item = teamChannels.value.find((i) => i.id === id);
  teamChannels.value = teamChannels.value.filter((i) => i.id !== id);
  saveLocalChannels();
  if (item && item.channelNum) {
    try {
      const cloudId = `${activeServer.value}_CH${item.channelNum}_${globalBossId.value}`;
      await fetch(`/api/public-timers?server=${activeServer.value}&id=${cloudId}`, { method: 'DELETE' });
    } catch (e) {}
  }
  triggerToast('🗑️ 已移除该频道');
}

async function clearAllChannels() {
  const pwd = prompt('请输入清空频道密码:');
  if (pwd === null) return;
  if (pwd.trim() === '2887') {
    teamChannels.value = [];
    cloudRecords.value = [];
    saveLocalChannels();
    try {
      await fetch(`/api/public-timers?server=${activeServer.value}`, { method: 'DELETE' });
    } catch (e) {}
    triggerToast('🗑️ 已清空所有看守频道');
  } else {
    alert('🔒 密码错误，无法清空看守频道！');
  }
}

function onCardClick(item: TeamChannelItem) {
  const minutes = item.totalSec > 0 ? Math.round(item.totalSec / 60) : currentBossMinutes.value;
  triggerTimerWithMinutes(item, minutes);
}

function triggerTimer(item: TeamChannelItem) {
  const minutes = item.totalSec > 0 ? Math.round(item.totalSec / 60) : currentBossMinutes.value;
  triggerTimerWithMinutes(item, minutes);
}

function triggerTimerWithMinutes(item: TeamChannelItem, minutes: number) {
  if (!item.channelNum) {
    alert('请先填入具体的频道号（如 110）后再进行报时！');
    return;
  }

  const itemBossId = item.bossId || globalBossId.value;
  const itemBossName = item.bossName || currentBossName.value;

  // 先变灰色 cooldown 1 秒 (原为2秒，现缩短为1秒极速确认)
  item.cooldown = true;
  item.started = false;
  item.remainingSec = 0;
  saveLocalChannels();

  // 战队模式下才广播给云端
  if (isTeamMode.value) {
    broadcastToCloud(item.channelNum, itemBossId, itemBossName, minutes);
  }

  setTimeout(() => {
    const sec = minutes * 60;
    item.cooldown = false;
    item.bossId = itemBossId; // 保持本身的 BossID，避免随全局切换错乱
    item.bossName = itemBossName;
    item.totalSec = sec;
    item.targetEndTime = Date.now() + sec * 1000;
    item.remainingSec = sec;
    item.started = true;
    saveLocalChannels();
  }, 1000);
}

function selectServer(server: ServerRegion) {
  if (activeServer.value === server) return;
  activeServer.value = server;
  loadChannelRange();
  loadLocalChannels();
  fetchCloudRecords();
  const label = server === 'asia' ? '🌏 亚服' : server === 'na' ? '🗽 美服' : '🏰 欧服';
  triggerToast(`已切换看守服务器为【${label}】`);
}

function saveLocalChannels() {
  try {
    localStorage.setItem(`maple_team_channels_v3_${activeServer.value}`, JSON.stringify(teamChannels.value));
  } catch (e) {}
}

function loadLocalChannels() {
  try {
    const data = localStorage.getItem(`maple_team_channels_v3_${activeServer.value}`);
    if (data) {
      teamChannels.value = JSON.parse(data);
    } else {
      teamChannels.value = [];
    }
  } catch (e) {
    teamChannels.value = [];
  }
}

async function fetchCloudRecords() {
  if (!isTeamMode.value) return; // 个人模式下不同步云端公共数据
  try {
    const res = await fetch(`/api/public-timers?server=${activeServer.value}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.records)) {
      cloudRecords.value = json.records;
      syncCloudToLocal();
    }
  } catch (e) {}
}

function syncCloudToLocal() {
  // 战队协同模式下：精准以云端最新公布的频道与击杀倒计时为准对齐
  const currentNow = Date.now();
  cloudRecords.value.forEach((record) => {
    const numMatch = record.channel.replace(/\D/g, '');
    if (!numMatch) return;
    const chNum = parseInt(numMatch, 10);

    let existing = teamChannels.value.find(
      (i) => i.channelNum === chNum && i.bossId === record.boss_id
    );

    const remainingSec = Math.max(0, Math.floor((record.respawn_at - currentNow) / 1000));

    if (existing) {
      existing.targetEndTime = record.respawn_at;
      existing.bossId = record.boss_id;
      existing.bossName = record.boss_name;
      existing.totalSec = (record.respawn_minutes || 10) * 60;
      existing.remainingSec = remainingSec;
      existing.started = true;
      existing.cooldown = false;
    } else {
      teamChannels.value.push({
        id: `cloud_${record.server}_CH${chNum}_${record.boss_id}`,
        channelNum: chNum,
        bossId: record.boss_id,
        bossName: record.boss_name,
        targetEndTime: record.respawn_at,
        totalSec: (record.respawn_minutes || 10) * 60,
        remainingSec: remainingSec,
        started: true,
        cooldown: false,
      });
    }
  });

  // 立即在主线程强制刷新视图，消除 1 秒的渲染时差
  teamChannels.value.forEach((item) => {
    if (item.started && item.targetEndTime > 0) {
      item.remainingSec = Math.max(0, Math.floor((item.targetEndTime - currentNow) / 1000));
    }
  });

  saveLocalChannels();
}

async function broadcastToCloud(
  channelNum: number | null,
  bossId: string,
  bossName: string,
  respawnMinutes: number
) {
  if (!isTeamMode.value || !channelNum || channelNum <= 0) return;
  try {
    await fetch('/api/public-timers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        server: activeServer.value,
        channel: `CH ${channelNum}`,
        boss_id: bossId,
        boss_name: bossName,
        respawn_minutes: respawnMinutes,
        reporter_name: '战队队友',
        killed_at: Date.now(),
      }),
    });
    fetchCloudRecords();
  } catch (e) {}
}

let timerInterval: any = null;
let pollInterval: any = null;

onMounted(() => {
  loadModePreference();
  loadChannelRange();
  loadLocalChannels();
  fetchCloudRecords();

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

  pollInterval = setInterval(() => {
    fetchCloudRecords();
  }, 2000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (pollInterval) clearInterval(pollInterval);
  stopScreenMonitor();
});
</script>
