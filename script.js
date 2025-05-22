const player = videojs('my-video');

const defaultM3uUrl = 'https://raw.githubusercontent.com/Sakubaba00/saku/refs/heads/main/playlist1.m3u';

const m3uFileInput = document.getElementById('m3uFileInput');
const m3uUrlInput = document.getElementById('m3uUrlInput');
const loadUrlButton = document.getElementById('loadUrlButton');

const playlistElement = document.querySelector('#playlist ul');
const playlistContainer = document.getElementById('playlist');
const body = document.body;

const playlistToggleHandle = document.getElementById('playlist-toggle-handle');

const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.id = 'playlist-search';
searchInput.placeholder = 'Kanal Ara...';
playlistContainer.insertBefore(searchInput, playlistElement);

let allChannelItems = [];

// Global kanal listesi değişkeni
let currentPlaylistChannels = [];

// Dokunmatik olay dinleyicileri için değişkenler
let touchStartX = 0;
let touchStartY = 0; // Başlangıç dikey konumunu kaydetmek için
let touchEndX = 0;
let touchEndY = 0;
let touchStartTime = 0;
const swipeThreshold = 50; // Kaydırma hareketi için minimum mesafe (piksel)
const tapThreshold = 10; // Dokunma için maksimum hareket mesafesi (piksel)
const doubleTapThreshold = 300; // Çift dokunma için maksimum süre (ms)
let lastTapTime = 0;

// Ses ayarlama için eklenecek değişkenler
let initialVolume = 0;
let isVolumeDragging = false;
const volumeDragThreshold = 5; // Ses ayarlama hareketini başlatmak için minimum dikey mesafe

const videoPlayerElement = player.el(); // Video.js oynatıcı elementini al

function updateToggleHandleVisibility() {
    if (window.innerWidth <= 768) {
        playlistToggleHandle.style.opacity = '1';
        playlistToggleHandle.style.pointerEvents = 'auto';
    } else {
        if (!body.classList.contains('playlist-visible')) {
           playlistToggleHandle.style.opacity = '0';
           playlistToggleHandle.style.pointerEvents = 'none';
        } else {
           playlistToggleHandle.style.opacity = '1';
           playlistToggleHandle.style.pointerEvents = 'auto';
        }
    }
}

updateToggleHandleVisibility();

window.addEventListener('resize', updateToggleHandleVisibility);

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

window.addEventListener('mousemove', (event) => {
    if (window.innerWidth > 768) {
        const mouseX = event.clientX;
        const toggleHandleRect = playlistToggleHandle.getBoundingClientRect();

        const isNearLeftEdge = mouseX <= 75;
        const isOverHandle = mouseX >= toggleHandleRect.left && mouseX <= toggleHandleRect.right &&
                             event.clientY >= toggleHandleRect.top && event.clientY <= toggleHandleRect.bottom;

        if (!body.classList.contains('playlist-visible')) {
            if (isNearLeftEdge || isOverHandle) { // Kenara yakınsa VEYA çentik üzerindeyse göster
                playlistToggleHandle.style.opacity = '1';
                playlistToggleHandle.style.pointerEvents = 'auto';
            } else {
                 playlistToggleHandle.style.opacity = '0';
                 playlistToggleHandle.style.pointerEvents = 'none';
            }
        } else {
            playlistToggleHandle.style.opacity = '1';
            playlistToggleHandle.style.pointerEvents = 'auto';
        }
    }
});

window.addEventListener('touchstart', (event) => {
     if (window.innerWidth > 768 && event.touches.length > 0) {
        const touchX = event.touches[0].clientX;
        const toggleHandleRect = playlistToggleHandle.getBoundingClientRect();

        const isNearLeftEdge = touchX <= 75;
        const isOverHandle = touchX >= toggleHandleRect.left && touchX <= toggleHandleRect.right &&
                             event.touches[0].clientY >= toggleHandleRect.top && event.touches[0].clientY <= toggleHandleRect.bottom;

        if (!body.classList.contains('playlist-visible') && (isNearLeftEdge || isOverHandle)) {
            playlistToggleHandle.style.opacity = '1';
            playlistToggleHandle.style.pointerEvents = 'auto';

        } else if (!body.classList.contains('playlist-visible') && !isNearLeftEdge && !isOverHandle) {
             playlistToggleHandle.style.opacity = '0';
             playlistToggleHandle.style.pointerEvents = 'none';
        } else if (body.classList.contains('playlist-visible')) {
             playlistToggleHandle.style.opacity = '1';
             playlistToggleHandle.style.pointerEvents = 'auto';
        }
     }
});

videoPlayerElement.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) { // Tek parmak dokunuşu
        touchStartX = event.changedTouches[0].clientX;
        touchStartY = event.changedTouches[0].clientY;
        touchStartTime = new Date().getTime();
        initialVolume = player.volume(); // Dokunma başladığında sesi kaydet
        isVolumeDragging = false; // Ses ayarlama bayrağını sıfırla
        event.preventDefault(); // Varsayılan kaydırma davranışını engellemek isteyebiliriz
    }
});

