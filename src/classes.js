import { getLocalStorage, setLocalStorage, sleep, twoBoxesCollide } from "./util";

export class Sprite {
    constructor({
        initialCoordinates,
        facingDirection,
        spriteImgUrl,
        ctx,
        canvas,
        characterId,
        worldConfig,
        attackPower = 0,
        spriteConfig = {}
    }) {
        this.characterId = characterId.toString();
        this.spriteImgUrl = spriteConfig.spriteImgUrl || 'https://cave-2c.s3.ap-southeast-1.amazonaws.com/example-sprite.png';
        this.spriteImgDOM = null;
        this.initialX = initialCoordinates.x;
        this.initialY = initialCoordinates.y;
        this.initialFacing = facingDirection
        this.keyPresses = {};
        this.SCALE = (spriteConfig.SCALE || 0.5);
        this.WIDTH = (spriteConfig.SPRITE_WIDTH || 18) * (spriteConfig.SIZE_MULTIPLE || 8);
        this.HEIGHT = (spriteConfig.SPRITE_HEIGHT || 18) * (spriteConfig.SIZE_MULTIPLE || 8);
        this.SCALED_WIDTH = this.SCALE * this.WIDTH;
        this.SCALED_HEIGHT = this.SCALE * this.HEIGHT;
        this.FACING_DOWN = spriteConfig.FACING_DOWN || 0;
        this.FACING_UP = spriteConfig.FACING_UP || 1;
        this.FACING_LEFT = spriteConfig.FACING_LEFT || 2;
        this.FACING_RIGHT = spriteConfig.FACING_RIGHT || 3;
        this.FACING_IDLE = spriteConfig.FACING_IDLE || 6;
        this.FACING_ATTACK_LEFT = spriteConfig.ATTACK_LEFT || 5;
        this.FACING_ATTACK_RIGHT = spriteConfig.ATTACK_RIGHT || 4;
        this.FRAME_LIMIT = 12;
        this.MOVEMENT_SPEED = spriteConfig.MOVEMENT_SPEED || 5;
        this.positionX = this.initialX;
        this.positionY = this.initialY;

        this.ctx = ctx;
        this.canvas = canvas;

        // external understanding
        this.worldConfig = worldConfig;

        // life
        this.currentHealthPoint = 1000;
        this.maxHealthPoint = 1000;
        this.isDead = false;

        // animation
        this.CYCLE_LOOP = spriteConfig.CYCLE_LOOP || [0, 1, 4, 1, 4];
        this.currentActionUpdateCount = 0;
        this.currentActionMaxUpdateCount = 0;

        // For walking
        this.targetWalkCoordinates = null;
        this.walkCycleLoop = this.CYCLE_LOOP;
        this.currentWalkLoopIndex = 0;
        this.currentWalkFrameCount = 0;

        // For chasing
        this.characterToChase = null;

        // for attacking
        this.attackPower = attackPower;
        this.isAttacking = false
        this.attackDirection = ''

        // Conversation
        this.isThinkingConversation = false
        this.currentSpoken = null
        this.conversation_memory = []
    }

    // memory
    async memorizeBasicInfo() {
        const info = {
            positionX: this.positionX,
            positionY: this.positionY,
            currentHealthPoint: this.currentHealthPoint
        };
        console.log('memorize basic info now ...', `${this.characterId}-basic-info`, JSON.stringify(info));
        await setLocalStorage(`${this.characterId}-basic-info`, JSON.stringify(info))
    }

