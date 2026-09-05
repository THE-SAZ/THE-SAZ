document.addEventListener('DOMContentLoaded', function() {
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            renderFeed(data.posts);
            renderRepos(data.repos);
            document.getElementById('timestamp').textContent = data.updated_at || 'نامشخص';
        })
        .catch(error => {
            console.error('Error loading data:', error);
            document.getElementById('feed-container').innerHTML = '<p>خطا در بارگذاری مطالب. لطفاً بعداً تلاش کنید.</p>';
            document.getElementById('repos-container').innerHTML = '<p>خطا در بارگذاری ریپازیتوری‌ها.</p>';
        });
});

function renderFeed(posts) {
    const container = document.getElementById('feed-container');
    if (!posts || posts.length === 0) {
        container.innerHTML = '<p>هیچ پستی یافت نشد.</p>';
        return;
    }
    
    container.innerHTML = posts.map(post => {
        const photoHtml = post.photo_url ? `<img src="${post.photo_url}" class="post-photo" alt="Post image">` : '';
        const postLink = post.post_url ? `<a href="${post.post_url}" target="_blank" rel="noopener">مشاهده در تلگرام</a>` : '';
        return `
            <div class="post-card">
                <div class="post-date">📅 ${post.date}</div>
                ${photoHtml}
                <div class="post-text">${post.text_html || ''}</div>
                ${postLink ? `<div style="margin-top:10px; font-size:0.8rem;">${postLink}</div>` : ''}
            </div>
        `;
    }).join('');
    
    // اطمینان از باز شدن لینک‌ها در تب جدید
    container.querySelectorAll('a').forEach(a => {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
    });
}

function renderRepos(repos) {
    const container = document.getElementById('repos-container');
    if (!repos || repos.length === 0) {
        container.innerHTML = '<p>ریپازیتوری‌ای یافت نشد.</p>';
        return;
    }
    
    container.innerHTML = repos.map(repo => `
        <div class="repo-card">
            <div class="repo-name"><a href="${repo.url}" target="_blank" rel="noopener">${repo.name}</a></div>
            <div class="repo-description">${repo.description}</div>
            <div class="repo-meta">
                <span>⭐ ${repo.stars}</span>
                <span>🍴 ${repo.forks}</span>
                <span>💻 ${repo.language || 'نامشخص'}</span>
                <span>📅 ${repo.updated || 'نامشخص'}</span>
            </div>
        </div>
    `).join('');
}