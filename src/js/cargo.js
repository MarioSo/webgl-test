import { find } from './utils/elements'
import { addListener } from './utils/events'

const Cargo = () => {

  const img = find('.js-cargo-logo')[0]
  // console.log(img)
  //
  //
  // var renderer = PIXI.autoDetectRenderer(img.clientWidth, img.clientHeight, {
  //   transparent: true
  // })
  //
  // document.body.appendChild(renderer.view);
  //
  // var stage = new PIXI.Container();
  //
  // var cargoLogo = PIXI.Sprite.fromImage('./public/cargo_logo.png');
  // cargoLogo.anchor.x = 0
  // cargoLogo.anchor.y = 0
  // stage.addChild(cargoLogo)



  /// TUTORIAL!

  let mesh;
  let cloth;
  let spacingX = 5;
  let spacingY = 5;

  let opts = {
    image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/39255/face.png',
    pointsX: 50,
    pointsY: 50,

    pointCount: 50,

    brushSize: 30,

    randomImage(){
      this.image = 'https://unsplash.it/400/400?image=' + Math.floor(Math.random() * 1100);
      if ( cloth ) { cloth.randomize(loadTexture); }
      else { loadTexture(); }
    },
    reset(){
      if ( cloth ) { cloth.reset(); }
    },

    randomizePoints(){
      if ( cloth ) { cloth.randomize(); }
    }
  };

  /*////////////////////////////////////////*/

  let gui = new dat.GUI();
  gui.closed = window.innerWidth < 600;

  let image = gui.add(opts, 'image', {
    Face: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/39255/face.png',
    Logo: 'http://brokensquare.com/Code/assets/logo.svg',
    shshaw: 'http://brokensquare.com/Code/assets/head.svg',
    Lion: 'https://unsplash.it/400/400?image=1074',
    Water: 'https://unsplash.it/400/400?image=1053',
    YellowCurtain: 'https://unsplash.it/400/400?image=855',
    Tunnel: 'https://unsplash.it/400/400?image=137'
  });
  image.onChange(loadTexture);


  let pointCount = gui.add(opts, 'pointCount', 20,80).step(1);
  pointCount.onFinishChange((val)=>{
    opts.pointsX = opts.pointsY = val;
    loadTexture();
  });


  /*////////////////////////////////////////*/
  let mouse = {
    down: false,
    x: 0,
    y: 0,
    px: 0,
    py: 1
  }

  let brush = new PIXI.Graphics();
  function updateBrush(){
    brush.clear();
    brush.blendMode = PIXI.BLEND_MODES.ADD;
    brush.lineStyle(1, 0x888888, 0.4);
    brush.drawCircle(0, 0, opts.brushSize); // drawCircle(x, y, radius)
    brush.x = mouse.x;
    brush.y = mouse.y;
    brush.updateLocalBounds();
  }

  updateBrush();

  let influence = gui.add(opts, 'brushSize', 0, 100).step(1);
  influence.onChange(updateBrush);

  let random = gui.add(opts, 'randomImage');
  let randomize = gui.add(opts, 'randomizePoints');
  let reset = gui.add(opts, 'reset');

  /*////////////////////////////////////////*/

  let stage = new PIXI.Container();
  stage.interactive = true;
  stage.addChild(brush);

  // let renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, { transparent: true });
  // console.log(img.clientWidth, img.clientHeight)
  var renderer = PIXI.autoDetectRenderer(img.clientWidth, img.clientHeight, { transparent: true })

  document.body.appendChild(renderer.view);
  renderer.render(stage);


  /*////////////////////////////////////////*/

  function loadTexture() {
    console.log('loading texture', opts.image);
    document.body.className = 'loading';

    // let texture = new PIXI.Texture.fromImage(opts.image);
    let texture = new PIXI.Texture.fromImage(img.src);
    if ( !texture.requiresUpdate ) {
      texture.update();
    }

    texture.on('error', function(){ console.error('AGH!'); });

    texture.on('update',function(){
      document.body.className = '';

      console.log('texture loaded');

      if ( mesh ) {
        stage.removeChild(mesh);
      }

      mesh = new PIXI.mesh.Plane( this, opts.pointsX, opts.pointsY);
      mesh.width = this.width;
      mesh.height = this.height;

      mesh.x = renderer.width / 2 - mesh.width / 2;
      mesh.y = renderer.height / 2 - mesh.height / 2;

      spacingX = mesh.width / (opts.pointsX-1);
      spacingY = mesh.height / (opts.pointsY-1);

      cloth = new Cloth(opts.pointsX-1, opts.pointsY-1, !opts.pinCorners);

      stage.addChildAt(mesh,0);
    });
  }

  loadTexture(opts.image);

  /*////////////////////////////////////////*/

  ;(function update() {
    requestAnimationFrame(update);
    if ( cloth ) {
      cloth.update(0.016)
    }

    brush.x = renderer.plugins.interaction.mouse.global.x
    brush.y = renderer.plugins.interaction.mouse.global.y
    // brush.x = mouse.x;
    // brush.y = mouse.y;


    renderer.render(stage);
  })(0)

  /*////////////////////////////////////////*/


  const twoPi = Math.PI * 2;
  const ease = Elastic.easeOut.config(1.2, 0.4);

  class Point {
    constructor (x, y) {
      this.x = this.origX = x
      this.y = this.origY = y

      this.randomize(this.reset.bind(this));
    }

    animateTo(nx, ny, force, callback){

      if ( !this.resetting || force ) {
        let dx = nx - this.x
        let dy = ny - this.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        this.resetting = true;

        TweenMax.to(this,
          Math.min(1.25, Math.max(0.4, dist / 40) ),
          {
            x: nx,
            y: ny,
            ease: ease,
            onComplete: () => {
              this.resetting = false
              if ( callback ) { callback(); }
            }
          })
      } else if ( callback ) { callback(); }
    }

    randomize(callback) {
      let nx = this.x + ((Math.random() * 60) - 30);
      let ny = this.y + ((Math.random() * 60) - 30);

      this.animateTo(nx, ny, null, callback ? callback : null );
    }

    reset(){
      this.animateTo(this.origX, this.origY, true);
    }

    update (delta) {

      let dx;
      let dy;

      if (!this.resetting && mouse.down) {
        // dx = this.x - mouse.x + mesh.x
        // dy = this.y - mouse.y + mesh.y
        dx = Math.abs(mouse.x - this.x)
        dy = Math.abs(mouse.y - this.y)
        // console.log('->',dx )

        let dist = Math.sqrt(dx * dx + dy * dy)
        // console.log('dist', dist)

        if ( dist < opts.brushSize) {
          let a = this.x
          this.x = this.x + (( mouse.x - mouse.px) * Math.abs( Math.cos( twoPi * dx / dist)))
          this.y = this.y + (( mouse.y - mouse.py) * Math.abs( Math.cos( twoPi * dy / dist)))
          console.log(dist, this.x, a)
        }
      }
      return this
    }
  }

  /*////////////////////////////////////////*/

  let count = 0;

  class Cloth {
    constructor (clothX, clothY, free) {
      this.points = []

      let startX = 0; //renderer.view.width / 2 - clothX * spacingX / 2;
      let startY = 0//renderer.view.height * 0.1;

      for (let y = 0; y <= clothY; y++) {
        for (let x = 0; x <= clothX; x++) {
          let point = new Point(startX + x * spacingX, startY + y * spacingY)
          this.points.push(point)
        }
      }
    }

    randomize(callback){
      this.points.forEach((point,i) => {
        point.randomize( i === 0 ? callback : null );
      })
    }

    reset(){
      this.points.forEach((point) => {
        point.reset()
      })
    }

    update (delta) {
      this.points.forEach((point,i) => {
        point.update(delta * delta)

        if ( mesh ) {
          i *= 2;
          mesh.vertices[i] = point.x;
          mesh.vertices[i+1] = point.y;
        }
      });

    }
  }

  function pointerMove(e) {
    // let pointer = e.touches ? e.touches[0] : e;

    let lp = e.data.getLocalPosition(stage)
    mouse.px = mouse.x || lp.x
    mouse.py = mouse.y || lp.y
    // mouse.x = pointer.clientX
    // mouse.y = pointer.clientY

    // console.log(mouse)
    // console.log(e)
    mouse.x = lp.x
    mouse.y = lp.y
  }

  function pointerDown(e){
    mouse.down = true
    mouse.button = 1
    pointerMove(e);
  }

  function pointerUp(e){
    mouse.down = false;
    mouse.px = null;
    mouse.py = null;
  }

  stage.on('mousedown', pointerDown)
  stage.on('mousemove', pointerMove)
  stage.on('mouseup', pointerUp)

  addListener('.js-reset-mesh', 'click', () => {
    if (cloth) {
      cloth.reset()
    }
  })

  // renderer.view.addEventListener('mousedown', pointerDown);
  // renderer.view.addEventListener('mouseenter', pointerDown);
  // renderer.view.addEventListener('touchstart', pointerDown);

  // document.body.addEventListener('mousemove',pointerMove);
  // document.body.addEventListener('touchmove', pointerMove);

  // document.body.addEventListener('mouseup', pointerUp);
  // document.body.addEventListener('touchend', pointerUp);
  // document.body.addEventListener('mouseleave', pointerUp);
}

export default Cargo
