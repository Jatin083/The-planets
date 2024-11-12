import "./style.css";
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'; // Import RGBELoader
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // Import OrbitControls
import gsap from 'gsap'; 

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 100);
const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Set device pixel ratio
document.body.appendChild(renderer.domElement);

// Load HDRI texture for the environment
const loader = new RGBELoader();
loader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonlit_golf_1k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping; // Set mapping
    scene.environment = texture; // Set environment
});

// Constants for the scene
const radius = 1.3;
const Segments = 64;
const orbitradius = 4.5;
const color = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
const texturePaths = ['/csilla/color.png', '/earth/map.jpg', '/venus/map.jpg', '/volcanic/color.png'];

// Create a group for the planets
const spheres = new THREE.Group();

// Create the background sphere (stars)
const starTexture = new THREE.TextureLoader().load('/stars/stars.jpg');
starTexture.colorSpace = THREE.SRGBColorSpace;
const bigSphereGeometry = new THREE.SphereGeometry(10, 64, 64);
const bigSphereMaterial = new THREE.MeshStandardMaterial({ 
    map: starTexture, 
    side: THREE.BackSide 
});
const bigSphere = new THREE.Mesh(bigSphereGeometry, bigSphereMaterial);
scene.add(bigSphere);

// Array to hold the sphere meshes
const SpheresMesh = [];

// Load textures asynchronously and create spheres
const textureLoader = new THREE.TextureLoader();
const texturesLoaded = [];

for (let i = 0; i < 4; i++) {
    const sphereGeometry = new THREE.SphereGeometry(radius, Segments, Segments);
    const sphereMaterial = new THREE.MeshStandardMaterial({ wireframe: false });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Load texture for each sphere
    textureLoader.load(texturePaths[i], (texture) => {
        sphereMaterial.map = texture;
        sphereMaterial.needsUpdate = true; // Ensure material is updated once texture is loaded
        texturesLoaded.push(true); // Track loaded textures

        // Check if all textures are loaded
        if (texturesLoaded.length === 4) {
            scene.add(spheres); // Add spheres to the scene once all textures are loaded
        }
    });

    // Position the spheres on an orbit
    const angle = (i / 4) * (Math.PI * 2); // 360 degrees
    sphere.position.x = orbitradius * Math.cos(angle); // 3 is the radius of the circle
    sphere.position.z = orbitradius * Math.sin(angle); // 3 is the radius of the circle

    spheres.add(sphere);
}

spheres.rotation.x = 0.1;
spheres.position.y = -0.8;

// Position the camera
camera.position.z = 9;

// Scroll throttle logic for animations
let lastExecution = 0;
let ScrollCount = 0;

const throttleWheelEvent = (event) => {
    const now = Date.now();
    if (now - lastExecution >= 2000) {
        lastExecution = now;

        const direction = event.deltaY > 0 ? 'down' : 'up';

        ScrollCount = (ScrollCount + 1) % 4;

        const headings = document.querySelectorAll('h1');
        gsap.to(headings, {
            duration: 1,
            y: `-=${100}%`,
            ease: 'power2.inOut'
        });

        gsap.to(spheres.rotation, {
            y: `+=${Math.PI / 2}`,
            duration: 1,
            ease: 'power2.inOut',
        });

        if (ScrollCount === 0) {
            gsap.to(headings, {
                duration: 1,
                y: `0`,
                ease: 'power2.inOut',
            });
        }
    }
};

// Add wheel event listener
window.addEventListener('wheel', throttleWheelEvent);

// Animation loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    for (let i = 0; i < SpheresMesh.length; i++) {
        const sphere = SpheresMesh[i];
        sphere.rotation.y = clock.getElapsedTime() * 0.05;
    }
    renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
