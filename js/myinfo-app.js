let data = loadData() || createSampleData();
let searchQuery = '';
let expandedComments = new Set();
let avatarObjectURL = null;
let selectedMood = '';
let editingPostId = null;

const els = {
  currentAvatar: document.querySelector('.current-avatar'),
  avatarInput: document.getElementById('avatar-input'),
  userName: document.querySelector('.user-name'),
  composeInput: document.querySelector('.compose-input'),
  composeCount: document.querySelector('.compose-count'),
  composeSubmit: document.querySelector('.compose-submit'),
  imageInput: document.getElementById('image-input'),
  videoInput: document.getElementById('video-input'),
  searchInput: document.querySelector('.search-input'),
  postFlow: document.querySelector('.post-flow'),
  emptyState: document.querySelector('.empty-state'),
  library: document.querySelector('.gallery'),
  emptyStateLibrary: document.querySelector('.empty-state-library'),
  moodSelector: document.querySelector('.mood-selector')
};

async function init() {
  applyStoredTheme();
  await loadAvatar();
  bindEvents();
  initMoodSelector();
  updateComposeState();
  render();
  initThreeScene();
  initScrollController();
  setHeroShapeVisible(true);
}

function applyStoredTheme() {
  const theme = data.settings?.theme || 'cyan';
  if (window.updateThemeColor) {
    updateThemeColor(theme);
  } else {
    document.documentElement.style.setProperty('--primary', `var(--${theme})`);
  }

  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

async function loadAvatar() {
  if (data.currentUser.avatarFileId) {
    const url = await createObjectURL(data.currentUser.avatarFileId);
    if (url) {
      if (avatarObjectURL) URL.revokeObjectURL(avatarObjectURL);
      avatarObjectURL = url;
      els.currentAvatar.src = url;
      return;
    }
  }
  const defaultAvatar = defaultAvatarSVG();
  els.currentAvatar.src = defaultAvatar;
}

function defaultAvatarSVG() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect width="48" height="48" fill="#1a1a2e" rx="24"/>
    <circle cx="24" cy="18" r="8" fill="#00f0ff" opacity="0.6"/>
    <path d="M10 44c0-10 6.3-16 14-16s14 6 14 16v2H10z" fill="#b829dd" opacity="0.5"/>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

async function saveAvatar(file) {
  if (file.size > MAX_IMAGE_SIZE) {
    showToast('头像图片不能超过 5MB');
    return;
  }

  const fileId = generateId();
  await saveMedia(fileId, file, { type: 'image', name: file.name, size: file.size });

  if (data.currentUser.avatarFileId) {
    await deleteMedia(data.currentUser.avatarFileId);
  }

  data.currentUser.avatarFileId = fileId;
  saveData(data);
  await loadAvatar();
  render();
  showToast('头像已更新');
}

function initMoodSelector() {
  if (!els.moodSelector) return;
  els.moodSelector.addEventListener('click', (e) => {
    const item = e.target.closest('.mood-item');
    if (!item) return;

    selectedMood = item.dataset.mood;
    els.moodSelector.querySelectorAll('.mood-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mood === selectedMood);
    });
  });
}

function resetMoodSelector() {
  selectedMood = '';
  if (!els.moodSelector) return;
  els.moodSelector.querySelectorAll('.mood-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mood === '');
  });
}

function updateComposeState() {
  const len = els.composeInput.value.length;
  els.composeCount.textContent = `${len}/${MAX_LENGTH}`;

  const overLimit = len > MAX_LENGTH;
  els.composeCount.classList.toggle('over-limit', overLimit);

  const hasContent = len > 0 || pendingMedia.length > 0;
  els.composeSubmit.disabled = !hasContent || overLimit;

  els.composeSubmit.textContent = editingPostId ? '保存' : '发布';
}

