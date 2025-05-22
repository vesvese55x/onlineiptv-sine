const player = videojs('my-video');

const defaultM3uUrl = 'https://raw.githubusercontent.com/Sakubaba00/saku/refs/heads/main/playlist1.m3u';

const m3uFileInput = document.getElementById('m3uFileInput');
const m3uUrlInput = document.getElementById('m3uUrlInput');
const loadUrlButton = document.getElementById('loadUrlButton');

const playlistElement = document.querySelector('#playlist ul');
const playlistContainer = document.getElementById('playlist');
const body = document.body;

const playlistToggleHandle = document.getElementById('playlist-toggle-handle');
const searchInput = document.getElementById('playlist-search');
const scrollToTopButton = document.getElementById('scroll-to-top-button');

// Mobile elements
const mobilePlaylistToggle = document.getElementById('mobile-playlist-toggle');
const mobileUploadButton = document.getElementById('mobile-upload-button');

let allChannelItems = [];
let isMobile = window.innerWidth <= 768;

// Mobile detection and handling
function checkMobile() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;

    if (wasMobile !== isMobile) {
        // Mode changed, reset playlist visibility
        if (!isMobile && body.classList.contains('playlist-visible')) {
            // Desktop mode, keep playlist open but adjust video
            body.classList.add('playlist-visible');
        } else if (isMobile) {
            // Mobile mode, close playlist initially
            body.classList.remove('playlist-visible');
        }
    }
}

window.addEventListener('resize', checkMobile);
window.addEventListener('orientationchange', () => {
    setTimeout(checkMobile, 100);
});

// Search functionality
searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();

    allChannelItems.forEach(item => {
        const channelName = item.textContent.toLowerCase();
        if (channelName.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});

// Scroll to top functionality
scrollToTopButton.addEventListener('click', () => {
    playlistContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

playlistContainer.addEventListener('scroll', () => {
    if (playlistContainer.scrollTop > 100) {
        scrollToTopButton.classList.add('show');
    } else {
        scrollToTopButton.classList.remove('show');
    }
});

// Desktop mouse hover for toggle handle
window.addEventListener('mousemove', (event) => {
    if (isMobile) return;

    const mouseX = event.clientX;
    const toggleHandleRect = playlistToggleHandle.getBoundingClientRect();

    const isNearLeftEdge = mouseX <= 75;
    const isOverHandle = mouseX >= toggleHandleRect.left && mouseX <= toggleHandleRect.right &&
                         event.clientY >= toggleHandleRect.top && event.clientY <= toggleHandleRect.bottom;

    if (!body.classList.contains('playlist-visible') && isNearLeftEdge) {
        playlistToggleHandle.style.opacity = '1';
        playlistToggleHandle.style.pointerEvents = 'auto';
    } else if (!body.classList.contains('playlist-visible') && !isNearLeftEdge && !isOverHandle) {
         playlistToggleHandle.style.opacity = '0';
         playlistToggleHandle.style.pointerEvents = 'none';
    }
});

// File input handling
m3uFileInput.addEventListener('change', (event) => {
    closeUploadModal();
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        parseM3uContent(content);
    };
    reader.readAsText(file);
});

// URL loading
loadUrlButton.addEventListener('click', async () => {
    closeUploadModal();
    const url = m3uUrlInput.value.trim();
    if (!url) {
        showError("Lütfen bir M3U URL'si girin.");
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        parseM3uContent(content);
    } catch (error) {
        console.error("M3U URL'si yüklenirken hata oluştu:", error);
        showError(`URL yüklenemedi: ${error.message}`);
    }
});

// Toggle handlers
playlistToggleHandle.addEventListener('click', () => {
    body.classList.toggle('playlist-visible');
});

mobilePlaylistToggle.addEventListener('click', () => {
    body.classList.toggle('playlist-visible');
});

// Modal handling
const openUploadModalButton = document.getElementById('open-upload-modal-button');
const modalOverlay = document.getElementById('modal-overlay');

openUploadModalButton.addEventListener('click', () => {
    modalOverlay.classList.add('visible');
});

mobileUploadButton.addEventListener('click', () => {
    modalOverlay.classList.add('visible');
});

modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
        closeUploadModal();
    }
});

function closeUploadModal() {
    modalOverlay.classList.remove('visible');
}

function showError(message) {
    playlistElement.innerHTML = '';
    const listItem = document.createElement('li');
    listItem.textContent = message;
    listItem.style.color = '#ff6b6b';
    listItem.style.textAlign = 'center';
    listItem.style.padding = '20px';
    playlistElement.appendChild(listItem);
}

// Load default M3U
if (defaultM3uUrl) {
    console.log('Varsayılan M3U URL yükleniyor:', defaultM3uUrl);
    fetch(defaultM3uUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(content => {
            parseM3uContent(content);
            console.log('Varsayılan M3U listesi başarıyla yüklendi.');
        })
        .catch(error => {
            console.error('Varsayılan M3U URL yüklenirken hata oluştu:', error);
            showError(`Varsayılan URL yüklenemedi: ${error.message}`);
        });
}

function parseM3uContent(content) {
    const lines = content.split('\n');
    const channels = [];
    let currentChannel = null;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('#EXTINF:')) {
            const match = trimmedLine.match(/#EXTINF:(-?\d+)(.*?),(.*)/);
            if (match) {
                currentChannel = {
                    duration: parseInt(match[1], 10),
                    attributes: match[2].trim(),
                    name: match[3].trim(),
                    url: null
                };
                const groupMatch = currentChannel.attributes.match(/group-title="(.*?)"/);
                if (groupMatch) {
                    currentChannel.group = groupMatch[1];
                }
            }
        } else if (trimmedLine.startsWith('#EXTVLCOPT:')) {
            continue;
        } else if (trimmedLine && !trimmedLine.startsWith('#')) {
            if (currentChannel) {
                currentChannel.url = trimmedLine;
                channels.push(currentChannel);
                currentChannel = null;
            }
        }
    }

    displayChannels(channels);
}

