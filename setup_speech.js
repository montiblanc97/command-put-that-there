/*****************************************************************/
/******** SPEECH RECOGNITION SETUP YOU CAN IGNORE ****************/
/*****************************************************************/
let debouncedProcessSpeech = _.debounce(processSpeechHolder, 500);
let tweaked;

let recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.onresult = function (event) {
    // clearInterval(timer);
    // timer = setInterval(reset_speech_recognition, delay);

    // Build the interim transcript, so we can process speech faster
    let transcript = '';
    let hasFinal = false;
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal)
            hasFinal = true;
        else
            transcript += event.results[i][0].transcript;
    }

    let element = document.getElementsByClassName("speech")[0];
    element.innerHTML = transcript.toLowerCase();

    tweaked = transcript_tweak(transcript.toLowerCase()); // speech substitutions
    let processed = debouncedProcessSpeech(tweaked);

    if (processed) {
        recognition.stop();
    }
};
// Restart recognition if it has stopped
recognition.onend = function (event) {
    setTimeout(function () {
        recognition.start();
    }, 1000);
};
recognition.start();


// https://stackoverflow.com/questions/6672344/resetting-setinterval-in-a-function-scope-is-global
// In case of speech overload, reset speech recognition every 2 seconds without speech
// let delay = 2000;
// let timer = setInterval(reset_speech_recognition, delay);
//
// function reset_speech_recognition() {
//     // Reset timer
//     recognition.stop();
//     clearInterval(timer);
//     timer = setInterval(reset_speech_recognition, delay);
// }


/*****************************************************************/
/******** END OF SPEECH RECOG SETUP ******************************/
/*****************************************************************/

