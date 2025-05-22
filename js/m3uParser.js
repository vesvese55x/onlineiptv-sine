// M3U dosyası ayrıştırma işlevleri
const M3UParser = {
    /**
     * M3U içeriğini ayrıştır
     * @param {string} content - Ayrıştırılacak M3U içeriği
     * @returns {Array} - Ayrıştırılmış kanallar listesi
     */
    parseContent: function(content) {
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

        return channels;
    },

    /**
     * Dosyadan M3U içeriğini yükle
     * @param {File} file - Yüklenecek M3U dosyası
     */
    loadFromFile: function(file) {
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const channels = this.parseContent(content);
            Playlist.displayChannels(channels);
        };
        reader.readAsText(file);
    },

    /**
     * URL'den M3U içeriğini yükle
     * @param {string} url - M3U içeriğinin yükleneceği URL
     */
    loadFromUrl: async function(url) {
        if (!url) {
            Playlist.showError("Lütfen bir M3U URL'si girin.");
            return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            const channels = this.parseContent(content);
            Playlist.displayChannels(channels);
            console.log('M3U listesi başarıyla yüklendi.');
        } catch (error) {
            console.error("M3U URL'si yüklenirken hata oluştu:", error);
            Playlist.showError(`URL yüklenemedi: ${error.message}`);
        }
    }
};