function displayChannels(channels) {
    playlistElement.innerHTML = '';

    if (channels.length === 0) {
        showError("M3U dosyasında/URL'sinde kanal bulunamadı.");
        searchInput.value = '';
        allChannelItems = [];
        return;
    }

    allChannelItems = [];

    const groupedChannels = channels.reduce((groups, channel) => {
        const group = channel.group || 'Diğer Kanallar';
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(channel);
        return groups;
    }, {});

    let firstChannelItem = null;
    for (const group in groupedChannels) {
        if (groupedChannels.hasOwnProperty(group)) {
            const groupHeader = document.createElement('li');
            groupHeader.classList.add('group-header');
            groupHeader.textContent = group;
            playlistElement.appendChild(groupHeader);

            groupedChannels[group].forEach(channel => {
                const listItem = document.createElement('li');
                listItem.textContent = channel.name;
                listItem.dataset.url = channel.url;

                // Touch and click handling
                let touchStartTime = 0;
                let touchStartX = 0;
                let touchStartY = 0;

                listItem.addEventListener('touchstart', (e) => {
                    touchStartTime = Date.now();
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                }, { passive: true });

                listItem.addEventListener('touchend', (e) => {
                    const touchEndTime = Date.now();
                    const touchDuration = touchEndTime - touchStartTime;
                    const touchEndX = e.changedTouches[0].clientX;
                    const touchEndY = e.changedTouches[0].clientY;
                    const touchDistanceX = Math.abs(touchEndX - touchStartX);
                    const touchDistanceY = Math.abs(touchEndY - touchStartY);

                    // Long press for copy (1 second)
                    if (touchDuration > 1000 && touchDistanceX < 10 && touchDistanceY < 10) {
                        e.preventDefault();
                        copyChannelUrl(listItem);
                        return;
                    }

                    // Regular tap
                    if (touchDuration < 500 && touchDistanceX < 20 && touchDistanceY < 20) {
                        selectAndPlayChannel(listItem);
                    }
                }, { passive: false });

                listItem.addEventListener('click', (event) => {
                    // For desktop
                    if (!isMobile) {
                        if (event.shiftKey) {
                            copyChannelUrl(listItem);
                        } else {
                            selectAndPlayChannel(listItem);
                        }
                    }
                });

                playlistElement.appendChild(listItem);
                allChannelItems.push(listItem);

                if (!firstChannelItem && channel.url) {
                    firstChannelItem = listItem;
                }
            });
        }
    }

    if (firstChannelItem) {
        firstChannelItem.classList.add('selected');
        playChannel(firstChannelItem.dataset.url, true);
    }
}

function selectAndPlayChannel(listItem) {
    const previouslySelected = playlistElement.querySelector('li.selected');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected');
    }

    listItem.classList.add('selected');
    playChannel(listItem.dataset.url, false);

    // On mobile, close playlist after selection
    if (isMobile) {
        setTimeout(() => {
            body.classList.remove('playlist-visible');
        }, 300);
    }
}

function copyChannelUrl(listItem) {
    const urlToCopy = listItem.dataset.url;
    navigator.clipboard.writeText(urlToCopy).then(() => {
        console.log('URL panoya kopyalandı:', urlToCopy);
        listItem.classList.add('copied');
        setTimeout(() => {
            listItem.classList.remove('copied');
        }, 1500);

        // Show feedback for mobile users
        if (isMobile) {
            showToast('URL panoya kopyalandı');
        }
    }).catch(err => {
        console.error('URL kopyalanırken hata oluştu:', err);
        if (isMobile) {
            showToast('Kopyalama başarısız');
        }
    });
}

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        font-size: 14px;
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);

    // Remove after 2 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 2000);
}

function playChannel(url, shouldMute = false) {
    if (player) {
        player.src({
            src: url,
            type: url.includes('.m3u8') ? 'application/x-mpegURL' :
                  (url.includes('.mpd') ? 'application/dash+xml' : 'video/mp4')
        });

        if (shouldMute) {
             player.muted(true);
        }

        if ((url.includes('.m3u8') && !videojs.Html5Hlsjs) || (url.includes('.mpd') && !videojs.Html5Dashjs)) {
             console.warn("Video.js gerekli akış desteğini bulamadı. Lütfen videojs-contrib-hls veya videojs-contrib-dash eklentilerini kontrol edin.");
        }

        player.play().catch(error => {
            console.log('Autoplay prevented:', error);
            // On mobile, user interaction is required for play
            if (isMobile) {
                showToast('Oynatmak için video alanına dokunun');
            }
        });
    } else {
        console.error("Video.js oynatıcı nesnesi bulunamadı.");
    }
}

// Prevent zoom on double tap for iOS
document.addEventListener('touchend', function (event) {
    var now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

var lastTouchEnd = 0;

// Keyboard shortcuts for desktop
document.addEventListener('keydown', (event) => {
    if (isMobile) return;

    switch(event.key) {
        case 'Escape':
            if (body.classList.contains('playlist-visible')) {
                body.classList.remove('playlist-visible');
            }
            if (modalOverlay.classList.contains('visible')) {
                closeUploadModal();
            }
            break;
        case 'Tab':
            if (!body.classList.contains('playlist-visible')) {
                event.preventDefault();
                body.classList.add('playlist-visible');
                searchInput.focus();
            }
            break;
        case '/':
            if (body.classList.contains('playlist-visible')) {
                event.preventDefault();
                searchInput.focus();
            }
            break;
    }
});

// Initialize mobile state
checkMobile();