    // utils
    drawFrame(img, frameX, frameY, canvasX, canvasY) {
        try {
            // ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(img,
                frameX * this.WIDTH, frameY * this.HEIGHT, this.WIDTH, this.HEIGHT,
                canvasX * window.devicePixelRatio, canvasY * window.devicePixelRatio, this.SCALED_WIDTH * window.devicePixelRatio, this.SCALED_HEIGHT * window.devicePixelRatio);
        } catch (error) {
            console.log(error)
        }
    }

    moveCharacter(deltaX, deltaY) {
        if (window.isHori) {
            console.log('hori moving ...', this.positionX, deltaX, this.positionX + deltaX > 0, this.positionX + this.SCALED_WIDTH + deltaX < this.canvas.width);
        }
        if (this.positionX + deltaX > 0 && this.positionX + this.SCALED_WIDTH + deltaX < this.canvas.width) {
            this.positionX += deltaX;
        }
        if (this.positionY + deltaY > 0 && this.positionY + this.SCALED_HEIGHT + deltaY < this.canvas.height) {
            this.positionY += deltaY;
        }
    }

    // actions
    async arriveWorld() {
        return new Promise(async (rs, rj) => {
            // const port = browser.runtime.connect({ name: 'digimon-proxy' })
            // load stored data
            let info = null;
            const basicInfoKey = `${this.characterId}-basic-info`;
            const infoStr = await getLocalStorage(basicInfoKey);

            if (infoStr) {
                try {
                    info = JSON.parse(infoStr);
                    this.initialX = info.positionX;
                    this.initialY = info.positionY;
                    this.positionX = this.initialX;
                    this.positionY = this.initialY;
                    if (info.currentHealthPoint) {
                        this.currentHealthPoint = info.currentHealthPoint;
                    }
                    if (this.currentHealthPoint === 0) {
                        console.log('reborn');
                        this.reborn();
                    }
                    console.log('used last location');
                } catch (error) {
                    console.log(error);
                }
            }


            let img = new Image();
            img.src = this.spriteImgUrl;
            this.spriteImgDOM = img;
            img.onload = () => {
                this.ctx.mozImageSmoothingEnabled = false;
                this.ctx.webkitImageSmoothingEnabled = false;
                this.ctx.msImageSmoothingEnabled = false;
                this.ctx.imageSmoothingEnabled = false;
                this.drawFrame(img, this.CYCLE_LOOP[0], this.FACING_LEFT, this.initialX, this.initialY);
                // basic listeners
                const humanMessageListener = (msg) => {
                    if (msg.data && msg.data.message_type === 'human_shout_to_metaworld') {
                        this.hear({
                            content: msg.data.content
                        })
                    }
                }
                window.addEventListener('message', humanMessageListener);

                const keyDownListener = (event) => {
                    this.keyPresses[event.key] = true;
                    // if (this.keyPresses.a) {
                    //     this.attack({
                    //         direction: 'left'
                    //     })
                    // }
                }
                window.addEventListener('keydown', keyDownListener);

                const keyUpListener = (event) => {
                    this.keyPresses[event.key] = false;
                    // if (this.isAttacking && !this.keyPresses.a) {
                    //     this.rest()
                    // }
                }
                window.addEventListener('keyup', keyUpListener);
                console.log(`[${this.characterId}] arrived world`, this);
                rs(this);
            };
        });
    }

    checkIfAttacked({
        charactersInTheScene
    }) {
        Object.entries(charactersInTheScene).map(([characterId, character]) => {
            if (characterId !== this.characterId) {
                if (twoBoxesCollide(character, this) && character.isAttacking) {
                    console.log(`[${character.characterId}] attacked [${this.characterId}]`)
                    this.takeHit({
                        attackPower: character.attackPower
                    });
                    this.memorizeBasicInfo();
                    console.log(`[${character.characterId}] health: ${character.currentHealthPoint} | [${this.characterId.toString()}] health: ${this.currentHealthPoint}`)
                }
            }
        });
    }

    updateAllActions({
        charactersInTheScene
    }) {
        // life
        if (this.isDead) {
            this.updateFrame()
            this.drawFrame(this.spriteImgDOM, this.currentWalkLoopIndex, this.FACING_UP, this.positionX, this.positionY);
            return;
        }

        // conversation
        if (this.isThinkingConversation) {
            this.ctx.font = '30px arial';
            this.ctx.fillText('...', this.positionX * window.devicePixelRatio, this.positionY * window.devicePixelRatio - 20);
        } else {
            if (this.currentSpoken) {
                this.ctx.font = '30px arial';
                this.ctx.fillText(this.currentSpoken.content, this.positionX * window.devicePixelRatio, this.positionY * window.devicePixelRatio - 20);
            }
        }

        // check if attacked
        this.checkIfAttacked({
            charactersInTheScene
        })

        // chase
        if (this.characterToChase) {
            const targetCharacter = this.characterToChase.charactersInTheScene[this.characterToChase.characterId];
            console.log('target position: ', targetCharacter.positionX, targetCharacter.positionY, ' | ', this.positionX, this.positionY);
            if (!this.characterToChase.currentPosition) {
                this.characterToChase.currentPosition = {
                    x: targetCharacter.positionX,
                    y: targetCharacter.positionY
                }
            } else {
                if (
                    (this.characterToChase.currentPosition.x !== targetCharacter.positionX)
                    ||
                    (this.characterToChase.currentPosition.y !== targetCharacter.positionY)
                ) {
                    this.characterToChase.currentPosition = {
                        x: targetCharacter.positionX,
                        y: targetCharacter.positionY
                    }
                }
            }
            this.characterToChase.observationCount += 1;
            if (this.characterToChase.observationCount > 30) {
                this.characterToChase.observationCount = 0;
            }
            // perfect chase down
            if (this.characterToChase.purpose === 'reach') {
                if ((targetCharacter.positionX === this.positionX) && (targetCharacter.positionY === this.positionY)) {
                    this.characterToChase = null;
                }
            }
            if (this.characterToChase.purpose === 'kill') {
                if (targetCharacter.currentHealthPoint === 0) {
                    if (this.characterToChase.onReachCallback) {
                        this.characterToChase.onReachCallback();
                    }
                    this.characterToChase = null;
                }
            }

            if (twoBoxesCollide(this, targetCharacter)) {
                console.log('enter attack area');
                this.attack({
                    direction: 'right'
                })
            } else {
                // throttling
                if (this.characterToChase.observationCount >= 0) {
                    this.goToCoordinates({
                        destinationCoordinates: this.characterToChase.currentPosition
                    })
                }
            }
        }

        // walk
        if (this.targetWalkCoordinates) {
            let axis = '';
            let walkDir = 0;
            let movement = 0;

            // vertical first
            let remainingY = this.targetWalkCoordinates.y - this.positionY;

            if (remainingY) {
                let yDirection = remainingY > 0 ? 1 : -1;
                let yMovement = yDirection * ((Math.abs(remainingY) > this.MOVEMENT_SPEED) ? this.MOVEMENT_SPEED : Math.abs(remainingY));
                axis = 'y';
                movement = yMovement;
                walkDir = remainingY > 0 ? this.FACING_DOWN : this.FACING_UP
            }

            // horizontal next
            let remainingX = this.targetWalkCoordinates.x - this.positionX;

            if (!remainingY && remainingX) {
                let xDirection = remainingX > 0 ? 1 : -1;
                let xMovement = xDirection * ((Math.abs(remainingX) > this.MOVEMENT_SPEED) ? this.MOVEMENT_SPEED : Math.abs(remainingX));
                axis = 'x';
                movement = xMovement;
                walkDir = remainingX > 0 ? this.FACING_RIGHT : this.FACING_LEFT
            }

            if (axis && movement) {
                this.currentActionUpdateCount++;
                if (axis === 'x') {
                    this.moveCharacter(movement, 0);
                }
                if (axis === 'y') {
                    this.moveCharacter(0, movement);
                }
                this.updateFrame()
                this.drawFrame(this.spriteImgDOM, this.currentWalkLoopIndex, walkDir, this.positionX, this.positionY);
            } else {
                // finished walking
                this.seriesCallback({
                    targetWalkCoordinates: this.targetWalkCoordinates
                })
                this.targetWalkCoordinates = null;
            }

            if (this.targetWalkCoordinates && (this.currentActionUpdateCount > this.currentActionMaxUpdateCount)) {
                this.targetWalkCoordinates = null;
                this.seriesCallback(null, {
                    message: 'timeout'
                })
            }
        } else if (this.isAttacking) {
            let attackDir = this.FACING_ATTACK_RIGHT;
            if (this.attackDirection === 'left') {
                attackDir = this.FACING_ATTACK_LEFT;
            }
            this.updateFrame()
            this.drawFrame(this.spriteImgDOM, this.currentWalkLoopIndex, attackDir, this.positionX, this.positionY);
        } else {
            // idle
            this.updateFrame()
            this.drawFrame(this.spriteImgDOM, this.currentWalkLoopIndex, this.FACING_IDLE, this.positionX, this.positionY);
        }
    }

    updateFrame() {
        this.currentWalkFrameCount++;
        if (this.currentWalkFrameCount >= this.FRAME_LIMIT) {
            this.currentWalkFrameCount = 0;
            this.currentWalkLoopIndex++;
            if (this.currentWalkLoopIndex >= this.walkCycleLoop.length) {
                this.currentWalkLoopIndex = 0;
            }
        }
    }

    async chaseAnotherCharacter({
        characterId,
        charactersInTheScene,
        purpose = 'kill',
        onReachCallback
    }) {
        this.characterToChase = {
            observationCount: 0, // for throttling
            characterId,
            charactersInTheScene,
            purpose,
            onReachCallback
        }
    }

    async goToCoordinates({
        destinationCoordinates
    }) {
        if (this.isDead) {
            return new Promise((rs, rj) => {
                rs(this);
            });
        }
        console.log('start walking to: ', destinationCoordinates)
        return new Promise((rs, rj) => {
            let remainingY = Math.abs(destinationCoordinates.y - this.positionY);
            let remainingX = Math.abs(destinationCoordinates.x - this.positionX);
            this.currentActionMaxUpdateCount = (Math.ceil(remainingX / this.MOVEMENT_SPEED) + Math.ceil(remainingY / this.MOVEMENT_SPEED));
            this.isAttacking = false;
            this.currentActionUpdateCount = 0;
            this.targetWalkCoordinates = destinationCoordinates;
            this.seriesCallback = (d, err) => {
                this.currentActionUpdateCount = 0;
                this.currentActionMaxUpdateCount = 0;
                if (err) {
                    console.log('error finished walking: ', d);
                    rj(err)
                    this.seriesCallback = null;
                    this.memorizeBasicInfo();
                } else {
                    console.log('success finished walking: ', d);
                    rs(d)
                    this.seriesCallback = null;
                    this.memorizeBasicInfo();
                }
            }
        })
    }

    attack({
        direction
    }) {
        if (!this.isDead && (this.attackPower > 0)) {
            this.isAttacking = true;
            this.attackDirection = direction;
        }
    }

    reborn() {
        this.currentHealthPoint = this.maxHealthPoint;
        this.isDead = false;
    }

    die() {
        this.isDead = true;
        console.log(`[${this.characterId}] died`);
        this.isAttacking = false;
        this.isThinkingConversation = false;
        this.targetWalkCoordinates = false;
        if (this.seriesCallback) {
            // immediately execute callback
            this.seriesCallback(null, {
                message: 'character_died'
            });
            this.seriesCallback = null;
        }
    }

    takeHit({
        attackPower
    }) {
        if (this.currentHealthPoint >= attackPower) {
            this.currentHealthPoint -= attackPower;
        }
        if (this.currentHealthPoint < attackPower) {
            this.currentHealthPoint = 0;
        }
        if (this.currentHealthPoint === 0) {
            this.die()
        }
    }

    rest() {
        this.isAttacking = false;
        this.targetWalkCoordinates = null;
    }

    async speak({
        content,
        waitAfterSpeak = 500
    }) {
        this.isThinkingConversation = true
        await sleep(1000);
        this.currentSpoken = {
            content
        }
        this.isThinkingConversation = false
        await sleep(waitAfterSpeak);
    }

    async hear({
        content
    }) {
        this.conversation_memory.push({
            content,
            heard_at: new Date().toISOString(),
            heard_at_unix: new Date().getTime()
        });
        console.log(`[${this.characterId}] heard this:`, content);
        console.log(this.conversation_memory);
    }

    recall() {
        console.log(this.conversation_memory)
    }
}

