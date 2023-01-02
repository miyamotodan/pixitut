
import {style, PixelsPerMeter, MetersPerPixel} from './utils.js';

const Graphics = PIXI.Graphics;
const Container = PIXI.Container;
const Text = PIXI.Text;
const Vec2 = planck.Vec2;
const FrictionJoint = planck.FrictionJoint;
const DistanceJoint = planck.DistanceJoint;
const RopeJoint = planck.RopeJoint;

export class GameJoint {
	constructor(opts) {
		this.label = new Graphics();
        this.labelLayer = opts.labellayer;
		this.sprite = new Graphics();
        this.spriteLayer = opts.spritelayer;
		this.textlabel = new Text(opts.label, style);
		this.label.addChild(this.textlabel);
		this.container = new Container();
		this.world = opts.world;
		this.goa = opts.goa;
		this.gob = opts.gob;

		// Container is our main interface to PIXI.
		// this.container.pivot.x = this.container.width / 2;
		// this.container.pivot.y = this.container.height / 2;
		// this.container.x = opts.position.x * PixelsPerMeter;
		// this.container.y = opts.position.y * PixelsPerMeter;
		this.container.addChild(this.sprite);
		this.spriteLayer.addChild(this.container);

		this.label.interactive = true;
		this.label.buttonMode = true;
		this.label.on('pointerdown', this.click.bind(this));
		this.label.on('mouseover', this.mouseover.bind(this));
		this.label.on('mouseout', this.mouseout.bind(this));
		
		// label
		this.label.x = this.container.x;
		this.label.y = this.container.y;
		this.labelLayer.addChild(this.label);
		
		let j;
		//creazione del joint
		switch (opts.type) {
			case "distance":
				j = DistanceJoint({	bodyA: this.goa.body, localAnchorA: Vec2(0.0, 0.0), bodyB: this.gob.body, localAnchorB: Vec2(0.0, 0.0), frequencyHz: 4, dampingRatio: 0.5 });
				break;
			case "friction":
				j = FrictionJoint({ collideConnected : true, maxForce : 1, maxTorque : 1 }, this.goa.body, this.gob.body);
				break;
			case "rope":
				j = RopeJoint({	bodyA: this.goa.body, bodyB: this.gob.body, collideConnected : true, maxLength: 5 });
				break;
			default:
				break;
		}
		this.joint = j;
		this.world.createJoint(j);		
	
	}
	click() {
		console.log("joint click");
	}
	mouseover() {
		console.log("joint over", this.goa.textlabel.text, this.gob.textlabel.text);
		//this.textlabel.text = 'x:'+this.container.x.toFixed(2)+" y:"+this.container.y.toFixed(2);
		this.textlabel.text = this.goa.textlabel.text+"--"+ this.gob.textlabel.text;
		this.label.alpha = 1;
	}
	mouseout() {
		console.log("joint out");
		this.label.alpha = 0;
	}
	integrate(alpha) {
		
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
	

	}
	update(dt) {
		
	}
	destroy() {
		// box2d cleanup
		this.world.destroyJoint(this.joint);
		// pixi cleanup
		this.container.destroy({ children: true });
		this.label.destroy();
	}
}