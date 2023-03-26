const API_TOKEN='YOUR_HUGGINGFACE_API_KEY'
const CHATGPT_API_TOKEN = 'YOUR_OPENAI_API_KEY';

// Settings for the text-to-speech functionality (the bot's voice)
var CN_TEXT_TO_SPEECH_RATE = 2; // The higher the rate, the faster the bot will speak
var CN_TEXT_TO_SPEECH_PITCH = 1; // This will alter the pitch for the bot's voice

// Indicate a locale code such as 'fr-FR', 'en-US', to use a particular language for the speech recognition functionality (when you speak into the mic)
// If you leave this blank, the system's default language will be used
var CN_WANTED_LANGUAGE_SPEECH_REC = ""; //"fr-FR";

var CN_WANTED_PERSON_TYPE = "Visually Impaired User"; //"fr-FR";

var CN_DESCRIPTION_DEFAULT_VALUE = '60';

// Indicate "locale-voice name" (the possible values are difficult to determine, you should just ignore this and use the settings menu instead)
var CN_WANTED_VOICE_NAME = "";

// ----------------------------


// -------------------
// CODE (DO NOT ALTER)
// -------------------
var CN_MESSAGE_COUNT = 0;
var CN_CURRENT_MESSAGE = null;
var CN_CURRENT_MESSAGE_SENTENCES = [];
var CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ = 0;
var CN_SPEECHREC = false;
var CN_IS_READING = false;
var CN_IS_LISTENING = false;
var CN_FINISHED = false;
var CN_PAUSED = false;
var CN_WANTED_VOICE = null;
var CN_TIMEOUT_KEEP_SYNTHESIS_WORKING = null;
var CN_TIMEOUT_KEEP_SPEECHREC_WORKING = null;
var CN_SPEECH_REC_SUPPORTED = false;
var CN_SPEAKING_DISABLED = false;
var CN_SPEECHREC_DISABLED = false;

// This function will say the given text out loud using the browser's speech synthesis API
function CN_SayOutLoud(text) {
	// Let's speak out loud
	console.log("Saying out loud: "+text);
	var msg = new SpeechSynthesisUtterance();
	msg.text = text;
	
	if (CN_WANTED_VOICE) msg.voice = CN_WANTED_VOICE;
	msg.rate = CN_TEXT_TO_SPEECH_RATE;
	msg.pitch = CN_TEXT_TO_SPEECH_PITCH;
	msg.onstart = () => {
		// Make border green
		$("#TTGPTSettings").css("border-bottom", "8px solid green");
		
		if (CN_FINISHED) return;
		CN_IS_READING = true;
		clearTimeout(CN_TIMEOUT_KEEP_SYNTHESIS_WORKING);
		CN_TIMEOUT_KEEP_SYNTHESIS_WORKING = setTimeout(CN_KeepSpeechSynthesisActive, 5000);
	};
	msg.onend = () => {
		CN_AfterSpeakOutLoudFinished();
	}
	CN_IS_READING = true;
	window.speechSynthesis.speak(msg);
}

// Occurs when speaking out loud is finished
function CN_AfterSpeakOutLoudFinished() {
	// Make border grey again
	$("#TTGPTSettings").css("border", "2px solid #888");
	
	if (CN_FINISHED) return;
	
	// Finished speaking
	clearTimeout(CN_TIMEOUT_KEEP_SYNTHESIS_WORKING);
	console.log("Finished speaking out loud");
	
	// restart listening
	CN_IS_READING = false;
}

// This is a workaround for Chrome's bug in the speech synthesis API (https://stackoverflow.com/questions/21947730/chrome-speech-synthesis-with-longer-texts)
function CN_KeepSpeechSynthesisActive() {
	console.log("Keeping speech synthesis active...");
	window.speechSynthesis.pause();
	window.speechSynthesis.resume();
	CN_TIMEOUT_KEEP_SYNTHESIS_WORKING = setTimeout(CN_KeepSpeechSynthesisActive, 5000);
}

