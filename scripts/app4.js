console.log("app4.js");

import { getLogarithmicScaledValue, randcolor, randrange } from './utils.js';
import { deltaTime, physicsSteps, modifyPhysicsSteps, setPhysicsSteps, timestep, maxRNode, minRNode, maxREdge, minREdge, worldW, worldH } from './variables.js';
import { GraphNode } from './GraphNode.js';
import { json2Graph, maxVedge, maxVnode, minVedge, minVnode, reduceGraph } from './Graph.js';
import { GraphEdge } from './GraphEdge.js';

const Application = PIXI.Application;
const Graphics = PIXI.Graphics;
const Assets = PIXI.Assets;
const Loader = PIXI.Loader;
const Container = PIXI.Container;
const Spritesheet = PIXI.Spritesheet;
const BaseTexture = PIXI.BaseTexture;
const TextStyle = PIXI.TextStyle;
const Text = PIXI.Text;

// PIXI
//const renderer = new PIXI.Renderer({ width: 1280, height: 720, backgroundColor: 0x000000 });
//document.body.appendChild(renderer.view);

let app = new Application({ width: worldW, height: worldH, backgroundColor: 0x000000, antialias: true, autoDensity: true, resolution: 2 });
document.body.appendChild(app.view);

//container in cui c'è il grafo e tutti i layer legati agli oggetti del grafo
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
viewport.drag().pinch().wheel().decelerate().clampZoom({ maxScale: 2.0, minScale: 0.05 });
const renderer = app.renderer
viewport.fit()
app.stage.addChild(viewport);

//container in cui ci sono le componenti fisse dell'interfaccia
const uiLayer = new Container();			// Text UI on top
app.stage.addChild(uiLayer);
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

//const loader = PIXI.Loader.shared; 				// for v5+.  In v4 Loader should be lowercased?

const spriteEdgeLayer = new Container();		// Sprites in here.
viewport.addChild(spriteEdgeLayer);
const spriteNodeLayer = new Container();		// Sprites in here.
viewport.addChild(spriteNodeLayer);
const debugLayer = new Container();				// Outlines/planck shapes.
viewport.addChild(debugLayer);
const labelLayer = new Container();	    		// object's labels
viewport.addChild(labelLayer);

//const boundaryGraphics = new Graphics();		// our stage boundaries are on their own graphics object we handle
//debugLayer.addChild(boundaryGraphics);		// in the way planck.js provides us (this is a demo afterall)

// Timing
var gameTime = 0;							// Elapsed time since updating began.
var lastTime = 0;
var frameTime = 0;
var accumulator = 0;
var paused = false;

// Settings
var interpolation = true;					// Draw PIXI objects between physics states for smoother animation.
var drawLines = true;						// Draw Debug lines

var graphNodes = [];						// Our list of GraphNode instances.
var graphEdges = [];						// Our list of GraphEdge instances.
var g;										// grafo (graphology)
var rg;										// grafo ridotto (graphology)

// The bread and butter.  This is (hopefully) a proper game loop, if I learned anything from the gaffer.
function step(t) {

	requestAnimationFrame(step);

	if (lastTime) {
		frameTime = t - lastTime;
		accumulator += frameTime;
		while (accumulator >= timestep) {
			// walk in reverse since we could be splicing.
			for (let o = graphNodes.length - 1; o >= 0; o--) {
				//salvo lo stato precedente
				if (!graphNodes[o].type === "static")
					graphNodes[o].update(deltaTime);
			}

			//indica la pausa del layout
			if (!paused) {
				//calcolo la nuova posizione dei nodi
				let positions = graphologyLibrary.layoutForceAtlas2(g, {
					iterations: 1,
					settings: {
						strongGravityMode: false,
						barnesHutOptimize: false,
						gravity: 0.001,
						edgeWeightInfluence: 1,
						slowDown: 15,
						scalingRatio: 4000,
					},
					weighted: true,
					attributes: { weight: "count" },
				});
				//assegnare le nuove posizioni ai nodi del grafo
				g.forEachNode((node, attr) => {
					//recupero il nodo "grafico"
					let gn = graphNodes.filter(n => n.nodeAttr.id==node)[0];
					if (gn.type === 'dynamic') {
						//assegno le nuove coordinate agli attributi
						g.setNodeAttribute(node, "x", positions[node].x);
						g.setNodeAttribute(node, "y", positions[node].y);	
					}
				});
			
			}

			//assegnare il nuovo stato ai nodi (PIXI)
			for (let o = 0; o < graphNodes.length; o++) {
				let gn = graphNodes[o]; 
				if (!gn.dragged && gn.type === 'dynamic') {
					gn.state.x = g.getNodeAttributes(gn.nodeAttr.id).x;
					gn.state.y = g.getNodeAttributes(gn.nodeAttr.id).y;
					gn.state.angle += gn.deltangle; //0.05; //randrange(0, 5) / 100;
				} else {
					//se è draggato è il contraio, il nodo segue la grafica				
					g.setNodeAttribute(gn.nodeAttr.id, "x", gn.state.x);
					g.setNodeAttribute(gn.nodeAttr.id, "y", gn.state.y);
				}
			}

			gameTime += timestep;
			accumulator -= timestep;
		}
		render(accumulator / timestep);			// PIXI time.
	}
	lastTime = t;


}