export class SpellBullet extends Sprite {
    constructor({
        initialCoordinates,
        facingDirection,
        spriteImgUrl,
        ctx,
        canvas,
        characterId,
        worldConfig,
        attackPower = 0,
        spriteConfig = {}
    }) {
        super({
            initialCoordinates,
            facingDirection,
            spriteImgUrl,
            ctx,
            canvas,
            characterId,
            worldConfig,
            attackPower,
            spriteConfig
        })
    }
}

export class Character extends Sprite {
    constructor({
        initialCoordinates,
        facingDirection,
        spriteImgUrl,
        ctx,
        canvas,
        characterId,
        worldConfig,
        attackPower = 0,
        spriteConfig = {}
    }) {
        super({
            initialCoordinates,
            facingDirection,
            spriteImgUrl,
            ctx,
            canvas,
            characterId,
            worldConfig,
            attackPower,
            spriteConfig
        })
    }

    async throwSpellToCharacter({
        characterId,
        charactersInTheScene
    }) {
        let charId = new Date().getTime();
        let spellBullet = new SpellBullet({
            initialCoordinates: {
                x: this.positionX,
                y: this.positionY
              },
              facingDirection: 'right',
              ctx: this.ctx,
              canvas: this.canvas,
              characterId: charId,
              worldConfig: this.worldConfig,
              attackPower: 1000,
              spriteConfig: {
                MOVEMENT_SPEED: 20,
                SPRITE_WIDTH: 64,
                SPRITE_HEIGHT: 64,
                spriteImgUrl: 'https://cave-2c.s3.ap-southeast-1.amazonaws.com/fireball_0.png',
                SCALE: 1,
                SIZE_MULTIPLE: 1,
                FACING_DOWN: 6,
                FACING_UP: 2,
                FACING_LEFT: 1,
                FACING_RIGHT: 4,
                FACING_IDLE: 4,
                ATTACK_LEFT: 0,
                ATTACK_RIGHT: 4,
                CYCLE_LOOP: [0, 1, 2, 3, 4]
              }
        });
        await spellBullet.arriveWorld();
        spellBullet.chaseAnotherCharacter({
            characterId: characterId,
            charactersInTheScene,
            onReachCallback: () => {
                delete charactersInTheScene[charId]
            }
        });
        charactersInTheScene[charId] = spellBullet;
    }
}