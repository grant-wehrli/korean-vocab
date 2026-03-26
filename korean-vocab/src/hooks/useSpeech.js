export function useSpeech() {
  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'ko-KR';
    window.speechSynthesis.speak(utt);
  }
  return { speak };
}
