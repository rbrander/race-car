// app.js -- race car sprite demo
/*
TODO:
- collision detection (look for black near corners of car)
- change car colour randomly and specifically
- trigger random rotating car colour picker
- (using let instead const) for HALF_CANVAS_WIDTH (and height), and update on resize
*/

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const SPRITE_PATH = './sprites/';
const CAR_IMAGE_FILENAMES = [
  'blue_car.png',
  'green_car.png',
  'orange_car.png',
  'pink_car.png',
  'red_car.png',
  'white_car.png',
  'yellow_car.png'
];
const CAR_SIZE_PCT = 1; // 100% of the size it actually is

const CORNER_FRONT_LEFT = 'Front Left Corner';
const CORNER_FRONT_RIGHT = 'Front Right Corner';
const CORNER_REAR_LEFT = 'Rear Left Corner';
const CORNER_REAR_RIGHT = 'Rear Right Corner';
const CORNER_STATUS_CLEAR = 'Status: clear';
const CORNER_STATUS_WARNING = 'Status: warning';
const CORNER_STATUS_ERROR = 'Status: error';

const MAP_FILENAME = './track-maps.png';
// There are two track maps in the map file
const MAP_TRACKS = [
  // Map 1 is (100, 0) -> (1250, 1600) = 1150x1600
  {
    x: 100, // x,y location of source image to start copying
    y: 0,
    width: 1150, // width,height of source image to copy
    height: 1600,
    startX: 1300, // starting position for race car; starting line
    startY: 1580,
    zoomPct: 2.4 // 230% of original size
  },
  // Map 2 is (1300, 0) -> (2700, 1600) = 1400x1600
  {
    x: 1300, // x,y location of source image to start copying
    y: 0,
    width: 1400, // width,height of source image to copy
    height: 1600,
    startX: 1600, // starting position for race car; starting line
    startY: 400,
    zoomPct: 2 // 200% of original size
  }
];

// Keyboard Constants (event.key)
const UP_ARROW = 'ArrowUp';
const DOWN_ARROW = 'ArrowDown';
const RIGHT_ARROW = 'ArrowRight';
const LEFT_ARROW = 'ArrowLeft';

const TURNING_ANGLE_DEGS = 3.5;
const TURNING_ANGLE = Math.PI / (180 / TURNING_ANGLE_DEGS);

const state = {
  tick: {
    prev: 0,
    curr: 0,
    framesPerSecond: 0
  },
  map: {
    xOffset: 0,
    yOffset: 0,
    image: undefined,
    isLoaded: false,
    trackIdx: 0 // index of MAP_TRACKS
  },
  keys: new Set([]), // keep track of what keys are pressed, a Set is used to help avoid duplicates
  car: {
    images: [],
    imagesLoaded: false,
    x: 800,
    y: 1000,
    direction: 0,
    velocity: 10,
    corners: {
      CORNER_FRONT_LEFT: CORNER_STATUS_CLEAR,
      CORNER_FRONT_RIGHT: CORNER_STATUS_CLEAR,
      CORNER_REAR_LEFT: CORNER_STATUS_CLEAR,
      CORNER_REAR_RIGHT: CORNER_STATUS_CLEAR
    },
    selectedImage: undefined
  },
  clickCount: 0
};


const selectTrack = (trackIndex) => {
  state.map.trackIdx = trackIndex % MAP_TRACKS.length; // modding it for safety
  // reset the car position
  const currTrack = MAP_TRACKS[state.map.trackIdx];
  Object.assign(state.car, { x: currTrack.startX, y: currTrack.startY });
};

const updateTick = (time) => {
  const { tick } = state;
  // Calculate the frames per second
  tick.prev = tick.curr;
  tick.curr = time;
  const msPerFrame = time - tick.prev;
  const msPerSecond = 1000;
  tick.framesPerSecond = ~~(msPerSecond / msPerFrame);
};

const updateCar = () => {
  const { keys, car } = state;

  // forward movement
  if (keys.has(UP_ARROW)) {
    car.x += car.velocity * Math.cos(car.direction);
    car.y += car.velocity * Math.sin(car.direction);
  }

  // reverse movement
  if (keys.has(DOWN_ARROW)) {
    const reverseDrag = 0.5; // 50% of speed going forward
    const reverseVelocity = car.velocity * reverseDrag;
    const reverseDirection = car.direction + Math.PI;
    car.x += reverseVelocity * Math.cos(reverseDirection);
    car.y += reverseVelocity * Math.sin(reverseDirection);
  }

  // check rotation
  if (keys.has(LEFT_ARROW)) {
    car.direction -= TURNING_ANGLE;
  }
  if (keys.has(RIGHT_ARROW)) {
    car.direction += TURNING_ANGLE;
  }
};

