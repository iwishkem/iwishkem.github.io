// ==UserScript==
// @name         X (Twitter) Medya İndirici
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  X.com'daki (Twitter) fotoğrafları, videoları ve GIF'leri en yüksek kalitede indirmenizi sağlar.
// @author       t.me/kemsdumpster
// @match        *://twitter.com/*
// @match        *://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @updateURL    https://raw.githubusercontent.com/iwishkem/iwishkem.github.io/main/scripts/x-media-downloader.user.js
// @downloadURL  https://raw.githubusercontent.com/iwishkem/iwishkem.github.io/main/scripts/x-media-downloader.user.js
// @grant        GM_xmlhttpRequest
// @connect      twimg.com
// @connect      api.vxtwitter.com
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const downloadIconSVG = `
        <g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14-7-5 5-5-5m5 5V3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></g>
    `;

    function getThemeColors() {
        let theme = { bg: '#15202b', border: '#38444d', text: '#ffffff', itemBg: '#1e2732', overlay: 'rgba(0, 0, 0, 0.6)' };
        try {
            const bgColor = window.getComputedStyle(document.body).backgroundColor;
            if (bgColor === 'rgb(255, 255, 255)' || bgColor === 'rgba(255, 255, 255, 1)') {
                theme = { bg: '#ffffff', border: '#eff3f4', text: '#0f1419', itemBg: '#f7f9f9', overlay: 'rgba(0, 0, 0, 0.4)' };
            } else if (bgColor === 'rgb(0, 0, 0)' || bgColor === 'rgba(0, 0, 0, 1)') {
                theme = { bg: '#000000', border: '#2f3336', text: '#e7e9ea', itemBg: '#16181c', overlay: 'rgba(255, 255, 255, 0.1)' };
            }
        } catch(e) {}
        return theme;
    }

    async function fetchTweetData(username, tweetId) {
        const apiUrl = `https://api.vxtwitter.com/${username}/status/${tweetId}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("API hatası");
        return await response.json();
    }

    function downloadMedia(mediaObj, btnContainer, username, tweetId, index) {
        const url = mediaObj.url;
        const type = mediaObj.type || 'image';

        let extension = url.split('.').pop().split('?')[0];
        if (!['mp4', 'png', 'jpg', 'jpeg'].includes(extension)) extension = 'jpg';

        let typeName = 'Foto';
        if (type === 'video') typeName = 'Video';
        if (type === 'gif') typeName = 'GIF';

        const safeUsername = username ? `@${username}` : 'X';
        const fileName = `${safeUsername}_${tweetId}_${typeName}_${index + 1}.${extension}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'blob',
            onload: function(res) {
                const blobUrl = URL.createObjectURL(res.response);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = blobUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();

                setTimeout(() => { URL.revokeObjectURL(blobUrl); document.body.removeChild(a); }, 1000);

                if(btnContainer) {
                    btnContainer.dataset.status = 'success';
                    btnContainer.title = "İndirme Tamamlandı!";
                    btnContainer.style.color = '#00ba7c';
                    setTimeout(() => {
                        btnContainer.dataset.status = '';
                        btnContainer.style.color = 'rgb(113, 118, 123)';
                        btnContainer.title = "En Yüksek Kalitede İndir";
                    }, 3000);
                }
            },
            onprogress: function(progress) {
                if (progress.lengthComputable && btnContainer) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    btnContainer.title = `%${percent} İndiriliyor...`;
                }
            },
            onerror: function(err) {
                console.error("İndirme Hatası:", err);
                if(btnContainer) {
                    btnContainer.dataset.status = 'error';
                    btnContainer.title = "Hata oluştu!";
                    btnContainer.style.color = '#f91880';
                }
            }
        });
    }

    function showDownloadMenu(mediaArr, btnContainer, username, tweetId) {
        const theme = getThemeColors();
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: ${theme.overlay}; backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            z-index: 999999; opacity: 0; transition: opacity 0.3s ease;
        `;

        const menuBox = document.createElement('div');
        menuBox.style.cssText = `
            background: ${theme.bg}; border: 1px solid ${theme.border}; border-radius: 16px;
            padding: 16px; width: 85%; max-width: 320px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex; flex-direction: column; gap: 12px;
            transform: translateY(20px); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        `;

        const title = document.createElement('div');
        title.innerText = "Hangi medyayı indirmek istersiniz?";
        title.style.cssText = `color: ${theme.text}; font-weight: bold; font-size: 16px; text-align: center; margin-bottom: 8px;`;
        menuBox.appendChild(title);

        mediaArr.forEach((mediaObj, index) => {
            const itemBtn = document.createElement('button');
            itemBtn.style.cssText = `
                background: ${theme.itemBg}; border: 1px solid ${theme.border}; border-radius: 12px;
                padding: 8px 12px; color: ${theme.text}; display: flex; align-items: center; gap: 12px;
                cursor: pointer; font-size: 15px; font-weight: 500; transition: filter 0.2s; border: none; width: 100%;
            `;
            itemBtn.addEventListener('mouseover', () => itemBtn.style.filter = 'brightness(0.9)');
            itemBtn.addEventListener('mouseout', () => itemBtn.style.filter = 'brightness(1)');

            const thumb = document.createElement('img');
            thumb.src = mediaObj.thumbnail_url || mediaObj.url;
            thumb.style.cssText = "width: 40px; height: 40px; border-radius: 6px; object-fit: cover; background: #888;";

            let typeName = mediaObj.type === 'video' ? 'Video' : (mediaObj.type === 'gif' ? 'GIF' : 'Fotoğraf');
            const text = document.createElement('span');
            text.innerText = `${typeName} ${index + 1}`;

            itemBtn.appendChild(thumb);
            itemBtn.appendChild(text);

            itemBtn.addEventListener('click', () => {
                downloadMedia(mediaObj, btnContainer, username, tweetId, index);
                closeMenu();
            });
            menuBox.appendChild(itemBtn);
        });

        if (mediaArr.length > 1) {
            const downloadAllBtn = document.createElement('button');
            downloadAllBtn.innerText = `Tümünü İndir (${mediaArr.length})`;
            downloadAllBtn.style.cssText = `
                background: #1d9bf0; color: white; border: none; border-radius: 9999px;
                padding: 12px; font-weight: bold; font-size: 15px; cursor: pointer; margin-top: 4px;
            `;
            downloadAllBtn.addEventListener('mouseover', () => downloadAllBtn.style.background = '#1a8cd8');
            downloadAllBtn.addEventListener('mouseout', () => downloadAllBtn.style.background = '#1d9bf0');

            downloadAllBtn.addEventListener('click', () => {
                mediaArr.forEach((mediaObj, index) => downloadMedia(mediaObj, null, username, tweetId, index));
                btnContainer.dataset.status = 'success';
                btnContainer.style.color = '#00ba7c';
                setTimeout(() => { btnContainer.dataset.status = ''; btnContainer.style.color = 'rgb(113, 118, 123)'; }, 3000);
                closeMenu();
            });
            menuBox.appendChild(downloadAllBtn);
        }

        const cancelBtn = document.createElement('button');
        cancelBtn.innerText = "İptal";
        cancelBtn.style.cssText = `background: transparent; color: rgb(113, 118, 123); border: none; padding: 10px; font-weight: bold; font-size: 15px; cursor: pointer;`;
        cancelBtn.addEventListener('click', closeMenu);
        menuBox.appendChild(cancelBtn);

        overlay.appendChild(menuBox);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => { overlay.style.opacity = '1'; menuBox.style.transform = 'translateY(0)'; });

        function closeMenu() {
            overlay.style.opacity = '0';
            menuBox.style.transform = 'translateY(20px)';
            setTimeout(() => { if(overlay.parentNode) document.body.removeChild(overlay); }, 300);
        }

        overlay.addEventListener('click', (e) => { if(e.target === overlay) closeMenu(); });
    }

    function createDownloadButton(actionBar, tweetElement, isLightboxFallback) {
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = `
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; padding-left: 8px; padding-right: 8px; height: 100%;
            color: rgb(113, 118, 123); transition: color 0.2s ease;
        `;
        btnContainer.title = "En Yüksek Kalitede İndir";

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.style.width = '1.35em';
        svg.style.height = '1.35em';
        svg.innerHTML = downloadIconSVG;
        btnContainer.appendChild(svg);

        btnContainer.addEventListener('mouseover', () => { if(btnContainer.dataset.status !== 'loading') btnContainer.style.color = '#1d9bf0'; });
        btnContainer.addEventListener('mouseout', () => { if(btnContainer.dataset.status !== 'loading' && btnContainer.dataset.status !== 'success') btnContainer.style.color = 'rgb(113, 118, 123)'; });

        btnContainer.addEventListener('click', async (e) => {
            e.preventDefault(); e.stopPropagation();
            if (btnContainer.dataset.status === 'loading') return;

            let targetTweetId, targetUsername;

            if (tweetElement) {
                const timeLinks = Array.from(tweetElement.querySelectorAll('a[href*="/status/"]')).filter(a => a.querySelector('time'));
                if (timeLinks.length > 0) {
                    const mainUrl = new URL(timeLinks[0].href);
                    targetTweetId = mainUrl.pathname.split('/').pop();
                    targetUsername = mainUrl.pathname.split('/')[1];
                } else {
                    const statusLink = Array.from(tweetElement.querySelectorAll('a')).find(a => a.href.includes('/status/'));
                    if (statusLink) {
                        const urlObj = new URL(statusLink.href);
                        targetTweetId = urlObj.pathname.split('/').pop();
                        targetUsername = urlObj.pathname.split('/')[1];
                    }
                }
            }

            if (!targetTweetId && (isLightboxFallback || window.location.pathname.includes('/status/'))) {
                const match = window.location.pathname.match(/\/(.+)\/status\/(\d+)/);
                if (match) {
                    targetUsername = match[1];
                    targetTweetId = match[2];
                }
            }

            if (!targetTweetId) {
                alert("Tweet bağlantısı tespit edilemedi.");
                return;
            }

            try {
                btnContainer.dataset.status = 'loading';
                btnContainer.style.color = '#ffd700';
                btnContainer.title = "Medya aranıyor...";

                let data = await fetchTweetData(targetUsername, targetTweetId);

                if (data && data.media_extended && data.media_extended.length > 0) {
                    const mediaArr = data.media_extended;
                    const finalUsername = data.user_screen_name || targetUsername;
                    const finalTweetId = data.tweetID || targetTweetId;

                    if (mediaArr.length > 1) {
                        btnContainer.dataset.status = '';
                        btnContainer.style.color = 'rgb(113, 118, 123)';
                        btnContainer.title = "Seçim bekleniyor...";
                        showDownloadMenu(mediaArr, btnContainer, finalUsername, finalTweetId);
                    } else {
                        downloadMedia(mediaArr[0], btnContainer, finalUsername, finalTweetId, 0);
                    }
                } else {
                    throw new Error("Medya bulunamadı");
                }
            } catch (error) {
                console.error(error);
                btnContainer.dataset.status = 'error';
                btnContainer.style.color = '#f91880';
                btnContainer.title = "Medya bulunamadı!";
                alert("Medyaya ulaşılamadı. Tweet silinmiş, gizli veya API limiti dolmuş olabilir.");
            }
        });

        actionBar.appendChild(btnContainer);
    }

    function hasMainTweetMedia(tweet) {
        const timeElements = tweet.querySelectorAll('time');
        if (timeElements.length > 1) {
            return false;
        }

        const mediaElements = Array.from(tweet.querySelectorAll('video, div[data-testid="tweetPhoto"], div[data-testid="videoPlayer"]'));
        return mediaElements.length > 0;
    }

    function addDownloadButtons() {
        const actionBars = document.querySelectorAll('[role="group"]:not([data-has-downloader="true"])');

        const isLightboxUrl = window.location.pathname.includes('/photo/') || window.location.pathname.includes('/video/');
        let lightboxTweetId = null;
        if (isLightboxUrl) {
            const match = window.location.pathname.match(/\/(.+)\/status\/(\d+)/);
            if (match) lightboxTweetId = match[2];
        }

        actionBars.forEach(actionBar => {
            const isValidInteractionBar = actionBar.querySelector('[data-testid="reply"], [data-testid="like"], [data-testid="retweet"]');
            if (!isValidInteractionBar) return;

            const tweet = actionBar.closest('article');

            if (tweet) {
                if (!hasMainTweetMedia(tweet)) return;
                createDownloadButton(actionBar, tweet, false);
                actionBar.dataset.hasDownloader = 'true';
            }
            else if (isLightboxUrl) {
                createDownloadButton(actionBar, null, true);
                actionBar.dataset.hasDownloader = 'true';
            }
        });
    }

    const observer = new MutationObserver(addDownloadButtons);
    observer.observe(document.body, { childList: true, subtree: true });
    addDownloadButtons();

})();
