console.log("app1.js");

import {randcolor, randrange, MetersPerPixel, PixelsPerMeter} from './utils.js';
import {GameJoint} from './gamejoint.js';
import {GameObject} from './gameobject.js';

const Application = PIXI.Application;
const Graphics = PIXI.Graphics;
const Assets = PIXI.Assets;
const Loader = PIXI.Loader;
const Container = PIXI.Container;
const Sprite = PIXI.Sprite;
const Rectangle = PIXI.Rectangle;
const ParticleContainer = PIXI.ParticleContainer;
const Texture = PIXI.Texture;
const AnimatedSprite = PIXI.AnimatedSprite;
const Spritesheet = PIXI.Spritesheet;
const BaseTexture = PIXI.BaseTexture;
const TextStyle = PIXI.TextStyle;
const Text = PIXI.Text;
const TilingSprite = PIXI.TilingSprite;
const Vec2 = planck.Vec2;
const FrictionJoint = planck.FrictionJoint;
const DistanceJoint = planck.DistanceJoint;
const RopeJoint = planck.RopeJoint;

// PIXI
//const renderer = new PIXI.Renderer({ width: 1280, height: 720, backgroundColor: 0x000000 });
//document.body.appendChild(renderer.view);

const worldW = 1280;
const worldH = 720;

let app = new Application({ width: worldW, height: worldH, backgroundColor: 0x000000, antialias: true, autoDensity: true, resolution: 2 });
document.body.appendChild(app.view);
let viewport = new pixi_viewport.Viewport({
	// screenWidth: window.innerWidth,              // screen width used by viewport (eg, size of canvas)
	// screenHeight: window.innerHeight,            // screen height used by viewport (eg, size of canvas)
	worldWidth: worldW,                        		// world width used by viewport (automatically calculated based on container width)
	worldHeight: worldH,                      		// world height used by viewport (automatically calculated based on container height)
	// threshold: 5,                                // number of pixels to move to trigger an input event (e.g., drag, pinch) or disable a clicked event
	passiveWheel: false,                            // whether the 'wheel' event is set to passive (note: if false, e.preventDefault() will be called when wheel is used over the viewport)
	// stopPropagation: false,                      // whether to stopPropagation of events that impact the viewport (except wheel events, see options.passiveWheel)
	// forceHitArea: null,                          // change the default hitArea from world size to a new value
	// noTicker: false,                             // set this if you want to manually call update() function on each frame
	// ticker: PIXI.Ticker.shared,                  // use this PIXI.ticker for updates
	interaction: app.renderer.events,   			// InteractionManager, available from instantiated WebGLRenderer/CanvasRenderer.plugins.interaction - used to calculate pointer position relative to canvas location on screen
	// divWheel: null,                              // div to attach the wheel event (uses document.body as default)
	// disableOnContextMenu: false,                 // remove oncontextmenu=() => {} from the divWheel element
});
app.stage.addChild(viewport);
viewport.drag().pinch().wheel().decelerate().clampZoom({ maxScale: 2.0, minScale: 0.05 });
const renderer = app.renderer
viewport.fit()

//const loader = PIXI.Loader.shared; 				// for v5+.  In v4 Loader should be lowercased?
// Layer our scene with containers

//const stage = new PIXI.Container();				// Everything ends up here.
const stage = viewport;