async function addPost() {
  const content = els.composeInput.value.trim();
  const media = getPendingMedia();

  if (!content && media.length === 0) return;
  if (content.length > MAX_LENGTH) return;

  if (editingPostId) {
    const post = data.posts.find(p => p.id === editingPostId);
    if (post) {
      post.content = content;
      post.mood = selectedMood;
      post.tags = extractTags(content);
      saveData(data);
      showToast('简讯已更新');
    }
    editingPostId = null;
  } else {
    const newPost = {
      id: generateId(),
      author: data.currentUser.name,
      avatarFileId: data.currentUser.avatarFileId,
      content,
      mood: selectedMood,
      tags: extractTags(content),
      createdAt: new Date().toISOString(),
      media,
      likes: 0,
      likedByMe: false,
      comments: [],
      reposts: 0,
      isPinned: false,
      isRetracted: false,
      isHidden: false
    };

    data.posts.unshift(newPost);
    saveData(data);
    showToast('简讯已发布');
  }

  els.composeInput.value = '';
  clearPendingMedia();
  resetMoodSelector();
  updateComposeState();
  render();
}

async function deletePost(id) {
  if (!confirm('确定要删除这条简讯吗？')) return;

  const post = data.posts.find(p => p.id === id);
  if (post && post.media) {
    for (const m of post.media) {
      await deleteMedia(m.fileId);
      if (m.coverId) await deleteMedia(m.coverId);
    }
  }

  data.posts = data.posts.filter(p => p.id !== id);
  expandedComments.delete(id);
  saveData(data);
  await cleanupOrphans();
  render();
}

async function cleanupOrphans() {
  const usedIds = getUsedFileIds(data);
  await cleanupOrphanMedia(usedIds);
}

function toggleLike(id) {
  const post = data.posts.find(p => p.id === id);
  if (!post || post.isRetracted) return;

  post.likedByMe = !post.likedByMe;
  post.likes += post.likedByMe ? 1 : -1;
  saveData(data);
  render();
}

function toggleComment(id) {
  if (expandedComments.has(id)) {
    expandedComments.delete(id);
  } else {
    expandedComments.add(id);
  }
  render();
}

function addComment(postId, content) {
  const post = data.posts.find(p => p.id === postId);
  if (!post || post.isRetracted) return;

  post.comments.push({
    id: generateId(),
    author: '路人甲',
    content,
    createdAt: new Date().toISOString()
  });

  saveData(data);
  render();
  expandedComments.add(postId);
}

function pinPost(id) {
  data.posts.forEach(p => { p.isPinned = false; });
  const post = data.posts.find(p => p.id === id);
  if (post) {
    post.isPinned = true;
    saveData(data);
    render();
    showToast('已置顶');
  }
}

function unpinPost(id) {
  const post = data.posts.find(p => p.id === id);
  if (post) {
    post.isPinned = false;
    saveData(data);
    render();
    showToast('已取消置顶');
  }
}

function retractPost(id) {
  const post = data.posts.find(p => p.id === id);
  if (!post) return;
  if (!post.isRetracted && !confirm('撤回后其他用户将看到该简讯已撤回，是否继续？')) return;

  post.isRetracted = !post.isRetracted;
  saveData(data);
  render();
  showToast(post.isRetracted ? '已撤回' : '已恢复');
}

function hidePost(id) {
  const post = data.posts.find(p => p.id === id);
  if (!post) return;
  post.isHidden = !post.isHidden;
  saveData(data);
  render();
  showToast(post.isHidden ? '已隐藏' : '已显示');
}

function editPost(id) {
  const post = data.posts.find(p => p.id === id);
  if (!post) return;

  editingPostId = id;
  els.composeInput.value = post.content;
  selectedMood = post.mood || '';

  if (els.moodSelector) {
    els.moodSelector.querySelectorAll('.mood-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mood === selectedMood);
    });
  }

  updateComposeState();
  scrollToSection(1);
  setTimeout(() => els.composeInput.focus(), 500);
}

function getFilteredPosts() {
  let posts = data.posts.filter(p => !p.isHidden);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    posts = posts.filter(p =>
      p.content.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      (p.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
  }

  return posts.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function iconLike(active) {
  const color = active ? 'var(--pink)' : 'currentColor';
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
}

function iconComment() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
}

function iconRepost() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2.5l4 4.5-4 4.5M3 7h14M7 21.5l-4-4.5 4-4.5M21 17H7"/></svg>`;
}

