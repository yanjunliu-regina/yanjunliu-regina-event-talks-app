/**
 * BigQuery Release Notes Hub - Frontend Logic
 * Handles fetching, rendering, filtering, selection, theme toggling, and Twitter sharing.
 */

document.addEventListener('DOMContentLoaded', () => {
    // App State
    let updates = [];
    let selectedUpdates = new Set();
    let filterType = 'all';
    let searchQuery = '';
    let isLightMode = localStorage.getItem('theme') === 'light';

    // DOM Elements
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    
    // Stats elements
    const statTotal = document.getElementById('stat-total');
    const statFeatures = document.getElementById('stat-features');
    const statChanges = document.getElementById('stat-changes');
    const statAnnouncements = document.getElementById('stat-announcements');
    const statIssues = document.getElementById('stat-issues');

    // Search and filter elements
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const filterPills = document.querySelectorAll('.filter-pills .pill');

    // Loading & Empty States
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const notesGrid = document.getElementById('notes-grid');

    // Selection Bar Elements
    const selectionBar = document.getElementById('selection-bar');
    const selectedCountVal = document.getElementById('selected-count-val');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const tweetSelectedBtn = document.getElementById('tweet-selected-btn');

    // Tweet Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    const charProgressFill = document.getElementById('char-progress-fill');
    const tweetSourcesContainer = document.getElementById('tweet-sources-container');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const postTweetBtn = document.getElementById('post-tweet-btn');

    // Toast element
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // ==========================================================================
    // Theme Initialisation & Toggle
    // ==========================================================================
    const initTheme = () => {
        if (isLightMode) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    };

    themeToggle.addEventListener('click', () => {
        isLightMode = !isLightMode;
        localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
        initTheme();
        showToast(isLightMode ? 'Light theme enabled' : 'Dark theme enabled');
    });

    initTheme();

    // ==========================================================================
    // API Integration (Fetch Data)
    // ==========================================================================
    const fetchReleaseNotes = async () => {
        // Show loading state
        refreshIcon.classList.add('spinning');
        refreshBtn.disabled = true;
        notesGrid.classList.add('hidden');
        emptyState.classList.add('hidden');
        loadingState.classList.remove('hidden');

        try {
            const response = await fetch('/api/release-notes');
            const data = await response.json();
            
            if (data.success) {
                updates = data.updates;
                calculateStats();
                renderNotes();
                showToast('Release notes updated successfully!');
            } else {
                throw new Error(data.error || 'Failed to fetch release notes');
            }
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showToast(`Error: ${error.message}`, 'error');
            
            loadingState.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.querySelector('h3').textContent = 'Error Loading Feed';
            emptyState.querySelector('p').textContent = error.message;
        } finally {
            refreshIcon.classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    };

    // ==========================================================================
    // Render and Filter Logic
    // ==========================================================================
    const renderNotes = () => {
        loadingState.classList.add('hidden');
        notesGrid.innerHTML = '';
        
        // Filter list
        const filteredUpdates = updates.filter(up => {
            // Type match
            let matchesType = true;
            if (filterType !== 'all') {
                if (filterType === 'issue') {
                    matchesType = up.type.toLowerCase() === 'issue';
                } else {
                    matchesType = up.type.toLowerCase() === filterType;
                }
            }
            
            // Search query match
            let matchesSearch = true;
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                const contentText = up.content_text.toLowerCase();
                const dateText = up.date.toLowerCase();
                const typeText = up.type.toLowerCase();
                matchesSearch = contentText.includes(query) || dateText.includes(query) || typeText.includes(query);
            }
            
            return matchesType && matchesSearch;
        });

        if (filteredUpdates.length === 0) {
            notesGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        notesGrid.classList.remove('hidden');

        // Create cards
        filteredUpdates.forEach(up => {
            const typeLower = up.type.toLowerCase();
            const card = document.createElement('div');
            card.className = `note-card card card-${typeLower}`;
            card.dataset.id = up.id;
            
            if (selectedUpdates.has(up.id)) {
                card.classList.add('selected');
            }

            card.innerHTML = `
                <div class="card-select-badge">
                    <i class="fa-solid fa-check"></i>
                </div>
                <div class="card-header">
                    <span class="date-badge">
                        <i class="fa-regular fa-calendar"></i>
                        ${up.date}
                    </span>
                    <span class="type-tag tag-${typeLower}">${up.type}</span>
                </div>
                <div class="card-body">
                    ${up.content_html}
                </div>
                <div class="card-footer">
                    <button class="btn-card-tweet" title="Tweet this update">
                        <i class="fa-brands fa-x-twitter"></i> Tweet
                    </button>
                    ${up.link ? `
                        <a href="${up.link}" target="_blank" class="btn-card-link" title="Open source documentation">
                            docs <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    ` : ''}
                </div>
            `;

            // Card Selection Click (unless click is on a link, footer button, or is a text selection)
            card.addEventListener('click', (e) => {
                if (window.getSelection().toString()) return; // Don't toggle selection if text is selected
                if (e.target.closest('a') || e.target.closest('.btn-card-tweet')) return;
                
                toggleCardSelection(up.id);
            });

            // Tweet button click inside card
            const tweetBtn = card.querySelector('.btn-card-tweet');
            tweetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openTweetModal([up]);
            });

            notesGrid.appendChild(card);
        });
    };

    const toggleCardSelection = (id) => {
        const card = document.querySelector(`.note-card[data-id="${id}"]`);
        if (selectedUpdates.has(id)) {
            selectedUpdates.delete(id);
            if (card) card.classList.remove('selected');
        } else {
            selectedUpdates.add(id);
            if (card) card.classList.add('selected');
        }
        updateSelectionBar();
    };

    const updateSelectionBar = () => {
        const count = selectedUpdates.size;
        selectedCountVal.textContent = count;
        
        if (count > 0) {
            selectionBar.classList.add('active');
        } else {
            selectionBar.classList.remove('active');
        }
    };

    const calculateStats = () => {
        statTotal.textContent = updates.length;
        
        const counts = {
            feature: 0,
            change: 0,
            announcement: 0,
            issue: 0,
            breaking: 0
        };

        updates.forEach(up => {
            const type = up.type.toLowerCase();
            if (type in counts) {
                counts[type]++;
            }
        });

        statFeatures.textContent = counts.feature;
        statChanges.textContent = counts.change;
        statAnnouncements.textContent = counts.announcement;
        
        // Group issue and breaking for stats display bar
        statIssues.textContent = counts.issue + counts.breaking;
    };

    // ==========================================================================
    // Event Listeners (Search & Filter)
    // ==========================================================================
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim() !== '') {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        renderNotes();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderNotes();
    });

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            filterType = pill.dataset.type;
            renderNotes();
        });
    });

    refreshBtn.addEventListener('click', fetchReleaseNotes);

    clearSelectionBtn.addEventListener('click', () => {
        selectedUpdates.clear();
        document.querySelectorAll('.note-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        updateSelectionBar();
    });

    tweetSelectedBtn.addEventListener('click', () => {
        if (selectedUpdates.size === 0) return;
        const selectedList = updates.filter(up => selectedUpdates.has(up.id));
        openTweetModal(selectedList);
    });

    // ==========================================================================
    // Twitter/X Integration & Modal
    // ==========================================================================
    const openTweetModal = (selectedList) => {
        // Setup Modal Source Lists
        tweetSourcesContainer.innerHTML = '';
        selectedList.forEach(up => {
            const item = document.createElement('div');
            item.className = 'source-item-mini';
            item.innerHTML = `
                <div class="source-item-mini-info">
                    <span class="type-tag tag-${up.type.toLowerCase()}" style="padding: 2px 8px; font-size: 11px;">${up.type}</span>
                    <span class="source-item-mini-text">${up.date}: ${up.content_text}</span>
                </div>
                ${selectedList.length > 1 ? `
                    <button class="source-item-mini-remove" data-id="${up.id}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                ` : ''}
            `;
            
            // Remove from selected list button in modal
            const removeBtn = item.querySelector('.source-item-mini-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    // Update main page state
                    toggleCardSelection(up.id);
                    // Re-filter the current modal list and refresh it
                    const newModalList = selectedList.filter(item => item.id !== up.id);
                    if (newModalList.length === 0) {
                        closeTweetModal();
                    } else {
                        openTweetModal(newModalList);
                    }
                });
            }
            tweetSourcesContainer.appendChild(item);
        });

        // Generate auto drafted tweet text
        const draftText = generateTweetText(selectedList);
        tweetTextarea.value = draftText;
        updateCharCounter();

        // Show Modal
        tweetModal.classList.remove('hidden');
    };

    const generateTweetText = (selectedList) => {
        if (selectedList.length === 1) {
            const up = selectedList[0];
            const tag = up.type.toUpperCase();
            const date = up.date;
            let text = up.content_text;
            const link = up.link;
            
            // Craft suffix
            const suffix = link ? `\n\nRead more: ${link}\n#BigQuery #GoogleCloud` : `\n\n#BigQuery #GoogleCloud`;
            
            // Twitter limit is 280 characters.
            // Calculate available characters for text: 280 - tag - date - suffix - overheads
            const prefix = `BigQuery [${tag}] (${date}): `;
            const maxTextLen = 280 - prefix.length - suffix.length - 5;
            
            if (text.length > maxTextLen) {
                text = text.substring(0, maxTextLen - 3) + "...";
            }
            
            return `${prefix}${text}${suffix}`;
        } else {
            // Multiple updates
            const header = "Latest BigQuery updates:\n\n";
            const footer = "\n#BigQuery #GoogleCloud";
            
            // Total characters in fixed header/footer
            const fixedLen = header.length + footer.length;
            const remaining = 280 - fixedLen;
            
            // Split remaining characters equally amongst the updates
            const itemsCount = selectedList.length;
            const charsPerItem = Math.floor((remaining - (itemsCount * 3)) / itemsCount); // 3 for list items prefix/suffix
            
            let listItems = [];
            selectedList.forEach((up, idx) => {
                let text = up.content_text;
                const tag = up.type.substring(0, 4); // Abbreviate to save space
                const prefix = `${idx + 1}. [${tag}] `;
                const linkSuffix = up.link ? ` ${up.link.substring(up.link.lastIndexOf('#'))}` : ''; // just anchor link to save space
                const itemOverhead = prefix.length + linkSuffix.length;
                
                let textLimit = charsPerItem - itemOverhead;
                if (textLimit < 15) textLimit = 15; // safe fallback
                
                if (text.length > textLimit) {
                    text = text.substring(0, textLimit - 3) + "...";
                }
                
                listItems.push(`${prefix}${text}${linkSuffix}`);
            });
            
            return `${header}${listItems.join("\n")}${footer}`;
        }
    };

    const updateCharCounter = () => {
        const len = tweetTextarea.value.length;
        charCount.textContent = len;
        
        // Progress Fill Percent
        const percentage = Math.min((len / 280) * 100, 100);
        charProgressFill.style.width = `${percentage}%`;

        // Color status classes
        charProgressFill.className = '';
        if (len > 270) {
            charProgressFill.classList.add('danger');
            charCount.style.color = 'var(--color-issue)';
        } else if (len > 240) {
            charProgressFill.classList.add('warning');
            charCount.style.color = 'var(--color-announcement)';
        } else {
            charCount.style.color = 'var(--text-secondary)';
        }

        // Disable Post button if too long or empty
        postTweetBtn.disabled = len === 0 || len > 280;
    };

    const closeTweetModal = () => {
        tweetModal.classList.add('hidden');
    };

    tweetTextarea.addEventListener('input', updateCharCounter);
    
    closeModalBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    postTweetBtn.addEventListener('click', () => {
        const tweetContent = tweetTextarea.value;
        if (tweetContent.length > 280) {
            showToast("Tweet exceeds the 280 character limit!", "error");
            return;
        }

        // Open Twitter Web Intent in a new window
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetContent)}`;
        window.open(twitterIntentUrl, '_blank', 'width=550,height=420,toolbar=0,status=0');
        
        closeTweetModal();
        showToast("Opened Twitter sharing window!");
    });

    // ==========================================================================
    // Toast Alert system
    // ==========================================================================
    const showToast = (message, type = 'success') => {
        toastMessage.textContent = message;
        
        if (type === 'error') {
            toast.style.backgroundColor = 'var(--color-issue)';
            toast.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
            toast.querySelector('.toast-icon').className = 'fa-solid fa-circle-exclamation toast-icon';
        } else {
            toast.style.backgroundColor = 'var(--color-feature)';
            toast.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
            toast.querySelector('.toast-icon').className = 'fa-solid fa-circle-check toast-icon';
        }

        toast.classList.remove('hidden');
        
        // Auto hide after 4 seconds
        clearTimeout(toast.timeoutId);
        toast.timeoutId = setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    };

    // Load initial data on mount
    fetchReleaseNotes();
});
