document.addEventListener('DOMContentLoaded', function() {
    // ===== ИНТЕРАКТИВНЫЙ АРТБОРД =====
    const artboard = document.getElementById('artboard');
    const images = document.querySelectorAll('.floating-image');
    
    if (artboard && images.length > 0) {
        let isMouseDown = false;
        let startX, startY;
        let rotateX = 0, rotateY = 0;
        let targetRotateX = 0, targetRotateY = 0;

        artboard.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            startX = e.clientX;
            startY = e.clientY;
        });

        document.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            targetRotateY = deltaX * 0.1;
            targetRotateX = -deltaY * 0.1;

            rotateX += (targetRotateX - rotateX) * 0.1;
            rotateY += (targetRotateY - rotateY) * 0.1;

            images.forEach((img, index) => {
                const depth = 0.5 + (index * 0.1);
                img.style.transform = `translate3d(${deltaY * 0.02}px, ${deltaX * 0.02}px, 0) rotateX(${rotateX * depth}deg) rotateY(${rotateY * depth}deg)`;
            });
        });

        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth - 0.5;
            const mouseY = e.clientY / window.innerHeight - 0.5;

            images.forEach((img, index) => {
                const speed = 0.02 + (index * 0.01);
                const x = mouseX * 20 * speed;
                const y = mouseY * 20 * speed;
                img.style.transform += ` translate(${x}px, ${y}px)`;
            });
        });
    }

    // ===== 3D TILT ДЛЯ КАРТОЧЕК =====
    const cards = document.querySelectorAll('.service-card, .why-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            
            card.style.setProperty('--x', x + 'px');
            card.style.setProperty('--y', y + 'px');
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });

    // ===== АНИМАЦИИ ПОЯВЛЕНИЯ =====
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(el => observer.observe(el));

    // ===== ДИНАМИЧЕСКАЯ ШАПКА =====
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ===== ПРОГРЕСС-БАР СКРОЛЛА =====
    const progressBar = document.getElementById('scrollProgress');
    const progressCircle = document.querySelector('.progress-circle');
    const progressText = document.querySelector('.progress-text');
    
    if (progressBar && progressCircle && progressText) {
        const circumference = 2 * Math.PI * 27;
        progressCircle.style.strokeDasharray = circumference;
        
        const updateProgress = function() {
            const winScroll = window.scrollY;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (winScroll / height) * 100;
            
            const offset = circumference - (scrolled / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
            progressText.textContent = Math.round(scrolled) + '%';
            
            if (winScroll > 200) {
                progressBar.classList.add('visible');
            } else {
                progressBar.classList.remove('visible');
            }
        };
        
        window.addEventListener('scroll', updateProgress);
        window.addEventListener('resize', updateProgress);
        updateProgress();
        
        progressBar.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== МОДАЛЬНОЕ ОКНО =====
    const modal = document.getElementById('modalOverlay');
    const openButtons = document.querySelectorAll('#openFormBtn, #heroCtaBtn, #finalCtaBtn, #openMasterBtn');
    const closeBtn = document.getElementById('modalClose');

    function openModal() {
        if (!modal) return;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    openButtons.forEach(btn => {
        if (btn) btn.addEventListener('click', openModal);
    });
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // ===== ОТПРАВКА ФОРМЫ =====
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('.form-button');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Отправлено!';
                alert('Спасибо! Мы свяжемся с вами в ближайшее время.');
                
                setTimeout(() => {
                    orderForm.reset();
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    closeModal();
                }, 1500);
            }, 1500);
        });
    }

    // ===== ФОРМАТИРОВАНИЕ ТЕЛЕФОНА =====
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.startsWith('7') || value.startsWith('8')) {
                value = value.substring(1);
            }
            
            let formatted = '+7';
            if (value.length > 0) formatted += ' (' + value.substring(0, 3);
            if (value.length > 3) formatted += ') ' + value.substring(3, 6);
            if (value.length > 6) formatted += '-' + value.substring(6, 8);
            if (value.length > 8) formatted += '-' + value.substring(8, 10);
            
            e.target.value = formatted;
        });
    });

    // ===== КУКИ БАННЕР =====
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('acceptCookies');
    
    if (cookieBanner && acceptBtn) {
        if (!localStorage.getItem('cookiesAccepted')) {
            setTimeout(() => {
                cookieBanner.classList.add('visible');
            }, 2000);
        }

        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            cookieBanner.classList.remove('visible');
            setTimeout(() => {
                cookieBanner.style.display = 'none';
            }, 500);
        });
    }

    // ===== ПЛАВАЮЩАЯ КНОПКА МАСТЕРА =====
    const flyBtn = document.getElementById('masterFlyBtn');
    const dynamicBtn = document.querySelector('.dynamic-btn');
    if (flyBtn) {
        setTimeout(() => {
            flyBtn.classList.add('visible');
        }, 7000);

        if (dynamicBtn) {
            const texts = ['Подобрать мастера →', 'Нужна помощь?', 'Срочный выезд?', 'Задать вопрос'];
            let index = 0;
            setInterval(() => {
                index = (index + 1) % texts.length;
                dynamicBtn.textContent = texts[index];
            }, 3000);
        }
    }

    // ===== ПЛАВНЫЙ СКРОЛЛ =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ===== ЗАКРЫТИЕ МОДАЛКИ ПО ESC =====
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // ===== Анимация счетчиков =====
    const counters = document.querySelectorAll('.counter-number');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                let count = 0;
                const duration = 2000;
                const step = target / (duration / 16);
                
                const updateCounter = function() {
                    count += step;
                    if (count < target) {
                        counter.textContent = Math.floor(count);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target + '+';
                        counter.classList.add('counted');
                    }
                };
                updateCounter();
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));

    // ===== Подсветка активных разделов =====
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(function(section) {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(function(link) {
            link.classList.remove('active-section');
            if (link.getAttribute('data-target') === current) {
                link.classList.add('active-section');
            }
        });
    });

    // ===== Динамический текст в Hero =====
    const dynamicHero = document.getElementById('dynamicHeroText');
    if (dynamicHero) {
        const phrases = ['на который можно положиться', 'который не подведет', 'с гарантией 2 года', 'круглосуточно'];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        
        const typeEffect = function() {
            const currentPhrase = phrases[phraseIndex];
            
            if (isDeleting) {
                dynamicHero.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
            } else {
                dynamicHero.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
            }
            
            if (!isDeleting && charIndex === currentPhrase.length) {
                isDeleting = true;
                setTimeout(typeEffect, 2000);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                setTimeout(typeEffect, 500);
            } else {
                setTimeout(typeEffect, isDeleting ? 50 : 100);
            }
        };
        typeEffect();
    }

    // ===== СЛАЙДЕР ОТЗЫВОВ (БЕЗ ТОЧЕК) =====
