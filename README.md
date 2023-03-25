# TheVisionaryVoices
# ![Image Title](M3.png)
## Problem Statement: Mental wellbeing: 
<h4>Music for the Mind</h4>
<p>Identify a user's emotional state from a picture which he/she is surfing on web, and recommend suitable music to fit and/or improve their mood.</p>

<h4>Cheer Me Up</h4>
<p>Assess a person's emotional state based on the image content he is watching. If they seem to need it, cheer them up in an appropriate manner (e.g. tell jokes, teach them something like meditation to make them feel better).</p>

<h4>Eye for Blind</h4>
<p>Provide a visual description of images for users who are visually impaired.</p>

<h4>Guide For Child</h4>
<p>Provide child-friendly content and features, such as simpler description of visual content.</p>

<h4>Companion For Autism Spectrum</h4>
<p>Provide visual description of images to cater to the needs of users with Autism-spectrum disorders, such as simple and consistent description, clear instructions, and sensory-friendly content.</p>

## Solution: AI Powered Chrome browser extension
<ul>
  <li>To enhance accessibility and foster positivity in image-based content.</li>
  <li>Configurable Extension to cater to the requirements of users with visual impairments, Autism-spectrum disorders, and children, as well as to uplift the overall mood of a user.</li>
  <li>Multi lingual and Multiple AI voice support</li>
  <li>Configurable AI Speech Speed</li>
  <li>Configurable AI Speech Pitch</li>
  <li>Vision Powered By <a href="https://huggingface.co/" target="_blank">Hugging Face</a> - <a href="https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning" target="_blank">vit-gpt2-image captioning model</a></li>
 <li>Logistic Powered By <a href="https://api.openai.com/v1/chat/completions" target="_blank">OpenAI chatgpt API for gpt-3.5-turbo model</a></li>
 <li>Speech Powered By <a href="https://developer.chrome.com/blog/web-apps-that-talk-introduction-to-the-speech-synthesis-api/" target="_blank">speech Synthesis API</a></li>
</ul>


## How to set up in local?

```sh
git clone https://github.com/KhushiSindhu/TheVisionaryVoices.git
```
Run below commands on command propmt
```sh
cd TheVisionaryVoices/
npm i
npm run build
```

- Open Google Chrome extensions page: chrome://extensions/

- Enable developer mode

- Click on [LOAD UNPACKED]

- Select TheVisionaryVoices/dist/ -folder!

- Hover over images on any web pages to see the extension working.


## Examples
![Image Title](demoimage.jpg)
<ul>
  <li><a href="https://github.com/KhushiSindhu/TheVisionaryVoices/raw/main/GeneralUser2.m4a">"Download audio to listen how the picture would be described to General User"</li><h6>You are watching a beautiful image of two people riding horses on the beach. To enhance your mood, I recommend listening to the soundtrack of the movie "Seabiscuit" by Randy Newman, which features uplifting and inspiring music. Alternatively, you could listen to "The Long Run" by The Eagles, which is a perfect fit for this scene. Here's a joke for you: Why did the horse cross the beach? To get to the neigh-sayers!u</h6>
  <li><a href="https://github.com/KhushiSindhu/TheVisionaryVoices/raw/main/VisuallyImpaired.m4a">"Download audio to listen how the picture would be described to Visually Impaired User"</li><h6>You are watching an image of two people riding horses on the beach. The horses are galloping along the shoreline with the waves crashing behind them. The riders are smiling and seem to be having a great time. The sun is shining down, and the sky is blue with a few white clouds. The beach is wide and sandy, and there are some palm trees in the background. It looks like a beautiful day to ride horses on the beach!</h6>
  <li><a href="https://github.com/KhushiSindhu/TheVisionaryVoices/raw/main/AutisticUser.m4a">"Download audio to listen how the picture would be described to Autistic User"</li><h6>You are currently looking at an image of two people riding horses on the beach. The horses have sandy hooves and the water is crystal clear blue. The riders are wearing hats and enjoying the beautiful view. You could almost feel the warm sun on your skin and the gentle breeze in your hair. I hope this description has helped you to visualize the scene. Enjoy your day!</h6>
  <li><a href="https://github.com/KhushiSindhu/TheVisionaryVoices/raw/main/child.m4a">"Download audio to listen how the picture would be described to Child User"</li><h6>You are looking at a picture of a man and a woman riding horses on the beach. The horses are running on the sand and there are waves splashing around them. It looks like they're having a really fun time! Imagine how exciting it would be to ride a horse like that! You could feel the wind in your hair and see the beautiful scenery all around you. Maybe one day you'll get to try it too! Keep exploring and having fun!</h6>
</ul>

#### Note:= The user preference can be changed from Settings menu provided by the browser extension.