async function createPostCard(post) {
  const card = document.createElement('li');
  card.className = 'cyber-card post-card';
  if (post.isPinned) card.classList.add('pinned');
  if (post.isRetracted) card.classList.add('retracted');
  card.dataset.id = post.id;

  const isMine = post.author === data.currentUser.name;
  const likedClass = post.likedByMe ? 'active' : '';
  const commentsHidden = expandedComments.has(post.id) ? '' : 'hidden';

  const avatarUrl = post.avatarFileId
    ? (await createObjectURL(post.avatarFileId)) || defaultAvatarSVG()
    : defaultAvatarSVG();

  const topActions = [];
  if (post.isPinned) topActions.push(`<button class="post-action-btn action-unpin">取消置顶</button>`);
  else topActions.push(`<button class="post-action-btn action-pin">置顶</button>`);

  if (isMine) {
    topActions.push(`<button class="post-action-btn action-edit">编辑</button>`);
    topActions.push(`<button class="post-action-btn action-retract">${post.isRetracted ? '恢复' : '撤回'}</button>`);
    topActions.push(`<button class="post-action-btn action-hide">${post.isHidden ? '显示' : '隐藏'}</button>`);
    topActions.push(`<button class="post-action-btn danger action-delete">删除</button>`);
  }

  const tagsHtml = (post.tags || []).map(tag =>
    `<span class="post-tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</span>`
  ).join('');

  card.innerHTML = `
    <div class="post-header">
      <img class="avatar" src="${avatarUrl}" alt="头像">
      <div class="post-meta">
        <div class="post-author">
          ${escapeHtml(post.author)}
          ${post.mood ? `<span class="post-mood">${post.mood}</span>` : ''}
        </div>
        <div class="post-time">${post.isPinned ? '置顶 · ' : ''}${formatTime(post.createdAt)}</div>
      </div>
      <div class="post-actions-top">${topActions.join('')}</div>
    </div>
    ${post.content ? `<div class="post-content">${escapeHtml(post.content)}</div>` : ''}
    ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
    <div class="post-media-container"></div>
    <div class="post-actions">
      <button class="action-btn action-like ${likedClass}" ${post.isRetracted ? 'disabled' : ''}>
        ${iconLike(post.likedByMe)}
        <span>${post.likes || 0}</span>
      </button>
      <button class="action-btn action-comment" ${post.isRetracted ? 'disabled' : ''}>
        ${iconComment()}
        <span>${post.comments.length > 0 ? post.comments.length : '评论'}</span>
      </button>
      <button class="action-btn action-repost" ${post.isRetracted ? 'disabled' : ''}>
        ${iconRepost()}
        <span>${post.reposts || '转发'}</span>
      </button>
    </div>
    <div class="comments" ${commentsHidden}>
      ${createCommentsHtml(post)}
    </div>
  `;

  const mediaContainer = card.querySelector('.post-media-container');
  await renderPostMedia(mediaContainer, post.media);

  initCardTilt(card);

  return card;
}

function createCommentsHtml(post) {
  const list = post.comments.length
    ? post.comments.map(c => `
      <div class="comment-item">
        <span class="comment-author">${escapeHtml(c.author)}:</span>
        <span>${escapeHtml(c.content)}</span>
      </div>
    `).join('')
    : '<div class="comment-empty" style="font-size: 13px; color: var(--text-secondary);">暂无评论</div>';

  return `
    <div class="comment-list">${list}</div>
    <form class="comment-form">
      <input class="comment-input" type="text" placeholder="写下你的评论..." maxlength="140">
      <button class="cyber-btn comment-submit" type="submit" disabled style="padding: 8px 18px;">发送</button>
    </form>
  `;
}

function initCardTilt(card) {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
  });
}

async function render() {
  const posts = getFilteredPosts();

  if (els.postFlow) {
    els.postFlow.innerHTML = '';

    if (posts.length === 0) {
      els.postFlow.hidden = true;
      if (els.emptyState) {
        els.emptyState.hidden = false;
        els.emptyState.querySelector('.empty-title').textContent = searchQuery.trim() ? '未找到相关简讯' : '暂无简讯';
        els.emptyState.querySelector('.empty-desc').textContent = searchQuery.trim() ? '换个关键词试试吧' : '前往发布区创建第一条简讯';
      }
    } else {
      els.postFlow.hidden = false;
      if (els.emptyState) els.emptyState.hidden = true;
      for (const post of posts) {
        els.postFlow.appendChild(await createPostCard(post));
      }
    }
  }

  await renderGallery();
}

async function removeGalleryItem(id) {
  if (!confirm('确定从媒体库删除该文件吗？')) return;

  const usedInAvatar = data.currentUser.avatarFileId === id;
  const usedInPosts = data.posts.some(p => p.media && p.media.some(m => m.fileId === id || m.coverId === id));

  if (usedInAvatar || usedInPosts) {
    showToast('该文件正在使用，无法删除');
    return;
  }

  await deleteMedia(id);
  render();
  showToast('媒体已删除');
}

