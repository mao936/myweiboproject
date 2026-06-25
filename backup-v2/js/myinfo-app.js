let data = loadData() || createSampleData();
let currentTab = 'home';
let searchQuery = '';
let searchQueryMine = '';
let expandedComments = new Set();
let avatarObjectURL = null;
let selectedMood = '';
let editingPostId = null;

const els = {
  currentAvatar: document.querySelector('.current-avatar'),
  currentAvatarSmall: document.querySelector('.current-avatar-small'),
  avatarInput: document.getElementById('avatar-input'),
  userName: document.querySelector('.user-name'),
  composeInput: document.querySelector('.compose-input'),
  composeCount: document.querySelector('.compose-count'),
  composeSubmit: document.querySelector('.compose-submit'),
  imageInput: document.getElementById('image-input'),
  videoInput: document.getElementById('video-input'),
  searchInput: document.querySelector('.search-input'),
  searchInputMine: document.querySelector('.search-input-mine'),
  postList: document.querySelector('.post-list'),
  postListMine: document.querySelector('.post-list-mine'),
  emptyState: document.querySelector('.empty-state'),
  emptyStateMine: document.querySelector('.empty-state-mine'),
  emptyStateLibrary: document.querySelector('.empty-state-library'),
  navItems: document.querySelectorAll('.nav-item'),
  library: document.querySelector('.library'),
  moodSelector: document.querySelector('.mood-selector')
};

async function init() {
  const hashTab = window.location.hash.replace('#', '');
  if (['home', 'mine', 'library'].includes(hashTab)) {
    currentTab = hashTab;
  }

  await loadAvatar();
  bindEvents();
  initMoodSelector();
  initBackgroundSlider();
  updateComposeState();

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === currentTab);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.hidden = panel.dataset.panel !== currentTab;
  });

  render();
}

async function loadAvatar() {
  if (data.currentUser.avatarFileId) {
    const url = await createObjectURL(data.currentUser.avatarFileId);
    if (url) {
      if (avatarObjectURL) URL.revokeObjectURL(avatarObjectURL);
      avatarObjectURL = url;
      els.currentAvatar.src = url;
      if (els.currentAvatarSmall) els.currentAvatarSmall.src = url;
      return;
    }
  }
  const defaultAvatar = defaultAvatarSVG();
  els.currentAvatar.src = defaultAvatar;
  if (els.currentAvatarSmall) els.currentAvatarSmall.src = defaultAvatar;
}

function defaultAvatarSVG() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect width="48" height="48" fill="#e5e5ea" rx="24"/>
    <circle cx="24" cy="19" r="7" fill="#aeaeb2"/>
    <path d="M11 42c0-9 5.8-15 13-15s13 6 13 15v2H11z" fill="#aeaeb2"/>
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

  if (editingPostId) {
    els.composeSubmit.textContent = '保存';
  } else {
    els.composeSubmit.textContent = '发布';
  }
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
  }

  els.composeInput.value = '';
  clearPendingMedia();
  resetMoodSelector();
  updateComposeState();
  render();

  if (currentTab !== 'home') switchTab('home');
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
  els.composeInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getFilteredPosts(mineOnly = false) {
  let posts = data.posts.filter(p => !p.isHidden);

  if (mineOnly) {
    posts = posts.filter(p => p.author === data.currentUser.name);
  }

  const query = mineOnly ? searchQueryMine : searchQuery;
  if (query.trim()) {
    const q = query.toLowerCase();
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
  const fill = active ? 'currentColor' : 'none';
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
}

function iconComment() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
}

function iconRepost() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2.5l4 4.5-4 4.5M3 7h14M7 21.5l-4-4.5 4-4.5M21 17H7"/></svg>`;
}

function iconClose() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
}