const spriteLayer = new Container();		// Sprites in here.
stage.addChild(spriteLayer);
const debugLayer = new Container();		// Outlines/planck shapes.
stage.addChild(debugLayer);
const uiLayer = new Container();			// Text UI on top
stage.addChild(uiLayer);
const labelLayer = new Container();	    // object's labels
stage.addChild(labelLayer);
const boundaryGraphics = new Graphics();	// our stage boundaries are on their own graphics object we handle
debugLayer.addChild(boundaryGraphics);			// in the way planck.js provides us (this is a demo afterall)
var infoText = new Text('', new TextStyle({ fill: '#ffffff' }));
infoText.x = 30;
infoText.y = 25;
uiLayer.addChild(infoText);
var topText = new Text("", new TextStyle({ fontSize: '11pt', fill: '#ffffff' }));
topText.x = 20;
topText.y = 0;
uiLayer.addChild(topText);
var bottomText = new Text("", new TextStyle({ fontSize: '11pt', fill: '#ffffff' }));
bottomText.x = 20;
bottomText.y = renderer.screen.height - 40;
uiLayer.addChild(bottomText);
/*
	Planck

	Goes without saying, please read the Box2D Manual: https://box2d.org/manual.pdf

	We will be simulating Box2d on a small scale, as far as game resolutions are concerned.
	We then draw our game world over that at a much larger scale.

	I opted for two globals for clarity, PixelsPerMeter (b2d-to-PIXI) and MetersPerPixel (PIXI-to-b2d).
	You could just divide PixelsPerMeter when going into Box2d, but an operator is an easy oversight
	for an annoying bug, especially in a tutorial meant for new users.

	Further reading on the concept of scaling box2d: https://box2d.org/2011/12/pixels/
*/

var drawLines = false;						// Draw Debug lines
// Timing
var gameTime = 0;							// Elapsed time since updating began.
var lastTime = 0;
var frameTime = 0;
var accumulator = 0;
var physicsSteps = 60;						// How many physics steps per second.
var timestep = 1000 / physicsSteps;			// 
var deltaTime = timestep / 1000;				// Since we're fixed, we don't need to divide constantly during simulation.
// Settings
var interpolation = true;					// Draw PIXI objects between physics states for smoother animation.
var forceStrength = 20;						// How much power our bunnies posses.
var deleteQueued = false;					// Destroying stuff during a physics step would be crashy.
var deleteAll = false;						// Flag to remove all objects next cycle (again, input polling it outside main loop, so we have to handle this cleanly)
var bulletMode = false;						// Flag new objects as bullets (prevents tunneling, but is harsh on performance)

// Our main Box2D world.
var world = planck.World({
	gravity: planck.Vec2(0, 0)				// approximate normal earth gravity
});

var gameObjects = [];						// Our list of GameObject instances.
var gameJoints = [];						// Our list of joint instances.

const destroyJoints = (go) => {
	//related joints
	let jtd = gameJoints.filter( j => j.goa===go || j.gob===go);
	//console.log("joints to del:",jtd);
	jtd.forEach( j => {
		j.destroy();
		gameJoints = gameJoints.filter( e => e!=j);
	})
	//console.log("joints:",gameJoints);
}

var ground = world.createBody({				// The confinement area for our sandbox
	userData: {
		myType: "boundary",
		label: "ground"
	}
});
// Shortcuts because lazy
const topLeft = planck.Vec2(20 * MetersPerPixel, 20 * MetersPerPixel);
const topRight = planck.Vec2((renderer.screen.width - 20) * MetersPerPixel, 20 * MetersPerPixel);
const bottomLeft = planck.Vec2(20 * MetersPerPixel, (renderer.screen.height - 40) * MetersPerPixel);
const bottomRight = planck.Vec2((renderer.screen.width - 20) * MetersPerPixel, (renderer.screen.height - 40) * MetersPerPixel);
// generate the fixtures on our ground body, one for each side of the room.
ground.createFixture(planck.Edge(topLeft, topRight));
ground.createFixture(planck.Edge(topRight, bottomRight));
ground.createFixture(planck.Edge(bottomRight, bottomLeft));
ground.createFixture(planck.Edge(bottomLeft, topLeft));

