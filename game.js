const GAME_CONFIG = {
  type: Phaser.AUTO,

  width: 288,
  height: 144,

  backgroundColor: 0x272727,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.ScaleModes.FIT,
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
  },
  parent: document.getElementById("game-container"),

  physics: {
    default: "arcade",
    arcade: {
      // debug: true,
      gravity: {
        y: 30
      }
    },
  },

  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const GAME = new Phaser.Game(GAME_CONFIG);

function preload() {
  this.load.atlas("atlas", "./atlas.png", "./atlas.json");
}

function create() {
  // create textures for the spritesheets
  this.__spriteTextures = {
    character: this.textures.addSpriteSheetFromAtlas("character", {
      atlas: "atlas",
      frame: "character",
      frameWidth: 24,
      frameHeight: 24,
    }),
    door: this.textures.addSpriteSheetFromAtlas("door", {
      atlas: "atlas",
      frame: "door",
      frameWidth: 18,
      frameHeight: 36,
    }),
    grass: this.textures.addSpriteSheetFromAtlas("grass", {
      atlas: "atlas",
      frame: "grass",
      frameWidth: 18,
      frameHeight: 18,
    }),
  };

  // ********** Controls setup ********
  this.ctrl_keyboard = this.input.keyboard.addKeys( "W,A,D,SPACE,LEFT,RIGHT" );
  this.ctrl_cheats = this.input.keyboard.addKeys( "O" );

  // ********* Background Layer ********
  this.img_background = this.add.image(
    this.game.config.width / 2,
    this.game.config.height / 2,
    "atlas",
    "background"
  );

  // ********* Ground Layer ********
  // add ground layer group
  this.grp_ground = this.physics.add.staticGroup();

  // corner tile
  this.grp_ground.create(9, this.game.config.height - 9, "grass", 0);
  // consecutive mid tiles
  this.grp_ground.createFromConfig({
    key: "grass",
    frame: 1,
    quantity: 12,
    setXY: {
      x: 27,
      y: this.game.config.height - 9,
      stepX: 18,
    },
  });
  // last end tiles
  this.grp_ground.createFromConfig({
    key: "atlas",
    frame: "ground",
    quantity: 3,
    setXY: {
      x: this.game.config.width - 9,
      y: this.game.config.height - 9,
      stepX: -18,
    },
  });
  // upper level tiles
  this.grp_ground.createFromConfig({
    key: "grass",
    frame: 1,
    quantity: 3,
    setXY: {
      x: 9,
      y: 81,
      stepX: 18,
    },
  });
  // end tile for upper level
  this.grp_ground.create(63, 81, "grass", 2);

  // ********* Spikes Layer ********
  this.grp_spikes = this.physics.add.staticGroup();

  let spikes_1 = this.physics.add.staticImage(171, 117, "atlas", "spikes");
  spikes_1.setSize( 18, 9 ).setOffset( 0, 9 );

  this.grp_spikes.add(spikes_1);

  // ********* Inner Cave Layer ********
  // using a tilesprite for repeating cave wall
  this.ts_caveWalls = this.add.tileSprite( 261, 108, 54, 36, "atlas", "dirt" );
  this.ts_caveWalls.setTint( 0xbcbcbc );

  // ************ CLiff Walls ************
  this.ts_cliffWalls = this.add.tileSprite( 261, 45, 54, 90, "atlas", "dirt" )
  // add collider for cliff
  let cliffArea = this.add.rectangle( 261, 45, 54, 90 );
  this.physics.world.enableBody( cliffArea, 1 );
  // add collider to a cliff group
  this.grp_cliff = this.physics.add.staticGroup();
  this.grp_cliff.add( cliffArea );


  // *************** Add Key ****************
  this.obj_key = this.physics.add.image( 18, 9, "atlas", "key" );
  this.obj_key.setSize( 18, 12 );
  this.obj_key.setBounce( 0.6 );
  this.obj_key.setCollideWorldBounds();
  // add collision with ground
  this.physics.add.collider( this.grp_ground, this.obj_key );

  // ************ Add Door ****************
  this.obj_door = this.physics.add.staticSprite( 243, 108, "door", 0 );
  this.obj_door.setSize( 8, 36);
  this.obj_door.state = "locked"; // locked state;

  // ************ Add Crate ****************
  this.obj_crate = this.physics.add.image( 130, 108, "atlas", "crate" );
  this.obj_crate.body.setDragX( 300 );
  this.obj_crate.setCollideWorldBounds();
  // add collision with ground and spikes
  this.physics.add.collider( this.obj_crate, this.grp_ground );
  this.physics.add.collider( this.obj_crate, this.grp_spikes );

  // ************* Add Diamond ************
  this.obj_diamond = this.physics.add.staticImage( 270, 117, "atlas", "diamond" );
  // add collisions with ground
  this.physics.add.collider( this.obj_diamond, this.grp_ground );


  // ************** Setup Player **********
  // this.add.image( this.game.config.width / 2, 20, "atlas", "return" );
  this.obj_player = this.physics.add.sprite(30, 108, "character", 0);
  this.obj_player.setCollideWorldBounds()
  this.obj_player.setGravityY(50).setSize(16, 20).setOffset(4, 4);
  this.obj_player.setData( "has_key", false );
  // setup player collisions
  this.physics.add.collider(this.obj_player, this.grp_ground);
  this.physics.add.collider(this.obj_player, this.grp_cliff);
  this.physics.add.collider(this.obj_player, this.grp_spikes, die, undefined, this);
  this.physics.add.collider(this.obj_player, this.obj_crate);
  this.physics.add.collider(this.obj_player, this.obj_door, openDoor, undefined, this);
  this.physics.add.collider(this.obj_player, this.obj_key, collectKey, undefined, this);
  this.physics.add.collider(this.obj_player, this.obj_diamond, collectDiamond, undefined, this);

  // ********* Animations ********************
  this.anims.create({
    key: "walk",
    frames: this.anims.generateFrameNumbers( "character" ),
    frameRate: 8,
    repeat: -1
  })

  // ************** Reset Button *************
  this.btn_reset = this.add.image( this.game.config.width / 2, 20, "atlas", "reset" );
  this.btn_reset.setInteractive();
  this.btn_reset.on(
    "pointerdown",
    reset,
    this
  );

  return;
}

