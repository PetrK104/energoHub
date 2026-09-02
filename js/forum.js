(function () {

  // === CONFIG ===
  var SUPABASE_URL     = 'https://rfmwjcimgtpttgeshegs.supabase.co'
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbXdqY2ltZ3RwdHRnZXNoZWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Mjg5NDcsImV4cCI6MjEwMzMwNDk0N30.ABcxqHUj6a_OvrVmrfcI4gAC6oWjecmr71mD-kuje4Y'
  var BOT_COLORS = ['#b7f13d', '#3db4f1', '#f59e0b', '#a78bfa', '#f87171']

  var FILTER_KEYWORDS = {
    jom: ['jom', 'jednotné odběrné', 'odběrné místo'],
    fve: ['fve', 'fotovoltaika', 'solární', 'panel']
  }

  // === STATE ===
  var sb
  var currentUser     = null
  var currentRole     = null
  var currentUsername = null
  var currentThread   = null
  var realtimeChannel = null
  var searchQuery     = ''
  var activeFilter    = ''
  var allThreads      = []
  var autoStartTurns  = 0
  var userCache       = {}  // userId → username
  var pendingAction   = null
  var currentPage     = 1
  var THREADS_PER_PAGE = 5

  // === DOM — hero auth ===
  var heroAuthPanel        = document.getElementById('heroAuthPanel')
  var heroUserPanel        = document.getElementById('heroUserPanel')
  var heroUserEmail        = document.getElementById('heroUserEmail')
  var heroUserEmailAddress = document.getElementById('heroUserEmailAddress')
  var heroAuthHeading      = document.getElementById('heroAuthHeading')
  var heroAuthSub          = document.getElementById('heroAuthSub')
  var heroLoginForm        = document.getElementById('heroLoginForm')
  var heroRegisterForm     = document.getElementById('heroRegisterForm')
  var heroLoginError       = document.getElementById('heroLoginError')
  var heroRegisterError    = document.getElementById('heroRegisterError')
  var heroRegisterSuccess  = document.getElementById('heroRegisterSuccess')
  var heroPasswordInput    = document.getElementById('heroPasswordInput')
  var heroPasswordToggle   = document.getElementById('heroPasswordToggle')
  var heroEyeOpen          = document.getElementById('heroEyeOpen')
  var heroEyeClosed        = document.getElementById('heroEyeClosed')
  var heroUsernameInput    = document.getElementById('heroUsernameInput')
  var heroSwitchToRegister = document.getElementById('heroSwitchToRegister')
  var heroSwitchToLogin    = document.getElementById('heroSwitchToLogin')
  var heroSignOutBtn       = document.getElementById('heroSignOutBtn')

  // === DOM — main ===
  var viewList        = document.getElementById('viewList')
  var viewDetail      = document.getElementById('viewDetail')
  var forumList       = document.getElementById('forumList')
  var forumLoading    = document.getElementById('forumLoading')
  var forumEmpty      = document.getElementById('forumEmpty')
  var forumPagination = document.getElementById('forumPagination')
  var forumSearch     = document.getElementById('forumSearch')
  var forumNewBtn     = document.getElementById('forumNewBtn')

  var backBtn         = document.getElementById('backBtn')
  var threadHeader    = document.getElementById('threadHeader')
  var botBar          = document.getElementById('botBar')
  var botModeLabel    = document.getElementById('botModeLabel')
  var toggleBotBtn    = document.getElementById('toggleBotBtn')
  var messageList     = document.getElementById('messageList')
  var messagesLoading = document.getElementById('messagesLoading')
  var replyForm       = document.getElementById('replyForm')
  var replyError      = document.getElementById('replyError')
  var loginHint       = document.getElementById('loginHint')
  var loginHintBtn         = document.getElementById('loginHintBtn')
  var loginHintRegisterBtn = document.getElementById('loginHintRegisterBtn')

  var authModal         = document.getElementById('authModal')
  var authModalBackdrop = document.getElementById('authModalBackdrop')
  var authModalClose    = document.getElementById('authModalClose')
  var authModalTitle    = document.getElementById('authModalTitle')
  var authForm          = document.getElementById('authForm')
  var authError         = document.getElementById('authError')
  var authSwitchToRegister = document.getElementById('authSwitchToRegister')
  var authSwitchToLogin    = document.getElementById('authSwitchToLogin')
  var authRegisterForm     = document.getElementById('authRegisterForm')
  var authRegError         = document.getElementById('authRegError')
  var authRegSuccess       = document.getElementById('authRegSuccess')
  var authRegUsernameInput = document.getElementById('authRegUsernameInput')
  var authRegEmailInput    = document.getElementById('authRegEmailInput')
  var authRegPasswordInput = document.getElementById('authRegPasswordInput')

  var forumModal         = document.getElementById('forumModal')
  var forumModalBackdrop = document.getElementById('forumModalBackdrop')
  var forumModalClose    = document.getElementById('forumModalClose')
  var forumPostForm      = document.getElementById('forumPostForm')
  var botSection         = document.getElementById('botSection')
  var botRowsContainer   = document.getElementById('botRows')
  var addBotBtn          = document.getElementById('addBotBtn')
  var threadError        = document.getElementById('threadError')

  var addBotToThreadBtn   = document.getElementById('addBotToThreadBtn')

  var addBotModal         = document.getElementById('addBotModal')
  var addBotModalBackdrop = document.getElementById('addBotModalBackdrop')
  var addBotModalClose    = document.getElementById('addBotModalClose')
  var addBotForm          = document.getElementById('addBotForm')
  var addBotError         = document.getElementById('addBotError')

  var heroExplorePanel     = document.getElementById('heroExplorePanel')
  var heroExploreBtn       = document.getElementById('heroExploreBtn')
  var heroUserCard         = document.getElementById('heroUserCard')

  var heroDeleteAccountBtn  = document.getElementById('heroDeleteAccountBtn')
  var deleteAccountWrap     = document.getElementById('deleteAccountWrap')
  var deleteAccountBackdrop = document.getElementById('deleteAccountBackdrop')
  var deleteAccountModal    = document.getElementById('deleteAccountModal')
  var deleteAccountCancel   = document.getElementById('deleteAccountCancel')
  var deleteAccountConfirm  = document.getElementById('deleteAccountConfirm')

  // === HELPERS ===

  function escapeHtml(str) {
    if (!str) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: '2-digit' })
  }

  function formatDateTime(iso) {
    if (!iso) return ''
    var d = new Date(iso)
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }) + ' ' +
           d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }

  function formatTime(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }

  function formatRelativeTime(iso) {
    if (!iso) return ''
    var diff = Date.now() - new Date(iso).getTime()
    var mins = Math.floor(diff / 60000)
    if (mins < 1) return 'právě teď'
    if (mins < 60) return 'před ' + mins + (mins === 1 ? ' minutou' : ' minutami')
    var hours = Math.floor(mins / 60)
    if (hours < 24) return 'před ' + hours + (hours === 1 ? ' hodinou' : hours < 5 ? ' hodinami' : ' hodinami')
    var days = Math.floor(hours / 24)
    if (days < 30) return 'před ' + days + (days === 1 ? ' dnem' : days < 5 ? ' dny' : ' dny')
    return formatDate(iso)
  }

  async function getToken() {
    var session = await sb.auth.getSession()
    return session.data.session ? session.data.session.access_token : null
  }

  function matchesFilter(topic) {
    if (!activeFilter) return true
    var t = (topic || '').toLowerCase()
    return FILTER_KEYWORDS[activeFilter].some(function (k) { return t.indexOf(k) !== -1 })
  }

  // === INIT ===

  function init() {
    if (!window.supabase) { console.error('Supabase SDK nenačten'); return }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    })
    sb.auth.onAuthStateChange(handleAuthChange)
    bindEvents()
    addBotRow()
    addBotRow()
    loadThreads()

    var mainEl = document.querySelector('.forum-main')
    if (mainEl) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) mainEl.classList.add('is-visible')
      }, { threshold: 0.05 }).observe(mainEl)
    }
  }

  // === EVENTS ===

  function bindEvents() {
    // Hero auth — login form
    heroLoginForm.addEventListener('submit', function (e) {
      e.preventDefault()
      var d = new FormData(heroLoginForm)
      handleSignIn(d.get('email'), d.get('password'), heroLoginError, heroLoginForm)
    })

    // Hero auth — register form
    heroRegisterForm.addEventListener('submit', function (e) {
      e.preventDefault()
      var d = new FormData(heroRegisterForm)
      handleSignUp(d.get('email'), d.get('password'), (d.get('username') || '').trim())
    })

    // Hero auth — mode switch
    heroSwitchToRegister.addEventListener('click', function () { showHeroMode('register') })
    heroSwitchToLogin.addEventListener('click', function () { showHeroMode('login') })

    // Hero auth — password toggle
    heroPasswordToggle.addEventListener('click', function () {
      var isHidden = heroPasswordInput.type === 'password'
      heroPasswordInput.type = isHidden ? 'text' : 'password'
      heroEyeOpen.hidden   = isHidden
      heroEyeClosed.hidden = !isHidden
    })

    // Hero — explore button (nepřihlášený stav)
    heroExploreBtn.addEventListener('click', function () {
      document.querySelector('.forum-main').scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    // Hero auth — user panel
    heroSignOutBtn.addEventListener('click', handleSignOut)

    // Nové vlákno (toolbar)
    forumNewBtn.addEventListener('click', function () {
      if (!currentUser) {
        pendingAction = 'newThread'
        openAuthModal()
      } else {
        openForumModal()
      }
    })

    // Auth modal (pro login hint v detailu vlákna)
    authModalClose.addEventListener('click', closeAuthModal)
    authModalBackdrop.addEventListener('click', closeAuthModal)
    authForm.addEventListener('submit', function (e) {
      e.preventDefault()
      var d = new FormData(authForm)
      handleSignIn(d.get('email'), d.get('password'), authError, authForm)
    })

    authSwitchToRegister.addEventListener('click', function () {
      authForm.hidden = true
      authRegisterForm.hidden = false
      authModalTitle.textContent = 'Registrace'
    })
    authSwitchToLogin.addEventListener('click', function () {
      authRegisterForm.hidden = true
      authForm.hidden = false
      authModalTitle.textContent = 'Přihlášení'
    })
    authRegisterForm.addEventListener('submit', function (e) {
      e.preventDefault()
      var username = authRegUsernameInput.value
      var email    = authRegEmailInput.value
      var password = authRegPasswordInput.value
      handleSignUpModal(username, email, password)
    })

    if (loginHintBtn) loginHintBtn.addEventListener('click', openAuthModal)
    if (loginHintRegisterBtn) loginHintRegisterBtn.addEventListener('click', function () {
      openAuthModal()
      authSwitchToRegister.click()
    })

    // Nové vlákno modal
    forumModalClose.addEventListener('click', closeForumModal)
    forumModalBackdrop.addEventListener('click', closeForumModal)
    addBotBtn.addEventListener('click', addBotRow)
    forumPostForm.addEventListener('submit', function (e) {
      e.preventDefault()
      handleCreateThread()
    })

    // Vyhledávání
    forumSearch.addEventListener('input', function () {
      searchQuery = forumSearch.value.trim().toLowerCase()
      currentPage = 1
      renderThreads(allThreads)
    })

    // Filtry průvodců
    document.querySelectorAll('.forum-filter-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeFilter = btn.dataset.filter
        currentPage = 1
        document.querySelectorAll('.forum-filter-tab').forEach(function (b) {
          b.classList.toggle('is-active', b === btn)
        })
        renderThreads(allThreads)
      })
    })

    // Detail
    backBtn.addEventListener('click', function () { history.back() })
    window.addEventListener('popstate', function () { if (currentThread) showListView() })
    toggleBotBtn.addEventListener('click', handleToggleBotMode)
    addBotToThreadBtn.addEventListener('click', openAddBotModal)
    threadHeader.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'deleteThreadBtn') handleDeleteThread()
    })

    // Admin: přidat bota do vlákna
    addBotModalClose.addEventListener('click', closeAddBotModal)
    addBotModalBackdrop.addEventListener('click', closeAddBotModal)
    addBotForm.addEventListener('submit', function (e) {
      e.preventDefault()
      handleAddBotToThread()
    })

    // Odpověď
    replyForm.addEventListener('submit', function (e) {
      e.preventDefault()
      var ta = replyForm.querySelector('textarea')
      var text = ta.value.trim()
      if (!text) return
      ta.value = ''
      handleSendReply(text)
    })

    // Smazání účtu
    heroDeleteAccountBtn.addEventListener('click', openDeleteAccountModal)
    deleteAccountCancel.addEventListener('click', closeDeleteAccountModal)
    deleteAccountBackdrop.addEventListener('click', closeDeleteAccountModal)
    deleteAccountConfirm.addEventListener('click', handleDeleteAccount)

    // Escape zavře modály
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!authModal.hidden) closeAuthModal()
        if (!forumModal.hidden) closeForumModal()
        if (!deleteAccountModal.hidden) closeDeleteAccountModal()
      }
    })
  }

  // === AUTH ===

  async function handleAuthChange(event, session) {
    currentUser = session ? session.user : null
    currentRole = null
    if (currentUser) await fetchUserRole(currentUser.id)
    updateAuthUI()
  }

  async function fetchUserRole(userId) {
    var result = await sb.from('profiles').select('role, username').eq('id', userId).single()
    if (result.data) {
      currentRole     = result.data.role
      currentUsername = result.data.username || null
      userCache[userId] = result.data.username || null
    }
    // If username missing, apply pending username from registration (email confirmation flow)
    if (!currentUsername) {
      var pending = localStorage.getItem('pendingUsername')
      if (pending) {
        try {
          var sess = await sb.auth.getSession()
          var tok  = sess.data.session ? sess.data.session.access_token : null
          if (tok) {
            var r = await fetch('/.netlify/functions/upsert-profile', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
              body:    JSON.stringify({ username: pending })
            })
            if (r.ok) {
              currentUsername = pending
              userCache[userId] = pending
              localStorage.removeItem('pendingUsername')
            }
          }
        } catch (_) {}
      }
    }
  }

  async function fetchUsernames(ids) {
    var toFetch = ids.filter(function (id) { return id && !(id in userCache) })
    if (!toFetch.length) return
    var res = await sb.from('profiles').select('id, username').in('id', toFetch)
    if (res.data) res.data.forEach(function (p) { userCache[p.id] = p.username || null })
  }

  function updateAuthUI() {
    if (currentUser) {
      heroExplorePanel.hidden = true
      heroUserCard.hidden = false
      heroUserEmail.textContent        = currentUsername || '…'
      heroUserEmailAddress.textContent = currentUser.email
      forumNewBtn.hidden = false
      deleteAccountWrap.hidden = false
    } else {
      heroExplorePanel.hidden = false
      heroUserCard.hidden = true
      forumNewBtn.hidden = false
      deleteAccountWrap.hidden = true
    }

    if (currentThread) {
      replyForm.hidden = !currentUser
      loginHint.hidden = !!currentUser
      updateBotBar()
    }
  }

  async function handleSignIn(email, password, errorEl, formEl) {
    errorEl.hidden = true
    var submitBtn = formEl.querySelector('button[type=submit]')
    submitBtn.disabled = true

    var result = await sb.auth.signInWithPassword({ email: email, password: password })
    submitBtn.disabled = false

    if (result.error) {
      errorEl.textContent = result.error.message || 'Přihlášení se nezdařilo.'
      errorEl.hidden = false
      return
    }
    if (!authModal.hidden) closeAuthModal()
    if (pendingAction === 'newThread') {
      pendingAction = null
      openForumModal()
    } else if (pendingAction && pendingAction.type === 'reply') {
      var tid = pendingAction.threadId
      var savedText = pendingAction.text
      pendingAction = null
      var form = document.querySelector('.forum-post__quick-reply-form[data-thread-id="' + tid + '"]')
      if (form && savedText) handleInlineReply(tid, savedText, form)
    }
  }

  function showHeroMode(mode) {
    var isLogin = mode === 'login'
    heroLoginForm.hidden    = !isLogin
    heroRegisterForm.hidden = isLogin
    heroAuthHeading.textContent = isLogin ? 'Přihlášení' : 'Registrace'
    heroAuthSub.textContent     = isLogin
      ? 'Vítejte zpět, přihlaste se ke svému účtu.'
      : 'Vytvořte si účet a zapojte se do diskuze.'
    if (isLogin) {
      heroLoginError.hidden = true
    } else {
      heroRegisterError.hidden = true
      heroRegisterSuccess.hidden = true
    }
  }

  async function handleSignUp(email, password, username) {
    heroRegisterError.hidden   = true
    heroRegisterSuccess.hidden = true

    var showErr = function (msg) {
      heroRegisterError.textContent = msg
      heroRegisterError.hidden = false
    }

    email    = (email    || '').trim()
    password = (password || '').trim()
    username = (username || '').trim()

    if (!username || username.length < 3) return showErr('Uživatelské jméno musí mít alespoň 3 znaky.')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErr('Zadejte platnou e-mailovou adresu.')
    if (!password || password.length < 6) return showErr('Heslo musí mít alespoň 6 znaků.')

    var submitBtn = heroRegisterForm.querySelector('button[type=submit]')
    submitBtn.disabled = true

    var result = await sb.auth.signUp({ email: email, password: password })

    if (result.error) {
      heroRegisterError.textContent = result.error.message
      heroRegisterError.hidden = false
      submitBtn.disabled = false
      return
    }

    var token = result.data.session ? result.data.session.access_token : null
    if (token && username) {
      try {
        var r = await fetch('/.netlify/functions/upsert-profile', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body:    JSON.stringify({ username: username })
        })
        var d = await r.json()
        if (!r.ok) {
          heroRegisterError.textContent = d.error || 'Chyba při ukládání jména.'
          heroRegisterError.hidden = false
          submitBtn.disabled = false
          return
        }
      } catch (err) {
        heroRegisterError.textContent = 'Chyba připojení: ' + err.message
        heroRegisterError.hidden = false
        submitBtn.disabled = false
        return
      }
    } else if (username) {
      // Email confirmation required — store username for use on first login
      localStorage.setItem('pendingUsername', username)
    }

    submitBtn.disabled = false
    heroRegisterSuccess.hidden = false
    heroRegisterForm.reset()
  }

  async function handleSignUpModal(username, email, password) {
    authRegError.hidden   = true
    authRegSuccess.hidden = true

    var showErr = function (msg) {
      authRegError.textContent = msg
      authRegError.hidden = false
    }

    email    = (email    || '').trim()
    password = (password || '').trim()
    username = (username || '').trim()

    if (!username || username.length < 3) return showErr('Uživatelské jméno musí mít alespoň 3 znaky.')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErr('Zadejte platnou e-mailovou adresu.')
    if (!password || password.length < 6) return showErr('Heslo musí mít alespoň 6 znaků.')

    var submitBtn = authRegisterForm.querySelector('button[type=submit]')
    submitBtn.disabled = true

    var result = await sb.auth.signUp({ email: email, password: password })

    if (result.error) {
      showErr(result.error.message)
      submitBtn.disabled = false
      return
    }

    var token = result.data.session ? result.data.session.access_token : null
    if (token && username) {
      try {
        var r = await fetch('/.netlify/functions/upsert-profile', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body:    JSON.stringify({ username: username })
        })
        var d = await r.json()
        if (!r.ok) {
          showErr(d.error || 'Chyba při ukládání jména.')
          submitBtn.disabled = false
          return
        }
      } catch (err) {
        showErr('Chyba připojení: ' + err.message)
        submitBtn.disabled = false
        return
      }
      submitBtn.disabled = false
      if (!authModal.hidden) closeAuthModal()
      if (pendingAction === 'newThread') {
        pendingAction = null
        openForumModal()
      } else if (pendingAction && pendingAction.type === 'reply') {
        var tid = pendingAction.threadId
        pendingAction = null
        toggleQuickReply(tid)
      }
    } else if (username) {
      localStorage.setItem('pendingUsername', username)
      submitBtn.disabled = false
      authRegSuccess.textContent = 'Zkontrolujte svůj e-mail a potvrďte registraci.'
      authRegSuccess.hidden = false
      authRegisterForm.reset()
    } else {
      submitBtn.disabled = false
      authRegSuccess.textContent = 'Zkontrolujte svůj e-mail a potvrďte registraci.'
      authRegSuccess.hidden = false
      authRegisterForm.reset()
    }
  }

  async function handleSignOut() {
    await sb.auth.signOut()
  }

  function openDeleteAccountModal() {
    deleteAccountModal.hidden  = false
    deleteAccountBackdrop.hidden = false
    document.body.style.overflow = 'hidden'
  }

  function closeDeleteAccountModal() {
    deleteAccountModal.hidden  = true
    deleteAccountBackdrop.hidden = true
    document.body.style.overflow = ''
    deleteAccountConfirm.disabled = false
  }

  async function handleDeleteAccount() {
    deleteAccountConfirm.disabled = true

    var sess = await sb.auth.getSession()
    var token = sess.data.session ? sess.data.session.access_token : null
    if (!token) {
      closeDeleteAccountModal()
      return
    }

    try {
      var r = await fetch('/.netlify/functions/delete-account', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      })
      if (!r.ok) {
        var d = await r.json().catch(function () { return {} })
        alert(d.error || 'Smazání se nezdařilo.')
        deleteAccountConfirm.disabled = false
        return
      }
    } catch (err) {
      alert('Chyba připojení: ' + err.message)
      deleteAccountConfirm.disabled = false
      return
    }

    closeDeleteAccountModal()
    await sb.auth.signOut()
  }

  function openAuthModal() {
    authForm.hidden = false
    authRegisterForm.hidden = true
    authModalTitle.textContent = 'Přihlášení'
    authForm.reset()
    authRegisterForm.reset()
    authError.hidden = true
    authRegError.hidden = true
    authRegSuccess.hidden = true
    authModal.hidden = false
    document.body.style.overflow = 'hidden'
    setTimeout(function () {
      var input = authModal.querySelector('input:not([hidden])')
      if (input) input.focus()
    }, 50)
  }

  function closeAuthModal() {
    authModal.hidden = true
    document.body.style.overflow = ''
  }

  // === LIST VIEW ===

  function showListView() {
    viewList.hidden = false
    viewDetail.hidden = true
    currentThread = null
    autoStartTurns = 0
    unsubscribeRealtime()
    history.replaceState(null, '', location.pathname + location.search)
  }

  async function loadThreads() {
    forumLoading.hidden = false
    forumList.innerHTML = ''
    forumEmpty.hidden = true

    var result = await sb
      .from('threads')
      .select('id, topic, body, created_at, created_by, messages(id, text, sender_type, created_at)')
      .order('created_at', { ascending: false })

    forumLoading.hidden = true

    if (result.error) {
      forumEmpty.textContent = 'Nepodařilo se načíst vlákna.'
      forumEmpty.hidden = false
      return
    }

    allThreads = result.data || []
    var creatorIds = allThreads.map(function (t) { return t.created_by }).filter(Boolean)
    await fetchUsernames([...new Set(creatorIds)])
    renderThreads(allThreads)
  }

  function renderThreads(threads) {
    var filtered = threads.filter(function (t) {
      return matchesFilter(t.topic) &&
        (!searchQuery || (t.topic && t.topic.toLowerCase().indexOf(searchQuery) !== -1))
    })

    forumEmpty.hidden = filtered.length > 0
    if (!filtered.length) {
      forumList.innerHTML = ''
      forumPagination.hidden = true
      forumEmpty.textContent = searchQuery || activeFilter
        ? 'Žádná vlákna neodpovídají filtru.'
        : 'Zatím žádná vlákna. Buďte první!'
      return
    }

    var totalPages = Math.ceil(filtered.length / THREADS_PER_PAGE)
    if (currentPage > totalPages) currentPage = totalPages
    var start = (currentPage - 1) * THREADS_PER_PAGE
    var paged = filtered.slice(start, start + THREADS_PER_PAGE)

    var personIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path></svg>'
    var bubbleIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'

    forumList.innerHTML = paged.map(function (t) {
      var msgs  = t.messages || []
      var fullText = t.body || ''
      var preview = fullText.length > 130
        ? escapeHtml(fullText.slice(0, 130)) + '… <span class="forum-post__read-more">číst více</span>'
        : escapeHtml(fullText)
      var count = msgs.length

      return (
        '<article class="forum-post" data-id="' + t.id + '" tabindex="0" role="button" aria-label="Otevřít vlákno: ' + escapeHtml(t.topic) + '">' +
          '<h3 class="forum-post__title">' + escapeHtml(t.topic) + '</h3>' +
          (preview ? '<p class="forum-post__preview">' + preview + '</p>' : '') +
          '<div class="forum-post__meta">' +
            '<span class="forum-post__meta-date">' + escapeHtml(formatDateTime(t.created_at)) + '</span>' +
            '<span class="forum-post__meta-author">' + personIcon + escapeHtml(userCache[t.created_by] || 'Anonymní') + '</span>' +
            '<span class="forum-post__meta-replies">' + bubbleIcon + '<span class="forum-post__reply-count">' + count + '</span></span>' +
          '</div>' +
          '<div class="forum-post__quick-reply" id="qr-' + t.id + '">' +
            '<form class="forum-post__quick-reply-form" data-thread-id="' + t.id + '" novalidate>' +
              '<div class="forum-post__quick-reply-row">' +
                '<input type="text" placeholder="Napište odpověď…" autocomplete="off">' +
                '<button type="submit" class="btn btn-primary forum-post__quick-reply-submit">Odeslat</button>' +
              '</div>' +
              '<p class="forum-post__quick-reply-error" hidden></p>' +
            '</form>' +
          '</div>' +
        '</article>'
      )
    }).join('')

    forumList.querySelectorAll('.forum-post').forEach(function (el) {
      function openByEl() {
        var id = el.dataset.id
        var thread = allThreads.find(function (t) { return String(t.id) === id })
        if (thread) showDetailView(thread)
      }
      el.addEventListener('click', openByEl)
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openByEl() }
      })
    })

    forumList.querySelectorAll('.forum-post__quick-reply').forEach(function (panel) {
      panel.addEventListener('click', function (e) { e.stopPropagation() })
    })

    forumList.querySelectorAll('.forum-post__quick-reply-form').forEach(function (form) {
      var input = form.querySelector('input[type=text]')

      form.addEventListener('submit', function (e) {
        e.preventDefault()
        var text = input.value.trim()
        if (!text) return
        if (!currentUser) {
          pendingAction = { type: 'reply', threadId: form.dataset.threadId, text: text }
          openAuthModal()
          return
        }
        handleInlineReply(form.dataset.threadId, text, form)
      })
    })

    // Stránkování
    if (totalPages <= 1) {
      forumPagination.hidden = true
    } else {
      forumPagination.hidden = false
      var prevSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>'
      var nextSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'

      var pages = ''
      for (var p = 1; p <= totalPages; p++) {
        pages += '<button class="forum-pagination__page' + (p === currentPage ? ' is-active' : '') + '" data-page="' + p + '">' + p + '</button>'
      }

      forumPagination.innerHTML =
        '<button class="forum-pagination__arrow" id="pgPrev" aria-label="Předchozí stránka"' + (currentPage === 1 ? ' disabled' : '') + '>' + prevSvg + '</button>' +
        pages +
        '<button class="forum-pagination__arrow" id="pgNext" aria-label="Další stránka"' + (currentPage === totalPages ? ' disabled' : '') + '>' + nextSvg + '</button>'

      forumPagination.querySelector('#pgPrev').addEventListener('click', function () {
        if (currentPage > 1) { currentPage--; renderThreads(allThreads) }
      })
      forumPagination.querySelector('#pgNext').addEventListener('click', function () {
        if (currentPage < totalPages) { currentPage++; renderThreads(allThreads) }
      })
      forumPagination.querySelectorAll('.forum-pagination__page').forEach(function (btn) {
        btn.addEventListener('click', function () {
          currentPage = parseInt(btn.dataset.page)
          renderThreads(allThreads)
        })
      })
    }
  }

  function toggleQuickReply(threadId) {
    var panel = document.getElementById('qr-' + threadId)
    if (!panel) return
    panel.hidden = !panel.hidden
    if (!panel.hidden) panel.querySelector('textarea').focus()
  }

  async function handleInlineReply(threadId, text, formEl) {
    var submitBtn = formEl.querySelector('button[type=submit]')
    var errorEl   = formEl.querySelector('.forum-post__quick-reply-error')
    submitBtn.disabled = true
    errorEl.hidden = true

    var token = await getToken()
    if (!token) { submitBtn.disabled = false; return }

    try {
      var r = await fetch('/.netlify/functions/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ thread_id: threadId, text: text })
      })
      var d = await r.json()
      if (!r.ok) {
        errorEl.textContent = d.error || 'Chyba při odesílání.'
        errorEl.hidden = false
        submitBtn.disabled = false
        return
      }
      formEl.querySelector('input[type=text]').value = ''
      document.getElementById('qr-' + threadId).hidden = true
      var countEl = document.querySelector('[data-id="' + threadId + '"] .forum-post__reply-count')
      if (countEl) countEl.textContent = (parseInt(countEl.textContent) || 0) + 1
      submitBtn.disabled = false
    } catch (err) {
      errorEl.textContent = 'Chyba připojení: ' + err.message
      errorEl.hidden = false
      submitBtn.disabled = false
    }
  }

  // === DETAIL VIEW ===

  async function showDetailView(thread) {
    currentThread = thread
    viewList.hidden = true
    viewDetail.hidden = false
    renderThreadHeader(thread)
    updateAuthUI()
    updateBotBar()
    await loadMessages(thread.id)
    subscribeRealtime(thread.id)
    history.pushState({ threadId: thread.id }, '', '#' + thread.id)
  }

  function renderThreadHeader(thread) {
    var canDelete  = currentUser && (currentUser.id === thread.created_by || currentRole === 'admin')
    var authorName = userCache[thread.created_by] || 'Anonymní'

    threadHeader.innerHTML =
      '<h1 class="forum-question__title">' + escapeHtml(thread.topic) + '</h1>' +
      (thread.body ? '<p class="forum-question__body">' + escapeHtml(thread.body) + '</p>' : '') +
      '<div class="forum-question__meta">' +
        '<div class="forum-question__meta-left">' +
          '<span class="forum-question__date">' + escapeHtml(formatDateTime(thread.created_at)) + '</span>' +
          '<span class="forum-question__dash">—</span>' +
          '<span class="forum-question__author">' + escapeHtml(authorName) + '</span>' +
        '</div>' +
        (canDelete ? '<button class="forum-thread-header__delete" id="deleteThreadBtn">Smazat vlákno</button>' : '') +
      '</div>'
  }

  function updateBotBar() {
    if (!currentThread || currentRole !== 'admin') { botBar.hidden = true; return }
    botBar.hidden = false
    var isActive = currentThread.bot_mode === 'active'
    botModeLabel.textContent = isActive ? 'Boti jsou zapnutí' : 'Boti jsou vypnutí'
    toggleBotBtn.textContent = isActive ? 'Vypnout boty' : 'Zapnout boty'
  }

  async function loadMessages(threadId) {
    messagesLoading.hidden = false
    messageList.innerHTML = ''

    var result = await sb
      .from('messages')
      .select('id, text, sender_type, user_id, created_at, bots(name, color)')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    messagesLoading.hidden = true

    if (result.error) {
      messageList.innerHTML = '<p class="forum-login-hint">Nepodařilo se načíst zprávy.</p>'
      return
    }

    var msgs = result.data || []
    var humanIds = msgs
      .filter(function (m) { return m.sender_type === 'human' && m.user_id })
      .map(function (m) { return m.user_id })
    await fetchUsernames([...new Set(humanIds)])

    msgs.forEach(function (msg) { appendMessageEl(buildMessageEl(msg)) })
    scrollMessages()
  }

  var AVATAR_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/></svg>'

  function buildMessageEl(msg) {
    var isHuman     = msg.sender_type === 'human'
    var botData     = msg.bots || {}
    var botName     = botData.name || 'Bot'
    var botColor    = botData.color || '#6C8EF5'
    var senderLabel = isHuman ? (userCache[msg.user_id] || 'Uživatel') : botName

    var el = document.createElement('div')
    el.className = 'forum-message forum-message--' + (isHuman ? 'human' : 'bot')
    if (!isHuman) el.style.setProperty('--bot-color', botColor)

    var isThreadAuthor = isHuman && currentThread && msg.user_id === currentThread.created_by
    var senderClass = 'forum-message__sender' + (isThreadAuthor ? ' forum-message__sender--author' : '')

    el.innerHTML =
      '<div class="forum-message__avatar">' + AVATAR_ICON + '</div>' +
      '<div class="forum-message__content">' +
        '<div class="forum-message__meta">' +
          '<span class="forum-message__time">' + escapeHtml(formatDateTime(msg.created_at)) + '</span>' +
          '<span class="forum-message__dash">—</span>' +
          '<span class="' + senderClass + '">' + escapeHtml(senderLabel) + '</span>' +
        '</div>' +
        '<p class="forum-message__text">' + escapeHtml(msg.text) + '</p>' +
      '</div>'

    return el
  }

  function appendMessageEl(el) { messageList.appendChild(el) }
  function scrollMessages() { messageList.scrollTop = messageList.scrollHeight }

  // === REALTIME ===

  function subscribeRealtime(threadId) {
    unsubscribeRealtime()
    realtimeChannel = sb
      .channel('thread-' + threadId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'thread_id=eq.' + threadId },
        async function (payload) {
          var msg = payload.new
          if (msg.sender_type === 'bot' && msg.bot_id) {
            var botRes = await sb.from('bots').select('name, color').eq('id', msg.bot_id).single()
            if (botRes.data) msg.bots = botRes.data
          }
          appendMessageEl(buildMessageEl(msg))
          scrollMessages()
          if (msg.sender_type === 'bot' && autoStartTurns > 0) {
            autoStartTurns--
            setTimeout(function () { if (currentThread) maybeTriggerBot() }, 1500)
          }
        }
      )
      .subscribe()
  }

  function unsubscribeRealtime() {
    if (realtimeChannel) { realtimeChannel.unsubscribe(); realtimeChannel = null }
  }

  // === REPLY ===

  async function handleSendReply(text) {
    var submitBtn = replyForm.querySelector('button[type=submit]')
    submitBtn.disabled = true
    replyError.hidden = true

    var token = await getToken()
    if (!token) {
      replyError.textContent = 'Nejste přihlášeni.'
      replyError.hidden = false
      submitBtn.disabled = false
      return
    }

    try {
      var res = await fetch('/.netlify/functions/send-reply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body:    JSON.stringify({ thread_id: currentThread.id, text: text })
      })
      var d = await res.json()
      if (!res.ok || !d.ok) {
        replyError.textContent = 'Chyba: ' + (d.error || 'HTTP ' + res.status)
        replyError.hidden = false
        submitBtn.disabled = false
        return
      }
    } catch (err) {
      replyError.textContent = 'Chyba při odesílání: ' + err.message
      replyError.hidden = false
      submitBtn.disabled = false
      return
    }

    submitBtn.disabled = false
    maybeTriggerBot()
  }

  async function maybeTriggerBot() {
    var res = await sb.from('threads').select('bot_mode').eq('id', currentThread.id).single()
    if (!res.data || res.data.bot_mode !== 'active') return

    try {
      var r = await fetch('/.netlify/functions/take-turn', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ thread_id: currentThread.id })
      })
      if (!r.ok) {
        var d = await r.json().catch(function () { return {} })
        replyError.textContent = 'Bot nereagoval: ' + (d.error || 'HTTP ' + r.status)
        replyError.hidden = false
      }
    } catch (err) {
      console.error('take-turn error:', err)
    }
  }

  // === BOT TOGGLE ===

  async function handleToggleBotMode() {
    var newMode = currentThread.bot_mode === 'active' ? 'disabled' : 'active'
    toggleBotBtn.disabled = true

    var token = await getToken()
    if (!token) { toggleBotBtn.disabled = false; return }

    try {
      var res = await fetch('/.netlify/functions/toggle-bot-mode', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body:    JSON.stringify({ thread_id: currentThread.id, bot_mode: newMode })
      })
      if (!res.ok) {
        console.error('toggle-bot-mode failed:', res.status)
        toggleBotBtn.disabled = false
        return
      }
    } catch (err) {
      console.error('toggle-bot-mode error:', err)
      toggleBotBtn.disabled = false
      return
    }

    toggleBotBtn.disabled = false
    currentThread.bot_mode = newMode
    updateBotBar()
    renderThreadHeader(currentThread)
  }

  // === NOVÉ VLÁKNO ===

  var botRowCount = 0

  function addBotRow() {
    botRowCount++
    var row = document.createElement('div')
    row.className = 'forum-bot-row'
    row.innerHTML =
      '<input type="text" name="botName" placeholder="Jméno bota" required>' +
      '<input type="text" name="botPersona" placeholder="Persona (popis role a chování)" required>' +
      '<button type="button" class="forum-bot-row__remove" aria-label="Odebrat bota">✕</button>'

    row.querySelector('.forum-bot-row__remove').addEventListener('click', function () {
      if (botRowsContainer.querySelectorAll('.forum-bot-row').length <= 2) return
      row.remove()
      updateRemoveButtons()
    })

    botRowsContainer.appendChild(row)
    updateRemoveButtons()
  }

  function updateRemoveButtons() {
    var rows = botRowsContainer.querySelectorAll('.forum-bot-row')
    rows.forEach(function (r) {
      r.querySelector('.forum-bot-row__remove').disabled = rows.length <= 2
    })
  }

  async function handleCreateThread() {
    threadError.hidden = true
    var topic = (forumPostForm.querySelector('#postTopic').value || '').trim()
    var body  = (forumPostForm.querySelector('#postBody').value || '').trim()
    if (!topic) { showThreadError('Zadejte nadpis otázky.'); return }
    if (!body)  { showThreadError('Zadejte text otázky.'); return }

    var bots = []
    if (currentRole === 'admin') {
      var botIdx = 0
      var botValid = true
      botRowsContainer.querySelectorAll('.forum-bot-row').forEach(function (row) {
        var name    = (row.querySelector('[name=botName]').value || '').trim()
        var persona = (row.querySelector('[name=botPersona]').value || '').trim()
        if (!name && !persona) return
        if (!name || !persona) { botValid = false; return }
        bots.push({ name: name, persona: persona, color: BOT_COLORS[botIdx++ % BOT_COLORS.length] })
      })
      if (!botValid) { showThreadError('Každý bot musí mít vyplněné jméno i personu.'); return }
    }

    var submitBtn = forumPostForm.querySelector('button[type=submit]')
    submitBtn.disabled = true

    var token = await getToken()
    if (!token) { showThreadError('Nejste přihlášeni.'); submitBtn.disabled = false; return }

    var data
    try {
      var res = await fetch('/.netlify/functions/create-thread', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body:    JSON.stringify({ topic: topic, body: body, bots: bots })
      })
      data = await res.json()
      if (!res.ok || !data.ok) {
        showThreadError(data.error || 'Nepodařilo se vytvořit vlákno. (HTTP ' + res.status + ')')
        submitBtn.disabled = false
        return
      }
    } catch (err) {
      showThreadError('Chyba při vytváření vlákna: ' + (err.message || 'Zkuste to znovu.'))
      submitBtn.disabled = false
      return
    }

    submitBtn.disabled = false
    closeForumModal()
    await loadThreads()

    var newThread = allThreads.find(function (t) { return String(t.id) === String(data.thread_id) })
    if (newThread) {
      await showDetailView(newThread)
      if (bots.length > 0) {
        autoStartTurns = bots.length - 1
        setTimeout(function () { maybeTriggerBot() }, 800)
      }
    }
  }

  function showThreadError(msg) { threadError.textContent = msg; threadError.hidden = false }

  function openForumModal() {
    forumModal.hidden = false
    forumPostForm.reset()
    botRowsContainer.innerHTML = ''
    botRowCount = 0
    threadError.hidden = true

    var isAdmin = currentRole === 'admin'
    botSection.hidden = !isAdmin
    if (isAdmin) { addBotRow(); addBotRow() }

    document.body.style.overflow = 'hidden'
    setTimeout(function () {
      var input = forumModal.querySelector('input')
      if (input) input.focus()
    }, 50)
  }

  function closeForumModal() { forumModal.hidden = true; document.body.style.overflow = '' }

  // === MAZÁNÍ VLÁKNA ===

  function openAddBotModal() {
    addBotForm.reset()
    addBotError.hidden = true
    addBotModal.hidden = false
  }

  function closeAddBotModal() {
    addBotModal.hidden = true
  }

  async function handleAddBotToThread() {
    addBotError.hidden = true
    var name         = (addBotForm.querySelector('#addBotName').value || '').trim()
    var persona      = (addBotForm.querySelector('#addBotPersona').value || '').trim()
    var writeComment = addBotForm.querySelector('#addBotWriteComment').checked

    if (!name)    { addBotError.textContent = 'Zadejte jméno bota.'; addBotError.hidden = false; return }
    if (!persona) { addBotError.textContent = 'Zadejte personu bota.'; addBotError.hidden = false; return }

    var submitBtn = addBotForm.querySelector('button[type=submit]')
    submitBtn.disabled = true
    submitBtn.textContent = writeComment ? 'Přidávám a generuji…' : 'Přidávám…'

    var token = await getToken()
    if (!token) { submitBtn.disabled = false; submitBtn.textContent = 'Přidat bota'; return }

    try {
      var res = await fetch('/.netlify/functions/add-bot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body:    JSON.stringify({ thread_id: currentThread.id, name, persona, write_comment: writeComment })
      })
      var d = await res.json()
      if (!res.ok || !d.ok) {
        addBotError.textContent = d.error || 'Nepodařilo se přidat bota.'
        addBotError.hidden = false
        submitBtn.disabled = false
        submitBtn.textContent = 'Přidat bota'
        return
      }
      closeAddBotModal()
    } catch (err) {
      addBotError.textContent = 'Chyba: ' + err.message
      addBotError.hidden = false
      submitBtn.disabled = false
      submitBtn.textContent = 'Přidat bota'
    }
  }

  async function handleDeleteThread() {
    if (!window.confirm('Opravdu smazat toto vlákno? Tato akce je nevratná.')) return

    var token = await getToken()
    if (!token) return

    try {
      var res = await fetch('/.netlify/functions/delete-thread', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body:    JSON.stringify({ thread_id: currentThread.id })
      })
      var d = await res.json()
      if (!res.ok || !d.ok) { alert('Nepodařilo se smazat vlákno: ' + (d.error || 'Neznámá chyba')); return }
    } catch (err) {
      alert('Chyba při mazání: ' + err.message)
      return
    }

    showListView()
    await loadThreads()
  }

  // === START ===
  init()

})()