// The bread and butter.  This is (hopefully) a proper game loop, if I learned anything from the gaffer.
function step(t) {
	requestAnimationFrame(step);
	if (deleteQueued) {
		if (gameObjects.length) {
			destroyJoints(gameObjects[0]);
			gameObjects[0].destroy();
			gameObjects.splice(0, 1);
		}
		deleteQueued = false; // dequeue if nothing is available
	}
	if (deleteAll) {
		for (let o = 0; o < gameObjects.length; o++) {
			destroyJoints(gameObjects[o]);
			gameObjects[o].destroy();
		}
		gameObjects = [];
		deleteAll = false;
	}
	if (lastTime) {
		frameTime = t - lastTime;
		if (frameTime > 100) { // Panic! In this state, we need to start removing objects!
			frameTime = 100;
			//TODO:entra qui anche se si fa lo switch della finestra con ALT+TAB... non va bene
			if (gameObjects.length) {
				destroyJoints(gameObjects[0]);
				gameObjects[0].destroy();
				gameObjects.splice(0, 1);
				if (gameObjects.length > 10) {		// Be more aggressive.
					for (let d = 0; d < 10; d++) {
						destroyJoints(gameObjects[0]);
						gameObjects[0].destroy();
						gameObjects.splice(0, 1);
					}
				}
			}
		}
		accumulator += frameTime;
		while (accumulator >= timestep) {
			// walk in reverse since we could be splicing.
			for (let o = gameObjects.length - 1; o >= 0; o--) {
				// delete objects flagged out of bounds
				if (gameObjects[o].dirty) {
					destroyJoints(gameObjects[o]);
					gameObjects[o].destroy();
					gameObjects.splice(o, 1);
					continue;
				}
				if (!gameObjects[o].body.isStatic())
					gameObjects[o].update(deltaTime);
			}
			world.step(deltaTime);				// step box2d
			gameTime += timestep;
			accumulator -= timestep;
		}
		render(accumulator / timestep);			// PIXI time.
	}
	lastTime = t;
}

function render(alpha) {
	for (let o = 0; o < gameObjects.length; o++) {
		gameObjects[o].integrate(alpha);
	}

	//renderizzo i joint...
	for (let j = 0; j < gameJoints.length; j++) {
		gameJoints[j].integrate(alpha);	
	}

	// Planck.js maintained box2d quite enthusiastically, including not-very-js ways of doing things.
	// Being a C++ library written in ~2007, it iterates strangely for javascript programmers =)
	// Also note, that most getters in planck.js are by reference, so that's fun!
	// I did the level boundaries in a more vanilla way here, so we could see an example of that in action.
	boundaryGraphics.clear();
	for (var body = world.getBodyList(); body; body = body.getNext()) {
		var userData = body.getUserData();
		if ("gameObject" in userData) continue;	// we skip to the next object if this is a gameObject (handled these above already)
		for (var fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
			var shape = fixture.getShape();
			if (shape.getType() == 'edge' && userData.myType == 'boundary') {
				boundaryGraphics.lineStyle(3, 0xFEEB77, 1);
				boundaryGraphics.moveTo(shape.m_vertex1.x * PixelsPerMeter, shape.m_vertex1.y * PixelsPerMeter);
				boundaryGraphics.lineTo(shape.m_vertex2.x * PixelsPerMeter, shape.m_vertex2.y * PixelsPerMeter);
			}
		}
	}
	boundaryGraphics.endFill();
	// Set our text for rendering. 
	infoText.text = "Steps: " + world.m_stepCount + " (" + physicsSteps + "/sec @ " + frameTime.toFixed(2) + "ms)";
	infoText.text += "\n#: " + gameObjects.length;
	topText.text = 'SPACE: bunnies!    ENTER: random geometry    DEL: remove object    NumPad +/-: gravity (' + world.getGravity().y.toFixed(2) + ")";
	topText.text += "    up / down : impulse (" + forceStrength.toFixed(2) + ")    " + "[ ] = timestep (" + timestep.toFixed(2) + ")";
	bottomText.text = "(L)ines: are " + (drawLines ? "On" : "Off") + "  (I)nterpolation: is " + (interpolation ? "On" : "Off") + "  (B)ulletMode: is " + (bulletMode ? "On" : "Off") + "";
	bottomText.text += "        (C)ircle  (S)quare  (T)riangle         (R)eset Scene      Click an object to apply random force";
	// And finally...
	renderer.render(stage);
}

