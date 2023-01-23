export const getSpeechToText = ({
    maxThreshold = 3000, // miliseconds
    onTextRecognized = () => {}
}) => {
    return new Promise((rs,rj) => {
        if ("webkitSpeechRecognition" in window) {
            let recognizedText = '';
            let speechRecognition = new webkitSpeechRecognition();
            let final_transcript = "";
    
            speechRecognition.continuous = true;
            speechRecognition.interimResults = true;
            speechRecognition.lang = 'en-US'
            // speechRecognition.lang = 'zh-HK'
    
            speechRecognition.onstart = () => {
                console.log('start recognizing ...');
            };
            speechRecognition.onerror = () => {
                console.log("Speech Recognition Error");
            };
            speechRecognition.onend = () => {
                console.log("Speech Recognition Ended");
            };
    
            speechRecognition.onresult = (event) => {
                let interim_transcript = "";
    
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final_transcript += event.results[i][0].transcript;
                    } else {
                        interim_transcript += event.results[i][0].transcript;
                    }
                }
                recognizedText = final_transcript;
                onTextRecognized(interim_transcript);
            };
            speechRecognition.start();
            setTimeout(() => {
                if (!recognizedText) {
                    speechRecognition.stop();
                    rj('nothing_heard');
                } else {
                    console.log('result: ', final_transcript);
                    speechRecognition.stop();
                    rs(final_transcript);
                }
            }, maxThreshold);
        } else {
            console.log("Speech Recognition Not Available");
            rj('speech_recognition_not_available');
        }
    })
}