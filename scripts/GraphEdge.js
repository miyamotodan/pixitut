
import {style} from './variables.js';

const Graphics = PIXI.Graphics;
const Container = PIXI.Container;
const Text = PIXI.Text;

export class GraphEdge {
	constructor(opts) {
		//salvo le opzioni originali
		//this.opts = opts;

        this.edgeAttr = opts.edgeattr;
		this.graph = opts.graph;
		this.source = opts.source;
		this.target = opts.target;
		
		this.radius = opts.radius;
		this.label = new Graphics();
        this.labelLayer = opts.labellayer;
		this.sprite = new Graphics();
        this.spriteLayer = opts.spritelayer;
		this.textlabel = new Text(opts.label, style);
		this.label.addChild(this.textlabel);
		this.container = new Container();
		this.container.addChild(this.sprite);
		this.spriteLayer.addChild(this.container);

		this.label.interactive = true;
	
		this.label.on('pointerdown', this.click.bind(this));
		this.label.on('mouseover', this.mouseover.bind(this));
		this.label.on('mouseout', this.mouseout.bind(this));
		
		// label
		this.label.x = this.container.x;
		this.label.y = this.container.y;
		this.labelLayer.addChild(this.label);	
	
	}
	click() {
		//console.log("joint click");
	}
	mouseover() {
		his.textlabel.text = "["+this.edgeAttr.value+"]";
		this.label.alpha = 1;
	}
	mouseout() {
		//console.log("joint out");
		this.label.alpha = 0;
	}
	integrate(alpha) {
		
		//console.log (this.source, this.target, this.radius);

		this.sprite.clear();
		this.sprite.lineStyle(this.radius, 0xFEEB77, 1);
		this.sprite.moveTo(this.graph.getNodeAttributes(this.source).x, this.graph.getNodeAttributes(this.source).y);
		this.sprite.lineTo(this.graph.getNodeAttributes(this.target).x, this.graph.getNodeAttributes(this.target).y);
		this.sprite.endFill();
	

        /*
		let ba = this.joint.getBodyA();
		let bb = this.joint.getBodyB();
	
		
		let bap = ba.getPosition();
		let bbp = bb.getPosition();

		//console.log(bap,bbp);
		//console.log("ba",ba,"bb",bb);

		this.sprite.clear();
		this.sprite.lineStyle(3, 0xFEEB77, 1);
		this.sprite.moveTo(bap.x * PixelsPerMeter, bap.y * PixelsPerMeter);
		this.sprite.lineTo(bbp.x * PixelsPerMeter, bbp.y * PixelsPerMeter);
		this.sprite.endFill();
	
		//console.log("w",this.container.width,"h",this.container.height);

		//label position
		this.label.pivot.x = this.label.width / 2;
		this.label.pivot.y = this.label.height / 2;
		this.label.x = (bap.x * PixelsPerMeter + bbp.x * PixelsPerMeter) / 2; 
		this.label.y = (bap.y * PixelsPerMeter + bbp.y * PixelsPerMeter) / 2;

		//joint position
		//this.container.x = ba.container.x * MetersPerPixel * alpha;
		//this.container.y = ba.container.y * MetersPerPixel * alpha;
		this.container.x = bap.x * MetersPerPixel * alpha;
		this.container.y = bap.y * MetersPerPixel * alpha;
	    */

	}
	update(dt) {
		
	}
	destroy() {
		// pixi cleanup
		this.container.destroy({ children: true });
		this.label.destroy();
	}
}