// Roadmap Site Interactive Features with Progress Tracking
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initScrollAnimations();
    initPlatformCards();
    initExpandableContent();
    initSmoothScroll();
    initParallax();
    initProgressTracking();
    initThemeToggle();
    initSearch();
    
    // Console greeting
    console.log('%c🚀 Social Media Aggregator Roadmap', 'font-size: 20px; font-weight: bold; color: #6366f1;');
    console.log('%cBuilt with ❤️ for the AI4ALL project', 'font-size: 12px; color: #94a3b8;');
    console.log('%cCurrent Progress: Loading...', 'font-size: 12px; color: #10b981;');
});

// Scroll Animations
function initScrollAnimations() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    timelineItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(item);
    });
}

// Platform Cards Hover Effects
function initPlatformCards() {
    const platformCards = document.querySelectorAll('.platform-card');
    platformCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Expandable Timeline Content
function initExpandableContent() {
    const timelineContents = document.querySelectorAll('.timeline-content');
    timelineContents.forEach(content => {
        const header = content.querySelector('h2');
        const phaseContent = content.querySelector('.phase-content');
        
        if (header && phaseContent) {
            // Add expand icon
            const expandIcon = document.createElement('span');
            expandIcon.innerHTML = ' ▼';
            expandIcon.style.fontSize = '0.7em';
            expandIcon.style.transition = 'transform 0.3s ease';
            header.appendChild(expandIcon);
            
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                const isHidden = phaseContent.style.display === 'none';
                phaseContent.style.display = isHidden ? 'block' : 'none';
                header.style.opacity = isHidden ? '1' : '0.7';
                expandIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        }
    });
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Parallax Effect
function initParallax() {
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            hero.style.backgroundPositionY = `${scrolled * 0.5}px`;
        });
    }
}

// Progress Tracking System
async function initProgressTracking() {
    try {
        const response = await fetch('project-status.json');
        const data = await response.json();
        
        updateProgressIndicators(data.projectStatus);
        updateAPIStatus(data.apiStatus);
        updateRecentCommits(data.recentCommits);
        updateBuildStatus(data.buildStatus);
        updateOverallProgress(data.projectStatus.overallProgress);
        
        console.log(`%c✅ Progress loaded: ${data.projectStatus.overallProgress}%`, 'font-size: 12px; color: #10b981;');
    } catch (error) {
        console.warn('Could not load project status:', error);
    }
}

function updateProgressIndicators(status) {
    status.phases.forEach(phase => {
        const phaseElement = document.querySelector(`[data-phase="${phase.id}"]`);
        if (phaseElement) {
            // Add status badge
            const badge = document.createElement('div');
            badge.className = `phase-status ${phase.status}`;
            badge.innerHTML = getStatusIcon(phase.status);
            
            const header = phaseElement.querySelector('.phase-header');
            if (header) {
                header.insertBefore(badge, header.firstChild);
            }
            
            // Add progress bar
            const progressBar = document.createElement('div');
            progressBar.className = 'phase-progress';
            progressBar.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${phase.progress}%"></div>
                </div>
                <span class="progress-text">${phase.progress}%</span>
            `;
            
            const content = phaseElement.querySelector('.timeline-content');
            if (content) {
                content.insertBefore(progressBar, content.children[2]);
            }
            
            // Add status class to timeline item
            phaseElement.classList.add(`status-${phase.status}`);
        }
    });
}

function getStatusIcon(status) {
    const icons = {
        completed: '✅',
        in_progress: '🔄',
        not_started: '⏳'
    };
    return icons[status] || '⏳';
}

function updateAPIStatus(apiStatus) {
    const platformCards = document.querySelectorAll('.platform-card');
    platformCards.forEach(card => {
        const platformName = card.querySelector('h4')?.textContent?.toLowerCase();
        if (platformName && apiStatus[platformName]) {
            const status = apiStatus[platformName];
            const statusBadge = document.createElement('div');
            statusBadge.className = `api-status ${status.status}`;
            statusBadge.innerHTML = status.implemented ? '✓ Implemented' : '○ Pending';
            card.appendChild(statusBadge);
        }
    });
}

function updateRecentCommits(commits) {
    const main = document.querySelector('main.container');
    if (!main) return;
    
    const commitsSection = document.createElement('section');
    commitsSection.className = 'commits-section';
    commitsSection.innerHTML = `
        <h2>Recent Commits</h2>
        <div class="commits-list">
            ${commits.slice(0, 5).map(commit => `
                <div class="commit-item">
                    <span class="commit-sha">${commit.sha.slice(0, 7)}</span>
                    <span class="commit-message">${commit.message}</span>
                    <span class="commit-time">${formatTimeAgo(commit.timestamp)}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // Insert after timeline
    const timeline = main.querySelector('.timeline');
    if (timeline) {
        timeline.after(commitsSection);
    }
}

function updateBuildStatus(buildStatus) {
    const hero = document.querySelector('.hero-stats');
    if (!hero) return;
    
    const buildStat = document.createElement('div');
    buildStat.className = 'stat';
    buildStat.innerHTML = `
        <span class="stat-number ${buildStatus.status}">${buildStatus.tests.passed}/${buildStatus.tests.total}</span>
        <span class="stat-label">Tests Passing</span>
    `;
    hero.appendChild(buildStat);
}

function updateOverallProgress(progress) {
    const hero = document.querySelector('.hero .container');
    if (!hero) return;
    
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'overall-progress';
    progressIndicator.innerHTML = `
        <div class="progress-label">Overall Progress</div>
        <div class="progress-bar large">
            <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-percentage">${progress}%</div>
    `;
    
    hero.appendChild(progressIndicator);
}

function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Dark Mode Toggle
function initThemeToggle() {
    const header = document.querySelector('header.hero .container');
    if (!header) return;
    
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '🌙';
    themeToggle.setAttribute('aria-label', 'Toggle dark mode');
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        themeToggle.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
    
    // Check saved preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '☀️';
    }
    
    header.appendChild(themeToggle);
}

// Search Functionality
function initSearch() {
    const main = document.querySelector('main.container');
    if (!main) return;
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <input type="text" id="roadmap-search" placeholder="Search phases, tasks, platforms..." />
        <button id="search-btn">🔍</button>
    `;
    
    const timeline = main.querySelector('.timeline');
    if (timeline) {
        main.insertBefore(searchContainer, timeline);
    }
    
    const searchInput = document.getElementById('roadmap-search');
    const searchBtn = document.getElementById('search-btn');
    
    function performSearch() {
        const query = searchInput.value.toLowerCase();
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        timelineItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = 'block';
                item.style.opacity = '1';
            } else {
                item.style.display = query ? 'none' : 'block';
            }
        });
    }
    
    searchInput.addEventListener('input', performSearch);
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}