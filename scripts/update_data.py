import requests
from bs4 import BeautifulSoup
import datetime
import json
import re
import os

# تنظیمات
TELEGRAM_CHANNEL = "thesaz_projects"
GITHUB_USERNAME = "THE-SAZ"
README_TEMPLATE = "README.template.md"
OUTPUT_JSON = "docs/data.json"
OUTPUT_README = "README.md"

def fetch_telegram_posts(channel, limit=5):
    """دریافت آخرین پست‌های کانال تلگرام از صفحه عمومی"""
    url = f"https://t.me/s/{channel}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching Telegram: {e}")
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    posts = []
    message_wraps = soup.select('div.tgme_widget_message_wrap')
    
    for wrap in message_wraps[:limit]:
        message = wrap.select_one('div.tgme_widget_message')
        if not message:
            continue
        
        post_id = message.get('data-post', '')
        post_url = f"https://t.me/{channel}/{post_id.split('/')[-1]}" if post_id else ''
        
        date_tag = message.select_one('time')
        date_str = date_tag.get('datetime') if date_tag else ''
        if date_str:
            try:
                dt = datetime.datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                date_display = dt.strftime('%Y-%m-%d %H:%M')
            except:
                date_display = date_str
        else:
            date_display = 'Unknown date'
        
        text_div = message.select_one('div.tgme_widget_message_text')
        text_html = ''
        if text_div:
            inner_soup = BeautifulSoup(text_div.decode_contents(), 'html.parser')
            allowed_tags = ['b', 'i', 'u', 's', 'code', 'pre', 'a', 'br', 'em', 'strong']
            for tag in inner_soup.find_all(True):
                if tag.name not in allowed_tags:
                    tag.unwrap()
                else:
                    attrs = dict(tag.attrs)
                    for attr in attrs:
                        if attr != 'href':
                            del tag[attr]
            text_html = inner_soup.decode_contents()
        
        photo_url = ''
        photo_wrap = message.select_one('a.tgme_widget_message_photo_wrap')
        if photo_wrap:
            style = photo_wrap.get('style', '')
            match = re.search(r"background-image:url\('(.*?)'\)", style)
            if match:
                photo_url = match.group(1)
        
        posts.append({
            'date': date_display,
            'text_html': text_html,
            'photo_url': photo_url,
            'post_url': post_url
        })
    
    return posts

def fetch_github_repos(username):
    """دریافت لیست ریپازیتوری‌های کاربر از API گیت‌هاب"""
    url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated"
    headers = {"Accept": "application/vnd.github.v3+json"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching GitHub repos: {e}")
        return []
    
    repos = response.json()
    repos_sorted = sorted(repos, key=lambda x: x.get('stargazers_count', 0), reverse=True)
    
    result = []
    for repo in repos_sorted:
        name = repo.get('name', '')
        html_url = repo.get('html_url', '#')
        description = repo.get('description', '') or 'بدون توضیح'
        language = repo.get('language', 'نامشخص')
        stars = repo.get('stargazers_count', 0)
        forks = repo.get('forks_count', 0)
        updated = repo.get('updated_at', '')
        if updated:
            try:
                dt = datetime.datetime.fromisoformat(updated.replace('Z', '+00:00'))
                updated_display = dt.strftime('%Y-%m-%d')
            except:
                updated_display = updated
        else:
            updated_display = ''
        result.append({
            'name': name,
            'url': html_url,
            'description': description,
            'language': language,
            'stars': stars,
            'forks': forks,
            'updated': updated_display
        })
    return result

def generate_feed_html(posts):
    """تولید HTML برای بخش فید در README"""
    if not posts:
        return "<p>هیچ پستی یافت نشد.</p>"
    
    cards_html = ""
    for post in posts:
        photo_html = ""
        if post['photo_url']:
            photo_html = f'<img src="{post["photo_url"]}" style="width:100%; border-radius:5px; margin-bottom:10px;" />'
        card = f'''
        <div style="flex: 0 0 auto; width: 300px; margin-right: 15px; background: #ffffff; border: 1px solid #e1e4e8; border-radius: 10px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <div style="font-size: 12px; color: #586069; margin-bottom: 8px;">{post['date']}</div>
            {photo_html}
            <div style="font-size: 14px; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 8; -webkit-box-orient: vertical;">
                {post['text_html']}
            </div>
        </div>
        '''
        cards_html += card
    
    return f'''
    <div style="display: flex; overflow-x: auto; padding: 10px; background-color: #f6f8fa; border-radius: 10px; -webkit-overflow-scrolling: touch;">
        {cards_html}
    </div>
    '''

def generate_repos_html(repos):
    """تولید HTML برای بخش ریپازیتوری‌ها در README"""
    if not repos:
        return "<p>ریپازیتوری‌ای یافت نشد.</p>"
    
    cards_html = ""
    for repo in repos:
        card = f'''
        <div style="flex: 0 0 auto; width: 250px; margin: 5px; background: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-weight: bold; margin-bottom: 5px;"><a href="{repo['url']}" style="text-decoration: none; color: #0366d6;">{repo['name']}</a></div>
            <div style="font-size: 12px; color: #586069; margin-bottom: 8px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">{repo['description']}</div>
            <div style="font-size: 12px; color: #586069;">
                <span style="margin-right: 10px;">⭐ {repo['stars']}</span>
                <span style="margin-right: 10px;">🍴 {repo['forks']}</span>
                <span>💻 {repo['language']}</span>
            </div>
            <div style="font-size: 11px; color: #aaa; margin-top: 5px;">به‌روزرسانی: {repo['updated']}</div>
        </div>
        '''
        cards_html += card
    
    return f'''
    <div style="display: flex; flex-wrap: wrap; justify-content: center;">
        {cards_html}
    </div>
    '''

def main():
    print("Fetching Telegram posts...")
    posts = fetch_telegram_posts(TELEGRAM_CHANNEL)
    print(f"Got {len(posts)} posts")
    
    print("Fetching GitHub repos...")
    repos = fetch_github_repos(GITHUB_USERNAME)
    print(f"Got {len(repos)} repos")
    
    # ذخیره JSON برای داشبورد
    data = {
        'posts': posts,
        'repos': repos,
        'updated_at': datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    }
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"JSON saved to {OUTPUT_JSON}")
    
    # به‌روزرسانی README
    if os.path.exists(README_TEMPLATE):
        with open(README_TEMPLATE, 'r', encoding='utf-8') as f:
            template = f.read()
        
        feed_html = generate_feed_html(posts)
        repos_html = generate_repos_html(repos)
        timestamp = data['updated_at']
        
        readme_content = template.replace('{{FEED}}', feed_html) \
                                 .replace('{{REPOS}}', repos_html) \
                                 .replace('{{TIMESTAMP}}', timestamp)
        
        with open(OUTPUT_README, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        print(f"README.md updated")
    else:
        print(f"Warning: {README_TEMPLATE} not found, skipping README update")

if __name__ == '__main__':
    main()
