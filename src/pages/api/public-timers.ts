import type { APIRoute } from 'astro';
import { getPreviousResetTimestamp, getServerTimeInfo, type ServerRegion } from '../../utils/timezone';

export interface PublicTimerRecord {
  id: string;
  server: ServerRegion;
  room?: string;
  channel: string;
  boss_id: string;
  boss_name: string;
  respawn_minutes: number;
  killed_at: number;
  respawn_at: number;
  reporter_name: string;
  created_at: number;
  updated_at: number;
}

// 内存兜底存储（当 D1 数据库尚未绑定或本地运行无 DB 绑定时）
const memoryStore: Map<string, PublicTimerRecord> = new Map();

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const server = (url.searchParams.get('server') || 'asia') as ServerRegion;
  const room = (url.searchParams.get('room') || 'default').trim().toLowerCase();

  const now = Date.now();
  const serverInfo = getServerTimeInfo(server, now);
  // 保留过去 18 小时内的所有最新看守记录
  const cutoffMs = now - 18 * 3600 * 1000;

  let records: PublicTimerRecord[] = [];

  // 1. 优先尝试从 Cloudflare KV 读取
  const kv = (locals as any)?.runtime?.env?.KV;
  const db = (locals as any)?.runtime?.env?.DB;

  if (kv) {
    try {
      const raw = await kv.get(`timers_${server}_${room}`);
      if (raw) {
        const list: PublicTimerRecord[] = JSON.parse(raw);
        records = list.filter((r) => r.updated_at >= cutoffMs);
      }
    } catch (e) {}
  }

  // 2. 次选从 Cloudflare D1 读取
  if (records.length === 0 && db) {
    try {
      const { results } = await db
        .prepare(
          `SELECT * FROM public_boss_timers WHERE server = ? AND updated_at >= ? ORDER BY respawn_at ASC`
        )
        .bind(server, cutoffMs)
        .all();
      records = (results as PublicTimerRecord[]).filter((r) => (r.room || 'default') === room);
    } catch (e) {}
  }

  // 3. 尝试从 Cloudflare Global Edge Cache 全球边缘缓存读取 (零配置全球跨节点共享)
  if (records.length === 0) {
    try {
      const cacheKey = new Request(`https://cache.maple-timer.internal/records_${server}_${room}`);
      const cachedRes = await caches.default.match(cacheKey);
      if (cachedRes) {
        const list: PublicTimerRecord[] = await cachedRes.json();
        if (Array.isArray(list)) {
          records = list.filter((r) => r.updated_at >= cutoffMs);
        }
      }
    } catch (e) {}
  }

  // 4. 内存兜底模式
  if (records.length === 0) {
    records = Array.from(memoryStore.values()).filter(
      (r) => r.server === server && (r.room || 'default') === room && r.updated_at >= cutoffMs
    );
  }

  // 按预计刷新时刻升序排序
  records.sort((a, b) => a.respawn_at - b.respawn_at);

  return new Response(
    JSON.stringify({
      success: true,
      serverInfo,
      records,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const {
      server = 'asia',
      room = 'default',
      channel,
      boss_id,
      boss_name,
      respawn_minutes = 10,
      killed_at = Date.now(),
      reporter_name = '匿名玩家',
    } = body;

    if (!channel || !boss_id || !boss_name) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少必需的频道或Boss参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanRoom = room.trim().toLowerCase() || 'default';
    const formattedChannel = channel.toUpperCase().startsWith('CH')
      ? channel.toUpperCase()
      : `CH ${channel}`;

    const now = Date.now();
    const respawn_at = killed_at + Number(respawn_minutes) * 60 * 1000;
    const id = `${server}_${cleanRoom}_${formattedChannel.replace(/\s+/g, '')}_${boss_id}`;

    const record: PublicTimerRecord = {
      id,
      server: server as ServerRegion,
      room: cleanRoom,
      channel: formattedChannel,
      boss_id,
      boss_name,
      respawn_minutes: Number(respawn_minutes),
      killed_at: Number(killed_at),
      respawn_at,
      reporter_name,
      created_at: now,
      updated_at: now,
    };

    // 1. 写入 Cloudflare KV 绑定
    const kv = (locals as any)?.runtime?.env?.KV;
    const db = (locals as any)?.runtime?.env?.DB;

    if (kv) {
      try {
        const raw = await kv.get(`timers_${server}_${cleanRoom}`);
        let list: PublicTimerRecord[] = raw ? JSON.parse(raw) : [];
        list = list.filter((r) => r.id !== id);
        list.push(record);
        // 保存 24 小时过期
        await kv.put(`timers_${server}_${cleanRoom}`, JSON.stringify(list), { expirationTtl: 86400 });
      } catch (e) {}
    }

    // 2. 写入 D1 数据库
    if (db) {
      try {
        await db
          .prepare(
            `INSERT INTO public_boss_timers (
              id, server, channel, boss_id, boss_name, respawn_minutes, killed_at, respawn_at, reporter_name, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              killed_at = excluded.killed_at,
              respawn_at = excluded.respawn_at,
              reporter_name = excluded.reporter_name,
              updated_at = excluded.updated_at`
          )
          .bind(
            record.id,
            record.server,
            record.channel,
            record.boss_id,
            record.boss_name,
            record.respawn_minutes,
            record.killed_at,
            record.respawn_at,
            record.reporter_name,
            record.created_at,
            record.updated_at
          )
          .run();
      } catch (e) {}
    }

    memoryStore.set(id, record);

    // 3. 写入 Cloudflare Global Edge Cache (零配置全球跨节点数据共享)
    try {
      const cacheKey = new Request(`https://cache.maple-timer.internal/records_${server}_${cleanRoom}`);
      const listToCache = Array.from(memoryStore.values()).filter(
        (r) => (r.room || 'default') === cleanRoom && r.server === server
      );
      const cacheRes = new Response(JSON.stringify(listToCache), {
        headers: { 'Cache-Control': 'public, max-age=86400', 'Content-Type': 'application/json' },
      });
      await caches.default.put(cacheKey, cacheRes);
    } catch (e) {}

    return new Response(
      JSON.stringify({
        success: true,
        message: '公共报时更新成功！',
        record,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || '系统错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const server = url.searchParams.get('server') as ServerRegion;
  const id = url.searchParams.get('id');

  const db = (locals as any)?.runtime?.env?.DB;

  if (id) {
    memoryStore.delete(id);
    if (db) {
      try {
        await db.prepare('DELETE FROM public_boss_timers WHERE id = ?').bind(id).run();
      } catch (e) {}
    }
  } else if (server) {
    for (const [key, item] of memoryStore.entries()) {
      if (item.server === server) {
        memoryStore.delete(key);
      }
    }
    if (db) {
      try {
        await db.prepare('DELETE FROM public_boss_timers WHERE server = ?').bind(server).run();
      } catch (e) {}
    }
  }

  return new Response(
    JSON.stringify({ success: true, message: '已重置公共频道记录' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
