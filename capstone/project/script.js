(function () {
    'use strict';


    /*
       AMBIENT PARTICLES
       little carbon motes drifting in the background. uses the
       canvas API. */
    function initAmbientCanvas() {
        const canvas = document.getElementById('ambientCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let w, h;
        let particles = [];
        let scrollDepth = 0; // 0 to 1, how far down the page u are

        // make the canvas match the window size.
        // multiplying by devicePixelRatio makes it sharp on retina screens (google)
        function resize() {
            w = canvas.width = window.innerWidth * devicePixelRatio;
            h = canvas.height = window.innerHeight * devicePixelRatio;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
        }

        // make `n` particles at random positions with random velocities
        function spawn(n) {
            particles = [];
            for (let i = 0; i < n; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: (Math.random() * 1.4 + 0.3) * devicePixelRatio,
                    vx: (Math.random() - 0.5) * 0.15 * devicePixelRatio,
                    vy: (-Math.random() * 0.25 - 0.05) * devicePixelRatio, // mostly drifting upward
                    a: Math.random() * 0.5 + 0.15,
                    tw: Math.random() * Math.PI * 2, // for the twinkle phase
                });
            }
        }

        // the animation loop. requestAnimationFrame keeps it smooth (~60fps) (google)
        function tick() {
            ctx.clearRect(0, 0, w, h);

            // warm ember at the top of the page, and then into mossy green at the bottom.
            const r = Math.round(217 - scrollDepth * 94);
            const g = Math.round(119 + scrollDepth * 49);
            const b = Math.round(66 + scrollDepth * 56);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.tw += 0.02;

                // if a particle drifts off the top, wrap it to the bottom
                if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;

                const flicker = 0.6 + Math.sin(p.tw) * 0.4;
                ctx.fillStyle = `rgba(${r},${g},${b},${p.a * flicker})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
            requestAnimationFrame(tick);
        }

        function onScroll() {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            if (max > 0) {
                scrollDepth = window.scrollY / max;
                if (scrollDepth < 0) scrollDepth = 0;
                if (scrollDepth > 1) scrollDepth = 1;
            }
        }

        resize();
        spawn(140);
        window.addEventListener('resize', function () { resize(); spawn(140); });
        window.addEventListener('scroll', onScroll);
        tick();
    }


    /*
       SCROLL STORYTELLING
       gsap + ScrollTrigger do most of the work here
       (figured out the gsap API from gsap docs + youtube tutorials) */
    function initScrollStory() {

        // hero title slides in from below
        gsap.from('.hero-title .line', {
            y: 80,
            opacity: 0,
            duration: 1.1,
            ease: 'power3.out',
            stagger: 0.12,
            delay: 0.2,
        });

        // and then as u scroll past it, it drifts up and fades out
        gsap.to('.hero-title', {
            y: -80,
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            }
        });

        // each prose line fades in when it scrolls into view.
        // gsap.utils.toArray returns a real array i can forEach over (gsap docs)
        gsap.utils.toArray('.prose-line').forEach(function (line) {
            gsap.to(line, {
                opacity: 1,
                y: 0,
                duration: 1.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: line,
                    start: 'top 78%',
                    toggleActions: 'play none none reverse',
                }
            });
        });

        // stat counters — count up from 0 to the target number as u scroll past
        gsap.utils.toArray('.stat').forEach(function (stat) {
            const numEl = stat.querySelector('.stat-number');
            const target = parseFloat(numEl.dataset.target);
            const decimals = parseInt(numEl.dataset.decimals || '0');
            const prefix = numEl.dataset.prefix || '';

            // fade the whole stat block in
            gsap.fromTo(stat,
                { opacity: 0, y: 30 },
                {
                    opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
                    scrollTrigger: { trigger: stat, start: 'top 80%' }
                }
            );

            // and tween a temp object's `val` from 0 to target, updating the text on every frame. (this counter pattern is a common gsap trick i found online)
            const obj = { val: 0 };
            gsap.to(obj, {
                val: target,
                duration: 2.2,
                ease: 'power3.out',
                scrollTrigger: { trigger: stat, start: 'top 75%' },
                onUpdate: function () {
                    numEl.textContent = prefix + obj.val.toFixed(decimals);
                }
            });
        });

        // horizontal scroll section — pin it, then scroll the track sideways while the user scrolls down. learned this pattern from gsap's website itself.
        const track = document.getElementById('horizontalTrack');
        const wrap = document.querySelector('.horizontal-wrap');
        if (track && wrap) {
            // distance is how far we need to drag the track left
            function distance() {
                return track.scrollWidth - window.innerWidth;
            }

            const horizontalTween = gsap.to(track, {
                x: function () { return -distance(); },
                ease: 'none',
                scrollTrigger: {
                    trigger: wrap,
                    start: 'top top',
                    end: function () { return '+=' + distance(); },
                    scrub: 0.8,
                    pin: true,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                }
            });

            // each card fades up as it pans into view from the right. containerAnimation tells ScrollTrigger to track positions inside the horizontally-tweened track instead of vertical scroll (gsap docs)
            gsap.utils.toArray('.h-card').forEach(function (card) {
                gsap.from(card, {
                    y: 40,
                    opacity: 0,
                    duration: 0.6,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: card,
                        containerAnimation: horizontalTween,
                        start: 'left 92%',
                    }
                });
            });
        }

        // each stake fades in
        gsap.utils.toArray('.stake').forEach(function (s, i) {
            gsap.from(s, {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: { trigger: s, start: 'top 82%' },
                delay: (i % 2) * 0.1,
            });
        });

        // transition section lines fade in
        gsap.utils.toArray('.transition-line').forEach(function (line) {
            gsap.from(line, {
                opacity: 0,
                y: 30,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: { trigger: line, start: 'top 80%' }
            });
        });
    }


    /* 
       WISH STORAGE — back4app */
    const BACK4APP_CONFIG = {
        applicationId: 'UboIfjLuIcfNGVbsrZCdPBOpI5otpt6uC7vnZhHj',
        javascriptKey: 'rAOeoYTGve9Z3lNlqXLr3PuZEBnb6RgYM5q5qfZv',
        serverURL: 'https://parseapi.back4app.com/',
    };

    async function initWishes() {
        Parse.initialize(BACK4APP_CONFIG.applicationId, BACK4APP_CONFIG.javascriptKey);
        Parse.serverURL = BACK4APP_CONFIG.serverURL;

        const WishClass = Parse.Object.extend('Wish');

        async function all() {
            const q = new Parse.Query(WishClass);
            q.limit(500);
            q.descending('createdAt');
            const results = await q.find();
            const list = [];
            for (let i = 0; i < results.length; i++) {
                const r = results[i];
                list.push({
                    id: r.id,
                    text: r.get('text'),
                    author: r.get('author') || '',
                    x: r.get('x'),
                    y: r.get('y'),
                    z: r.get('z'),
                    createdAt: r.get('createdAt'),
                });
            }
            return list;
        }

        async function add(wish) {
            const w = new WishClass();
            w.set('text', wish.text);
            w.set('author', wish.author || '');
            w.set('x', wish.x);
            w.set('y', wish.y);
            w.set('z', wish.z);
            const saved = await w.save();
            return {
                id: saved.id,
                text: wish.text,
                author: wish.author,
                x: wish.x,
                y: wish.y,
                z: wish.z,
                createdAt: saved.get('createdAt'),
            };
        }

        return { all: all, add: add };
    }


    /*
       FOREST 3D SCENE
       uses three.js. dynamic import() pulls it in inside the IIFE
       (regular import only works in modules, dynamic import works
       anywhere — found this on google) */
    async function initForestScene(wishStore) {

        // pull in three.js + the loader + the orbit controls
        const THREE = await import('three');
        const GLTFLoaderMod = await import('three/addons/loaders/GLTFLoader.js');
        const OrbitControlsMod = await import('three/addons/controls/OrbitControls.js');
        const GLTFLoader = GLTFLoaderMod.GLTFLoader;
        const OrbitControls = OrbitControlsMod.OrbitControls;

        // grab all the html elements i need
        const canvas = document.getElementById('forestCanvas');
        const wrap = document.getElementById('forestCanvasWrap');
        const labelsLayer = document.getElementById('wishLabels');
        const composer = document.getElementById('composer');
        const composerText = document.getElementById('composerText');
        const composerName = document.getElementById('composerName');
        const composerSubmit = document.getElementById('composerSubmit');
        const composerCancel = document.getElementById('composerCancel');
        const charCount = document.getElementById('charCount');
        const wishCountEl = document.getElementById('wishCount');
        const resetBtn = document.getElementById('forestReset');
        const wishReader = document.getElementById('wishReader');
        const wishReaderText = document.getElementById('wishReaderText');
        const wishReaderMeta = document.getElementById('wishReaderMeta');

        // set up the renderer 
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        // tone mapping makes the colors look more film-like (three.js docs)
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        // the scene itself, with some fog so things in the distance fade out
        const scene = new THREE.Scene();
        scene.background = null;
        scene.fog = new THREE.Fog(0x0a1410, 8, 28);

        // camera
        const camera = new THREE.PerspectiveCamera(
            38,
            wrap.clientWidth / wrap.clientHeight,
            0.1,
            100
        );
        const initialCam = { x: -10, y: 3, z: 0 };
        const initialTarget = { x: 0, y: 1.5, z: 0 };
        camera.position.set(initialCam.x, initialCam.y, initialCam.z);
        camera.lookAt(initialTarget.x, initialTarget.y, initialTarget.z);

        // lights
        const hemi = new THREE.HemisphereLight(0xddeacc, 0x1a2a1a, 0.8);
        scene.add(hemi);

        const sun = new THREE.DirectionalLight(0xfff1d6, 1.4);
        sun.position.set(6, 10, 5);
        scene.add(sun);

        const rim = new THREE.DirectionalLight(0xa8c4d8, 0.6);
        rim.position.set(-5, 4, -6);
        scene.add(rim);

        // orbit controls so the user can drag to rotate / scroll to zoom
        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 4;
        controls.maxDistance = 16;
        controls.maxPolarAngle = Math.PI * 0.48; // dont let them go below the ground
        controls.minPolarAngle = Math.PI * 0.12;
        controls.target.set(initialTarget.x, initialTarget.y, initialTarget.z);
        controls.enablePan = false;

        // load gltf model
        wrap.classList.add('is-loading-3d');
        const loader = new GLTFLoader();
        const clickableObjects = []; // meshes the raycaster should test against

        try {
            const gltf = await loader.loadAsync('assets/forest_house/scene.gltf');
            const model = gltf.scene;

            // figure out the model's bounding box and scale it to a reasonable size, then drop it so its bottom sits at y=0 (three.js bounding-box math, from google)
            const bbox = new THREE.Box3().setFromObject(model);
            const size = bbox.getSize(new THREE.Vector3());
            const center = bbox.getCenter(new THREE.Vector3());
            const scale = 6 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            model.position.set(
                -center.x * scale,
                -bbox.min.y * scale,
                -center.z * scale
            );

            model.traverse(function (obj) {
                if (!obj.isMesh) return;
                const n = obj.name.toLowerCase();
                if (
                    n.indexOf('ground') !== -1 ||
                    n.indexOf('plane') !== -1 ||
                    n.indexOf('btree') !== -1 ||
                    n.indexOf('redwood') !== -1 ||
                    n.indexOf('moss') !== -1 ||
                    n.indexOf('grass') !== -1
                ) {
                    clickableObjects.push(obj);
                }
                // bump up roughness a tiny bit so things look less shiny
                if (obj.material && 'roughness' in obj.material) {
                    obj.material.roughness = Math.min(1, obj.material.roughness + 0.1);
                }
            });

            scene.add(model);
            wrap.classList.remove('is-loading-3d');
        } catch (err) {
            console.error('Failed to load forest_house gltf:', err);
            wrap.classList.remove('is-loading-3d');
            wrap.insertAdjacentHTML('beforeend',
                '<p style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#cfc6b3;font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">could not load forest model — run via a local server</p>');
            return;
        }


        /* wishes */
        let wishes = [];

        // turn a 3d point into a 2d screen position so we know where to put the html dot (three.js projection math, learned from google)
        function projectToScreen(vec) {
            const v = vec.clone().project(camera);
            const rect = canvas.getBoundingClientRect();
            return {
                x: (v.x * 0.5 + 0.5) * rect.width,
                y: (v.y * -0.5 + 0.5) * rect.height,
                visible: v.z > -1 && v.z < 1 && v.x > -1.05 && v.x < 1.05 && v.y > -1.05 && v.y < 1.05,
            };
        }

        // make the little glowing dot element for a wish
        function createLabelEl(wish, isNew) {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'wish-label';
            if (isNew) el.className += ' is-new';
            el.dataset.wishId = wish.id;
            el.addEventListener('mouseenter', function () { showWishReader(wish, el); });
            el.addEventListener('mouseleave', hideWishReader);
            labelsLayer.appendChild(el);
            return el;
        }

        function addWishToScene(wish, isNew) {
            const vec = new THREE.Vector3(wish.x, wish.y, wish.z);
            const el = createLabelEl(wish, isNew);
            wishes.push({
                id: wish.id,
                text: wish.text,
                author: wish.author,
                createdAt: wish.createdAt,
                vec: vec,
                el: el,
            });
            updateWishCount();
        }

        function updateWishCount() {
            const n = wishes.length;
            if (n === 0) {
                wishCountEl.textContent = '— be the first to leave a wish —';
            } else if (n === 1) {
                wishCountEl.textContent = '1 wish growing here';
            } else {
                wishCountEl.textContent = n + ' wishes growing here';
            }
        }

        // tooltip that pops up when u hover over a dot
        function showWishReader(wish, anchorEl) {
            wishReaderText.textContent = '“' + wish.text + '”';
            const date = wish.createdAt ? new Date(wish.createdAt) : null;
            const when = date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
            const author = wish.author || 'anonymous';
            wishReaderMeta.textContent = when ? (author + ' ・ ' + when) : author;

            // position it above the dot
            const rect = anchorEl.getBoundingClientRect();
            const wrapRect = wrap.getBoundingClientRect();
            const left = rect.left - wrapRect.left + rect.width / 2;
            const top = rect.top - wrapRect.top - 12;
            wishReader.style.left = (left - 140) + 'px';
            wishReader.style.top = (top - 90) + 'px';
            wishReader.classList.add('is-visible');
        }
        function hideWishReader() {
            wishReader.classList.remove('is-visible');
        }

        // load the existing wishes from storage and drop them into the scene
        const existing = await wishStore.all();
        existing.forEach(function (w) {
            addWishToScene(w, false);
        });


        /* click → raycast → open composer */
        // raycaster basically shoots an invisible line from the camera through wherever the mouse clicked, and tells us what 3d object it hit. (three.js docs)
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let pendingHit = null; // where the next wish should drop
        let downAt = null; // mouse down position so we can tell click vs drag

        canvas.addEventListener('pointerdown', function (e) {
            downAt = { x: e.clientX, y: e.clientY };
        });
        canvas.addEventListener('pointerup', function (e) {
            if (!downAt) return;

            const dx = Math.abs(e.clientX - downAt.x);
            const dy = Math.abs(e.clientY - downAt.y);
            downAt = null;
            if (dx > 4 || dy > 4) return;

            const rect = canvas.getBoundingClientRect();

            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const hits = raycaster.intersectObjects(clickableObjects, true);
            if (hits.length === 0) return;

            const p = hits[0].point;
            pendingHit = { x: p.x, y: p.y, z: p.z };
            openComposer();
        });


        /* composer modal (the little form for writing a wish) */
        function openComposer() {
            composer.classList.add('is-open');
            composerText.value = '';
            composerName.value = '';
            charCount.textContent = '0';
            // tiny delay before focusing so it doesnt fight the open transition
            setTimeout(function () { composerText.focus(); }, 80);
        }
        function closeComposer() {
            composer.classList.remove('is-open');
            pendingHit = null;
        }

        // update the char counter as u type
        composerText.addEventListener('input', function () {
            charCount.textContent = composerText.value.length;
        });

        composerCancel.addEventListener('click', closeComposer);

        // clicking the dim background closes the modal
        composer.addEventListener('click', function (e) {
            if (e.target === composer) closeComposer();
        });

        // hitting escape closes the modal
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && composer.classList.contains('is-open')) {
                closeComposer();
            }
        });

        // fires when u click submit
        composerSubmit.addEventListener('click', async function () {
            const text = composerText.value.trim();
            if (!text || !pendingHit) return;
            composerSubmit.disabled = true;
            try {
                const wish = await wishStore.add({
                    text: text,
                    author: composerName.value.trim(),
                    x: pendingHit.x,
                    y: pendingHit.y,
                    z: pendingHit.z,
                });
                addWishToScene(wish, true);
                closeComposer();
            } catch (err) {
                console.error('failed to save wish', err);
                alert('sorry — could not save your wish. try again in a moment.');
            } finally {
                composerSubmit.disabled = false;
            }
        });


        /* reset view button — smooth camera back to start */
        resetBtn.addEventListener('click', function () {
            gsap.to(camera.position, {
                x: initialCam.x,
                y: initialCam.y,
                z: initialCam.z,
                duration: 1.4,
                ease: 'power3.inOut',
                onUpdate: function () { camera.lookAt(controls.target.x, controls.target.y, controls.target.z); },
            });
            gsap.to(controls.target, {
                x: initialTarget.x,
                y: initialTarget.y,
                z: initialTarget.z,
                duration: 1.4,
                ease: 'power3.inOut',
            });
        });


        /* keep the renderer / camera in sync with window size */
        function onResize() {
            const w = wrap.clientWidth;
            const h = wrap.clientHeight;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        window.addEventListener('resize', onResize);
        onResize();


        /* the actual render loop */
        function tick() {
            controls.update();

            // update every wish dot's screen position every frame
            for (const w of wishes) {
                const p = projectToScreen(w.vec);
                w.el.style.transform = 'translate(' + p.x + 'px, ' + p.y + 'px)';
                if (p.visible) {
                    w.el.style.opacity = '1';
                    w.el.style.pointerEvents = 'auto';
                } else {
                    w.el.style.opacity = '0';
                    w.el.style.pointerEvents = 'none';
                }
            }

            renderer.render(scene, camera);
            requestAnimationFrame(tick);
        }
        tick();
    }


    /*
       SCROLL ARROWS
       click and hold the up/down arrows on the right side to scroll
       past the forest section, since the 3d canvas eats the scroll
       wheel for camera zooming. arrows only appear when the forest
       section is in view. */
    function initScrollArrows() {
        const arrows = document.getElementById('scrollArrows');
        const upBtn = document.getElementById('scrollUp');
        const downBtn = document.getElementById('scrollDown');
        const forestSection = document.getElementById('forestSection');
        if (!arrows || !upBtn || !downBtn || !forestSection) return;

        // show/hide based on whether forest section is in view
        function updateVisibility() {
            const rect = forestSection.getBoundingClientRect();
            const inView = rect.top < window.innerHeight && rect.bottom > 0;
            if (inView) {
                arrows.classList.add('is-visible');
            } else {
                arrows.classList.remove('is-visible');
            }
        }
        window.addEventListener('scroll', updateVisibility);
        window.addEventListener('resize', updateVisibility);
        updateVisibility();

        // click and hold logic
        // when a button is pressed, start a scroll loop that runs every animation frame until the user lets go. (requestAnimationFrame keeps the scroll smooth)
        let direction = 0;
        let looping = false;
        const speed = 8;

        function loop() {
            if (direction !== 0) {
                window.scrollBy(0, direction * speed);
                requestAnimationFrame(loop);
            } else {
                looping = false;
            }
        }

        function start(dir) {
            direction = dir;
            if (!looping) {
                looping = true;
                loop();
            }
        }
        function stop() {
            direction = 0;
        }

        // press starts the loop, release/leave stops it
        upBtn.addEventListener('mousedown', function () { start(-1); });
        downBtn.addEventListener('mousedown', function () { start(1); });
        upBtn.addEventListener('mouseup', stop);
        downBtn.addEventListener('mouseup', stop);
        upBtn.addEventListener('mouseleave', stop);
        downBtn.addEventListener('mouseleave', stop);

        // also stop if u somehow release outside the button (safety net)
        window.addEventListener('mouseup', stop);
    }


    /*
       START EVERYTHING */
    async function boot() {
        gsap.registerPlugin(ScrollTrigger);

        initAmbientCanvas();

        const wishStore = await initWishes();

        initScrollStory();

        initScrollArrows();

        initForestScene(wishStore);
    }

    // since the <script> tag has defer, the DOM is already parsed when we get here
    boot();

})();