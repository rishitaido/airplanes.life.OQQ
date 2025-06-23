// destinations-display.js — Destination Finder with Lightbox
(() => {
  'use strict';

  const DATA_URL = '/static/destinations.json';
  const ITINERARY_API = '/api/itinerary';
  const VISIBLE_CARDS = 4;

  const stackEl = document.getElementById('dest-stack');
  const nextBtn = document.getElementById('next-dest');
  const template = document.getElementById('dest-card-template');

  let destinations = [];
  let currentIndex = 0;
  let lightbox = null;

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function loadDestinations() {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
      const data = await res.json();
      destinations = shuffleArray(data.slice());
      renderStack();
    } catch (error) {
      console.error('Error loading destinations:', error);
      stackEl.textContent = 'Failed to load destinations.';
    }
  }

  function renderStack() {
    stackEl.innerHTML = '';

    for (let offset = 0; offset < VISIBLE_CARDS; offset++) {
      const idx = (currentIndex + offset) % destinations.length;
      const dest = destinations[idx];
      const posClass = offset === 0 ? 'active' : `behind-${offset}`;
      createCard(dest, posClass);
    }

    // Re-initialize lightbox after DOM updates
    if (lightbox) {
      lightbox.destroy();
    }
    lightbox = GLightbox({
      selector: '.glightbox'
    });
  }

  function createCard(dest, posClass) {
    const { name, tagline, fun_fact, best_time, images } = dest;
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.stack-card');
    card.classList.remove('hidden');
    card.classList.add(posClass);

    card.querySelector('.dest-title').textContent = name;
    card.querySelector('.dest-desc').textContent = tagline;
    card.querySelector('.dest-fun span').textContent = fun_fact;
    card.querySelector('.dest-best span').textContent = best_time;

    const linkEl = card.querySelector('.slider a');
    const imgEl = card.querySelector('.slider img');
    let imgIndex = 0;
    const srcList = images.map(src => `/static/assets/images/${src}`);

    function updateImage() {
      imgEl.src = srcList[imgIndex];
      imgEl.alt = name;
      linkEl.href = srcList[imgIndex];  // update lightbox target
    }
    updateImage();

    card.querySelector('.slider-prev').addEventListener('click', () => {
      imgIndex = (imgIndex - 1 + srcList.length) % srcList.length;
      updateImage();
    });
    card.querySelector('.slider-next').addEventListener('click', () => {
      imgIndex = (imgIndex + 1) % srcList.length;
      updateImage();
    });

    stackEl.appendChild(card);
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % destinations.length;
    renderStack();
  }

  async function onStackClick(event) {
    const btn = event.target.closest('.plan-trip');
    if (!btn) return;

    const card = btn.closest('.stack-card');
    if (!card.classList.contains('active')) return;

    const destName = card.querySelector('.dest-title')?.textContent;
    if (!destName) return;

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Loading...';

    try {
      const res = await fetch(ITINERARY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Plan a 3-day trip to ${destName} with food, culture, and local experiences.`,
          days: 3
        })
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();

      if (data.itinerary) {
        localStorage.setItem('itineraryJSON', JSON.stringify(data.itinerary));
      }
      if (data.reply) {
        localStorage.setItem('itineraryText', data.reply);
      }
      localStorage.setItem('itineraryTimestamp', Date.now().toString());

      window.location.href = '/itinerary';
    } catch (err) {
      console.error('Plan trip error:', err);
      alert('Sorry, could not plan your trip. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  function init() {
    nextBtn.addEventListener('click', showNext);
    stackEl.addEventListener('click', onStackClick);
    loadDestinations();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