// Split the text into sentences so the speech synthesis can start speaking as soon as possible
function CN_SplitIntoSentences(text) {
	var sentences = [];
	var currentSentence = "";
	
	for(var i=0; i<text.length; i++) {
		//
		var currentChar = text[i];
		
		// Add character to current sentence
		currentSentence += currentChar;
		
		// is the current character a delimiter? if so, add current part to array and clear
		if (
			// Latin punctuation
		       currentChar == ',' 
			|| currentChar == ':' 
			|| currentChar == '.' 
			|| currentChar == '!' 
			|| currentChar == '?' 
			|| currentChar == ';'
			|| currentChar == '…'
			// Chinese/japanese punctuation
			|| currentChar == '、' 
			|| currentChar == '，'
			|| currentChar == '。'
			|| currentChar == '．'
			|| currentChar == '！'
			|| currentChar == '？'
			|| currentChar == '；'
			|| currentChar == '：'
			) {
			if (currentSentence.trim() != "") sentences.push(currentSentence.trim());
			currentSentence = "";
		}
	}
	
	return sentences;
}

// Check for new messages the bot has sent. If a new message is found, it will be read out loud
function CN_CheckNewMessages() {
	// Any new messages?
	var currentMessageCount = jQuery(".text-base").length;
	if (currentMessageCount > CN_MESSAGE_COUNT) {
		// New message!
		CN_MESSAGE_COUNT = currentMessageCount;
		CN_CURRENT_MESSAGE = jQuery(".text-base:last");
		CN_CURRENT_MESSAGE_SENTENCES = []; // Reset list of parts already spoken
		CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ = 0;
	}
	
	// Split current message into parts
	if (CN_CURRENT_MESSAGE && CN_CURRENT_MESSAGE.length) {
		var currentText = CN_CURRENT_MESSAGE.text()+"";
		var newSentences = CN_SplitIntoSentences(currentText);
		if (newSentences != null && newSentences.length != CN_CURRENT_MESSAGE_SENTENCES.length) {
			// There is a new part of a sentence!
			var nextRead = CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ;
			for (i = nextRead; i < newSentences.length; i++) {
				CN_CURRENT_MESSAGE_SENTENCES_NEXT_READ = i+1;

				var lastPart = newSentences[i];
				CN_SayOutLoud(lastPart);
			}
			CN_CURRENT_MESSAGE_SENTENCES = newSentences;
		}
	}
	
	setTimeout(CN_CheckNewMessages, 100);
}

// Toggle button clicks: settings, pause, skip...
function CN_ToggleButtonClick() {
	var action = $(this).data("cn");
	switch(action) {
	
		// Open settings menu
		case "settings":
			CN_OnSettingsIconClick();
			return;
		
		// The bot's voice is on. Turn it off
		case "speakon":
			// Show other icon and hide this one
			$(this).css("display", "none");
			$(".CNToggle[data-cn=speakoff]").css("display", "");
			CN_SPEAKING_DISABLED = true;
			
			// Stop current message (equivalent to 'skip')
			window.speechSynthesis.pause(); // Pause, and then...
			window.speechSynthesis.cancel(); // Cancel everything
			CN_CURRENT_MESSAGE = null; // Remove current message
			return;
		
		// The bot's voice is off. Turn it on
		case "speakoff":
			// Show other icon and hide this one
			$(this).css("display", "none");
			$(".CNToggle[data-cn=speakon]").css("display", "");
			CN_SPEAKING_DISABLED = false;
			
			return;
		
		// Skip current message being read
		case "skip":
			window.speechSynthesis.pause(); // Pause, and then...
			window.speechSynthesis.cancel(); // Cancel everything
			CN_CURRENT_MESSAGE = null; // Remove current message
			
			// Restart listening maybe?
			CN_AfterSpeakOutLoudFinished();
			return;
	}
}

// Start Talk-to-GPT (Start button)
function CN_StartTTGPT() {
	CN_FINISHED = false;
	CN_SPEECHREC_DISABLED = true;
	CN_SPEECHREC = true;
	CN_IS_LISTENING = true;
	
	// Hide start button, show action buttons
	jQuery(".CNActionButtons").show();
}

