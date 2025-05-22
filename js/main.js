// Ana uygulama başlatma ve global değişkenler
document.addEventListener('DOMContentLoaded', function() {
    // Global değişkenler
    window.app = {
        player: null,
        isMobile: window.innerWidth <= 768,
        allChannelItems: [],
        lastTouchEnd: 0,
        defaultM3uUrl: 'https://raw.githubusercontent.com/Sakubaba00/saku/refs/heads/main/playlist1.m3u'
    };

    // Video.js oynatıcısını başlat
    app.player = videojs('my-video');

    // Mobil algılama
    window.addEventListener('resize', UI.checkMobile);
    window.addEventListener('orientationchange', () => {
        setTimeout(UI.checkMobile, 100);
    });

    // Olay dinleyicilerini başlat
    UI.initEventListeners();

    // Varsayılan M3U listesini yükle
    if (app.defaultM3uUrl) {
        console.log('Varsayılan M3U URL yükleniyor:', app.defaultM3uUrl);
        M3UParser.loadFromUrl(app.defaultM3uUrl);
    }

    // İlk mobil kontrolü
    UI.checkMobile();

    // iOS için çift dokunma yakınlaştırmasını engelle
    document.addEventListener('touchend', function (event) {
        var now = (new Date()).getTime();
        if (now - app.lastTouchEnd <= 300) {
            event.preventDefault();
        }
        app.lastTouchEnd = now;
    }, false);
});