const updateMap = () => {
  const { map, car } = state;
  // scroll the map so the player is in the center
  map.xOffset = car.x - (canvas.width / 2);
  map.yOffset = car.y - (canvas.height / 2);
};

const update = (time) => {
  updateTick();
  updateCar();
  updateMap();
};

const clearBackground = () => {
  ctx.fillStyle = 'brown';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const drawMap = () => {
  const { map } = state;
  if (map.isLoaded) {
    const { x, y, width, height } = MAP_TRACKS[map.trackIdx];
    const sourceX = x;
    const sourceY = y;
    const sourceWidth = width;
    const sourceHeight = height;
    const canvasX = -map.xOffset;
    const canvasY = -map.yOffset;
    const mapSizePct = MAP_TRACKS[state.map.trackIdx].zoomPct;
    const canvasWidth = sourceWidth * mapSizePct;
    const canvasHeight = sourceHeight * mapSizePct;
    // TODO: crop just the part that is on the screen
    ctx.drawImage(map.image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      canvasX, canvasY, canvasWidth, canvasHeight
    );
  }
};

const drawCar = () => {
  const { car } = state;
  if (car.imagesLoaded && car.selectedImage instanceof Image) {
    const CAR_WIDTH = ~~(car.selectedImage.width * CAR_SIZE_PCT);
    const CAR_HEIGHT = ~~(car.selectedImage.height * CAR_SIZE_PCT);
    const HALF_CAR_WIDTH = ~~(CAR_WIDTH / 2);
    const HALF_CAR_HEIGHT = ~~(CAR_HEIGHT / 2);
    const REAR_AXLE_FROM_CENTER = ~~(46 * CAR_SIZE_PCT); // 46px is relative to the original image
    const carRotateAngle = car.direction - (Math.PI / 2); // The original image is rotated +90 degrees, or Math.PI/2 radians
    const carXPos = ~~(canvas.width / 2);
    const carYPos = ~~(canvas.height / 2);
    ctx.translate(carXPos, carYPos);
    ctx.rotate(carRotateAngle);
    const carImageOffsetY = -(CAR_HEIGHT - HALF_CAR_HEIGHT - REAR_AXLE_FROM_CENTER);
    const carImageOffsetX = -HALF_CAR_WIDTH;
    ctx.drawImage(car.selectedImage, carImageOffsetX, carImageOffsetY, CAR_WIDTH, CAR_HEIGHT);
    ctx.rotate(-carRotateAngle);
    ctx.translate(-carXPos, -carYPos);
  }
};

const drawText = () => {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textBaseline = 'top';
  ctx.fillText([...state.keys].join(', '), 100, 10);
};

const draw = (time) => {
  clearBackground();
  drawMap();
  drawCar();
  drawText();
};

const loop = (time) => {
  update(time);
  draw(time);
  requestAnimationFrame(loop);
};

const loadCarImages = () => {
  const imagePromises = CAR_IMAGE_FILENAMES.map(filename =>
    new Promise(resolve => {
      const image = new Image();
      image.src = SPRITE_PATH + filename;
      image.onload = (e) => {
        resolve({ filename, image });
      };
    })
  );
  Promise.all(imagePromises)
    .then(images => {
      // all images are now loaded
      const { car } = state;
      car.images = images;
      car.imagesLoaded = true;
      if (images.length > 0) {
        car.selectedImage = images[0].image;
      }
  });
};

const updateSelectedImage = () => {
  const { car, clickCount } = state;
  // Use the click count to determine which car to show
  if (car.imagesLoaded && car.images.length > 0) {
    const imageIndex = clickCount % car.images.length;
    const image = car.images[imageIndex].image;
    car.selectedImage = image;
  }
};

const onClick = (e) => {
  const { car } = state;
  state.clickCount++;
  updateSelectedImage();
};

const onResize = (e) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

const onKeyDown = (e) => {
  state.keys = state.keys.add(e.key);
};

const onKeyUp = (e) => {
  state.keys.delete(e.key);
};

const loadMaps = () => {
  const mapImage = new Image();
  mapImage.src = MAP_FILENAME;
  mapImage.onload = () => {
    state.map.image = mapImage;
    state.map.isLoaded = true;
  };
};

const init = () => {
  console.log('race-car');
  loadCarImages();
  loadMaps();
  canvas.addEventListener('click', onClick);
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  onResize();
  selectTrack(~~(Math.random() * MAP_TRACKS.length));
  requestAnimationFrame(loop);
};

init();