// Perform initialization after jQuery is loaded
function CN_InitScript() {
	if (typeof $ === null || typeof $ === undefined) $ = jQuery;
	
	var warning = "";
	if ('webkitSpeechRecognition' in window) {
		console.log("Speech recognition API supported");
		CN_SPEECH_REC_SUPPORTED = true;
	} else {
		console.log("speech recognition API not supported.");
		CN_SPEECH_REC_SUPPORTED = false;
		warning = "\n\nWARNING: speech recognition (speech-to-text) is only available in Google Chrome desktop version at the moment. If you are using another browser, you will not be able to dictate text, but you can still listen to the bot's responses.";
	}
	
	// Restore settings
	CN_RestoreSettings();
	
	// Wait on voices to be loaded before fetching list
	window.speechSynthesis.onvoiceschanged = function () {
		if (!CN_WANTED_VOICE_NAME){
			console.log("Reading with default browser voice");
		} else {
			speechSynthesis.getVoices().forEach(function (voice) {
				if (voice.lang + "-" + voice.name == CN_WANTED_VOICE_NAME) {
					CN_WANTED_VOICE = voice;
					console.log("I will read using voice " + voice.name + " (" + voice.lang + ")");
					return false;
				}
			});
			if (!CN_WANTED_VOICE)
				console.log("No voice found for '" + CN_WANTED_VOICE_NAME + "', reading with default browser voice");
		}
		
		// Voice OK
		setTimeout(function() {
			CN_SayOutLoud("OK");
		}, 1000);
	};
	
	// Add icons on the top right corner
	jQuery("body").append("<span style='position: fixed; top: 8px; right: 16px; display: inline-block; " +
		"background: #888; color: white; padding: 8px; font-size: 16px; border-radius: 4px; text-align: center;" +
		"font-weight: bold; z-index: 1111;' id='TTGPTSettings'>The visionary voices<br />" +
		"<span style='font-size: 20px; display:none;' class='CNActionButtons'>" +
		"<span class='CNToggle' title='Text-to-speech (bot voice) enabled. Click to disable. This will skip the current message entirely.' data-cn='speakon'>🔊 </span>  " + // Speak out loud
		"<span class='CNToggle' title='Text-to-speech (bot voice) disabled. Click to enable' style='display:none;' data-cn='speakoff'>🔇 </span>  " + // Mute
		"<span class='CNToggle' title='Skip the message currently being read by the bot.' data-cn='skip'>⏩ </span>  " + // Skip
		"<span class='CNToggle' title='Open settings menu to change bot voice, language, and other settings' data-cn='settings'>⚙️</span> " + // Settings
		"</span></span>");
	
	setTimeout(function () {
		// Try and get voices
		speechSynthesis.getVoices();

		// Make icons clickable
		jQuery(".CNToggle").css("cursor", "pointer");
		jQuery(".CNToggle").on("click", CN_ToggleButtonClick);
		CN_StartTTGPT();
	}, 100);
}