videoPlayerElement.addEventListener('touchmove', (event) => {
    if (event.touches.length === 1) { // Tek parmak dokunuşu
        const currentTouchY = event.touches[0].clientY;
        const deltaY = currentTouchY - touchStartY; // Dikey hareket miktarı
        const deltaX = event.changedTouches[0].clientX - touchStartX; // Yatay hareket miktarı

        // Ses ayarlama hareketinin başlayıp başlamadığını kontrol et
        if (!isVolumeDragging && Math.abs(deltaY) > volumeDragThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
             isVolumeDragging = true;
             // Opsiyonel: İlk kaydırmadan sonra varsayılan davranışı engelle
             // event.preventDefault();
        }

        if (isVolumeDragging) {
            event.preventDefault(); // Ses ayarlama sırasında varsayılan kaydırmayı engelle

            const playerHeight = videoPlayerElement.clientHeight;
            // Dikey hareket miktarına göre ses değişimini hesapla
            // Yukarı kaydırma (deltaY negatif) sesi artırır, aşağı (deltaY pozitif) azaltır.
            // playerHeight boyunca yapılan kaydırma sesi tam olarak 0'dan 1'e veya tam tersi değiştirmeli.
            const volumeChange = -deltaY / playerHeight;

            let newVolume = initialVolume + volumeChange;

            // Ses seviyesini 0 ile 1 arasında sınırla
            newVolume = Math.max(0, Math.min(1, newVolume));

            player.volume(newVolume);
            // console.log('Ses seviyesi ayarlandı:', newVolume.toFixed(2)); // Hata ayıklama için
        }
    }
});

videoPlayerElement.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].clientX;
    touchEndY = event.changedTouches[0].clientY;
    const touchEndTime = new Date().getTime();
    const tapDuration = touchEndTime - touchStartTime;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Ses ayarlama hareketi yapılmadıysa dokunma ve kaydırma hareketlerini işle
    if (!isVolumeDragging) {
        if (moveDistance < tapThreshold) { // Bu bir dokunma olabilir
            const currentTime = new Date().getTime();
            const timeSinceLastTap = currentTime - lastTapTime;

            if (timeSinceLastTap <= doubleTapThreshold) {
                // Çift dokunma algılandı
                console.log('Çift dokunma algılandı');
                if (!player.paused()) {
                    player.pause();
                } else {
                    player.play();
                }
                lastTapTime = 0; // Çift dokunmayı sıfırla
            } else {
                // Tek dokunma başlangıcı, çift dokunma için zamanı kaydet
                lastTapTime = currentTime;
                 console.log('Tek dokunma algılandı, çift dokunma için bekleniyor');
            }
        }

        // Dokunma bittiğinde kaydırma hareketi olup olmadığını kontrol et
        handleSwipeGesture();
    } else {
        // Ses ayarlama hareketi tamamlandı
        console.log('Ses ayarlama tamamlandı.');
        isVolumeDragging = false; // Bayrağı sıfırla
        // initialVolume = player.volume(); // Yeni başlangıç sesini kaydet (isteğe bağlı)
    }

    // event.preventDefault(); // Varsayılan davranışı engellemek isteyebiliriz
});

function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;
    if (Math.abs(deltaX) > Math.abs(touchEndY - touchStartY) && Math.abs(deltaX) > swipeThreshold) { // Dikey hareketten daha belirgin yatay hareket
        // Yatay Kaydırma
        if (deltaX > 0) {
            console.log('Sağa Kaydırma'); // Sonraki kanal
            playNextChannel();
        } else {
            console.log('Sola Kaydırma'); // Önceki kanal
            playPreviousChannel();
        }
    }
}

