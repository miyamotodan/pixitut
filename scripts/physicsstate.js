const Vec2 = planck.Vec2;

export class PhysicsState {
	constructor() {
		this.position = Vec2(0, 0);
		this.angle = 0;
	}
	assign(position, a) {
		this.position = Vec2.clone(position);	// avoid the reference boogie-man
		this.angle = a;
	}
}