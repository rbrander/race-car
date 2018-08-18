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
    image: undefined,
    isLoaded: false,
    track: 1,
  },
  keys: new Set([]),
  car: {
    images: [],
    imagesLoaded: false,
    x: 200,
    y: 200,
    direction: 0,
    velocity: 10,
    selectedImage: undefined
  },
  clickCount: 0
};

const update = (time) => {
  const { tick, keys, car, clickCount } = state;
  // Calculate the frames per second
  tick.prev = tick.curr;
  tick.curr = time;
  const msPerFrame = time - tick.prev;
  const msPerSecond = 1000;
  tick.framesPerSecond = ~~(msPerSecond / msPerFrame);

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

  // Use the click count to determine which car to show
  if (car.imagesLoaded && car.images.length > 0) {
    const imageIndex = clickCount % car.images.length;
    const image = car.images[imageIndex].image;
    car.selectedImage = image;
  }
};

const REAR_AXLE_FROM_CENTER = 46; // pixels
const draw = (time) => {
  const { car, map } = state;
  ctx.fillStyle = 'brown';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw map
  if (map.isLoaded) {
    const { startX, startY, width, height } = MAP_TRACKS[map.track];
    const sourceX = startX;
    const sourceY = startY;
    const sourceWidth = width;
    const sourceHeight = height;
    const canvasX = 0;
    const canvasY = 0;
    const canvasWidth = sourceWidth;
    const canvasHeight = sourceHeight;
    ctx.drawImage(map.image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      canvasX, canvasY, canvasWidth, canvasHeight
    );
  }

  // draw the car
  if (car.imagesLoaded && car.selectedImage instanceof Image) {
    const carRotateAngle = car.direction - (Math.PI / 2);
    const carPosX = car.x;
    const carPosY = car.y;
    ctx.translate(carPosX, carPosY);
    ctx.rotate(carRotateAngle);
    const halfCarWidth = ~~(car.selectedImage.width / 2);
    const halfCarHeight = ~~(car.selectedImage.height / 2);
    const carImageOffsetY = -(car.selectedImage.height - halfCarHeight - REAR_AXLE_FROM_CENTER)
    const carImageOffsetX = -halfCarWidth;
    ctx.drawImage(car.selectedImage, carImageOffsetX, carImageOffsetY);
    ctx.rotate(-carRotateAngle);
    ctx.translate(-carPosX, -carPosY);
  }

  // draw white corners
  const LINE_LENGTH = 25;
  const PADDING = 5;
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'white';

  // upper left
  ctx.beginPath()
  ctx.moveTo(PADDING, PADDING + LINE_LENGTH);
  ctx.lineTo(PADDING, PADDING);
  ctx.lineTo(PADDING + LINE_LENGTH, PADDING);
  ctx.stroke();

  // upper right
  ctx.beginPath()
  ctx.moveTo(canvas.width - PADDING - LINE_LENGTH, PADDING);
  ctx.lineTo(canvas.width - PADDING, PADDING);
  ctx.lineTo(canvas.width - PADDING, PADDING + LINE_LENGTH);
  ctx.stroke();

  // lower left
  ctx.beginPath()
  ctx.moveTo(PADDING, canvas.height - PADDING - LINE_LENGTH);
  ctx.lineTo(PADDING, canvas.height - PADDING);
  ctx.lineTo(PADDING + LINE_LENGTH, canvas.height - PADDING);
  ctx.stroke();

  // lower right
  ctx.beginPath()
  ctx.moveTo(canvas.width - PADDING - LINE_LENGTH, canvas.height - PADDING);
  ctx.lineTo(canvas.width - PADDING, canvas.height - PADDING);
  ctx.lineTo(canvas.width - PADDING, canvas.height - PADDING - LINE_LENGTH);
  ctx.stroke();


  // draw FPS
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textBaseline = 'top';
  ctx.fillText(`FPS: ${state.tick.framesPerSecond}`, 10, 10);

  // draw keys
  ctx.fillText([...state.keys].join(', '), 100, 10);
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
      state.car.images = images;
      state.car.imagesLoaded = true;
  });
};

const onClick = (e) => {
  state.clickCount++;
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
  requestAnimationFrame(loop);
};

init();
