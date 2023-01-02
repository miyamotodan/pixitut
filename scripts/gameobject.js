import {style, randrange, MetersPerPixel, PixelsPerMeter} from './utils.js';
import {PhysicsState} from './physicsstate.js';

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

/*
	Box2d is a verbose library.  In addition, it has definitions each for Body, Fixture, and Shape; which can be overwhelming.
	This is a basic class that blends some of the common ones and saves a bit of typing.
*/
export class GameObject {
	constructor(opts) {
		// If no texture is supplied we become a solid shape.
		this.sprite = opts.texture == null ?  new Graphics() : new Sprite(opts.texture);
        this.spriteLayer = opts.spritelayer;
		this.debug = new PIXI.Graphics();
		this.debugLayer = opts.debuglayer;
		this.label = new PIXI.Graphics();
        this.labelLayer = opts.labellayer;
		this.textlabel = new Text('', style);
		this.label.addChild(this.textlabel);
		
		this.container = new PIXI.Container();
		this.shapeType = opts.shape;
		this.bulletCounter = 0;			// Expire our bullet flag after a short time; it's only needed for launching really.
		this.world = opts.world;
        this.renderer = opts.renderer;
		this.dirty = false;				// Outside the game area, I should get removed.

        this.bulletMode = opts.bulletmode;          //TODO:setBulletMode
        this.interpolation = opts.interpolation;    //TODO:setInterpolation
        this.drawLines = opts.drawlines;            //TODO:setDrawLines

		this.body = this.world.createBody({
			type: opts.type,
			bullet: this.bulletMode,
			angularVelocity: opts.angularVelocity,
			position: { x: opts.position.x * MetersPerPixel, y: opts.position.y * MetersPerPixel },
			userData: {	// We assign some userData for this body for future handling
				gameObject: true
			}
		});
		if (this.shapeType == 'box') {
			this.body.createFixture(planck.Box((opts.radius / 2) * MetersPerPixel, (opts.radius / 2) * MetersPerPixel), {
				friction: opts.friction,
				restitution: opts.restitution,
				density: opts.density
			});
			if (this.sprite instanceof PIXI.Sprite == false) {
				this.sprite.beginFill(opts.color, 1);
				this.sprite.drawRect(0, 0, opts.radius, opts.radius);
				this.sprite.endFill();
				// Boxes need their origin centralized, because box2d uses center of mass (this keeps our "sprite" within our body.  
				// Circles do this naturally
				this.sprite.pivot.x = this.sprite.width / 2;
				this.sprite.pivot.y = this.sprite.height / 2;
			}
		}
		else if (this.shapeType == 'triangle') {
			this.body.createFixture(planck.Polygon([
				planck.Vec2(-opts.radius * MetersPerPixel, opts.radius * MetersPerPixel),
				planck.Vec2(0, opts.radius * 2 * MetersPerPixel),
				planck.Vec2(opts.radius * MetersPerPixel, opts.radius * MetersPerPixel)]), {
				friction: opts.friction,
				restitution: opts.restitution,
				density: opts.density
			});
			if (this.sprite instanceof PIXI.Sprite == false) {
				this.sprite.beginFill(opts.color, 1);
				this.sprite.drawPolygon([
					new PIXI.Point(-opts.radius, opts.radius),
					new PIXI.Point(0, opts.radius * 2),
					new PIXI.Point(opts.radius, opts.radius)
				]);
				this.sprite.endFill();
			}
		}
		else if (this.shapeType == 'circle') {
			this.body.createFixture(planck.Circle(opts.radius * MetersPerPixel), {
				friction: opts.friction,
				restitution: opts.restitution,
				density: opts.density
			});
			if (this.sprite instanceof PIXI.Sprite == false) {
				this.sprite.beginFill(opts.color, 1);
				this.sprite.drawCircle(0, 0, opts.radius);
				this.sprite.endFill();
			}
		} else throw ("Unsupported physics shape!");
		// For interpolation, we need to know our Body's previous physics state.
		this.previousState = new PhysicsState();
		this.previousState.assign(this.body.getPosition(), this.body.getAngle());
		// If a texture is present, we need to center our origin
		if (this.sprite instanceof PIXI.Sprite) {
			this.sprite.pivot.x = this.sprite.width / 2;
			this.sprite.pivot.y = this.sprite.height / 2;
			//this.sprite.scale.set(opts.radius*MetersPerPixel*(PixelsPerMeter/12),opts.radius*MetersPerPixel*(PixelsPerMeter/12));
			this.sprite.scale.set(opts.radius * MetersPerPixel, opts.radius * MetersPerPixel);
		}
		// Container is our main interface to PIXI.
		this.container.pivot.x = this.container.width / 2;
		this.container.pivot.y = this.container.height / 2;
		this.container.x = opts.position.x * PixelsPerMeter;
		this.container.y = opts.position.y * PixelsPerMeter;
		this.container.addChild(this.sprite);	// Add the sprite after you setup the container, lest it gets goofy.
		this.spriteLayer.addChild(this.container);

		this.container.interactive = true;
		this.container.buttonMode = true;
		this.container.on('pointerdown', this.click.bind(this));
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
	click() {
		var fx = randrange(1, 100) > 50 ? -randrange(1, 100) / 100 : randrange(1, 100) / 100;
		var fy = randrange(1, 100) > 50 ? -randrange(1, 100) / 100 : randrange(1, 100) / 100;
		var force = planck.Vec2(fx, fy).mul(100 * forceStrength * deltaTime * PixelsPerMeter);
		// Force wake event
		if (this.bulletMode) this.body.setBullet(true);
		this.body.applyLinearImpulse(force, this.body.getWorldCenter(), true);
	}
	mouseover() {
		//this.textlabel.text = 'x:'+this.container.x.toFixed(2)+" y:"+this.container.y.toFixed(2);
		this.textlabel.text = "m:"+Math.round(this.body.m_mass);
		this.label.alpha = 1;
	}
	mouseout() {
		this.label.alpha = 0;
	}
	integrate(alpha) {
		// Interpolate or snap?
		this.container.x = this.interpolation ? (this.body.getPosition().x * alpha) * PixelsPerMeter + (this.previousState.position.x * (1 - alpha)) * PixelsPerMeter : this.body.getPosition().x * PixelsPerMeter;
		this.container.y = this.interpolation ? (this.body.getPosition().y * alpha) * PixelsPerMeter + (this.previousState.position.y * (1 - alpha)) * PixelsPerMeter : this.body.getPosition().y * PixelsPerMeter;
		this.container.rotation = this.interpolation ? this.body.getAngle() * alpha + this.previousState.angle * (1 - alpha) : this.body.getAngle();	// we don't convert rotations

		// If something is off the screen, we should get rid of it.
		var p = this.body.getWorldCenter();
		if ((p.x > this.renderer.screen.width * MetersPerPixel || p.x < 0) || (p.y > this.renderer.screen.height * MetersPerPixel || p.y < 0))
			this.dirty = true;
		else this.dirty = false;

		// Debug lines -- Yeah, these are not very fast, but useful for a testbed.
		this.debug.clear();
		if (this.drawLines) {
			this.debug.x = this.container.x;
			this.debug.y = this.container.y;
			this.debug.rotation = this.interpolation ? this.body.getAngle() * alpha + this.previousState.angle * (1 - alpha) : this.body.getAngle();
			this.debug.lineStyle(1, 0x00ff2a, 1);
			if (this.shapeType != 'circle') { // width and height don't seem to be a concept to boxes in box2d, so we go by their vertices.
				for (var fixture = this.body.getFixtureList(); fixture; fixture = fixture.getNext()) {
					var shape = fixture.getShape(); // we do make an assumption that there's just one fixture; keep this in mind if you add more.
					this.debug.moveTo(shape.getVertex(0).x * PixelsPerMeter, shape.getVertex(0).y * PixelsPerMeter);
					for (var v = 1; v < shape.m_count; v++) {
						this.debug.lineTo(shape.getVertex(v).x * PixelsPerMeter, shape.getVertex(v).y * PixelsPerMeter);
					}
					this.debug.lineTo(shape.getVertex(0).x * PixelsPerMeter, shape.getVertex(0).y * PixelsPerMeter);
				}
			}
			else if (this.shapeType == 'circle') {
				var r = this.body.getFixtureList().getShape().m_radius;
				this.debug.drawCircle(0, 0, r * PixelsPerMeter);
			}
			this.debug.endFill();
		}

		//label position
		this.label.x = this.container.x;
		this.label.y = this.container.y;
	}
	update(dt) {
		// turn off bullet mode after launch
		if (this.body.isBullet()) this.bulletCounter += dt;
		if (this.bulletCounter > 1) {
			this.bulletCounter = 0;
			this.body.setBullet(false);
		}
		// Store previous state
		this.previousState.assign(this.body.getPosition(), this.body.getAngle());
	}
	destroy() {
		// box2d cleanup
		this.world.destroyBody(this.body);

		// pixi cleanup
		this.container.destroy({ children: true });
		this.debug.destroy();
		this.label.destroy();
	}
}