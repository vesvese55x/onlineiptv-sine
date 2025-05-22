// Çalma listesi ile ilgili işlevler
const Playlist = {
    /**
     * Kanalları görüntüle
     * @param {Array} channels - Görüntülenecek kanallar listesi
     */
    displayChannels: function(channels) {
        const playlistElement = document.querySelector('#playlist ul');
        playlistElement.innerHTML = '';

        if (channels.length === 0) {
            this.showError("M3U dosyasında/URL'sinde kanal bulunamadı.");
            document.getElementById('playlist-search').value = '';
            app.allChannelItems = [];
            return;
        }

        app.allChannelItems = [];

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
                            Player.copyChannelUrl(listItem);
                            return;
                        }
                        
                        // Regular tap
                        if (touchDuration < 500 && touchDistanceX < 20 && touchDistanceY < 20) {
                            Player.selectAndPlayChannel(listItem);
                        }
                    }, { passive: false });

                    listItem.addEventListener('click', (event) => {
                        // For desktop
                        if (!app.isMobile) {
                            if (event.shiftKey) {
                                Player.copyChannelUrl(listItem);
                            } else {
                                Player.selectAndPlayChannel(listItem);
                            }
                        }
                    });

                    playlistElement.appendChild(listItem);
                    app.allChannelItems.push(listItem);

                    if (!firstChannelItem && channel.url) {
                        firstChannelItem = listItem;
                    }
                });
            }
        }

        if (firstChannelItem) {
            firstChannelItem.classList.add('selected');
            Player.playChannel(firstChannelItem.dataset.url, true);
        }
    },

    /**
     * Hata mesajını göster
     * @param {string} message - Gösterilecek hata mesajı
     */
    showError: function(message) {
        const playlistElement = document.querySelector('#playlist ul');
        playlistElement.innerHTML = '';
        const listItem = document.createElement('li');
        listItem.textContent = message;
        listItem.style.color = '#ff6b6b';
        listItem.style.textAlign = 'center';
        listItem.style.padding = '20px';
        playlistElement.appendChild(listItem);
    },

    /**
     * Arama işlevselliği
     * @param {string} searchTerm - Aranacak terim
     */
    search: function(searchTerm) {
        const term = searchTerm.toLowerCase();
        app.allChannelItems.forEach(item => {
            const channelName = item.textContent.toLowerCase();
            if (channelName.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
};