//PIXI 6 Loader
const loader = Loader.shared; // PixiJS exposes a premade instance for you to use.
let spritesheet;
loader.add('ssjf', 'assets/spritesheet.json')
loader.load((loader, resources) => {
    let jj = resources.ssjf;
    spritesheet = new Spritesheet(
		BaseTexture.from("assets/" + jj.data.meta.image),
		jj.data
	);
	// Generate all the Textures asynchronously
	spritesheet.parse().then(() => {
		//tutte le textures pronte
		requestAnimationFrame(step);
	});
});

/*
//PIXI 7 Assets
var spritesheet;
Assets.load('assets/spritesheet.json').then(jj => {
	spritesheet = new Spritesheet(
		BaseTexture.from("assets/" + jj.data.meta.image),
		jj.data
	);

	// Generate all the Textures asynchronously
	spritesheet.parse().then(() => {
		//tutte le textures pronte
		requestAnimationFrame(step);
	});
});
*/

// Input
document.addEventListener('keyup', (ev) => {

});
document.addEventListener('keydown', (ev) => {
	if (ev.code == "BracketLeft") {
		physicsSteps -= 5;
		if (physicsSteps < 5) physicsSteps = 5;
		timestep = 1000 / physicsSteps;
		deltaTime = timestep / 1000;
	}
	if (ev.code == "BracketRight") {
		physicsSteps += 5;
		if (physicsSteps > 200) physicsSteps = 200;
		timestep = 1000 / physicsSteps;
		deltaTime = timestep / 1000;
	}
	if (ev.code == "Delete") {
		deleteQueued = true;
	}
	if (ev.code == "ArrowDown") {
		forceStrength -= 5;
		if (forceStrength < 0) forceStrength = 0;
	}
	if (ev.code == "ArrowUp") {
		forceStrength += 5;
		if (forceStrength > 200) forceStrength = 200;
	}
	if (ev.code == "ArrowLeft") {
		
		
	}
	if (ev.code == "ArrowRight") {
		
	}
	if (ev.code == "KeyR") deleteAll = true;
	if (ev.code == "KeyB") bulletMode = bulletMode ? false : true;
	if (ev.code == "KeyL") drawLines = drawLines ? false : true;
	if (ev.code == "KeyI") interpolation = interpolation ? false : true;
	if (ev.code == "NumpadAdd") {
		var g = world.getGravity().clone();
		g.y += 1;
		if (g.y > 99) g.y = 99;
		world.setGravity(g);
	}
	if (ev.code == "NumpadSubtract") {
		var g = world.getGravity().clone();
		g.y -= 1;
		if (g.y < -99) g.y = -99;
		world.setGravity(g);
	}
	if (ev.code == 'Space') {
		var r = randrange(10, 40)

		//scelgo un oggetto tra quelli già esistenti
		let oo;
		if (gameObjects.length>0) {
			oo = gameObjects[randrange(0,gameObjects.length-1)]
		}

		var o = new GameObject({
			world: world,
			renderer: renderer,
			spritelayer: spriteLayer,
			labellayer: labelLayer,
			debuglayer: debugLayer,
			position: { x: 200, y: 200 },
			angle: 0, //Math.random(),
			angularVelocity: 0, //randrange(1, 3),
			radius: r,
			type: 'dynamic',
			shape: 'circle',
			color: randcolor(),
			restitution: randrange(1, 50) / 100,
			friction: randrange(1, 50) / 100,
			density: randrange(r, r * 2),
			texture: spritesheet.textures['sprite0' + randrange(1, 4)],
			bulletmode: bulletMode,			
			interpolation: interpolation,
			drawlines: drawLines	
		});
		gameObjects.push(o);

		var force = planck.Vec2(forceStrength, forceStrength).mul(deltaTime * PixelsPerMeter * o.body.m_mass);
		o.body.applyLinearImpulse(force, o.body.getWorldCenter());

		if (gameObjects.length>1) {

		    //aggiungo il vincolo con l'altro oggetto scelto
			gameJoints.push(new GameJoint({
				world: world,
				renderer: renderer,
				spritelayer: spriteLayer,
				labellayer: labelLayer,
				goa: o,
				gob: oo,
				label: "joint",
				type: "rope"
			}));

		
		}


	}
	if (ev.code == 'Enter') {
		var shape;
		var r = randrange(1, 100)
		if (r < 33) shape = 'triangle';
		if (r >= 33 && r < 66) shape = 'box';
		if (r >= 66) shape = 'circle';
		var size = randrange(25, 60);
		var o = new GameObject({
			world: world,
			renderer: renderer,
			spritelayer: spriteLayer,
			labellayer: labelLayer,
			debuglayer: debugLayer,
			position: { x: 200, y: 200 },
			angle: Math.random(),
			angularVelocity: 0,//randrange(1,5),
			radius: size,
			type: 'dynamic',
			shape: shape,
			color: randcolor(),
			restitution: (100 - size) / 100,
			friction: size / 100,
			density: (size * 2) / 100,
			texture: null,
			bulletmode: bulletMode,			
			interpolation: interpolation,
			drawlines: drawLines
		});
		gameObjects.push(o);
		
		var force = planck.Vec2(forceStrength, forceStrength).mul(deltaTime * PixelsPerMeter);
		o.body.applyLinearImpulse(force, o.body.getWorldCenter());
	}
	if (ev.code == 'KeyT') {
		var size = randrange(25, 60);
		var o = new GameObject({
			world: world,
			renderer: renderer,
			spritelayer: spriteLayer,
			labellayer: labelLayer,
			debuglayer: debugLayer,
			position: { x: 200, y: 200 },
			angle: Math.random(),
			angularVelocity: 0,//randrange(1,5),
			radius: size,
			type: 'dynamic',
			shape: 'triangle',
			color: randcolor(),
			restitution: (100 - size) / 100,
			friction: size / 100,
			density: (size * 2) / 100,
			texture: null,
			bulletmode: bulletMode,			
			interpolation: interpolation,
			drawlines: drawLines
		});
		gameObjects.push(o);
		
		var force = planck.Vec2(forceStrength, forceStrength).mul(deltaTime * PixelsPerMeter);
		o.body.applyLinearImpulse(force, o.body.getWorldCenter());
	}
	if (ev.code == 'KeyS') {
		var size = randrange(25, 70);
		var o = new GameObject({
			world: world,
			renderer: renderer,
			spritelayer: spriteLayer,
			labellayer: labelLayer,
			debuglayer: debugLayer,
			position: { x: 200, y: 200 },
			angle: Math.random(),
			angularVelocity: 0,//randrange(1,5),
			radius: size,
			type: 'dynamic',
			shape: 'box',
			color: randcolor(),
			restitution: (100 - size) / 100,
			friction: size / 100,
			density: (size * 2) / 100,
			texture: null,
			bulletmode: bulletMode,			
			interpolation: interpolation,
			drawlines: drawLines
		});
		gameObjects.push(o);
		
		var force = planck.Vec2(forceStrength, forceStrength).mul(deltaTime * PixelsPerMeter);
		o.body.applyLinearImpulse(force, o.body.getWorldCenter());
	}
	if (ev.code == 'KeyC') {
		var size = randrange(15, 50);
		var o = new GameObject({
			world: world,
			renderer: renderer,
			spritelayer: spriteLayer,
			labellayer: labelLayer,
			debuglayer: debugLayer,
			position: { x: 200, y: 200 },
			angle: Math.random(),
			angularVelocity: 0,//randrange(1,5),
			radius: size,
			type: 'dynamic',
			shape: 'circle',
			color: randcolor(),
			restitution: (100 - size) / 100,
			friction: size / 100,
			density: (size * 2) / 100,
			texture: null,
			bulletmode: bulletMode,			
			interpolation: interpolation,
			drawlines: drawLines
		});
		gameObjects.push(o);
		
		var force = planck.Vec2(forceStrength, forceStrength).mul(deltaTime * PixelsPerMeter);
		o.body.applyLinearImpulse(force, o.body.getWorldCenter());
	}
});







