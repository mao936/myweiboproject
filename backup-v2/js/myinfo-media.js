let pendingMedia = [];

async function handleFileSelect(file, type) {
  if (type === 'image') {
    if (file.size > MAX_IMAGE_SIZE) {
      showToast(`图片 ${file.name} 超过 5MB 限制`);
      return null;
    }
    const fileId = generateId();
    await saveMedia(fileId, file, { type: 'image', name: file.name, size: file.size });
    return { fileId, type: 'image', url: URL.createObjectURL(file), name: file.name };
  }

  if (type === 'video') {
    if (file.size > MAX_VIDEO_SIZE) {
      showToast(`视频 ${file.name} 超过 50MB 限制`);
      return null;
    }
    const duration = await getVideoDuration(file);
    if (duration > 60) {
      showToast('视频时长不能超过 60 秒');
      return null;
    }
    const fileId = generateId();
    const coverBlob = await generateVideoCover(file);
    const coverId = coverBlob ? generateId() : null;
    if (coverBlob) {
      await saveMedia(coverId, coverBlob, { type: 'image', name: 'cover', size: coverBlob.size });
    }
    await saveMedia(fileId, file, { type: 'video', name: file.name, size: file.size, coverId, duration });
    return { fileId, type: 'video', url: URL.createObjectURL(file), coverId, name: file.name, duration };
  }

  return null;
}

async function handleImageFiles(files) {
  const remaining = MAX_IMAGES - pendingMedia.filter(m => m.type === 'image').length;
  const targets = Array.from(files).slice(0, remaining);

  if (files.length > remaining) {
    showToast(`最多上传 ${MAX_IMAGES} 张图片`);
  }

  for (const file of targets) {
    const media = await handleFileSelect(file, 'image');
    if (media) pendingMedia.push(media);
  }

  if (pendingMedia.some(m => m.type === 'video')) {
    pendingMedia = pendingMedia.filter(m => m.type !== 'video');
    showToast('图片和视频不能同时发布');
  }

  renderPendingMedia();
}

async function handleVideoFile(file) {
  if (pendingMedia.some(m => m.type === 'image')) {
    showToast('图片和视频不能同时发布');
    return;
  }

  const media = await handleFileSelect(file, 'video');
  if (media) {
    pendingMedia = [media];
    renderPendingMedia();
  }
}

function removePendingMedia(index) {
  const item = pendingMedia[index];
  if (item) {
    URL.revokeObjectURL(item.url);
    pendingMedia.splice(index, 1);
    renderPendingMedia();
  }
}

function clearPendingMedia() {
  pendingMedia.forEach(m => URL.revokeObjectURL(m.url));
  pendingMedia = [];
  renderPendingMedia();
}

function renderPendingMedia() {
  const container = document.querySelector('.media-preview');
  if (!container) return;

  container.innerHTML = '';
  if (pendingMedia.length === 0) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  pendingMedia.forEach((media, index) => {
    const div = document.createElement('div');
    div.className = 'media-preview-item';

    if (media.type === 'image') {
      div.innerHTML = `
        <img src="${media.url}" alt="预览">
        <button class="media-remove" data-index="${index}" type="button">×</button>
      `;
    } else {
      div.innerHTML = `
        <video src="${media.url}" muted></video>
        <button class="media-remove" data-index="${index}" type="button">×</button>
      `;
    }

    container.appendChild(div);
  });
}

function getPendingMedia() {
  return pendingMedia.map(m => ({ fileId: m.fileId, type: m.type }));
}

async function generateVideoCover(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(1, video.duration / 2);
    });

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(video.src);

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.7);
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    });

    video.load();
  });
}

function getVideoDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);

    video.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    });
  });
}

async function renderPostMedia(container, mediaList) {
  container.innerHTML = '';
  if (!mediaList || mediaList.length === 0) return;

  if (mediaList.length === 1 && mediaList[0].type === 'video') {
    await renderVideoPlayer(container, mediaList[0].fileId);
    return;
  }

  const grid = document.createElement('div');
  grid.className = `media-grid count-${Math.min(mediaList.length, 9)}`;

  for (const media of mediaList) {
    const url = await createObjectURL(media.fileId);
    if (!url) continue;

    if (media.type === 'image') {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '简讯图片';
      img.className = 'post-image';
      grid.appendChild(img);
    }
  }

  container.appendChild(grid);
}

