# websprite.js
Easily embed a programmable sprite to your website

demo: [https://www.cy2.tech/](https://webspritejs.static.domains/)



```<!DOCTYPE html>
<html style="height: 100%; width: 100%;">
    <head>
        <title>Websprite Test</title>
    </head>
    <body style="height: 100%; width: 100%;">
        <h1>I am a test website</h1>
        <h2>Now this avatar lives on the web!</h2>
        <script src="https://unpkg.com/websprite.js@latest/dist/index.js"></script>
        <script>
            window.WebSpriteInit({
                rememberLastPosition: false
            }, async (inst) => {
                while (true) {
                    const randomX = Math.floor(Math.random() * window.innerWidth * 0.8);
                    const randomY = Math.floor(Math.random() * window.innerHeight * 0.8);
                    await inst.goToCoordinates({
                        destinationCoordinates: {
                            x: randomX,
                            y: randomY
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
            });
        </script>
    </body>
</html>
