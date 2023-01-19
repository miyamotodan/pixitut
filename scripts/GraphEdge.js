
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
		this.color = opts.color;
		this.radius = opts.radius;
		this.label = new Graphics();
        this.labelLayer = opts.labellayer;
		this.sprite = new Graphics();
        this.spriteLayer = opts.spritelayer;
		this.textlabel = new Text(opts.label, style);
		this.label.addChild(this.textlabel);
		this.label.alpha = 0;
		this.container = new Container();
		this.container.addChild(this.sprite);
		this.spriteLayer.addChild(this.container);
		this.viewport = opts.viewport;
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
		console.log("joint click");
	}
	mouseover() {
		this.textlabel.text = "["+this.edgeAttr.value+"]";
		this.label.alpha = 1;
	}
	mouseout() {
		this.label.alpha = 0;
	}
	integrate(alpha) {
		
		//console.log (this.source, this.target, this.radius);

		this.sprite.clear();
		this.sprite.lineStyle(this.radius, this.color, 0.5);
		this.sprite.moveTo(this.graph.getNodeAttributes(this.source).x, this.graph.getNodeAttributes(this.source).y);
		this.sprite.lineTo(this.graph.getNodeAttributes(this.target).x, this.graph.getNodeAttributes(this.target).y);
		this.sprite.endFill();
	
		//label position
		this.label.pivot.x = this.label.width / 2;
		this.label.pivot.y = this.label.height / 2;
		this.label.x = (this.graph.getNodeAttributes(this.source).x +this.graph.getNodeAttributes(this.target).x) / 2; 
		this.label.y = (this.graph.getNodeAttributes(this.source).y +this.graph.getNodeAttributes(this.target).y) / 2; 

	}
	update(dt) {
		
	}
	destroy() {
		// pixi cleanup
		this.container.destroy({ children: true });
		this.label.destroy();
	}
}