// ==UserScript==
// @name         Dynast.io — Custom PVP Only
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Оставляет только один кастомный PVP сервер, убирая все оригинальные. Исправлена бесконечная загрузка.
// @author       you
// @match        *://dynast.io/*
// @run-at       document-start
// @grant        none
// @updateURL    https://jsdelivr.net
// @downloadURL  https://jsdelivr.net
// ==/UserScript==

(function () {
  'use strict';

  // НАСТРОЙКА АНТИ-АФК
  const INTERVAL_MIN = 3; // Интервал ходьбы в минутах
  const W_TIME_MS = 3000;  // Как долго зажата кнопка W (в миллисекундах)
  const S_TIME_MS = 3000;  // Как долго зажата кнопка S (в миллисекундах)

  let active = false;
  let timer = null;

  // Базовый шаблон сервера без ломающих клиент таймеров
  const SERVER_TEMPLATE = {
    "ssl_port": 443,
    "ssl_ping_port": 8443,
    "ssl_host": "SZhtL/AXNopKB7frFQX9KwXcDul9kPLoevVeryrIUcLa3wI=",
    "port": 8080,
    "ping_port": 8880,
    "peer_key": null,
    "client_count": 6,
    "connections_limit": 60,
    "map": "pvp",
    "map_hash": "d0bc0fefa991ab5f899f81dd5da5a161",
    "game_mode": "pvp",
    "ip": "4mVXkv7txNetJCA9dCl3Ap2HMuXyf2USpxX6Zp7K2ats0V4=",
    "top_player_name": "🤣MarMoshka😂",
    "top_player_score": 110498,
    "top_player_level": 49,
    "load_avg": 3,
    "load_max": 3,
    "backend": "https://auth.dynast.cloud",
    "region": "Russia",
    "label": "CRaft_pvp-0",
    "version": "1.3.7",
    "custom_mode": false,
    "private": false,
    "frame_drop": 3,
    "events": [],
    "new_io": true,
    "pubsub_connected": true
  };

  const origFetch = window.fetch;

  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input?.url;
    if (!url) return origFetch.call(this, input, init);

    if (url.includes('announcement-') && url.includes('.dynast.cloud')) {
      console.log('[PatchServers] Перехвачен список. Формируем рабочий PVP сервер...');

      const res = await origFetch.call(this, input, init);

      try {
        const data = await res.clone().json();

        // Клонируем шаблон и генерируем актуальное время для обхода бесконечной загрузки
        const activeServer = Object.assign({}, SERVER_TEMPLATE);
        
        // Синхронизация времени сессии (текущий timestamp в секундах)
        const currentTimestamp = Math.floor(Date.now() / 1000);
        activeServer.server_time = currentTimestamp;
        activeServer.lifetime = currentTimestamp + 86400; // Жизненный цикл сессии на сутки вперед

        // Полностью перезаписываем массив
        data.servers = [activeServer];

        return new Response(JSON.stringify(data), {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers
        });

      } catch (e) {
        console.log('[PatchServers] Ошибка обработки:', e);
        return res;
      }
    }

    return origFetch.call(this, input, init);
  };

  // Эмуляция нажатий клавиш
  function press(type, key, code) {
    window.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true }));
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function walk() {
    if (!active) return;
    press('keydown', 'w', 'KeyW');
    await wait(W_TIME_MS);
    press('keyup', 'w', 'KeyW');

    if (!active) return;
    press('keydown', 's', 'KeyS');
    await wait(S_TIME_MS);
    press('keyup', 's', 'KeyS');
  }

  // Бинд кнопки Insert
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Insert') {
      active = !active;
      if (active) {
        walk();
        timer = setInterval(walk, INTERVAL_MIN * 60 * 1000);
      } else {
        clearInterval(timer);
      }
    }
  });

  console.log('[PatchServers] Режим "Только Кастомный PVP" загружен ✓');
})();