// Open settings menu
function CN_OnSettingsIconClick() {
	console.log("Opening settings menu");
	
	// Stop listening
	CN_PAUSED = true;
	
	// Prepare settings row
	var rows = "";
	  
	// 1. Bot's voice
	var voices = "";
	var n = 0;
	speechSynthesis.getVoices().forEach(function (voice) {
		var label = `${voice.name} (${voice.lang})`;
		if (voice.default) label += ' — DEFAULT';
		var SEL = (CN_WANTED_VOICE && CN_WANTED_VOICE.lang == voice.lang && CN_WANTED_VOICE.name == voice.name) ? "selected=selected": "";
		voices += "<option value='"+n+"' "+SEL+">"+label+"</option>";
		n++;
	});

	var personType = "";
	for(var i in PERSON_TYPE_ARRAYS) {
		var personTypeValue = PERSON_TYPE_ARRAYS[i];
		var SEL = personTypeValue == CN_WANTED_PERSON_TYPE ? "selected='selected'": "";
		personType += "<option value='" + personTypeValue + "' "+ SEL + ">" + personTypeValue + "</option>";
	} 

	rows += "<tr><td>Type of persona:</td><td><select id='TTGPTPerson' style='width: 300px; color: black'>" + personType + "</select></td></tr>";

	rows += "<tr><td>AI voice and language:</td><td><select id='TTGPTVoice' style='width: 300px; color: black'>"+voices+"</select></td></tr>";
	
	// 2. AI talking speed
	rows += "<tr><td>AI talking speed (speech rate):</td><td><input type=number step='.1' id='TTGPTRate' style='color: black; width: 100px;' value='"+CN_TEXT_TO_SPEECH_RATE+"' /></td></tr>";
	
	// 3. AI voice pitch
	rows += "<tr><td>AI voice pitch:</td><td><input type=number step='.1' id='TTGPTPitch' style='width: 100px; color: black;' value='"+CN_TEXT_TO_SPEECH_PITCH+"' /></td></tr>";
	
	// 4. Speech recognition language CN_WANTED_LANGUAGE_SPEECH_REC
	var languages = "<option value=''></option>";
	for(var i in CN_SPEECHREC_LANGS) {
		var languageName = CN_SPEECHREC_LANGS[i][0];
		for(var j in CN_SPEECHREC_LANGS[i]) {
			if (j == 0) continue;
			var languageCode = CN_SPEECHREC_LANGS[i][j][0];
			var SEL = languageCode == CN_WANTED_LANGUAGE_SPEECH_REC ? "selected='selected'": "";
			languages += "<option value='"+languageCode+"' "+SEL+">"+languageName+" - "+languageCode+"</option>";
		}
	}
	rows += "<tr><td>Speech recognition language:</td><td><select id='TTGPTRecLang' style='width: 300px; color: black;' >"+languages+"</select></td></tr>";
	
	var descLength = "";
	for(var i in DESCRIPTION_LENGTH_ARRAY) {
		var descValue = DESCRIPTION_LENGTH_ARRAY[i];
		var SEL = descValue == CN_DESCRIPTION_DEFAULT_VALUE ? "selected='selected'": "";
		descLength += "<option value='" + descValue + "' "+ SEL + ">" + descValue + "</option>";
	} 

	rows += "<tr><td>Description word count:</td><td><select id='TTGPTDescription' style='width: 300px; color: black'>" + descLength + "</select></td></tr>";

	// Prepare save/close buttons
	var closeRow = "<tr><td colspan=2 style='text-align: center'><br /><button id='TTGPTSave' style='font-weight: bold;'>✓ Save</button>&nbsp;<button id='TTGPTCancel' style='margin-left: 20px;'>✗ Cancel</button></td></tr>";
	
	// Prepare settings table
	var table = "<table cellpadding=6 cellspacing=0 style='margin: 30px;'>"+rows+closeRow+"</table>";
	
	// A short text at the beginning
	var desc = "<div style='margin: 8px;'>Please note: some the voices and speech recognition languages do not appear to work. If the one you select doesn't work, try reloading the page. " +
		"If it still doesn't work after reloading the page, please try selecting another voice or language. " +
		"Also, sometimes the text-to-speech API takes time to kick in, give it a few seconds to hear the bot speak." +
		"</div>";
	
	// Open a whole screenful of settings
	jQuery("body").append("<div style='background: rgba(0,0,0,0.7); position: absolute; top: 0; right: 0; left: 0; bottom: 0; z-index: 999999; padding: 20px; color: white; font-size: 14px;' id='TTGPTSettingsArea'><h1>⚙️ Visionary Voice settings</h1>"+desc+table+"</div>");
	
	// Assign events
	setTimeout(function() {
		jQuery("#TTGPTSave").on("click", CN_SaveSettings);
		jQuery("#TTGPTCancel").on("click", CN_CloseSettingsDialog);
	}, 100);
}

// Save settings and close dialog box
function CN_SaveSettings() {
	
	// Save settings
	try {
		// AI voice settings: voice/language, rate, pitch
		var wantedVoiceIndex = jQuery("#TTGPTVoice").val();
		var allVoices = speechSynthesis.getVoices();
		CN_WANTED_VOICE = allVoices[wantedVoiceIndex];
		CN_WANTED_VOICE_NAME = CN_WANTED_VOICE.lang+"-"+CN_WANTED_VOICE.name;
		CN_TEXT_TO_SPEECH_RATE = Number( jQuery("#TTGPTRate").val() );
		CN_TEXT_TO_SPEECH_PITCH = Number( jQuery("#TTGPTPitch").val() );
		
		// Speech recognition settings: language, stop, pause
		CN_WANTED_LANGUAGE_SPEECH_REC = jQuery("#TTGPTRecLang").val();
		CN_DESCRIPTION_DEFAULT_VALUE = jQuery("#TTGPTDescription").val();
		CN_WANTED_PERSON_TYPE = jQuery("#TTGPTPerson").val();

		// Apply language to speech recognition instance
		if (CN_SPEECHREC) CN_SPEECHREC.lang = CN_WANTED_LANGUAGE_SPEECH_REC;
		
		// Save settings in cookie
		var settings = [
			CN_WANTED_VOICE_NAME,
			CN_TEXT_TO_SPEECH_RATE,
			CN_TEXT_TO_SPEECH_PITCH,
			CN_WANTED_LANGUAGE_SPEECH_REC,
			CN_DESCRIPTION_DEFAULT_VALUE,
			CN_WANTED_PERSON_TYPE
		];
		CN_SetCookie("CN_TTGPT", JSON.stringify(settings));

	} catch(e) { alert('Invalid settings values'); return; }
	
	// Close dialog
	console.log("Closing settings dialog");
	jQuery("#TTGPTSettingsArea").remove();
	
	// Resume listening
	CN_PAUSED = false;
}

