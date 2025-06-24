import opentype from 'opentype.js';
import gsap from 'gsap';

export class HandwritingSliderSVG {
  constructor({
    container,
    slides,
    fontUrl,
    speed = 1, // скорость в px/ms для контура
    pause = 0,
    color = '#fff',
    fillColor = null, // если хотите отдельный цвет заливки
    autoScroll = false,
    autoScrollDelay = 3000,
    onComplete = null
  }) {
    this.container = container;
    this.slides = slides;
    this.fontUrl = fontUrl;
    this.speed = speed;
    this.pause = pause;
    this.color = color;
    this.fillColor = fillColor || this.color;
    this.autoScroll = autoScroll;
    this.autoScrollDelay = autoScrollDelay;
    this.onComplete = onComplete;

    this.currentSlide = 0;
    this.autoScrollTimer = null;
    this.isAutoScrollActive = false;

    this.initSVG();
    this.loadFont().then(font => {
      this.font = font;
      this.drawSlide(this.currentSlide);
      this.setupControls();
      if (this.autoScroll) {
        this.enableAutoScroll();
      }
    });
  }

  initSVG() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.display = 'block';
    this.container.appendChild(this.svg);
    window.addEventListener('resize', () => this.resize());
  }

  // async loadFont() {
  //   return opentype.load(document.querySelector('textarea').value);
  // }
  async loadFont() {
    const base64 = document.querySelector('textarea').value.split(',')[1]; // если есть префикс
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const font = opentype.parse(bytes.buffer);
    return font;
  }

  drawSlide(index) {
  this.clearAutoScrollTimer();
  this.currentSlide = index;

  while (this.svg.firstChild) {
    this.svg.removeChild(this.svg.firstChild);
  }

  const slide = this.slides[index];
  const lines = slide.text;
  const fontSize = slide.fontSize || 48;

  const paths = [];
  let yOffset = 0;
  const lineSpacing = fontSize * 1.2;
  const scale = 1 / this.font.unitsPerEm * fontSize;

  for (const line of lines) {
    let xOffset = 0;
    for (const fragment of line) {
      for (const char of fragment.content) {
        const glyph = this.font.charToGlyph(char);
        const pathObj = glyph.getPath(xOffset, yOffset, fontSize);
        const d = pathObj.toPathData(2);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', fragment.color || this.color);
        path.setAttribute('stroke-width', '2');
        paths.push(path);

        // Используем advanceWidth вместо bbox!
        xOffset += glyph.advanceWidth * scale;
      }
    }
    yOffset += lineSpacing;
  }

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  paths.forEach(p => group.appendChild(p));
  this.svg.appendChild(group);

  this.group = group;
  this.paths = paths;

  this.resize();
  this.animatePaths(paths);
}



  resize() {
    const bbox = this.group.getBBox();
    const svgWidth = this.container.clientWidth;
    const svgHeight = this.container.clientHeight;

    const scaleX = svgWidth / bbox.width;
    const scaleY = svgHeight / bbox.height;
    const scale = Math.min(scaleX, scaleY) * 0.8;

    const translateX = svgWidth / 2 - (bbox.x + bbox.width / 2) * scale;
    const translateY = svgHeight / 2 - (bbox.y + bbox.height / 2) * scale;

    this.group.setAttribute(
      'transform',
      `translate(${translateX}, ${translateY}) scale(${scale})`
    );
  }

  animatePaths(paths) {
    gsap.killTweensOf(paths);

    const overlap = .8; // доля перекрытия между буквами (0.5 = 50%)

    const tl = gsap.timeline({
      onComplete: () => this.handleAnimationComplete()
    });

    let currentTime = 0;

    paths.forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.fill = 'none';

      const duration = len / (this.speed * 1000);

      tl.to(p, {
        strokeDashoffset: 0,
        duration: duration,
        ease: 'none'
      }, currentTime);

      tl.to(p, {
        fill: this.fillColor,
        duration: 0.3,
        ease: 'power1.in'
      }, currentTime + duration - 0.2); // заливка начинается чуть раньше

      // Добавляем перекрытие: сдвигаем старт следующей буквы
      currentTime += duration * (1 - overlap);
    });
  }


  handleAnimationComplete() {
    if (this.onComplete) this.onComplete(this.currentSlide);
    if (this.isAutoScrollActive) {
      this.autoScrollTimer = setTimeout(() => this.nextSlide(), this.autoScrollDelay);
    }
  }

  setupControls() {
    const prevBtn = this.container.querySelector('.slider-prev');
    const nextBtn = this.container.querySelector('.slider-next');

    if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.drawSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.drawSlide(prevIndex);
  }

  enableAutoScroll() {
    if (this.isAutoScrollActive) return;
    this.isAutoScrollActive = true;
    this.autoScrollTimer = setTimeout(() => this.nextSlide(), this.autoScrollDelay);
  }

  disableAutoScroll() {
    this.isAutoScrollActive = false;
    this.clearAutoScrollTimer();
  }

  toggleAutoScroll() {
    if (this.isAutoScrollActive) {
      this.disableAutoScroll();
    } else {
      this.enableAutoScroll();
    }
  }

  clearAutoScrollTimer() {
    if (this.autoScrollTimer) {
      clearTimeout(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
  }

  destroy() {
    gsap.killTweensOf(this.paths);
    this.clearAutoScrollTimer();
    window.removeEventListener('resize', this.resize);
    this.container.removeChild(this.svg);
  }
}
