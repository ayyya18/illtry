// Slider component encapsulation
(function () {
    const App = window.App = window.App || {};

    function initTempSlider(selector = '.temp-slider') {
        const slider = document.querySelector(selector);
        if (!slider) return null;
        const slidesWrap = slider.querySelector('.slides');
        const slides = slider.querySelectorAll('.slide');
        const prevBtn = slider.querySelector('.slider-btn.prev');
        const nextBtn = slider.querySelector('.slider-btn.next');
        const dotsWrap = slider.querySelector('.slider-dots');
        let index = 0;

        function renderDots() {
            if (!dotsWrap) return;
            dotsWrap.innerHTML = '';
            slides.forEach((s, i) => {
                const b = document.createElement('button');
                b.className = 'slider-dot';
                if (i === index) b.classList.add('active');
                b.addEventListener('click', () => goTo(i));
                dotsWrap.appendChild(b);
            });
        }

        function goTo(i) {
            index = (i + slides.length) % slides.length;
            if (slidesWrap) slidesWrap.style.transform = `translateX(-${index * 100}%)`;
            if (dotsWrap) Array.from(dotsWrap.children).forEach((d, di) => d.classList.toggle('active', di === index));
            if (prevBtn) prevBtn.style.display = (index === 0) ? 'none' : 'flex';
            if (nextBtn) nextBtn.style.display = (index === slides.length - 1) ? 'none' : 'flex';
        }

        if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));

        // keyboard support
        window.addEventListener('keydown', (ev) => {
            if (ev.key === 'ArrowLeft') goTo(index - 1);
            if (ev.key === 'ArrowRight') goTo(index + 1);
        });

        // touch/pointer interactions
        let startX = null;
        if (slidesWrap) {
            slidesWrap.addEventListener('touchstart', (ev) => { startX = ev.touches[0].clientX; });
            slidesWrap.addEventListener('touchend', (ev) => {
                if (startX === null) return;
                const dx = ev.changedTouches[0].clientX - startX;
                if (Math.abs(dx) > 40) { if (dx < 0) goTo(index + 1); else goTo(index - 1); }
                startX = null;
            });
            let isDown = false; let downX = 0;
            slidesWrap.addEventListener('pointerdown', (ev) => { isDown = true; downX = ev.clientX; slidesWrap.setPointerCapture(ev.pointerId); });
            slidesWrap.addEventListener('pointerup', (ev) => { if (!isDown) return; isDown = false; slidesWrap.releasePointerCapture(ev.pointerId); const dx = ev.clientX - downX; if (Math.abs(dx) > 60) { if (dx < 0) goTo(index + 1); else goTo(index - 1); } });
            slidesWrap.addEventListener('pointercancel', () => { isDown = false; });
        }

        renderDots();
        goTo(0);
        return { goTo, renderDots };
    }

    App.slider = {
        initTempSlider
    };
})();
