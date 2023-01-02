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

export {randcolor, randrange, style, PixelsPerMeter, MetersPerPixel}