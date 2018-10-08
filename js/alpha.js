var container;
var camera, scene, renderer;
var controls, light, spLight, clock, stats, fogColor, rotate, zoom;
var darkBackground = false;
var EventsControls;
var smokeTexture, smokeMaterial, smokeGeo, smokeParticles, cubeSineDriver;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var object;
var _mouse = { x: 0, y: 0 },
    objects = [],
    _projector = new THREE.Projector();

var keyLight, fillLight, backLight;
var meshChild = [], mesh;

var modelMaterial = new THREE.MeshPhongMaterial({
    color: 0xb9d5ff,
    ambient: 0xfff660,
    shininess: 100,
    wireframe: false,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    combine: THREE.MixOperation
});


init();
animate();
function init() {
    //container = document.getElementById("objViewer");
    container = document.createElement('div');
    document.getElementById("objViewer").appendChild(container);
    //document.body.appendChild( container );
    //document.getElementById("objViewer").addEventListener( 'mousedown', onDocumentMouseDown, false );
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 2, 2000);
    camera.position.z = 270;


    // scene
    scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0x101030, 0.4);
    scene.add(ambientLight);
    var pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);
    // manager
    function loadModel() {
        object.traverse(function (child) {
            if (child.isMesh) {
                console.log("child : " + (child));
                child.material.map = texture;
                child.castShadow = true;
                cubeSineDriver = 0;
                meshChild.push(child);//not using for now
                mesh = child;//not using for now
            }
        });

        scene.add(object);
        object.position.x = 0;
        object.position.y = -20;
        object.position.z = 0;


        //Lights
        spLight = new THREE.SpotLight(0x654321, 1.75, 2000, Math.PI / 3);
        spLight.castShadow = true;
        spLight.position.set(-100, 300, -50);
        scene.add(spLight);

        
            var ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 10, 10),
            new THREE.MeshLambertMaterial(
                { color: 0xf5f5f5 }
            ));
            ground.receiveShadow = true;
            ground.position.set(0, -25, 0);
            ground.rotation.x = -Math.PI / 2;
            scene.add(ground);
      
        //ground.scale.set( 0.05, 0.05, 0.05 ); //to reduce size of ground plane
        //Helpers
        /*var helper = new THREE.CameraHelper(spLight.shadow.camera);
        scene.add(helper);
        scene.add( new THREE.AxisHelper( 200 ) ); */

        var spLight = new THREE.SpotLight(0xffffff, 1, 2000, Math.PI / 3);
        spLight.castShadow = true;
        spLight.position.set(100, 300, -50);
        scene.add(spLight);

        //main model object
        scene.add(object);

    }//loadModel()

    var manager = new THREE.LoadingManager(loadModel);
    manager.onProgress = function (item, loaded, total) {
        console.log(item, loaded, total);
    };
    // texture
    var textureLoader = new THREE.TextureLoader(manager);
    var texture = textureLoader.load('models/rough.png');

    // model
    function onProgress(xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log('model ' + Math.round(percentComplete, 2) + '% downloaded');
        }
    }
    function onError(xhr) { }

    var loader = new THREE.OBJLoader(manager);

    var modelPath = 'models/homeobj.obj';

    loader.load(modelPath, function (obj) {
        obj.scale.set(.3, .3, .3);//to reduce size of model- to one third
        object = obj; //object for using model overall
        objects.push(object);//to get properties on OnMouseDownEvent
    }, onProgress, onError);

    //Renderer
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });

    renderer.setClearColor(0x000000, 0);

    //renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    //newly added
    /* renderer.physicallyCorrectLights = true;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    //renderer.toneMapping = THREE.ReinhardToneMapping;*/
    clock = new THREE.Clock();
    console.log("clock : " + clock)

    controls = new THREE.OrbitControls(camera);
    controls.addEventListener('change', render);

    /* controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true; //added peed to the rotation speed of the model */

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
    container.appendChild(renderer.domElement);


    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );//for selected comp data
    //document.getElementById("objViewer").addEventListener('mousedown', onDocumentMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / 2 / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 2;
    mouseY = (event.clientY - windowHalfY) / 2;
}

function onDocumentMouseDown(event) {

    event.preventDefault();
    console.log("onDocumentMouseDown() called : event : " + JSON.stringify(event));
    // find intersections
    _mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    var vector = new THREE.Vector3(_mouse.x, _mouse.y, 1);

    //var ray = _projector.pickingRay( vector.clone(), camera );

    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    ray.setFromCamera(vector, camera);

    var intersects = ray.intersectObjects(scene.children, true);
    //var meshItem = JSON.stringify(intersects);

    console.log(intersects[0].distance);//distance getting printed
    //can also use objects[0].children instead of scene.children above, produces same result
    //error issue : all selection giving same output
    //console.log("intersects scene children : " + JSON.parse(meshItem));

    if (intersects.length > 0) {
        console.log("selected!");
        _SELECTED_DOWN = true;
    }
}

//

var already_selected = false;

function startRotatingModel() {
    rotate = true;
}

function stopRotatingModel() {
    rotate = false;
    object.rotation.y = 0;
}

function makeModelTransparent() {
    renderer.setClearColor(0x000000);
    objects[0].traverse(function (child) {
        if (child.isMesh) {
            child.material = modelMaterial;
            child.castShadow = false;
        }
    });
    //darkBackground = true;
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 10, 10),
    new THREE.MeshLambertMaterial(
        { color: 0x000000 }
    ));
    ground.receiveShadow = true;
    ground.position.set(0, -25, 0);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
}

function showModelAsWireframe() {
    renderer.setClearColor(0xffffff);
    objects[0].traverse(function (child) {
        if (child.isMesh) {
            child.material.wireframe = true;
            child.castShadow = false;
        }
    });
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 10, 10),
    new THREE.MeshLambertMaterial(
        { color: 0xf5f5f5 }
    ));
    ground.receiveShadow = true;
    ground.position.set(0, -25, 0);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
        
}

function reloadModel() {
    /* renderer.setClearColor(0x000000);
    mesh.material.wireframe = false;
 */
init();
animate();
}

function animate() {
    requestAnimationFrame(animate);
    render();
    controls.update();
    if (rotate)
        object.rotation.y += 0.02;
    /* //for rotating object on y axis, change respectively for other axis
    object.rotation.y += 0.01; */
    //stats.update();
}



function render() {
    renderer.render(scene, camera);
}