function render(alpha) {
	
	for (let o = 0; o < graphEdges.length; o++) {
		graphEdges[o].integrate(alpha);
	}

	for (let o = 0; o < graphNodes.length; o++) {
		graphNodes[o].integrate(alpha);
	}

	//boundaryGraphics.clear();

	// Set our text for rendering. 
	infoText.text = "\n#: " + graphNodes.length;
	//infoText.text += "     lastTime: " + lastTime.toFixed(4) + "   frameTime: " + frameTime.toFixed(4) + "     gameTime:"+gameTime.toFixed(4);
	topText.text = " [ ] = timestep (" + timestep.toFixed(2) + ")";
	bottomText.text = "(S)top (P)lay (L)ines: are " + (drawLines ? "On" : "Off") + "  (I)nterpolation: is " + (interpolation ? "On" : "Off") + "  ";

	// And finally...
	renderer.render(app.stage);
	
}

//PIXI 6 Loader
const loader = Loader.shared; // PixiJS exposes a premade instance for you to use.
let spritesheet;
let data;
loader.add('ssjf', 'assets/rollingBall_sheet.json');
loader.add('bubble', 'assets/plain-bubble-clipart-md.png');
loader.add('data', 'assets/data.json');
loader.load((loader, resources) => {

	let jj = resources.ssjf;
	spritesheet = new Spritesheet(
		BaseTexture.from("assets/" + jj.data.meta.image),
		jj.data
	);
	// Generate all the Textures asynchronously
	spritesheet.parse().then(() => {
		console.log(spritesheet);

		//tutte le textures pronte
		requestAnimationFrame(step);
	});

	//carica i dati
	data = resources.data.data;
	console.log("data:",data);
	g = json2Graph(data);
	console.log("g:",g);

	rg = reduceGraph(g);

	//creo i GraphNode
	rg.forEachNode( (n, a) => {
		let r = Math.round(getLogarithmicScaledValue(a.value, minRNode, maxRNode, minVnode, maxVnode));
		var nn = new GraphNode({
			graph: g, 
			viewport: viewport,
			spritelayer: spriteNodeLayer,
			labellayer: labelLayer,
			debuglayer: debugLayer,
			position: { x: a.x, y: a.y },
			angle: 0, //Math.random(),
			radius: r,
			type: 'dynamic',
			shape: 'circle',
			color: randcolor(),
			//texture: null,
			texture: resources.bubble.texture,
			//texture: spritesheet.textures.ball_red_large,
			interpolation: interpolation,
			drawlines: drawLines,
			nodeattr: a
		});
		graphNodes.push(nn);
	});

	let c = 0xeeffee; //randcolor();
	//creo i GraphEdge
	rg.forEachEdge( (e, a, s, t) => {
		let r = Math.round(getLogarithmicScaledValue(a.value, minREdge, maxREdge, minVedge, maxVedge));
		var ee = new GraphEdge({
			graph: g,
			viewport: viewport,
			spritelayer: spriteEdgeLayer,
			labellayer: labelLayer,
			radius: r,
			color: c,
			source: s,
			target: t,
			edgeattr: a
		});
		graphEdges.push(ee);
	});
	
	//requestAnimationFrame(step);
	
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

	if (ev.code == "Delete") { }
	if (ev.code == "ArrowDown") { }
	if (ev.code == "ArrowUp") { }
	if (ev.code == "ArrowLeft") { }
	if (ev.code == "ArrowRight") { }
	if (ev.code == "KeyR") { }
	if (ev.code == 'KeyC') { }
	if (ev.code == "KeyB") { };
	if (ev.code == "NumpadAdd") { }
	if (ev.code == "NumpadSubtract") { }
	if (ev.code == 'Enter') { }
	if (ev.code == 'KeyT') { }
	if (ev.code == 'Space') { }
	if (ev.code == 'KeyS') {
		//stop
		paused = true;
	}
	if (ev.code == 'KeyP') {
		//play
		paused = false;
	}
	if (ev.code == "KeyL") drawLines = drawLines ? false : true;
	if (ev.code == "KeyI") interpolation = interpolation ? false : true;
	if (ev.code == "BracketLeft") {
		modifyPhysicsSteps(-5);
		if (physicsSteps < 5) setPhysicsSteps(5);
	}
	if (ev.code == "BracketRight") {
		modifyPhysicsSteps(5);
		if (physicsSteps > 200) setPhysicsSteps(200);
	}

});







