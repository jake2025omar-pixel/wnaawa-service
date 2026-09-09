from pathlib import Path
from gtts import gTTS

script = Path('/home/ubuntu/wnaawa-service/wnaawa_screen_tour_script.md').read_text(encoding='utf-8')
voice_text = script.split('## English voiceover', 1)[1].split('## On-screen end card', 1)[0]
voice_text = voice_text.replace('**Style:** English (US), warm, sincere, confident documentary-commercial voice. Speak clearly, with a human and hopeful tone, never implying guaranteed rewards, guaranteed delivery, or guaranteed outcomes.\n\n', '')
voice_text = voice_text.strip()
out = '/home/ubuntu/webdev-static-assets/wnaawa-screen-tour-voiceover.mp3'
gTTS(text=voice_text, lang='en', tld='com', slow=False).save(out)
print(out)
