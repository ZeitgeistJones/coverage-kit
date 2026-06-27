export const STYLE_PRESETS: Record<string, string> = {
  'chill bro': `
Tone: casual, chill, bro energy. Like a hyped community member explaining something cool to a friend.
Use casual language naturally: "bro", "ngl", "lowkey", "actually wild", "no cap".
Sound genuinely excited, not like an AI reading a report.
Peer-to-peer energy — talking TO the viewer, not AT them.
Fast pacing, keep it moving.
  `.trim(),

  professional: `
Tone: professional, clear, and informative. Like a knowledgeable colleague presenting findings.
Use precise language. Avoid jargon where plain english works better.
Structured and credible but not stiff or corporate.
Measured enthusiasm — let the work speak for itself.
  `.trim(),

  hype: `
Tone: high energy, enthusiastic, genuinely pumped. Like someone who just discovered something amazing.
Bold claims backed by real substance. Never hollow hype.
Short punchy sentences. Exclamation points used sparingly for maximum effect.
Make the viewer feel like they're missing out if they don't watch.
  `.trim(),

  educational: `
Tone: clear, patient, and thorough. Like a great teacher breaking something complex down simply.
Use analogies and examples to explain technical concepts.
Assume the viewer is smart but not familiar with the specific topic.
Build understanding step by step. Never talk down to the audience.
  `.trim(),
}

export const DISCLAIMER_PRESETS: Record<string, string> = {
  'not financial advice': 'This is not financial advice. Always do your own research (DYOR) before making any investment decisions.',
  'not affiliated': 'This channel is not officially affiliated with any projects mentioned. This is independent community coverage.',
  'DYOR': 'Do your own research. Verify all facts against the primary sources linked in the description.',
  'verify facts': 'Both humans and AI make mistakes. Always verify information against official sources before acting on it.',
  'check official links': 'Check the video description for official links and verified contract addresses.',
}
