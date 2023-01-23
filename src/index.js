import { Character } from "./classes";
import { getSpeechToText } from "./speech-to-text";
import { sleep, twoBoxesCollide } from "./util";

window.WebSpriteInit = async (config, callback) => {

  // init construct
  const parElement = document.querySelector("body");
  const elem = document.createElement("div");
  const existingCanvas = document.querySelectorAll('.websprite-canvas-class');
  const cid = `websprite-${existingCanvas.length}`;
  const targetWidth = window.innerWidth;
  const targetHeight = window.innerHeight;
  elem.innerHTML = `<canvas id="${cid}" class="websprite-canvas-class" style="position: fixed; bottom: 0px; right: 0px; z-index: 10013; pointer-events: none;" id="websprite-canvas" width="${targetWidth * window.devicePixelRatio}" height="${targetHeight * window.devicePixelRatio}"></canvas>`
  parElement.appendChild(elem);

  const charactersInTheScene = {};

  function registerCharacter(characterInstance) {
    charactersInTheScene[characterInstance.characterId] = characterInstance;
  }

  let canvas = document.getElementById(cid);
  canvas.style.width = `${targetWidth}px`;
  canvas.style.height = `${targetHeight}px`;
  let ctx = canvas.getContext('2d');

  const webspriteInstance = new Character({
    initialCoordinates: {
      x: 0,
      y: 0
    },
    facingDirection: 'down',
    spriteImgUrl: 'https://cave-2c.s3.ap-southeast-1.amazonaws.com/example-sprite.png',
    ctx,
    canvas,
    characterId: 1,
    attackPower: 6,
    worldConfig: {
      total_width: targetWidth,
      total_height: targetHeight
    },
    // custom character appearance
    spriteConfig: {
      spriteImgUrl: 'https://cave-2c.s3.ap-southeast-1.amazonaws.com/fighting-sprite-1.png',
      SCALE: 0.35,
      SIZE_MULTIPLE: 16,
      FACING_DOWN: 10,
      FACING_UP: 8,
      FACING_LEFT: 9,
      FACING_RIGHT: 11,
      FACING_IDLE: 14,
      ATTACK_LEFT: 5,
      ATTACK_RIGHT: 7,
      CYCLE_LOOP: [0, 1, 2, 3, 4],
      rememberLastPosition: config.rememberLastPosition
    }
  });

  await webspriteInstance.arriveWorld();
  registerCharacter(webspriteInstance);

  document.querySelector('body').addEventListener('click', (event) => {
    let x = event.clientX;
    let y = event.clientY;
    Object.values(charactersInTheScene).forEach((c => {
      const clickArea = {
        positionX: x,
        positionY: y,
        WIDTH: 100,
        HEIGHT: 100
      };
      if (twoBoxesCollide(c, clickArea) && !([1,2].includes(c.characterId))) {
        console.log(`character [${c.characterId}] clicked: `, c);
      }
    }))
  });

  function animate() {
    window.requestAnimationFrame(animate)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Object.values(charactersInTheScene).forEach( c => {
      c.updateAllActions({
        charactersInTheScene
      })
    });
  }

  animate();
  callback(webspriteInstance);
}