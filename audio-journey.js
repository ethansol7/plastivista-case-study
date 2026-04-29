(() => {
  const button = document.querySelector("[data-sound-toggle]");
  const label = document.querySelector("[data-sound-label]");
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

  if (!button || !label || !AudioContextCtor) {
    if (button) {
      button.hidden = true;
    }
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const transitionTime = reducedMotion ? 3.1 : 1.75;
  const moods = {
    intro: {
      id: "intro",
      a: 174.61,
      b: 261.63,
      shimmer: 523.25,
      filter: 1500,
      pad: 0.05,
      shine: 0.008,
      pulseHz: 47,
      pulse: 0.0008,
      lfoHz: 0.032,
      lift: 55,
      master: 0.14
    },
    problem: {
      id: "problem",
      a: 146.83,
      b: 220,
      shimmer: 392,
      filter: 780,
      pad: 0.052,
      shine: 0.0035,
      pulseHz: 42,
      pulse: 0.0024,
      lfoHz: 0.026,
      lift: 34,
      master: 0.13
    },
    system: {
      id: "system",
      a: 196,
      b: 293.66,
      shimmer: 587.33,
      filter: 1260,
      pad: 0.046,
      shine: 0.007,
      pulseHz: 58,
      pulse: 0.0032,
      lfoHz: 0.078,
      lift: 72,
      master: 0.145
    },
    hardware: {
      id: "hardware",
      a: 130.81,
      b: 196,
      shimmer: 329.63,
      filter: 900,
      pad: 0.044,
      shine: 0.004,
      pulseHz: 52,
      pulse: 0.0041,
      lfoHz: 0.048,
      lift: 44,
      master: 0.135
    },
    material: {
      id: "material",
      a: 164.81,
      b: 246.94,
      shimmer: 493.88,
      filter: 1360,
      pad: 0.05,
      shine: 0.006,
      pulseHz: 49,
      pulse: 0.002,
      lfoHz: 0.04,
      lift: 58,
      master: 0.14
    },
    output: {
      id: "output",
      a: 220,
      b: 329.63,
      shimmer: 659.25,
      filter: 1660,
      pad: 0.044,
      shine: 0.011,
      pulseHz: 57,
      pulse: 0.0014,
      lfoHz: 0.038,
      lift: 72,
      master: 0.145
    },
    vision: {
      id: "vision",
      a: 196,
      b: 392,
      shimmer: 783.99,
      filter: 1850,
      pad: 0.046,
      shine: 0.012,
      pulseHz: 44,
      pulse: 0.0009,
      lfoHz: 0.025,
      lift: 90,
      master: 0.15
    }
  };

  const sectionMoodPairs = [
    ["#top", "intro"],
    ["#overview", "intro"],
    ["#context", "problem"],
    [".insight", "problem"],
    ["#system", "system"],
    ["#ideation", "system"],
    ["#hardware", "hardware"],
    ["#electronics", "hardware"],
    ["#materials", "material"],
    ["#sol", "output"],
    ["#vision", "vision"]
  ];

  const watchedSections = sectionMoodPairs
    .map(([selector, mood]) => {
      const element = document.querySelector(selector);
      return element ? { element, mood } : null;
    })
    .filter(Boolean);

  let ctx;
  let master;
  let filter;
  let padA;
  let padB;
  let shimmerTone;
  let pulseTone;
  let lfo;
  let padGainA;
  let padGainB;
  let shimmerGain;
  let pulseGain;
  let filterLift;
  let pulseLift;
  let active = false;
  let ready = false;
  let currentMood = moods.intro;
  let suspendTimer = 0;
  let scrollTicking = false;

  const setParam = (param, value, seconds = transitionTime) => {
    if (!ctx) {
      return;
    }
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, Math.max(0.04, seconds));
  };

  const updateButton = () => {
    button.classList.toggle("is-on", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    label.textContent = active ? "Sound Off" : "Sound On";
  };

  const makeTone = (type, hz, gainValue, destination) => {
    const tone = ctx.createOscillator();
    const gain = ctx.createGain();
    tone.type = type;
    tone.frequency.value = hz;
    gain.gain.value = gainValue;
    tone.connect(gain).connect(destination);
    tone.start();
    return { tone, gain };
  };

  const prepareAudio = () => {
    if (ready) {
      return;
    }

    ctx = new AudioContextCtor();
    master = ctx.createGain();
    filter = ctx.createBiquadFilter();
    filterLift = ctx.createGain();
    pulseLift = ctx.createGain();

    master.gain.value = 0;
    filter.type = "lowpass";
    filter.frequency.value = currentMood.filter;
    filter.Q.value = 0.42;
    filter.connect(master).connect(ctx.destination);

    const first = makeTone("sine", currentMood.a, currentMood.pad, filter);
    const second = makeTone("triangle", currentMood.b, currentMood.pad * 0.42, filter);
    const high = makeTone("sine", currentMood.shimmer, currentMood.shine, filter);
    const low = makeTone("sine", currentMood.pulseHz, currentMood.pulse, master);

    padA = first.tone;
    padGainA = first.gain;
    padB = second.tone;
    padGainB = second.gain;
    shimmerTone = high.tone;
    shimmerGain = high.gain;
    pulseTone = low.tone;
    pulseGain = low.gain;

    lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = currentMood.lfoHz;
    filterLift.gain.value = currentMood.lift;
    pulseLift.gain.value = currentMood.pulse * 0.28;
    lfo.connect(filterLift).connect(filter.frequency);
    lfo.connect(pulseLift).connect(pulseGain.gain);
    lfo.start();

    ready = true;
    applyMood(currentMood, true);
  };

  const applyMood = (mood, immediate = false) => {
    currentMood = mood;
    button.dataset.mood = mood.id;
    document.documentElement.dataset.soundMood = mood.id;

    if (!ready) {
      return;
    }

    const glide = immediate ? 0.06 : transitionTime;
    setParam(padA.frequency, mood.a, glide);
    setParam(padB.frequency, mood.b, glide);
    setParam(shimmerTone.frequency, mood.shimmer, glide);
    setParam(pulseTone.frequency, mood.pulseHz, glide);
    setParam(lfo.frequency, mood.lfoHz, glide);
    setParam(filter.frequency, mood.filter, glide);
    setParam(filterLift.gain, mood.lift, glide);
    setParam(padGainA.gain, mood.pad, glide);
    setParam(padGainB.gain, mood.pad * 0.42, glide);
    setParam(shimmerGain.gain, mood.shine, glide);
    setParam(pulseGain.gain, mood.pulse, glide);
    setParam(pulseLift.gain, mood.pulse * 0.28, glide);
    setParam(master.gain, active ? mood.master : 0, active ? glide : 0.55);
  };

  const chooseMood = () => {
    const anchor = window.scrollY + window.innerHeight * 0.48;
    let best = watchedSections[0];

    watchedSections.forEach((item) => {
      const top = item.element.getBoundingClientRect().top + window.scrollY - 100;
      if (anchor >= top) {
        best = item;
      }
    });

    const nextMood = moods[best.mood] || moods.intro;
    if (nextMood.id !== currentMood.id) {
      applyMood(nextMood);
    } else {
      button.dataset.mood = nextMood.id;
      document.documentElement.dataset.soundMood = nextMood.id;
    }
  };

  const scheduleMoodCheck = () => {
    if (scrollTicking) {
      return;
    }

    scrollTicking = true;
    window.requestAnimationFrame(() => {
      chooseMood();
      scrollTicking = false;
    });
  };

  const turnOn = async () => {
    prepareAudio();
    window.clearTimeout(suspendTimer);
    await ctx.resume();
    active = true;
    updateButton();
    chooseMood();
    applyMood(currentMood);
  };

  const turnOff = () => {
    if (!ready) {
      return;
    }

    active = false;
    updateButton();
    applyMood(currentMood);
    suspendTimer = window.setTimeout(() => {
      if (!active && ctx.state === "running") {
        ctx.suspend();
      }
    }, 1600);
  };

  button.addEventListener("click", () => {
    if (active) {
      turnOff();
      return;
    }

    turnOn().catch(() => {
      active = false;
      updateButton();
    });
  });

  window.addEventListener("scroll", scheduleMoodCheck, { passive: true });
  window.addEventListener("resize", scheduleMoodCheck);

  chooseMood();
  updateButton();
})();
