export type ServerRegion = 'asia' | 'na';

export interface ServerTimeInfo {
  server: ServerRegion;
  serverName: string;
  timeZone: string;
  formattedCurrentTime: string;
  nextResetTimestamp: number;
  secondsUntilReset: number;
}

/**
 * 获取指定服务器（亚服: UTC+8 北京时间, 美服: America/New_York 纽约时间）的重置节点信息
 * 当地凌晨 01:00 AM 重置
 */
export function getServerTimeInfo(server: ServerRegion = 'asia', nowMs: number = Date.now()): ServerTimeInfo {
  const timeZone = server === 'asia' ? 'Asia/Shanghai' : 'America/New_York';
  const serverName = server === 'asia' ? '亚服 (北京时间)' : '美服 (纽约时间)';

  // 使用 Intl.DateTimeFormat 获取当地年、月、日、时、分、秒
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(nowMs));
  const dateMap: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      dateMap[part.type] = parseInt(part.value, 10);
    }
  }

  const { year, month, day, minute, second } = dateMap;

  // 格式化当前服务器当地时间
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedCurrentTime = `${year}-${pad(month)}-${pad(day)} ${pad(dateMap.hour)}:${pad(minute)}:${pad(second)}`;

  // 计算上一个 01:00 重置点与下一个 01:00 重置点
  const todayResetMs = getTimeStampForLocalDate(year, month, day, 1, 0, 0, timeZone);

  let nextResetMs: number;

  if (nowMs >= todayResetMs) {
    // 明天的 01:00 AM
    nextResetMs = getTimeStampForLocalDate(year, month, day + 1, 1, 0, 0, timeZone);
  } else {
    nextResetMs = todayResetMs;
  }

  const secondsUntilReset = Math.max(0, Math.floor((nextResetMs - nowMs) / 1000));

  return {
    server,
    serverName,
    timeZone,
    formattedCurrentTime,
    nextResetTimestamp: nextResetMs,
    secondsUntilReset,
  };
}

/**
 * 获取指定服务器最近一个 01:00 AM 重置点的时间戳（毫秒）
 */
export function getPreviousResetTimestamp(server: ServerRegion = 'asia', nowMs: number = Date.now()): number {
  const timeZone = server === 'asia' ? 'Asia/Shanghai' : 'America/New_York';
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(nowMs));
  const dateMap: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      dateMap[part.type] = parseInt(part.value, 10);
    }
  }

  const { year, month, day } = dateMap;
  const todayResetMs = getTimeStampForLocalDate(year, month, day, 1, 0, 0, timeZone);

  if (nowMs >= todayResetMs) {
    return todayResetMs;
  } else {
    return getTimeStampForLocalDate(year, month, day - 1, 1, 0, 0, timeZone);
  }
}

/**
 * 辅助函数：根据当地年月日时分秒与时区获取对应的 UTC 时间戳
 */
function getTimeStampForLocalDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): number {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const m: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') m[p.type] = parseInt(p.value, 10);
  }

  const localTimeFromUtc = new Date(Date.UTC(m.year, m.month - 1, m.day, m.hour, m.minute, m.second)).getTime();
  const diff = utcDate.getTime() - localTimeFromUtc;

  return utcDate.getTime() + diff;
}
