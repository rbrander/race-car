// app.js -- race car sprite demo

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

const MAP_FILENAME = './track-maps.png';
// There are two track maps in the map file
const MAP_TRACKS = [
  // Map 1 is (100, 0) -> (1250, 1600) = 1150x1600
  {
    startX: 100,
    startY: 0,
    width: 1150,
    height: 1600
  },
  // Map 2 is (1300, 0) -> (2700, 1600) = 1400x1600
  {
    startX: 1300,
    startY: 0,
    width: 1400,
    height: 1600
  }
];
const MAP_SIZE_PCT = 1.5; // 150%

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
    track: 1,
  },
  keys: new Set([]),
  car: {
    images: [],
    imagesLoaded: false,
    x: 600,
    y: 180,
    direction: 0,
    velocity: 10,
    selectedImage: undefined
  },
  clickCount: 0
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

  // car movement
  if (keys.has(UP_ARROW)) {
    car.x += car.velocity * Math.cos(car.direction);
    car.y += car.velocity * Math.sin(car.direction);
  }

  if (keys.has(LEFT_ARROW)) {
    car.direction -= TURNING_ANGLE;
  }
  if (keys.has(RIGHT_ARROW)) {
    car.direction += TURNING_ANGLE;
  }
};

const update = (time) => {
  updateTick();
  updateCar();
};

const clearBackground = () => {
  ctx.fillStyle = 'brown';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const drawMap = () => {
  const { map } = state;
  if (map.isLoaded) {
    const { startX, startY, width, height } = MAP_TRACKS[map.track];
    const sourceX = startX;
    const sourceY = startY;
    const sourceWidth = width;
    const sourceHeight = height;
    const canvasX = map.xOffset;
    const canvasY = map.yOffset;
    const canvasWidth = sourceWidth * MAP_SIZE_PCT;
    const canvasHeight = sourceHeight * MAP_SIZE_PCT;
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
    ctx.translate(car.x, car.y);
    ctx.rotate(carRotateAngle);
    const carImageOffsetY = -(CAR_HEIGHT - HALF_CAR_HEIGHT - REAR_AXLE_FROM_CENTER);
    const carImageOffsetX = -HALF_CAR_WIDTH;
    ctx.drawImage(car.selectedImage, carImageOffsetX, carImageOffsetY, CAR_WIDTH, CAR_HEIGHT);
    ctx.rotate(-carRotateAngle);
    ctx.translate(-car.x, -car.y);
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

const changeCar = () => {
  state.clickCount++;
  updateSelectedImage();
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
  requestAnimationFrame(loop);
};

init();
