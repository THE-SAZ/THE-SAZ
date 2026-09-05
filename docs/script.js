document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load data');
            return res.json();
        })
        .then(data => {
            renderFeed(data.posts);
            renderRepos(data.repos);
            document.getElementById('timestamp').textContent = data.updated_at || 'Never';
            document.getElementById('repo-count').textContent = data.repos ? data.repos.length : 0;
            document.getElementById('post-count').textContent = data.posts ? data.posts.length : 0;
        })
        .catch(err => {
            console.error('Error:', err);
            document.getElementById('feed-container').innerHTML = '<div class="loading-text">Error loading feeds</div>';
            document.getElementById('repos-container').innerHTML = '<div class="loading-text">Error loading repos</div>';
        });
});

function renderFeed(posts) {
    const container = document.getElementById('feed-container');
    if (!posts || posts.length === 0) {
        container.innerHTML = '<div class="loading-text">No posts found</div>';
        return;
    }
    container.innerHTML = posts.map(post => {
        const photo = post.photo_url ? `<img src="${post.photo_url}" class="post-photo" alt="Post">` : '';
        const link = post.post_url ? `<a href="${post.post_url}" target="_blank" class="post-link">↗ Open in Telegram</a>` : '';
        return `
            <div class="post-card">
                <div class="post-date">${post.date}</div>
                ${photo}
                <div class="post-text">${post.text_html}</div>
                ${link}
            </div>
        `;
    }).join('');
    // Make all links safe
    container.querySelectorAll('a').forEach(a => {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
    });
}

function renderRepos(repos) {
    const container = document.getElementById('repos-container');
    if (!repos || repos.length === 0) {
        container.innerHTML = '<div class="loading-text">No repositories found</div>';
        return;
    }
    container.innerHTML = repos.map(repo => `
        <div class="repo-card">
            <div class="repo-name"><a href="${repo.url}" target="_blank" rel="noopener">${repo.name}</a></div>
            <div class="repo-description">${repo.description}</div>
            <div class="repo-meta">
                <span>⭐ ${repo.stars}</span>
                <span>🍴 ${repo.forks}</span>
                <span>💻 ${repo.language || 'N/A'}</span>
                <span>📅 ${repo.updated || 'N/A'}</span>
            </div>
        </div>
    `).join('');
}
