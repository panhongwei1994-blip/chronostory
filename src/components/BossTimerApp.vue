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
          <span>🎥 游戏屏幕 AI 自动监测 (血条检测 / 📸 对比删除不存在频道)</span>
          <span v-if="isScanning" class="scan-live-badge">● 正在 AI 监控中</span>
        </div>
      </div>

      <div class="panel-content-body">
        <div class="monitor-controls" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
          <button v-if="!isScanning" class="btn-start-monitor" @click="startScreenMonitor">
            🎥 绑定游戏窗口
          </button>
          <button v-else class="btn-stop-monitor" @click="stopScreenMonitor">
            ⏹️ 停止 AI 监测
          </button>

          <button v-if="isScanning" class="btn-start-monitor" @click="ocrChannelPanelNow" style="background:linear-gradient(135deg, #059669, #10b981); border-color:#34d399;">
            📸 自动识别【换线面板所有频道】
          </button>

          <div v-if="isScanning" class="monitor-target-ch">
            <span>血条消失绑定频道:</span>
            <input
              type="number"
              v-model.number="boundChannelNum"
              placeholder="频道号(如105)"
              class="target-ch-input"
            />
          </div>
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

const teamChannels = ref<TeamChannelItem[]>([]);

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
  saveLocalChannels();
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
  if (end - start > 100) end = start + 100;
  const list: number[] = [];
  for (let c = start; c <= end; c++) {
    list.push(c);
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
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    monitorStatus.value = '⚠️ 您的浏览器暂不支持屏幕捕获（请使用电脑版 Chrome / Edge / Brave 浏览器，并在 HTTPS 加密网站下使用此功能）';
    return;
  }

  monitorStatus.value = '正在请求屏幕共享权限，请在弹出的对话框中选择枫之谷游戏窗口...';

  navigator.mediaDevices.getDisplayMedia({
    video: {
      // @ts-ignore
      displaySurface: 'window',
    },
    audio: false,
  }).then(async (stream) => {
    mediaStream = stream;
    await nextTick();
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      videoRef.value.play().catch(() => {});
    }
    isScanning.value = true;
    monitorStatus.value = '🎯 游戏窗口绑定成功！全自动血条监测与频道对比已实时就绪！';

    stream.getVideoTracks()[0].onended = () => {
      stopScreenMonitor();
    };

    if (scanTimer) clearInterval(scanTimer);
    scanTimer = setInterval(() => {
      captureAndAnalyzeFrame();
    }, 1200);
  }).catch((err) => {
    isScanning.value = false;
    if (err.name === 'NotAllowedError') {
      monitorStatus.value = '⚠️ 您取消了屏幕授权。请重新点击【🎥 绑定游戏窗口】并在浏览器顶部弹窗中点击【允许】。';
    } else {
      monitorStatus.value = `⚠️ 绑定失败: ${err.message || '请确保使用 Chrome/Edge 电脑版浏览器并在 HTTPS 下访问'}`;
    }
  });
}

function stopScreenMonitor() {
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
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
}

// 📸 自动识别游戏内 CHANGE CHANNEL 弹窗里的所有频道与高亮双击选中频道
async function ocrChannelPanelNow() {
  if (!videoRef.value || !canvasRef.value) return;

  monitorStatus.value = '📸 正在扫描游戏画面中的换线面板与高亮切线频道...';

  const video = videoRef.value;
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    // @ts-ignore
    if (typeof window.Tesseract !== 'undefined') {
      // @ts-ignore
      const worker = await window.Tesseract.createWorker('eng');
      const ret = await worker.recognize(canvas);
      await worker.terminate();

      const text = ret.data.text || '';

      // 解析画面上的 CH 1391, CH1398, CH 1405 等频道
      const regex = /(?:CH|CH\.|CH_|\b)(\d{3,4})\b/gi;
      const matches = [...text.matchAll(regex)];
      const extracted: number[] = [];

      matches.forEach((m) => {
        const num = parseInt(m[1], 10);
        if (!isNaN(num) && num > 0 && num < 9999 && !extracted.includes(num)) {
          extracted.push(num);
        }
      });

      if (extracted.length > 0) {
        extracted.sort((a, b) => a - b);
        const minCh = extracted[0];
        const maxCh = extracted[extracted.length - 1];

        // 自动录入频道数量
        matrixStartCh.value = minCh;
        matrixEndCh.value = maxCh;
        saveChannelRange();

        // 自动解封
        hiddenChannels.value = hiddenChannels.value.filter((c) => !extracted.includes(c));
        saveHiddenChannels();

        // 锁定为看守线
        if (extracted[0]) {
          boundChannelNum.value = extracted[0];
        }

        monitorStatus.value = `🎉 自动从游戏换线面板录入 ${extracted.length} 个频道 (CH ${minCh} ~ CH ${maxCh})！自动锁定您切到的频道看守！`;
      } else {
        monitorStatus.value = '⚠️ 未能在当前画面中检测到 CH 频道，请在游戏内打开 CHANGE CHANNEL 窗口。';
      }
    } else {
      monitorStatus.value = '⚠️ Tesseract OCR 识别组件未就绪';
    }
  } catch (e) {
    monitorStatus.value = '⚠️ 换线面板识别异常，请重试';
  }
}

let timerInterval: any = null;

onMounted(() => {
  loadChannelRange();
  loadLocalChannels();

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