// Restore settings from cookie
function CN_RestoreSettings() {
	var settingsRaw = CN_GetCookie("CN_TTGPT");
	try {
		var settings = JSON.parse(settingsRaw);
		if (typeof settings == "object" && settings != null) {
			console.log("Reloading settings from cookie: "+settings);
			CN_WANTED_VOICE_NAME = settings[0];
			CN_TEXT_TO_SPEECH_RATE = settings[1];
			CN_TEXT_TO_SPEECH_PITCH = settings[2];
			CN_WANTED_LANGUAGE_SPEECH_REC = settings[3];
			CN_DESCRIPTION_DEFAULT_VALUE = settings[4];
			CN_WANTED_PERSON_TYPE = settings[5];
		}
	} catch (ex) {
		console.error(ex);
	}
}

// Close dialog: remove area altogether
function CN_CloseSettingsDialog() {
	console.log("Closing settings dialog");
	jQuery("#TTGPTSettingsArea").remove();
	
	// Resume listening
	CN_PAUSED = false;
}

// Sets a cookie
function CN_SetCookie(name, value) {
	var days = 365;
	var date = new Date();
	date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
	var expires = "; expires=" + date.toGMTString();
	document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

// Reads a cookie
function CN_GetCookie(name) {
	var nameEQ = encodeURIComponent(name) + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) === ' ')
			c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0)
			return decodeURIComponent(c.substring(nameEQ.length, c.length));
	}
	return null;
}

// MAIN ENTRY POINT
// Load jQuery, then run initialization function
(function () {
	
	setTimeout(function() {
		typeof jQuery == "undefined" ?
			alert("[Visionary Voice] Sorry, but jQuery was not able to load. The script cannot run. Try using Google Chrome on Windows 11") :
			CN_InitScript();
	}, 500);
	
})();

var PERSON_TYPE_ARRAYS = ['General User', 'Visually Impaired User', 'Child User', 'Autistic User'];
var DESCRIPTION_LENGTH_ARRAY = ['40', '60', '80'];

