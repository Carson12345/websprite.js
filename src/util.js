export const isProduction = () => !window.location.host.includes('localhost');
export const sleep = async (time) => {
    await new Promise((rs) => {
        setInterval(() => {
            rs();
        }, time)
    });
}

export const getLocalStorage = async (key) => {
    return window.localStorage.getItem(key);
}

export const setLocalStorage = async (key, value) => {
    window.localStorage.setItem(key, value);
}

export const twoBoxesCollide = (box1, box2) => {
    return (
        box1.positionX + box1.WIDTH >=
          box2.positionX &&
        box1.positionX <=
          box2.positionX + box2.WIDTH &&
        box1.positionY + box1.HEIGHT >=
          box2.positionY &&
        box1.positionY <= box2.positionY + box2.HEIGHT
    )
}