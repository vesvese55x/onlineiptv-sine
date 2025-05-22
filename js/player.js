// Video oynatıcı ile ilgili işlevler
const Player = {
    /**
     * Belirtilen URL'deki kanalı oynat
     * @param {string} url - Oynatılacak kanal URL'si
     * @param {boolean} shouldMute - Ses kapatılsın mı
     */
    playChannel: function(url, shouldMute = false) {
        if (app.player) {
            app.player.src({
                src: url,
                type: url.includes('.m3u8') ? 'application/x-mpegURL' :
                      (url.includes('.mpd') ? 'application/dash+xml' : 'video/mp4')
            });

            if (shouldMute) {
                app.player.muted(true);
            }

            if ((url.includes('.m3u8') && !videojs.Html5Hlsjs) || (url.includes('.mpd') && !videojs.Html5Dashjs)) {
                console.warn("Video.js gerekli akış desteğini bulamadı. Lütfen videojs-contrib-hls veya videojs-contrib-dash eklentilerini kontrol edin.");
            }

            app.player.play().catch(error => {
                console.log('Autoplay prevented:', error);
                // On mobile, user interaction is required for play
                if (app.isMobile) {
                    UI.showToast('Oynatmak için video alanına dokunun');
                }
            });
        } else {
            console.error("Video.js oynatıcı nesnesi bulunamadı.");
        }
    },

    /**
     * Seçilen kanal öğesini işaretle ve oynat
     * @param {HTMLElement} listItem - Seçilen kanal öğesi
     */
    selectAndPlayChannel: function(listItem) {
        const playlistElement = document.querySelector('#playlist ul');
        const previouslySelected = playlistElement.querySelector('li.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        listItem.classList.add('selected');
        this.playChannel(listItem.dataset.url, false);
        
        // On mobile, close playlist after selection
        if (app.isMobile) {
            setTimeout(() => {
                document.body.classList.remove('playlist-visible');
            }, 300);
        }
    },

    /**
     * Kanal URL'sini panoya kopyala
     * @param {HTMLElement} listItem - URL'si kopyalanacak kanal öğesi
     */
    copyChannelUrl: function(listItem) {
        const urlToCopy = listItem.dataset.url;
        navigator.clipboard.writeText(urlToCopy).then(() => {
            console.log('URL panoya kopyalandı:', urlToCopy);
            listItem.classList.add('copied');
            setTimeout(() => {
                listItem.classList.remove('copied');
            }, 1500);
            
            // Show feedback for mobile users
            if (app.isMobile) {
                UI.showToast('URL panoya kopyalandı');
            }
        }).catch(err => {
            console.error('URL kopyalanırken hata oluştu:', err);
            if (app.isMobile) {
                UI.showToast('Kopyalama başarısız');
            }
        });
    }
};