// List of languages for speech recognition - Pulled from https://www.google.com/intl/en/chrome/demos/speech.html
var CN_SPEECHREC_LANGS =
[['Afrikaans',       ['af-ZA']],
 ['አማርኛ',           	 ['am-ET']],
 ['Azərbaycanca',    ['az-AZ']],
 ['বাংলা',            	 ['bn-BD', 'বাংলাদেশ'],
                     ['bn-IN', 'ভারত']],
 ['Bahasa Indonesia',['id-ID']],
 ['Bahasa Melayu',   ['ms-MY']],
 ['Català',          ['ca-ES']],
 ['Čeština',         ['cs-CZ']],
 ['Dansk',           ['da-DK']],
 ['Deutsch',         ['de-DE']],
 ['English',         ['en-AU', 'Australia'],
                     ['en-CA', 'Canada'],
                     ['en-IN', 'India'],
                     ['en-KE', 'Kenya'],
                     ['en-TZ', 'Tanzania'],
                     ['en-GH', 'Ghana'],
                     ['en-NZ', 'New Zealand'],
                     ['en-NG', 'Nigeria'],
                     ['en-ZA', 'South Africa'],
                     ['en-PH', 'Philippines'],
                     ['en-GB', 'United Kingdom'],
                     ['en-US', 'United States']],
 ['Español',         ['es-AR', 'Argentina'],
                     ['es-BO', 'Bolivia'],
                     ['es-CL', 'Chile'],
                     ['es-CO', 'Colombia'],
                     ['es-CR', 'Costa Rica'],
                     ['es-EC', 'Ecuador'],
                     ['es-SV', 'El Salvador'],
                     ['es-ES', 'España'],
                     ['es-US', 'Estados Unidos'],
                     ['es-GT', 'Guatemala'],
                     ['es-HN', 'Honduras'],
                     ['es-MX', 'México'],
                     ['es-NI', 'Nicaragua'],
                     ['es-PA', 'Panamá'],
                     ['es-PY', 'Paraguay'],
                     ['es-PE', 'Perú'],
                     ['es-PR', 'Puerto Rico'],
                     ['es-DO', 'República Dominicana'],
                     ['es-UY', 'Uruguay'],
                     ['es-VE', 'Venezuela']],
 ['Euskara',         ['eu-ES']],
 ['Filipino',        ['fil-PH']],
 ['Français',        ['fr-FR']],
 ['Basa Jawa',       ['jv-ID']],
 ['Galego',          ['gl-ES']],
 ['ગુજરાતી',           	 ['gu-IN']],
 ['Hrvatski',        ['hr-HR']],
 ['IsiZulu',         ['zu-ZA']],
 ['Íslenska',        ['is-IS']],
 ['Italiano',        ['it-IT', 'Italia'],
                     ['it-CH', 'Svizzera']],
 ['ಕನ್ನಡ',              ['kn-IN']],
 ['ភាសាខ្មែរ',            ['km-KH']],
 ['Latviešu',        ['lv-LV']],
 ['Lietuvių',        ['lt-LT']],
 ['മലയാളം',           ['ml-IN']],
 ['मराठी',               ['mr-IN']],
 ['Magyar',          ['hu-HU']],
 ['ລາວ',              ['lo-LA']],
 ['Nederlands',      ['nl-NL']],
 ['नेपाली भाषा',        	 ['ne-NP']],
 ['Norsk bokmål',    ['nb-NO']],
 ['Polski',          ['pl-PL']],
 ['Português',       ['pt-BR', 'Brasil'],
                     ['pt-PT', 'Portugal']],
 ['Română',          ['ro-RO']],
 ['සිංහල',          	 ['si-LK']],
 ['Slovenščina',     ['sl-SI']],
 ['Basa Sunda',      ['su-ID']],
 ['Slovenčina',      ['sk-SK']],
 ['Suomi',           ['fi-FI']],
 ['Svenska',         ['sv-SE']],
 ['Kiswahili',       ['sw-TZ', 'Tanzania'],
                     ['sw-KE', 'Kenya']],
 ['ქართული',         ['ka-GE']],
 ['Հայերեն',         ['hy-AM']],
 ['தமிழ்',              ['ta-IN', 'இந்தியா'],
                     ['ta-SG', 'சிங்கப்பூர்'],
                     ['ta-LK', 'இலங்கை'],
                     ['ta-MY', 'மலேசியா']],
 ['తెలుగు',             ['te-IN']],
 ['Tiếng Việt',      ['vi-VN']],
 ['Türkçe',          ['tr-TR']],
 ['اُردُو',            ['ur-PK', 'پاکستان'],
                     ['ur-IN', 'بھارت']],
 ['Ελληνικά',        ['el-GR']],
 ['български',       ['bg-BG']],
 ['Pусский',         ['ru-RU']],
 ['Српски',          ['sr-RS']],
 ['Українська',      ['uk-UA']],
 ['한국어',            ['ko-KR']],
 ['中文',             ['cmn-Hans-CN', '普通话 (中国大陆)'],
                     ['cmn-Hans-HK', '普通话 (香港)'],
                     ['cmn-Hant-TW', '中文 (台灣)'],
                     ['yue-Hant-HK', '粵語 (香港)']],
 ['日本語',           ['ja-JP']],
 ['हिन्दी',               ['hi-IN']],
 ['ภาษาไทย',         	 ['th-TH']]];


const API_ENDPOINT = 'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning';
const IMAGE_SIZE = 224;
const TOPK_PREDICTIONS = 10;

class BackgroundProcessing {
  constructor() {
    this.imageRequests = {};
    this.addListeners();
  }
  addListeners() {
	document.addEventListener("DOMContentLoaded", () => {
		const images = document.getElementsByTagName("img");
		for (let i = 0; i < images.length; i++) {
		  images[i].addEventListener("click", (event) => {
			CN_InitScript();
			const urls = [];
			CN_SayOutLoud("Hello");
			urls.push(event.target.src);
			if (urls.length > 0) {
			  for (var j = 0; j < urls.length; j++) {
				console.log("URL Info: " + urls[j]);
				this.imageRequests[urls[j]] = urls[j];
				this.analyzeImage(urls[j]).then(caption => {
				  CN_SayOutLoud(caption);
				});
			  }
			}
		  });
		}	  
		// add event listeners or other logic here
	  });
  }

