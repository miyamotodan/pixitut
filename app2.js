console.log("app2.js");

const Vec2 = planck.Vec2;
const FrictionJoint= planck.FrictionJoint;

let scale = 100;
let GroundW = 3;
let GroundH = 1;

let GroundP = Vec2(3,0);
let redBallP = Vec2(4,6);

let redBallR = 1;

planck.testbed(function (testbed) {
    
    var gravity = Vec2(0.0, -9);

    // Create a world
    var world = planck.World(gravity);
    

    // Viewbox center and size
    testbed.x = 0;
    testbed.y = 0;

    // Viewbox size
    testbed.width = 30;
    testbed.height = 20;


    var groundBodyDef = { position: GroundP, angle: -0.05 * Math.PI };
    var groundBody = world.createBody(groundBodyDef);
    var groundBox = planck.Box(GroundW, GroundH);
    groundBody.createFixture(groundBox, 0.0);


    var bodyDef = { type: 'dynamic', position: redBallP }
    var body = world.createBody(bodyDef);
    var dynamicBox = planck.Circle(Vec2(0, 0), redBallR);
    //var dynamicBox = planck.Box(redBallR, redBallR, Vec2(0, 0));
    var fixtureDef = { shape: dynamicBox, density: 1.0, friction: 0.3 };
    body.createFixture(fixtureDef);

    world.createJoint(FrictionJoint({
        collideConnected : true,
        maxForce : 4.5,
        maxTorque : 0.6
      }, groundBody, body));


    // Prepare for simulation
    var timeStep = 1.0 / 60.0;
    var velocityIterations = 6;
    var positionIterations = 2;

    /*
    for (let i = 0; i < 60; ++i) {
        world.step(timeStep, velocityIterations, positionIterations);
        let position = body.getPosition();
        let angle = body.getAngle();
        console.log("["+i+"] ("+position.x+","+position.y+") : "+ angle);
    }
    */

    // Make sure you return the world
    return world;
});

