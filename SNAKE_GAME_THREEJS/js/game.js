var scene;
var camera;
var renderer;
var controls;
var matLib = { Wall: new THREE.MeshStandardMaterial(), Grass: new THREE.MeshStandardMaterial(), SnakeBody: new THREE.MeshStandardMaterial(), Apple: new THREE.MeshStandardMaterial() };
var libText = ["Wall", "Grass", "Snake", "Apple"];

const size = 10;
var snake_direction = 1; // 1=left, 2=up, 3=right, 4=down
var snake = new THREE.Group();
var mapW = 14;
var mapH = 14;
var apple;
var isEatApple = false;
var applexy = [];
var isPlayable = false;
var isGameOver = false;
var score = 0;
var tfont;


function onWindowResize() {
    camera.aspect = $('#webgl').width() / $('#webgl').height();
    camera.updateProjectionMatrix();
    renderer.setSize($('#webgl').width(), $('#webgl').height());
}
function loadMatLib(_lib) {
    for (var i = 0; i < _lib.length; i++) {
        var material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        material.roughness = 1;
        var loader = new THREE.TextureLoader();
        material.map = loader.load('../textures/' + _lib[i] + '.jpg');
        matLib[_lib[i]] = material;
    }
}
function createDirectionalLight() {
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(300, 300, -300);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.intensity = 1;

    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 1000;

    scene.add(directionalLight);
}
function createScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    renderer = new THREE.WebGLRenderer({ physicallyCorrectLights: true, antialias: true, powerPreference:'high-performance' });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('webgl').appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
    camera.position.x = mapH * size * 1.2;
    camera.position.y = mapW * size * 1.2;
    camera.position.z = (mapW * size) / 2;
    var ambientLight = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambientLight);
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    var onKeyDown = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                if (snake_direction == 1 || snake_direction == 3) //eğer mevcutta sağa veya sola gidiyorsa yukarı dönebilsin
                    snake_direction = 2;
                break;
            case 37: // left
            case 65: // a
                if (snake_direction == 2 || snake_direction == 4) //eğer mevcutta yukarı veya aşağı gidiyorsa sola dönebilsin
                    snake_direction = 1;
                break;
            case 40: // down
            case 83: // s
                if (snake_direction == 1 || snake_direction == 3) //eğer mevcutta sağa veya sola gidiyorsa aşağı dönebilsin
                    snake_direction = 4;
                break;
            case 39: // right
            case 68: // d
                if (snake_direction == 2 || snake_direction == 4) //eğer mevcutta yukarı veya aşağı gidiyorsa sağa dönebilsin
                    snake_direction = 3;
                break;
            case 80: // p
                if (!isGameOver)
                    isPlayable = !isPlayable;
                else {
                    scene.children.forEach(refreshMeshes);
                    snake = new THREE.Group();
                    scene.remove(apple);
                    createMap(mapW, mapH);
                    createSnake(5, 6);
                    createApple(9 * size, size, 11 * size, matLib.Apple);
                    isPlayable = true;
                    isGameOver = false;
                    score = 0;
                    refreshScore();
                }
                break;
        }
    };
    document.addEventListener('keydown', onKeyDown, false);

    function refreshMeshes(_mesh) {
        if (_mesh.name == "Wall" || _mesh.name == "Floor" || _mesh.name == "Snake")
            scene.remove(_mesh);
    }

    createDirectionalLight();
    loadMatLib(libText);
    createMap(mapW, mapH);
    createSnake(5, 6);
    createApple(9 * size, size, 11 * size, matLib.Apple);

    const loader2 = new THREE.FontLoader();
    loader2.load('fonts/helvetiker_regular.typeface.json', function (font) {
        this.tfont = font;
        refreshScore();
    });
    

    render();
}

function createMap(w, d) {
    if (w < 10)
        w = 10;
    if (d < 10)
        d = 10;
    mapW = w;
    mapH = d;
    w += 2;
    d += 2;
    var startx = 0;
    var starty = 0;
    for (var i = 0; i < w; i++) {
        for (var j = 0; j < d; j++) {
            createBox('m_' + i + '_' + j, size, -startx + (i * size), 0, -starty + (j * size), matLib.Grass, scene, "Floor");
            if (i == 0 || i == w - 1)
                createBox('m_' + i + '_' + j, size, -startx + (i * size), size, -starty + (j * size), matLib.Wall, scene, "Wall");
            if (j == 0 || j == d - 1)
                createBox('m_' + i + '_' + j, size, -startx + (i * size), size, -starty + (j * size), matLib.Wall, scene, "Wall");
        }
    }
}
function moveStandard() {
    var cacheLastX;
    var cacheLastY;
    if (isEatApple) {
        cacheLastX = snake.children[snake.children.length - 1].position.x;
        cacheLastY = snake.children[snake.children.length - 1].position.z;
    }

    for (var i = snake.children.length - 1; i > 0; i--) {
        snake.children[i].position.x = snake.children[i - 1].position.x;
        snake.children[i].position.z = snake.children[i - 1].position.z;
    }

    if (isEatApple) {
        addSnake(cacheLastX, cacheLastY);
        isEatApple = false;
        setApple();
        apple.position.set(applexy[0] * size, size, applexy[1] * size);
    }
}
function setApple() {
    applexy[0] = Math.floor(Math.random() * mapW) + 1;
    applexy[1] = Math.floor(Math.random() * mapH) + 1;
    for (var i = 0; i < snake.children.length; i++) {
        if (snake.children[i].position.x == applexy[0] * size && snake.children[i].position.z == applexy[1] * size) {
            setApple();
            break;
        }
    }
}
function moveLeft() {
    moveStandard();
    snake.children[0].position.z = snake.children[0].position.z + size;
}
function moveRight() {
    moveStandard();
    snake.children[0].position.z = snake.children[0].position.z - size;
}
function moveUp() {
    moveStandard();
    snake.children[0].position.x = snake.children[0].position.x - size;
}
function moveDown() {
    moveStandard();
    snake.children[0].position.x = snake.children[0].position.x + size;
}

