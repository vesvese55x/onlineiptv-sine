// Kullanıcı arayüzü işlevleri
const UI = {
    /**
     * Mobil cihaz kontrolü
     */
    checkMobile: function() {
        const wasMobile = app.isMobile;
        app.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== app.isMobile) {
            // Mode changed, reset playlist visibility
            if (!app.isMobile && document.body.classList.contains('playlist-visible')) {
                // Desktop mode, keep playlist open but adjust video
                document.body.classList.add('playlist-visible');
            } else if (app.isMobile) {
                // Mobile mode, close playlist initially
                document.body.classList.remove('playlist-visible');
            }
        }
    },

    /**
     * Toast mesajı göster
     * @param {string} message - Gösterilecek mesaj
     */
    showToast: function(message) {
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
    },

    /**
     * Yükleme modalını kapat
     */
    closeUploadModal: function() {
        document.getElementById('modal-overlay').classList.remove('visible');
    },

    /**
     * Tüm olay dinleyicilerini başlat
     */
    initEventListeners: function() {
        // DOM elementleri
        const playlistElement = document.querySelector('#playlist ul');
        const playlistContainer = document.getElementById('playlist');
        const playlistToggleHandle = document.getElementById('playlist-toggle-handle');
        const searchInput = document.getElementById('playlist-search');
        const scrollToTopButton = document.getElementById('scroll-to-top-button');
        const mobilePlaylistToggle = document.getElementById('mobile-playlist-toggle');
        const mobileUploadButton = document.getElementById('mobile-upload-button');
        const m3uFileInput = document.getElementById('m3uFileInput');
        const m3uUrlInput = document.getElementById('m3uUrlInput');
        const loadUrlButton = document.getElementById('loadUrlButton');
        const openUploadModalButton = document.getElementById('open-upload-modal-button');
        const modalOverlay = document.getElementById('modal-overlay');

        // Arama işlevselliği
        searchInput.addEventListener('input', (event) => {
            Playlist.search(event.target.value);
        });

        // Yukarı kaydırma butonu
        scrollToTopButton.addEventListener('click', () => {
            playlistContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Çalma listesi kaydırma kontrolü
        playlistContainer.addEventListener('scroll', () => {
            if (playlistContainer.scrollTop > 100) {
                scrollToTopButton.classList.add('show');
            } else {
                scrollToTopButton.classList.remove('show');
            }
        });

        // Masaüstü fare hareketi
        window.addEventListener('mousemove', (event) => {
            if (app.isMobile) return;
            
            const mouseX = event.clientX;
            const toggleHandleRect = playlistToggleHandle.getBoundingClientRect();

            const isNearLeftEdge = mouseX <= 75;
            const isOverHandle = mouseX >= toggleHandleRect.left && mouseX <= toggleHandleRect.right &&
                                event.clientY >= toggleHandleRect.top && event.clientY <= toggleHandleRect.bottom;

            if (!document.body.classList.contains('playlist-visible') && isNearLeftEdge) {
                playlistToggleHandle.style.opacity = '1';
                playlistToggleHandle.style.pointerEvents = 'auto';
            } else if (!document.body.classList.contains('playlist-visible') && !isNearLeftEdge && !isOverHandle) {
                playlistToggleHandle.style.opacity = '0';
                playlistToggleHandle.style.pointerEvents = 'none';
            }
        });

        // Dosya yükleme
        m3uFileInput.addEventListener('change', (event) => {
            this.closeUploadModal();
            M3UParser.loadFromFile(event.target.files[0]);
        });

        // URL yükleme
        loadUrlButton.addEventListener('click', () => {
            this.closeUploadModal();
            M3UParser.loadFromUrl(m3uUrlInput.value.trim());
        });

        // Çalma listesi geçiş kontrolü
        playlistToggleHandle.addEventListener('click', () => {
            document.body.classList.toggle('playlist-visible');
        });

        mobilePlaylistToggle.addEventListener('click', () => {
            document.body.classList.toggle('playlist-visible');
        });

        // Modal kontrolü
        openUploadModalButton.addEventListener('click', () => {
            modalOverlay.classList.add('visible');
        });

        mobileUploadButton.addEventListener('click', () => {
            modalOverlay.classList.add('visible');
        });

        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                this.closeUploadModal();
            }
        });

        // Klavye kısayolları
        document.addEventListener('keydown', (event) => {
            if (app.isMobile) return;
            
            switch(event.key) {
                case 'Escape':
                    if (document.body.classList.contains('playlist-visible')) {
                        document.body.classList.remove('playlist-visible');
                    }
                    if (modalOverlay.classList.contains('visible')) {
                        this.closeUploadModal();
                    }
                    break;
                case 'Tab':
                    if (!document.body.classList.contains('playlist-visible')) {
                        event.preventDefault();
                        document.body.classList.add('playlist-visible');
                        searchInput.focus();
                    }
                    break;
                case '/':
                    if (document.body.classList.contains('playlist-visible')) {
                        event.preventDefault();
                        searchInput.focus();
                    }
                    break;
            }
        });
    }
};