function bindEvents() {
  els.currentAvatar.addEventListener('click', () => els.avatarInput.click());

  els.avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) saveAvatar(file);
    e.target.value = '';
  });

  els.userName.addEventListener('change', (e) => {
    const name = e.target.value.trim();
    if (!name) {
      e.target.value = data.currentUser.name;
      return;
    }
    data.currentUser.name = name;
    saveData(data);
    showToast('昵称已更新');
  });

  els.composeInput.addEventListener('input', updateComposeState);
  els.composeSubmit.addEventListener('click', (e) => {
    e.preventDefault();
    addPost();
  });

  document.querySelector('.tool-image').addEventListener('click', () => els.imageInput.click());
  document.querySelector('.tool-video').addEventListener('click', () => els.videoInput.click());

  els.imageInput.addEventListener('change', (e) => {
    handleImageFiles(e.target.files);
    e.target.value = '';
  });

  els.videoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleVideoFile(file);
    e.target.value = '';
  });

  document.querySelector('.media-preview').addEventListener('click', (e) => {
    if (e.target.classList.contains('media-remove')) {
      const index = Number(e.target.dataset.index);
      removePendingMedia(index);
      updateComposeState();
    }
  });

  if (els.searchInput) {
    els.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });
  }

  if (els.postFlow) {
    els.postFlow.addEventListener('click', handlePostClick);
    els.postFlow.addEventListener('submit', handleCommentSubmit);
    els.postFlow.addEventListener('input', handleCommentInput);
  }

  if (els.library) {
    els.library.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.gallery-remove');
      if (!removeBtn) return;
      const item = removeBtn.closest('.gallery-item');
      if (item) removeGalleryItem(item.dataset.id);
    });
  }

  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      data.settings.theme = theme;
      saveData(data);
      updateThemeColor(theme);
      document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showToast(`主题已切换为 ${theme}`);
    });
  });

  document.querySelectorAll('.bg-interval').forEach(btn => {
    btn.addEventListener('click', () => {
      const interval = Number(btn.dataset.interval);
      data.settings.bgInterval = interval;
      saveData(data);
      document.querySelectorAll('.bg-interval').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showToast(`背景切换间隔已设为 ${interval} 秒`);
    });
  });

  document.querySelector('.clear-data')?.addEventListener('click', () => {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复。')) return;
    localStorage.removeItem(STORAGE_KEY);
    indexedDB.deleteDatabase('myinfo-media-db');
    location.reload();
  });
}

function handlePostClick(e) {
  const postCard = e.target.closest('.post-card');
  if (!postCard) return;
  const id = postCard.dataset.id;

  const tagEl = e.target.closest('.post-tag');
  if (tagEl) {
    searchQuery = tagEl.dataset.tag;
    if (els.searchInput) els.searchInput.value = searchQuery;
    scrollToSection(2);
    render();
    return;
  }

  if (e.target.closest('.action-pin')) { pinPost(id); return; }
  if (e.target.closest('.action-unpin')) { unpinPost(id); return; }
  if (e.target.closest('.action-edit')) { editPost(id); return; }
  if (e.target.closest('.action-retract')) { retractPost(id); return; }
  if (e.target.closest('.action-hide')) { hidePost(id); return; }
  if (e.target.closest('.action-delete')) { deletePost(id); return; }
  if (e.target.closest('.action-like')) { toggleLike(id); return; }
  if (e.target.closest('.action-comment')) { toggleComment(id); return; }
  if (e.target.closest('.action-repost')) { showToast('转发功能暂未实现'); }
}

function handleCommentSubmit(e) {
  e.preventDefault();
  const postCard = e.target.closest('.post-card');
  if (!postCard) return;
  const id = postCard.dataset.id;
  const input = e.target.querySelector('.comment-input');
  const content = input.value.trim();
  if (!content) return;
  addComment(id, content);
}

function handleCommentInput(e) {
  if (e.target.classList.contains('comment-input')) {
    const form = e.target.closest('.comment-form');
    const submit = form.querySelector('.comment-submit');
    submit.disabled = e.target.value.trim().length === 0;
  }
}

init();
