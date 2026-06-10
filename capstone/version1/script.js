(function () {
    'use strict';


    /*
       SCROLL STORYTELLING
       gsap + ScrollTrigger drive the scroll animations.
       (figured out the gsap API from gsap docs + youtube tutorials) */
    function initScrollStory() {

        // hero title slides in from below on page load
        gsap.from('.hero-title .line', {
            y: 80,
            opacity: 0,
            duration: 1.1,
            ease: 'power3.out',
            stagger: 0.12,
            delay: 0.2,
        });

        // each prose line fades in when it scrolls into view
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

        // horizontal scroll section — pin it, then scroll the track sideways while
        // the user scrolls down. learned this pattern from gsap's website itself.
        const track = document.getElementById('horizontalTrack');
        const wrap = document.querySelector('.horizontal-wrap');
        if (track && wrap) {
            function distance() {
                return track.scrollWidth - window.innerWidth;
            }

            gsap.to(track, {
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
        }
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

        const THREE = await import('three');
        const GLTFLoaderMod = await import('three/addons/loaders/GLTFLoader.js');
        const OrbitControlsMod = await import('three/addons/controls/OrbitControls.js');
        const GLTFLoader = GLTFLoaderMod.GLTFLoader;
        const OrbitControls = OrbitControlsMod.OrbitControls;

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

        // set up the renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        // scene with fog so things in the distance fade out
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
        controls.maxPolarAngle = Math.PI * 0.48;
        controls.minPolarAngle = Math.PI * 0.12;
        controls.target.set(initialTarget.x, initialTarget.y, initialTarget.z);
        controls.enablePan = false;

        // load gltf model
        wrap.classList.add('is-loading-3d');
        const loader = new GLTFLoader();
        const clickableObjects = [];

        try {
            const gltf = await loader.loadAsync('assets/forest_house/scene.gltf');
            const model = gltf.scene;

            // scale the model to a reasonable size and sit its bottom at y=0 (three.js bounding-box math, from google)
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


        /* wishes in 3d */
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

        function createLabelEl(wish) {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'wish-label';
            el.dataset.wishId = wish.id;
            labelsLayer.appendChild(el);
            return el;
        }

        function addWishToScene(wish) {
            const vec = new THREE.Vector3(wish.x, wish.y, wish.z);
            const el = createLabelEl(wish);
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

        // load existing wishes from back4app
        const existing = await wishStore.all();
        existing.forEach(function (w) {
            addWishToScene(w);
        });


        /* click → raycast → open composer */
        // raycaster shoots an invisible line from the camera through wherever the mouse clicked, and tells us what 3d object it hit. (three.js docs)
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let pendingHit = null;
        let downAt = null;

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


        /* composer modal */
        function openComposer() {
            composer.classList.add('is-open');
            composerText.value = '';
            composerName.value = '';
            charCount.textContent = '0';
            setTimeout(function () { composerText.focus(); }, 80);
        }
        function closeComposer() {
            composer.classList.remove('is-open');
            pendingHit = null;
        }

        composerText.addEventListener('input', function () {
            charCount.textContent = composerText.value.length;
        });

        composerCancel.addEventListener('click', closeComposer);

        composer.addEventListener('click', function (e) {
            if (e.target === composer) closeComposer();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && composer.classList.contains('is-open')) {
                closeComposer();
            }
        });

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
                addWishToScene(wish);
                closeComposer();
            } catch (err) {
                console.error('failed to save wish', err);
                alert('sorry — could not save your wish. try again in a moment.');
            } finally {
                composerSubmit.disabled = false;
            }
        });


        /* reset view button — snaps camera directly back to start */
        resetBtn.addEventListener('click', function () {
            camera.position.set(initialCam.x, initialCam.y, initialCam.z);
            controls.target.set(initialTarget.x, initialTarget.y, initialTarget.z);
            controls.update();
        });


        /* keep the renderer in sync with window size */
        function onResize() {
            const w = wrap.clientWidth;
            const h = wrap.clientHeight;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        window.addEventListener('resize', onResize);
        onResize();


        /* render loop */
        function tick() {
            controls.update();

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
       START EVERYTHING */
    async function boot() {
        gsap.registerPlugin(ScrollTrigger);

        const wishStore = await initWishes();

        initScrollStory();

        initForestScene(wishStore);
    }

    boot();

})();