const track = document.getElementById('testimonialsTrack');
const prevBtn = document.getElementById('sliderPrev');
const nextBtn = document.getElementById('sliderNext');

    if (track && prevBtn && nextBtn) {
    const cards = document.querySelectorAll('.testimonial-card');
    const totalCards = cards.length;
    
    // Определение мобильного устройства
    const isMobileDevice = function() {
        return window.innerWidth <= 768;
    };
    
    let currentIndex = 0;
        
        // Функция обновления слайдера
    const updateSlider = function() {
        if (isMobileDevice()) {
            // Для мобильного: сдвиг в % для показа одной карточки полностью
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        } else {
            // Десктоп: старый код с px (не меняем)
            const cardWidth = cards[0].offsetWidth;
            const gap = 16;
            const effectiveWidth = cardWidth + gap;
            track.style.transform = `translateX(-${currentIndex * effectiveWidth}px)`;
        }
            
            // Убеждаемся, что currentIndex в пределах
        const maxIndex = isMobileDevice() ? totalCards - 1 : totalCards - 3;
        if (currentIndex > maxIndex) currentIndex = maxIndex;
        if (currentIndex < 0) currentIndex = 0;
    };
        
        // Кнопка назад
    prevBtn.addEventListener('click', function() {
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
        }
    });
        
        // Кнопка вперёд
    nextBtn.addEventListener('click', function() {
        const maxIndex = isMobileDevice() ? totalCards - 1 : totalCards - 3;
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateSlider();
        }
    });
        
        // Обновление при ресайзе
    window.addEventListener('resize', updateSlider);
        
        // Запускаем после загрузки
    setTimeout(updateSlider, 100);
        
        // Дополнительный запуск после полной загрузки
    window.addEventListener('load', function() {
        setTimeout(updateSlider, 200);
    });
    }
});

// Отдельные обработчики событий
window.addEventListener('load', function() {
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) heroContent.style.opacity = '1';
});

document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
    }
}, true);

// ===== ОТКРЫТИЕ ЮРИДИЧЕСКИХ МОДАЛОК =====
document.querySelectorAll('.legal-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const modalType = this.getAttribute('data-modal');
        let modalId;
        
        if (modalType === 'privacy') {
            modalId = 'privacyModal';
        } else if (modalType === 'agreement') {
            modalId = 'agreementModal';
        }
        
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        }
    });
});

// Закрытие по кнопке × и по клику вне окна
document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay') || e.target.hasAttribute('data-close')) {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        }
    });
});
