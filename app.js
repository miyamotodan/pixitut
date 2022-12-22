console.log("app.js");

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
const TextStyle= PIXI.TextStyle;
const Text = PIXI.Text;
const TilingSprite = PIXI.TilingSprite;

let app = new Application({ width: 640, height: 360, transparent: true, antialias: true });
document.body.appendChild(app.view);

const resize = () => { app.renderer.resize(window.innerWidth, window.innerHeight) }

app.renderer.background.color = 0xdddddd;
app.renderer.view.style.position = 'absolute';

// Listen for window resize events
window.addEventListener("resize", resize);
resize();

let starSprite;
let rocketSprite;
let container;

//sprite animato creato con https://www.codeandweb.com/free-sprite-sheet-packer
//(json hash)
Assets.load('assets/animated.json').then( jj => {

    const spritesheet = new Spritesheet(
        BaseTexture.from("assets/"+jj.data.meta.image),
        jj.data
    );
    
    // Generate all the Textures asynchronously
    spritesheet.parse().then( () => {
        // spritesheet is ready to use!
        const anim = new AnimatedSprite(spritesheet.animations.enemy);
        anim.position.set(250,400);
        app.stage.addChild(anim);
        anim.play();
        anim.animationSpeed = 0.1;
    });
    
    
});

Assets.load('assets/clouds.png').then( texture => {
    let cloudSprite = new TilingSprite(texture,app.screen.width, app.screen.height);
    cloudSprite.tileScale.set(0.5,0.5);
    app.ticker.add((delta) => {
        cloudSprite.tilePosition.x += 1;
    })
    app.stage.addChild(cloudSprite);
});

Assets.load('assets/spritesheet.png').then( texture => {
    //Create texture rectangle object that defines the position and
    //size of the sub-image you want to extract from the texture
    //(`Rectangle` is an alias for `PIXI.Rectangle`)
    let rocketTexture = texture.clone();
    let starTexture = texture.clone();
    
    const rocket_frm = new Rectangle(25, 25, 120, 150);

    //Tell the texture to use that rectangular section
    rocketTexture.frame = rocket_frm;

    //Create the sprite from the texture
    rocketSprite = new Sprite(rocketTexture);

    const star_frm = new Rectangle(350,350, 120, 150);
    starTexture.frame = star_frm;
    starSprite = new Sprite(starTexture);

    //Position the rocket sprite on the canvas
    rocketSprite.x = 100;
    rocketSprite.y = 100;

    starSprite.x = 400;
    starSprite.y = 400;
    starSprite.scale.set(1.0,1.0);
    
    container = new Container();

    container.addChild(rocketSprite);
    container.addChild(starSprite);

    app.stage.addChild(container);
    
    setup();

    app.ticker.add(delta => loop(delta))

})
    
const explImages = [
    'assets/Explosion/explosion00.png',
    'assets/Explosion/explosion01.png',
    'assets/Explosion/explosion02.png',
    'assets/Explosion/explosion03.png',
    'assets/Explosion/explosion04.png',
    'assets/Explosion/explosion05.png',
    'assets/Explosion/explosion06.png',
    'assets/Explosion/explosion07.png',
    'assets/Explosion/explosion08.png',
];
const expTextureArray = [];

for (let i = 0; i < 9; i++)
{
    const texture = Texture.from(explImages[i]);
    expTextureArray.push(texture);
}
const expAnimatedSprite = new AnimatedSprite(expTextureArray);

const loop= (delta) => {

    starSprite.anchor.set(0.5,0.5);
    starSprite.rotation += 0.01;

    rocketSprite.anchor.set(0.5,0.5);
    rocketSprite.rotation += Math.random()*0.05*(Math.random()*4-2);

}

const setup = () => {

    document.addEventListener("keydown", (e) => {
        switch (e.key) {
            case "ArrowRight":
                container.x += 5;
                break;
            case "ArrowLeft":
                container.x -= 5;
                break;
            case "ArrowUp":
                container.y -= 5;
                break;
            case "ArrowDown":
                container.y += 5;
                break;
            default:
                break;
        }
    })

    let pc = new ParticleContainer(1000, {
        positon: true,  //can change positions of objects
        rotation: true, //can rotate of objects
        vertices: true, //can scale objects
        tint:true,      //sprite alpha and tint
        uvs:true,       //uvs mesh
    });


    //crea un rettangolo
    const rec = new Graphics();
    rec.beginFill(0xee1111);
    rec.lineStyle(4, 0x0000);
    rec.drawRect(200,200,100,100);
    rec.endFill();
    app.stage.addChild(rec);

    //scrive un testo stile fatto con https://pixijs.io/pixi-text-style/
    const style = new TextStyle({
        align: "center",
        dropShadow: true,
        fill: "#e11919",
        fontFamily: "Tahoma",
        fontStyle: "italic",
        fontVariant: "small-caps",
        fontWeight: "bold",
        stroke: "#161313",
        strokeThickness: 1
    });
    const text = new Text('Hello World', style);
    text.x = 300; text.y=300;
    app.stage.addChild(text);

    starSprite.interactive=true;
    starSprite.cursor = 'pointer';
    starSprite.on('pointerdown', () => {
        starSprite.scale.x += 0.1;
        starSprite.scale.y += 0.1;
        console.log(starSprite.scale.x,starSprite.scale.y)
        if (starSprite.scale.x > 2) {
            expAnimatedSprite.scale.set(0.7,0.7);
            expAnimatedSprite.anchor.set(0.5,0.5);
            expAnimatedSprite.x = starSprite.getGlobalPosition().x ;
            expAnimatedSprite.y = starSprite.getGlobalPosition().y;
            app.stage.addChild(expAnimatedSprite);
            expAnimatedSprite.play();
            expAnimatedSprite.loop = false;
            expAnimatedSprite.animationSpeed = 0.3;
            expAnimatedSprite.onComplete = () => {
                container.removeChild(starSprite);
                app.stage.removeChild(expAnimatedSprite);
            };
        }

    })

    var bf = new PIXI.filters.BlurFilter();
    starSprite.filters=[bf];

    const sound = new Howl({
        src : ['./assets/mixkit-mystwrious-bass-pulse-2298.wav']
    }) 
    sound.play();

    

    

}
