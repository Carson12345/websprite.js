# websprite.js
Easily embed a programmable sprite to your website

demo: https://www.cy2.tech/



```<!DOCTYPE html>
<html style="height: 100%; width: 100%;">
    <head>
        <title>Test</title>
    </head>
    <body style="height: 100%; width: 100%;">
        <h1>I am a test website</h1>
        <script src="https://unpkg.com/websprite.js@latest/dist/index.js"></script>
        <script>
            window.WebSpriteInit({
                rememberLastPosition: false
            }, async (inst) => {
                await inst.goToCoordinates({
                    destinationCoordinates: {
                        x: 200,
                        y: 200
                    }
                })
            });
        </script>
    </body>
</html>
