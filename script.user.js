// ==UserScript==
// @name         Dynast.io — Custom PVP Only
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Оставляет только один кастомный PVP сервер, убирая все оригинальные
// @author       you
// @match        *://dynast.io/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // НАСТРОЙКА АНТИ-АФК
  const INTERVAL_MIN = 3; // Интервал ходьбы в минутах
  const W_TIME_MS = 3000;  // Как долго зажата кнопка W (в миллисекундах)
  const S_TIME_MS = 3000;  // Как долго зажата кнопка S (в миллисекундах)

  let active = false;
  let timer = null;

  // Оставляем только один нужный PVP сервер
  const CUSTOM_SERVERS = [
    {
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
      "label": "CRAFTpvp-0",
      "version": "1.3.7",
      "custom_mode": false,
      "private": false,
      "frame_drop": 3,
      "server_time": 710279.921545109,
      "events": [
        {
          "id": "6a1afcc63d317a06d6b5d30a",
          "header": "ui.event.increaseddrop",
          "description": "ui.event.increaseddrop",
          "start_time": "2026-05-30T00:00:00Z",
          "finish_time": "2026-06-01T00:00:00Z",
          "kind": {
            "type": "increaseddrop",
            "coef": 2
          }
        }
      ],
      "new_io": true,
      "pubsub_connected": true,
      "lifetime": 90000
    }
  ];

  const origFetch = window.fetch;

  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input?.url;
    if (!url) return origFetch.call(this, input, init);

    if (url.includes('announcement-') && url.includes('.dynast.cloud')) {
      console.log('[PatchServers] Перехвачен список. Удаляем оригинал, ставим только кастомный PVP...');

      const res = await origFetch.call(this, input, init);

      try {
        const data = await res.clone().json();

        // Полностью перезаписываем массив, игнорируя оригинальные сервера
        data.servers = CUSTOM_SERVERS;

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