// Yeni Eklenecek Fonksiyonların Taslağı
function playNextChannel() {
    console.log('Sonraki kanal oynatılıyor...');
    const currentlyPlayingUrl = player.currentSrc();
    const currentIndex = currentPlaylistChannels.findIndex(channel => channel.url === currentlyPlayingUrl);

    if (currentIndex !== -1 && currentIndex < currentPlaylistChannels.length - 1) {
        const nextChannel = currentPlaylistChannels[currentIndex + 1];
        playChannel(nextChannel.url);

        // Çalma listesindeki seçili öğeyi güncelle
        const previouslySelected = playlistElement.querySelector('li.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }
        // allChannelItems kullanarak yeni seçili öğeyi bul ve işaretle
        const nextSelectedItem = allChannelItems.find(item => item.dataset.url === nextChannel.url);
        if (nextSelectedItem) {
            nextSelectedItem.classList.add('selected');
            // İsteğe bağlı: Yeni seçili öğeye scroll yap
            nextSelectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

    } else {
        console.log('Son kanaldayız.');
        // İsteğe bağlı: Listenin başına dönebilir veya başka bir bildirim gösterebilirsiniz.
    }
}

function playPreviousChannel() {
    console.log('Önceki kanal oynatılıyor...');
    const currentlyPlayingUrl = player.currentSrc();
    const currentIndex = currentPlaylistChannels.findIndex(channel => channel.url === currentlyPlayingUrl);

    if (currentIndex > 0) {
        const previousChannel = currentPlaylistChannels[currentIndex - 1];
        playChannel(previousChannel.url);

        // Çalma listesindeki seçili öğeyi güncelle
        const previouslySelected = playlistElement.querySelector('li.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }
         // allChannelItems kullanarak yeni seçili öğeyi bul ve işaretle
        const previousSelectedItem = allChannelItems.find(item => item.dataset.url === previousChannel.url);
        if (previousSelectedItem) {
            previousSelectedItem.classList.add('selected');
            // İsteğe bağlı: Yeni seçili öğeye scroll yap
            previousSelectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

    } else {
        console.log('İlk kanaldayız.');
        // İsteğe bağlı: Listenin sonuna dönebilir veya başka bir bildirim.
    }
}

function adjustVolume(newVolume) {
    if (player) {
        player.volume(newVolume);
        console.log('Ses seviyesi ayarlandı:', newVolume);
        // İsteğe bağlı: Kullanıcıya ses seviyesini gösteren bir UI öğesi
    }
}

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

loadUrlButton.addEventListener('click', async () => {
    closeUploadModal();
    const url = m3uUrlInput.value.trim();
    if (!url) {
        console.error("Lütfen bir M3U URL'si girin.");
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
        playlistElement.innerHTML = '';
        const listItem = document.createElement('li');
        listItem.textContent = `URL yüklenemedi: ${error.message}`;
        listItem.style.color = 'red';
        playlistElement.appendChild(listItem);
    }
});

playlistToggleHandle.addEventListener('click', () => {
    body.classList.toggle('playlist-visible');
});

const openUploadModalButton = document.getElementById('open-upload-modal-button');
const modalOverlay = document.getElementById('modal-overlay');

openUploadModalButton.addEventListener('click', () => {
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
            playlistElement.innerHTML = '';
            const listItem = document.createElement('li');
            listItem.textContent = `Varsayılan URL yüklenemedi: ${error.message}`;
            listItem.style.color = 'red';
            playlistElement.appendChild(listItem);
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

    // Ayrıştırılmış kanal listesini global değişkene ata
    currentPlaylistChannels = channels;

    displayChannels(channels);
}

function displayChannels(channels) {
    playlistElement.innerHTML = '';

    if (channels.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = "M3U dosyasında/URL'sinde kanal bulunamadı.";
        playlistElement.appendChild(listItem);
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

                listItem.addEventListener('click', (event) => {
                    const previouslySelected = playlistElement.querySelector('li.selected');
                    if (previouslySelected) {
                        previouslySelected.classList.remove('selected');
                    }

                    event.currentTarget.classList.add('selected');

                    const urlToCopy = event.currentTarget.dataset.url;
                    if (event.shiftKey) {
                        navigator.clipboard.writeText(urlToCopy).then(() => {
                            console.log('URL panoya kopyalandı:', urlToCopy);
                            event.currentTarget.classList.add('copied');
                            setTimeout(() => {
                                event.currentTarget.classList.remove('copied');
                            }, 1000);
                        }).catch(err => {
                            console.error('URL kopyalanırken hata oluştu:', err);
                        });
                    } else {
                        playChannel(urlToCopy, false);
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

        player.play();
    } else {
        console.error("Video.js oynatıcı nesnesi bulunamadı.");
    }
}

// Mobil cihazlardaysa sayfa yüklendiğinde playlisti görünür yap
window.addEventListener('load', () => {
    if (window.innerWidth <= 768) {
        body.classList.add('playlist-visible');
    }
});

// Pencere boyutu değiştiğinde mobil boyuta girilirse playlisti görünür yap
window.addEventListener('resize', () => {
     if (window.innerWidth <= 768 && !body.classList.contains('playlist-visible')) {
        body.classList.add('playlist-visible');
    } /*else if (window.innerWidth > 768 && body.classList.contains('playlist-visible')) {
        // Eğer masaüstü boyuta dönülürse ve playlist açıksa,
        // masaüstü varsayılan durumuna göre davranması için sınıfı kaldırabiliriz.
        // Ancak mobil deneyimi bozmamak adına bu kısmı şimdilik opsiyonel tutuyorum.
        // body.classList.remove('playlist-visible');
        // updateToggleHandleVisibility(); // Masaüstü handle görünürlüğünü güncelle
    }*/
});