async function renderVideoPlayer(container, fileId) {
  const url = await createObjectURL(fileId);
  if (!url) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';
  wrapper.innerHTML = `
    <video src="${url}" preload="metadata" playsinline></video>
    <div class="video-cover">
      <div class="play-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
  `;

  const video = wrapper.querySelector('video');
  const cover = wrapper.querySelector('.video-cover');

  cover.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      cover.hidden = true;
    }
  });

  video.addEventListener('pause', () => {
    cover.hidden = false;
  });

  video.addEventListener('ended', () => {
    cover.hidden = false;
  });

  container.appendChild(wrapper);
}

async function renderLibrary() {
  const container = document.querySelector('.library');
  const empty = document.querySelector('.empty-state-library');
  const mediaList = await getAllMedia();

  container.innerHTML = '';

  if (mediaList.length === 0) {
    container.hidden = true;
    empty.hidden = false;
    return;
  }

  container.hidden = false;
  empty.hidden = true;

  for (const item of mediaList) {
    const url = await createObjectURL(item.id);
    if (!url) continue;

    const div = document.createElement('div');
    div.className = 'library-item';
    div.dataset.id = item.id;

    if (item.type === 'image') {
      div.innerHTML = `
        <img src="${url}" alt="${escapeHtml(item.name || '')}">
        <div class="library-info">${escapeHtml(item.name || '图片')} · ${formatBytes(item.size || 0)}</div>
        <button class="library-remove" type="button">×</button>
      `;
    } else {
      div.innerHTML = `
        <video src="${url}" muted></video>
        <div class="library-info">${escapeHtml(item.name || '视频')} · ${formatBytes(item.size || 0)}</div>
        <button class="library-remove" type="button">×</button>
      `;
    }

    container.appendChild(div);
  }
}

function initBackgroundSlider() {
  const slides = document.querySelectorAll('.bg-slide');
  const dots = document.querySelectorAll('.bg-dot');
  const settingsBtn = document.querySelector('.bg-settings-btn');
  const settingsPanel = document.querySelector('.bg-settings');
  const intervalOptions = document.querySelectorAll('.bg-option');

  if (!slides.length) return;

  const NATURE_SEEDS = ['mountains', 'lake', 'forest', 'sunset', 'ocean', 'meadow'];

  let current = 0;
  let interval = getBgInterval();
  let timer = null;

  function getBgInterval() {
    const data = loadData();
    return (data && data.settings && data.settings.bgInterval) ? data.settings.bgInterval : 10;
  }

  function loadSlideImage(slide, url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function applyBackgrounds() {
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      let url = slide.dataset.image;
      if (!url) {
        const seed = slide.dataset.seed || NATURE_SEEDS[i % NATURE_SEEDS.length];
        const width = window.innerWidth || 1920;
        const height = window.innerHeight || 1080;
        url = `https://picsum.photos/seed/${seed}/${width}/${height}`;
      }
      await loadSlideImage(slide, url);
      slide.style.backgroundImage = `url('${url}')`;
    }
  }

  function updateIntervalOptions() {
    intervalOptions.forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.interval) === interval);
    });
  }

  function nextSlide() {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function start() {
    if (timer) clearInterval(timer);
    timer = setInterval(nextSlide, interval * 1000);
  }

  function restartTimer() {
    start();
  }

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.hidden = !settingsPanel.hidden;
  });

  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
      settingsPanel.hidden = true;
    }
  });

  intervalOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      interval = Number(btn.dataset.interval);
      const data = loadData() || createDefaultData();
      data.settings.bgInterval = interval;
      saveData(data);
      updateIntervalOptions();
      restartTimer();
      showToast(`背景切换间隔已设为 ${interval} 秒`);
    });
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyBackgrounds();
    }, 300);
  });

  updateIntervalOptions();
  applyBackgrounds().then(() => {
    start();
  });
}
