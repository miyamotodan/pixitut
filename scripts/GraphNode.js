import {style} from './variables.js';

const Graphics = PIXI.Graphics;
const Container = PIXI.Container;
const Sprite = PIXI.Sprite;
const Point = PIXI.Point;
const Text = PIXI.Text;
const Polygon = PIXI.Polygon;

export class GraphNode {
	constructor(opts) {
		//salvo le opzioni originali
		//this.opts = opts;
		this.graph = opts.graph;
		this.nodeAttr = opts.nodeattr;
		
		this.type = opts.type, //static , dynamic

		// If no texture is supplied we become a solid shape.
		this.sprite = opts.texture == null ?  new Graphics() : new Sprite(opts.texture);
        this.spriteLayer = opts.spritelayer;
		this.viewport = opts.viewport;
		this.debug = new Graphics();
		this.debugLayer = opts.debuglayer;
		this.label = new Graphics();
        this.labelLayer = opts.labellayer;
		this.textlabel = new Text('', style);
		this.label.addChild(this.textlabel);
		this.dragged=false;
		this.state = { x: opts.position.x, y: opts.position.y, angle: opts.angle};
		
		this.container = new Container();
		this.shapeType = opts.shape;

        this.interpolation = opts.interpolation;    
        this.setInterpolation = (v) => this.interpolation = v;

        this.drawLines = opts.drawlines;            
        this.setDrawLines = (v) => this.drawLines = v;

		if (this.shapeType == 'box') {
			if (this.sprite instanceof Sprite == false) {
				this.sprite.beginFill(opts.color, 1);
				this.polygon = new Polygon([new Point(-opts.radius/2,-opts.radius/2),new Point(-opts.radius/2, opts.radius/2), new Point(opts.radius/2,opts.radius/2), new Point(opts.radius/2,-opts.radius/2)])
				this.sprite.drawPolygon(this.polygon);
				this.sprite.endFill();
			}
		}
		else if (this.shapeType == 'triangle' || this.shapeType == 'box') {
			if (this.sprite instanceof Sprite == false) {
				this.sprite.beginFill(opts.color, 1);
				this.polygon = new Polygon([new Point(-opts.radius, 0), new Point(0, opts.radius), new Point(opts.radius, 0)]);
				this.sprite.drawPolygon(this.polygon);
				this.sprite.endFill();
				//this.sprite.pivot.x = this.sprite.width / 2;
				//this.sprite.pivot.y = this.sprite.height / 2;
			}
		}
		else if (this.shapeType == 'circle') {
			if (this.sprite instanceof Sprite == false) {
				this.sprite.beginFill(opts.color, 1);
				this.sprite.drawCircle(0, 0, opts.radius);
				this.sprite.endFill();
			}
		} else throw ("Unsupported physics shape!");
		
		// For interpolation, we need to know our Body's previous physics state.
		this.previousState = this.state;
	
		// If a texture is present, we need to center our origin
		if (this.sprite instanceof Sprite) {
			this.sprite.pivot.x = this.sprite.width / 2;
			this.sprite.pivot.y = this.sprite.height / 2;
			
			//sprite inscritto nel cerchio
			//this.sprite.scale.set(opts.radius*Math.sqrt(2)/this.sprite.width, opts.radius*Math.sqrt(2)/this.sprite.height);
			//sprite circoscritto nel cerchio
			this.sprite.scale.set(2*opts.radius/this.sprite.width, 2*opts.radius/this.sprite.height);
			
		}
		// Container is our main interface to PIXI.
		this.container.pivot.x = this.container.width / 2;
		this.container.pivot.y = this.container.height / 2;
		this.container.x = opts.position.x;
		this.container.y = opts.position.y;
		this.container.addChild(this.sprite);	// Add the sprite after you setup the container, lest it gets goofy.
		this.spriteLayer.addChild(this.container);

		this.container.interactive = true;
		this.container.buttonMode = true;
		
		this.container.on('mousemove', this.mousemove.bind(this));
		this.container.on('pointerup', this.mouseup.bind(this));
		this.container.on('pointerdown', this.mousedown.bind(this));
		this.container.on('mouseover', this.mouseover.bind(this));
		this.container.on('mouseout', this.mouseout.bind(this));
		// Debug lines
		this.debug.x = this.container.x = opts.position.x;
		this.debug.y = this.container.y = opts.position.y;
		this.debugLayer.addChild(this.debug);
		// label
		this.label.x = this.container.x = opts.position.x;
		this.label.y = this.container.y = opts.position.y;
		this.labelLayer.addChild(this.label);
		
	}
	mousedown(e) {
		//console.log('down', e.data.global.x,e.data.global.y);
		this.viewport.pause = true;
		this.dragged = true;
	}
	mouseup(e) {
		//console.log('up', e.data.global.x,e.data.global.y);
		this.viewport.pause = false;
		this.dragged = false;
		
		//assegno al nodo de grafo le coordinate in cui è stato draggato
		this.graph.setNodeAttribute(this.nodeAttr.id,"x",this.state.x);
		this.graph.setNodeAttribute(this.nodeAttr.id,"y",this.state.y);
		
	}
	mousemove(e) {
		//console.log('move', e.data.global.x,e.data.global.y);
		if (this.dragged){
			let newpos = this.viewport.toWorld(e.data.global);
			this.state.x = newpos.x;
			this.state.y = newpos.y;
		}
	}
	mouseover() {
		this.textlabel.text = "["+this.nodeAttr.value+"] "+this.nodeAttr.prefix+":"+this.nodeAttr.type;
		this.label.alpha = 1;
	}
	mouseout() {
		this.label.alpha = 0;
	}
	integrate(alpha) {
		// Interpolate or snap?
		this.container.x = this.interpolation ? (this.state.x * alpha) + (this.previousState.x * (1 - alpha)) : this.state.x;
		this.container.y = this.interpolation ? (this.state.y * alpha) + (this.previousState.y * (1 - alpha)) : this.state.y;
		this.container.rotation = this.interpolation ? this.state.angle * alpha + this.previousState.angle * (1 - alpha) : this.state.angle;

		// Debug lines -- Yeah, these are not very fast, but useful for a testbed.
		this.debug.clear();
		if (this.drawLines) {
			this.debug.x = this.container.x;
			this.debug.y = this.container.y;
			this.debug.rotation = this.interpolation ? this.state.angle * alpha + this.previousState.angle * (1 - alpha) : this.state.angle;
			this.debug.lineStyle(1, 0x00ff2a, 1);
			if (this.shapeType != 'circle') { // width and height don't seem to be a concept to boxes in box2d, so we go by their vertices.
				this.debug.drawPolygon(this.polygon);				
			} else
			if (this.shapeType == 'circle') {
				this.debug.drawCircle(0, 0, this.radius);
			} 
			
			this.debug.endFill();
		}

		//label position
		this.label.x = this.container.x;
		this.label.y = this.container.y;
	}
	update(dt) {
		// Store previous state
		this.previousState = this.state;
	}
	destroy() {
		// pixi cleanup
		this.container.destroy({ children: true });
		this.debug.destroy();
		this.label.destroy();
	}
}