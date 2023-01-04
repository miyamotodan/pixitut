console.log("app3.js");

const Application = PIXI.Application;
const Graphics = PIXI.Graphics;
const Assets = PIXI.Assets;
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

let app = new PIXI.Application({ width: 1280, height: 720, backgroundColor: 0x000000, antialias: true, autoDensity: true, resolution: 2 });
document.body.appendChild(app.view);
let viewport = new pixi_viewport.Viewport({
	// screenWidth: window.innerWidth,              // screen width used by viewport (eg, size of canvas)
	// screenHeight: window.innerHeight,            // screen height used by viewport (eg, size of canvas)
	worldWidth: 1280,                               // world width used by viewport (automatically calculated based on container width)
	worldHeight: 720,                               // world height used by viewport (automatically calculated based on container height)
	// threshold: 5,                                // number of pixels to move to trigger an input event (e.g., drag, pinch) or disable a clicked event
	passiveWheel: false,                            // whether the 'wheel' event is set to passive (note: if false, e.preventDefault() will be called when wheel is used over the viewport)
	// stopPropagation: false,                      // whether to stopPropagation of events that impact the viewport (except wheel events, see options.passiveWheel)
	// forceHitArea: null,                          // change the default hitArea from world size to a new value
	// noTicker: false,                             // set this if you want to manually call update() function on each frame
	// ticker: PIXI.Ticker.shared,                  // use this PIXI.ticker for updates
	interaction: app.renderer.events,               // InteractionManager, available from instantiated WebGLRenderer/CanvasRenderer.plugins.interaction - used to calculate pointer position relative to canvas location on screen
	// divWheel: null,                              // div to attach the wheel event (uses document.body as default)
	// disableOnContextMenu: false,                 // remove oncontextmenu=() => {} from the divWheel element
});
app.stage.addChild(viewport);
viewport.drag().pinch().wheel().decelerate().clampZoom({ maxScale: 2.0, minScale: 0.05 });

var graphics = new PIXI.Graphics();

graphics.beginFill(0xFFFF00);

// set the line style to have a width of 5 and set the color to red
graphics.lineStyle(5, 0xFF0000);

// draw a rectangle
graphics.drawRect(0, 0, 300, 200);

viewport.addChild(graphics);