function update() {
  playerController.call(this);
  checkCheats.call(this);
}

function playerController(){
  let motion = {
    left: false,
    right: false,
    jump: false
  }

  if( this.ctrl_keyboard["A"].isDown || this.ctrl_keyboard["LEFT"].isDown ){
    motion.left = true;
  }
  if( this.ctrl_keyboard["D"].isDown || this.ctrl_keyboard["RIGHT"].isDown ){
    motion.right = true;
  }
  if( this.ctrl_keyboard["W"].isDown || this.ctrl_keyboard["SPACE"].isDown ){
    motion.jump = true;
  }

  // if no motion input return;
  if( !motion.left && !motion.right && !motion.jump ){
    this.obj_player.setVelocityX( 0 );
    this.obj_player.stop();
    return;
  }

  let playerSpeed = 30;
  let jumpHeight = 80;

  if( 
    (motion.left && motion.right) ||
    ( !motion.left && !motion.right )
  ){
    this.obj_player.setVelocityX( 0 );
    this.obj_player.stop();
    this.obj_player.setFrame( 0 );
  } else if ( motion.left ){
    this.obj_player.setVelocityX( -playerSpeed );
    this.obj_player.play( "walk", true );
    this.obj_player.setFlipX( false );
  } else if ( motion.right ){
    this.obj_player.setVelocityX( playerSpeed );
    this.obj_player.play( "walk", true );
    this.obj_player.setFlipX( true );
  }

  if( motion.jump && this.obj_player.body.onFloor()  ){
    this.obj_player.setVelocityY( -jumpHeight );
  }

  return;
}

function checkCheats(){
  if( this.ctrl_cheats["O"].isDown ){
    if( this.obj_door.state == "locked" ){
      this.obj_door.setFrame( 1 );
      this.obj_door.disableBody()
    }
  }
}

function collectKey( player, key ){
  key.disableBody( true, true );
  player.setData( "has_key", true );
  return;
}

function openDoor( player, door ){
  if( player.getData("has_key") === true ){
    door.setFrame( 1 );
    door.disableBody();
    door.setState( "open" );
  }

  return;
}

function die(){
  reset.call( this );
  return;
}

function collectDiamond( player, diamond ){
  diamond.disableBody( true, true );
}

function reset(){
  // reset player
  this.obj_player.setPosition( 30, 108 );
  this.obj_player.setVelocity( 0 );
  this.obj_player.setData( "has_key", false );

  // reset crate
  this.obj_crate.setPosition( 130, 108 );

  // reset key
  this.obj_key.enableBody( true, 18, 9, true, true );

  // reset door
  this.obj_door.setFrame( 0 );
  this.obj_door.setState( "locked" );
  this.obj_door.enableBody();

  // reset diamond
  this.obj_diamond.enableBody( false, undefined, undefined, true, true );

  return;
}