async function createPostNode(post) {
  const li = document.createElement('li');
  li.className = 'post-item';
  if (post.isPinned) li.classList.add('pinned');
  if (post.isRetracted) li.classList.add('retracted');
  li.dataset.id = post.id;

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
    topActions.push(`<button class="post-action-btn post-action-btn danger action-delete">删除</button>`);
  }

  const tagsHtml = (post.tags || []).map(tag =>
    `<span class="post-tag" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</span>`
  ).join('');

  li.innerHTML = `
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
    <div class="post-media" data-media='${JSON.stringify(post.media || [])}'></div>
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

  const mediaContainer = li.querySelector('.post-media');
  await renderPostMedia(mediaContainer, post.media);

  return li;
}

function createCommentsHtml(post) {
  const list = post.comments.length
    ? post.comments.map(c => `
      <div class="comment-item">
        <span class="comment-author">${escapeHtml(c.author)}:</span>
        <span class="comment-text">${escapeHtml(c.content)}</span>
      </div>
    `).join('')
    : '<div class="comment-empty">暂无评论，来说两句吧</div>';

  return `
    <div class="comment-list">${list}</div>
    <form class="comment-form">
      <input class="comment-input" type="text" placeholder="写下你的评论..." maxlength="140">
      <button class="comment-submit" type="submit" disabled>发送</button>
    </form>
  `;
}

async function render() {
  if (currentTab === 'home') {
    await renderList(getFilteredPosts(false), els.postList, els.emptyState, {
      title: searchQuery.trim() ? '未找到相关简讯' : '还没有简讯',
      desc: searchQuery.trim() ? '换个关键词试试吧' : '发布第一条简讯，记录此刻心情'
    });
  } else if (currentTab === 'mine') {
    await renderList(getFilteredPosts(true), els.postListMine, els.emptyStateMine, {
      title: searchQueryMine.trim() ? '未找到相关简讯' : '你还没有发布过简讯',
      desc: searchQueryMine.trim() ? '换个关键词试试吧' : '在首页发布一条简讯吧'
    });
  } else if (currentTab === 'library') {
    await renderLibrary();
  }
}

async function renderList(posts, listEl, emptyEl, messages) {
  listEl.innerHTML = '';

  if (posts.length === 0) {
    listEl.hidden = true;
    emptyEl.hidden = false;
    emptyEl.querySelector('.empty-title').textContent = messages.title;
    emptyEl.querySelector('.empty-desc').textContent = messages.desc;
  } else {
    listEl.hidden = false;
    emptyEl.hidden = true;
    for (const post of posts) {
      listEl.appendChild(await createPostNode(post));
    }
  }
}

function switchTab(tab) {
  currentTab = tab;
  window.location.hash = tab;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.hidden = panel.dataset.panel !== tab;
  });

  render();
}

async function removeLibraryItem(id) {
  if (!confirm('确定从媒体库删除该文件吗？')) return;

  const usedInAvatar = data.currentUser.avatarFileId === id;
  const usedInPosts = data.posts.some(p => p.media && p.media.some(m => m.fileId === id || m.coverId === id));

  if (usedInAvatar || usedInPosts) {
    showToast('该文件正在使用，无法删除');
    return;
  }

  await deleteMedia(id);
  renderLibrary();
  showToast('媒体已删除');
}

function bindEvents() {
  els.navItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

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

  els.composeSubmit.addEventListener('click', addPost);

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

  els.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  els.searchInputMine.addEventListener('input', (e) => {
    searchQueryMine = e.target.value;
    render();
  });

  els.postList.addEventListener('click', handlePostClick);
  els.postListMine.addEventListener('click', handlePostClick);

  [els.postList, els.postListMine].forEach(list => {
    list.addEventListener('submit', handleCommentSubmit);
    list.addEventListener('input', handleCommentInput);
  });

  if (els.library) {
    els.library.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.library-remove');
      if (!removeBtn) return;
      const item = removeBtn.closest('.library-item');
      if (item) removeLibraryItem(item.dataset.id);
    });
  }
}

function handlePostClick(e) {
  const postItem = e.target.closest('.post-item');
  if (!postItem) return;
  const id = postItem.dataset.id;

  const tagEl = e.target.closest('.post-tag');
  if (tagEl) {
    const tag = tagEl.dataset.tag;
    if (currentTab === 'mine') {
      searchQueryMine = tag;
      els.searchInputMine.value = tag;
    } else {
      searchQuery = tag;
      els.searchInput.value = tag;
    }
    render();
    return;
  }

  if (e.target.closest('.action-pin')) {
    pinPost(id);
    return;
  }

  if (e.target.closest('.action-unpin')) {
    unpinPost(id);
    return;
  }

  if (e.target.closest('.action-edit')) {
    editPost(id);
    return;
  }

  if (e.target.closest('.action-retract')) {
    retractPost(id);
    return;
  }

  if (e.target.closest('.action-hide')) {
    hidePost(id);
    return;
  }

  if (e.target.closest('.action-delete')) {
    deletePost(id);
    return;
  }

  if (e.target.closest('.action-like')) {
    toggleLike(id);
    return;
  }

  if (e.target.closest('.action-comment')) {
    toggleComment(id);
    return;
  }

  if (e.target.closest('.action-repost')) {
    showToast('转发功能暂未实现');
  }
}

function handleCommentSubmit(e) {
  e.preventDefault();
  const postItem = e.target.closest('.post-item');
  if (!postItem) return;
  const id = postItem.dataset.id;
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