var syc = 0;
function render() {
    renderer.render(scene, camera);
    syc += 1;
    if (syc % 15 == 0 && isPlayable) {
        var next = NextBox(snake_direction);
        if (next == "") {
            switch (snake_direction) {
                case 1:
                    moveLeft();
                    break;
                case 2:
                    moveUp();
                    break;
                case 3:
                    moveRight();
                    break;
                case 4:
                    moveDown();
                    break;
                default:
            }
        } else if (next == "Apple") {
            isEatApple = true;
            score += 10;
            refreshScore();
            switch (snake_direction) {
                case 1:
                    moveLeft();
                    break;
                case 2:
                    moveUp();
                    break;
                case 3:
                    moveRight();
                    break;
                case 4:
                    moveDown();
                    break;
                default:
            }
        } else if (next == "Wall" || next == "Snake_Body") {
            isPlayable = false;
            isGameOver = true;
            refreshScore();
        }
    }
    requestAnimationFrame(render);
}

function NextBox(sdir) {
    var rslt = "";
    var _cacheX;
    var _cacheZ;
    if (snake_direction == 1) {
        _cacheX = snake.children[0].position.x;
        _cacheZ = snake.children[0].position.z + size;
    }
    if (snake_direction == 2) {
        _cacheX = snake.children[0].position.x - size;
        _cacheZ = snake.children[0].position.z;
    }
    if (snake_direction == 3) {
        _cacheX = snake.children[0].position.x;
        _cacheZ = snake.children[0].position.z - size;
    }
    if (snake_direction == 4) {
        _cacheX = snake.children[0].position.x + size;
        _cacheZ = snake.children[0].position.z;
    }
    for (var i = 0; i < scene.children.length; i++) {
        if (scene.children[i].position.x == _cacheX && scene.children[i].position.z == _cacheZ && scene.children[i].position.y == size)
            rslt = scene.children[i].userData;
    }
    for (var i = 0; i < snake.children.length; i++) {
        if (snake.children[i].position.x == _cacheX && snake.children[i].position.z == _cacheZ)
            rslt = "Snake_Body";
    }
    return rslt;
}

function createBox(name, size, x, y, z, texture, parent, type) {
    var geometry = new THREE.BoxGeometry(size, size, size);
    if (texture == null) {
        texture = new THREE.MeshStandardMaterial({ color: 0xffffff })
    }
    var mesh = new THREE.Mesh(geometry, texture);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(x, y, z);
    mesh.userData = type;
    parent.add(mesh);
}
function createApple(x, y, z, texture) {
    var geometry = new THREE.SphereGeometry(size / 2, 32, 32);
    if (texture == null) {
        texture = new THREE.MeshStandardMaterial({ color: 0xffffff })
    }
    apple = new THREE.Mesh(geometry, texture);
    apple.name = "Apple";
    apple.castShadow = true;
    apple.receiveShadow = true;
    apple.position.set(x, y, z);
    apple.userData = 'Apple';
    scene.add(apple);
}

function createSnake(x, y, _direction) {
    var geometry = new THREE.SphereGeometry(size / 2, 4, 4);
    var mesh = new THREE.Mesh(geometry, matLib['Snake']);
    mesh.name = 'Snake_Head';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set((x * size), size, (y * size));
    snake.add(mesh);

    var geometry2 = new THREE.SphereGeometry(size / 2, 32, 32);
    var mesh2 = new THREE.Mesh(geometry2, matLib['Snake']);
    mesh2.castShadow = true;
    mesh2.receiveShadow = true;
    mesh2.name = 'Snake_Body';
    mesh2.userData = "Snake_Body";
    mesh2.position.set(((x - 1) * size), size, (y * size));
    snake.add(mesh2);

    var geometry3 = new THREE.SphereGeometry(size / 2, 32, 32);
    var mesh3 = new THREE.Mesh(geometry3, matLib['Snake']);
    mesh3.castShadow = true;
    mesh3.receiveShadow = true;
    mesh3.name = 'Snake_Body';
    mesh3.userData = "Snake_Body";
    mesh3.position.set(((x - 2) * size), size, (y * size));
    snake.add(mesh3);
    snake.name = "Snake";
    scene.add(snake);
}
function addSnake(x, y) {
    var geometry3 = new THREE.SphereGeometry(size / 2, 32, 32);
    var mesh3 = new THREE.Mesh(geometry3, matLib['Snake']);
    mesh3.castShadow = true;
    mesh3.receiveShadow = true;
    mesh3.name = 'Snake_Body';
    mesh3.userData = "Snake_Body";
    mesh3.position.set(x, size, y);
    snake.add(mesh3);
}

function refreshScore() {
    try {
        const object = scene.getObjectByName('Score');
        object.geometry.dispose();
        object.material.dispose();
        scene.remove(object);
    } catch (e) {

    }
    const geometry = new THREE.TextGeometry((isGameOver ? 'Game Over ' : '') + 'Score: ' + this.score, {
        
        font: this.tfont,
        size: 18,
        height: 1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 3,
        bevelSize: 1,
        bevelOffset: 0,
        bevelSegments: 5
    });
    var textMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    textMesh.position.set(-20, 20, (isGameOver ? 200 : 130));
    textMesh.rotation.y = Math.PI / 2;
    textMesh.name = "Score";
    scene.add(textMesh);
}


createScene();
