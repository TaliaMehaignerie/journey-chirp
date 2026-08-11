(function () {
  "use strict";

  var LONG_PRESS_MS = 500;

  var button = document.getElementById("chirp-button");
  var audio = document.getElementById("audio-player");

  var pressStart = 0;
  var longArmedTimer = null;
  var pointerActive = false;

  // Avoid playing the exact same clip twice in a row when possible.
  var lastShort = null;
  var lastLong = null;

  function pickRandom(list, last) {
    if (!list || list.length === 0) return null;
    if (list.length === 1) return list[0];
    var choice;
    do {
      choice = list[Math.floor(Math.random() * list.length)];
    } while (choice === last);
    return choice;
  }

  function playFile(folder, file) {
    var path = "chirps/" + folder + "/" + file;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (e) {
      /* ignore */
    }
    audio.src = path;
    var playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function (err) {
        console.error("Playback failed for " + path, err);
      });
    }
  }

  function playShort() {
    var file = pickRandom(CHIRPS.short, lastShort);
    if (!file) return;
    lastShort = file;
    playFile("short", file);
  }

  function playLong() {
    var file = pickRandom(CHIRPS.long, lastLong);
    if (!file) return;
    lastLong = file;
    playFile("long", file);
  }

  function armLongPress() {
    button.classList.add("long-armed");
    if (navigator.vibrate) {
      try { navigator.vibrate(15); } catch (e) { /* ignore */ }
    }
  }

  function onPressStart(e) {
    if (pointerActive) return;
    pointerActive = true;
    pressStart = Date.now();
    button.classList.add("pressed");
    button.classList.remove("long-armed");

    clearTimeout(longArmedTimer);
    longArmedTimer = setTimeout(armLongPress, LONG_PRESS_MS);

    if (e.cancelable) e.preventDefault();
  }

  function onPressEnd(e) {
    if (!pointerActive) return;
    pointerActive = false;
    clearTimeout(longArmedTimer);

    var heldMs = Date.now() - pressStart;
    button.classList.remove("pressed");
    button.classList.remove("long-armed");

    if (heldMs >= LONG_PRESS_MS) {
      playLong();
    } else {
      playShort();
    }

    if (e.cancelable) e.preventDefault();
  }

  function onPressCancel() {
    pointerActive = false;
    clearTimeout(longArmedTimer);
    button.classList.remove("pressed");
    button.classList.remove("long-armed");
  }

  if (window.PointerEvent) {
    button.addEventListener("pointerdown", onPressStart);
    button.addEventListener("pointerup", onPressEnd);
    button.addEventListener("pointercancel", onPressCancel);
    button.addEventListener("pointerleave", onPressCancel);
  } else {
    // Fallback for older browsers without Pointer Events support.
    button.addEventListener("touchstart", onPressStart, { passive: false });
    button.addEventListener("touchend", onPressEnd, { passive: false });
    button.addEventListener("touchcancel", onPressCancel);
    button.addEventListener("mousedown", onPressStart);
    button.addEventListener("mouseup", onPressEnd);
    button.addEventListener("mouseleave", onPressCancel);
  }

  // Block the iOS long-press context menu / callout entirely.
  button.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  // Register the service worker so the app (and all chirp audio) works offline
  // after the first successful load.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (err) {
        console.error("Service worker registration failed", err);
      });
    });
  }
})();