  async analyzeImage(src) {
	// console.log("start: analyzeImage");
    var meta = this.imageRequests[src];
	console.log("Meta: " + meta);
	var caption;
    if (meta) {
        const img = await this.loadImage(src);
        if (img) {
          caption = await this.generateCaption(img);
        }
    }

	// console.log("end: analyzeImage");
	return caption;
  }

  async generateCaption(imgElement) {
    console.log('Generating caption...');
    const imgData = await this.getBase64Image(imgElement);
    const imgBase64 = imgData;
    const requestBody =imgBase64
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}` // replace with your Hugging Face API token
      },
      body: JSON.stringify({ image: requestBody })
    });
    const result = await response.json();
    const caption = result[0].generated_text; // get the top caption
    const cpat= JSON.stringify(caption)
    console.log(`Caption of the image is "${cpat}"`);
	var settingsRaw = CN_GetCookie("CN_TTGPT");
	try {
		var settings = JSON.parse(settingsRaw);
		console.log("settingsRaw: " + settings);
		if (typeof settings == "object" && settings != null) {
			console.log("Reloading settings from cookie: "+settings);
			CN_WANTED_VOICE_NAME = settings[0];
			CN_TEXT_TO_SPEECH_RATE = settings[1];
			CN_TEXT_TO_SPEECH_PITCH = settings[2];
			CN_WANTED_LANGUAGE_SPEECH_REC = settings[3];
			CN_DESCRIPTION_DEFAULT_VALUE = settings[4];
			CN_WANTED_PERSON_TYPE = settings[5];
		}
	} catch (ex) {
		console.error(ex);
	}
    var userTypePrompt = await this.getPromptForChatGpt(CN_WANTED_PERSON_TYPE);
    var wordLimit = 80;
    const message = {
      'model': 'gpt-3.5-turbo',
      'messages': [{'role': 'user', 'content': `This is the caption of the image '${caption}''. '${userTypePrompt}'. Please keep the response limit in '${CN_DESCRIPTION_DEFAULT_VALUE}' words. Do not provide any leading text.`}],
      'temperature': 0.7,
    };
    // Call ChatGPT API after Hugging Face API
    const chatGptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHATGPT_API_TOKEN}`
      },
      body: JSON.stringify(message)
    });
    const chatGptResult = await chatGptResponse.json();
    console.log(chatGptResult.choices[0].message.content)
    return chatGptResult.choices[0].message.content;
  }

  async loadImage(src) {
	console.log("start: loadImage");
    return new Promise(resolve => {
      var img = document.createElement('img');
      img.crossOrigin = "anonymous";
      img.onerror = function(e) {
        resolve(null);
      };
      img.onload = function(e) {
        if ((img.height && img.height > 128) || (img.width && img.width > 128)) {
          // Set image size for API!
          img.width = 224;
          img.height = 224;
          resolve(img);
        }
        // Let's skip all tiny images
        resolve(null);
      }
      img.src = src;
    });
  }

  async getBase64Image(imgElement) {
    var canvas = document.createElement("canvas");
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(imgElement, 0, 0);
    var dataURL = canvas.toDataURL("image/png");
    return dataURL.replace(/^data:image\/?[A-z]*;base64,/, '');
  }

  async getPromptForChatGpt(usrType){
    var prompt = "";
    if(usrType === PERSON_TYPE_ARRAYS[0]){
      prompt = "visual discription of the captioned image for and recommend suitable Bollywood music to fit or improve their mood sometimes just tell a joke related to given image caption."
    }
    else if (usrType === PERSON_TYPE_ARRAYS[1]){
      prompt = "Provide a visual description of the captioned image for a blind user. For additional description Always use motivational and positive words"
    }
    else if ( usrType === PERSON_TYPE_ARRAYS[2]){
      prompt = "Provide child-friendly content in description, such as simpler description of visual content.";
    }
    else if ( usrType === PERSON_TYPE_ARRAYS[3]){
      prompt = "Provide visual description of images to cater to the needs of users with Autism-spectrum disorders, such as simple and consistent description, clear instructions, and sensory-friendly content.";
    }
    return prompt;
  }
}
var bg = new BackgroundProcessing();