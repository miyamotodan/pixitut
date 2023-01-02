// Some helpers, just for fun.
function randrange(min, max) { return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min); }
function randcolor() { return '0x' + Math.floor(Math.random() * 16777215).toString(16) }

const style = new PIXI.TextStyle({
    align: "center",
    fill: "#19e1d4",
    fontFamily: "\"Lucida Console\", Monaco, monospace",
    fontSize: 20,
    fontVariant: "small-caps",
    fontWeight: "bolder",
    lineJoin: "bevel",
    stroke: "#161313",
    strokeThickness: 2
});

var PixelsPerMeter = 50;					// How many pixels represent 1 meter.
var MetersPerPixel = 1 / PixelsPerMeter;	// And the reverse.
var forceStrength = 20;						// How much power our bunnies posses.

var physicsSteps = 60;						// How many physics steps per second.
var timestep = 1000 / physicsSteps;			// milliseconds per step
var deltaTime = timestep / 1000;			// Since we're fixed, we don't need to divide constantly during simulation.

const modifyPhysicsSteps = (v) => {
    physicsSteps += v;
    timestep = 1000 / physicsSteps;
    deltaTime = timestep / 1000;
}

const setPhysicsSteps = (v) => {
    physicsSteps = v;
    timestep = 1000 / physicsSteps;
    deltaTime = timestep / 1000;
}

export {randcolor, randrange, style, PixelsPerMeter, MetersPerPixel, forceStrength, 
    deltaTime, 
    timestep, 
    physicsSteps, modifyPhysicsSteps, setPhysicsSteps
}