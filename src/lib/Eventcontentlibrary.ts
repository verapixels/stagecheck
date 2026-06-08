// ─────────────────────────────────────────────────────────────────────────────
// eventContentLibrary.ts
// Smart offline fallback for AI-generated event summaries & descriptions.
//
// HOW TO USE IN Onboarding.tsx:
//   import { generateLocalSummary, generateLocalDescription } from './eventContentLibrary'
//
//   Replace the generateSummary() API call with:
//     const summary = generateLocalSummary(form.eventName, selectedTypeData?.label || 'event', form.venue)
//     setForm(f => ({ ...f, summary }))
//
//   Replace the description API call with:
//     const desc = generateLocalDescription(form.eventName, selectedTypeData?.label || 'event', form.venue)
//     setForm(f => ({ ...f, description: desc + (f.description ? '\n\n' + f.description : '') }))
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────
type EventTypeKey =
  | 'choir'
  | 'talent'
  | 'conference'
  | 'competition'
  | 'drama'
  | 'worship'
  | 'openmic'
  | 'graduation'
  | 'custom'

// ─── Utility: stable hash → index pick ───────────────────────────────────────
function stableHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function pickFrom<T>(arr: T[], seed: string): T {
  return arr[stableHash(seed) % arr.length]
}

// ─── Keyword → EventTypeKey mapper ───────────────────────────────────────────
const TYPE_LABEL_MAP: Record<string, EventTypeKey> = {
  'choir concert': 'choir',
  'talent show': 'talent',
  conference: 'conference',
  'school competition': 'competition',
  'drama / theatre': 'drama',
  'worship night': 'worship',
  'open mic': 'openmic',
  'award / graduation': 'graduation',
  'custom event': 'custom',
  choir: 'choir',
  talent: 'talent',
  competition: 'competition',
  drama: 'drama',
  worship: 'worship',
  openmic: 'openmic',
  graduation: 'graduation',
  custom: 'custom',
}

function resolveType(rawLabel: string): EventTypeKey {
  const lower = rawLabel.toLowerCase()
  for (const [key, val] of Object.entries(TYPE_LABEL_MAP)) {
    if (lower.includes(key)) return val
  }
  return 'custom'
}

// ─── Name keyword boosts ──────────────────────────────────────────────────────
const NAME_KEYWORDS: Record<string, string[]> = {
  festival: ['festival', 'fest', 'fiesta', 'carnival'],
  night: ['night', 'evening', 'gala', 'soirée', 'soiree'],
  summit: ['summit', 'forum', 'symposium', 'expo', 'convention'],
  championship: ['championship', 'championship', 'cup', 'trophy', 'olympiad'],
  showcase: ['showcase', 'showcase', 'revue', 'recital', 'showcase'],
  concert: ['concert', 'live', 'performance', 'show', 'jam'],
  award: ['award', 'awards', 'ceremony', 'honors', 'prize'],
  graduation: ['graduation', 'convocation', 'commencement', 'passing out'],
  worship: ['worship', 'praise', 'prayer', 'holy', 'revival', 'gospel'],
}

function detectNameKeyword(name: string): string | null {
  const lower = name.toLowerCase()
  for (const [key, synonyms] of Object.entries(NAME_KEYWORDS)) {
    if (synonyms.some(s => lower.includes(s))) return key
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY TEMPLATES  (≤140 chars each, uses {name}, {venue})
// ─────────────────────────────────────────────────────────────────────────────

const SUMMARIES: Record<EventTypeKey, string[]> = {
  choir: [
    "Voices in perfect harmony — {name} brings choirs together for an unforgettable night of song{venue}.",
    "Feel the chills. {name} unites the finest voices for a choral experience you won't soon forget{venue}.",
    "One stage. Many voices. Pure magic. {name} is the choir event of the year{venue}.",
    "Goosebumps guaranteed. {name} brings choral excellence to life{venue}.",
    "A celebration of song, soul, and harmony. {name} is where voices become one{venue}.",
    "Every note matters. Every chord soars. Welcome to {name}{venue}.",
    "Music that moves mountains — {name} gathers the region's best choirs for one extraordinary night{venue}.",
    "Expect tears, cheers, and standing ovations at {name}{venue}.",
    "Choral magic is real, and it lives at {name}{venue}.",
    "From whispers to crescendos — experience the full power of choral music at {name}{venue}.",
    "The wait is over. {name} is your front-row seat to vocal greatness{venue}.",
    "Harmony has a new home: {name}{venue}.",
    "An evening where voices rise, hearts soar, and memories are made — {name}{venue}.",
    "Prepare to be moved. {name} is choral music at its absolute finest{venue}.",
    "Join us for a night of heavenly harmonies at {name}{venue}.",
  ],

  talent: [
    "Every seat is a front-row seat to greatness. {name} — where raw talent meets the spotlight{venue}.",
    "Singer, dancer, comedian, or surprise act — {name} has it all{venue}.",
    "Discover tomorrow's stars today at {name}{venue}.",
    "Brace yourself for jaw-dropping acts and unexpected moments at {name}{venue}.",
    "Anything can happen. Everything will amaze you. That's {name}{venue}.",
    "The stage is set. The talent is ready. Are you? {name}{venue}.",
    "One night. Unlimited talent. {name} is where stars are born{venue}.",
    "From comedy to acrobatics — {name} is a talent explosion you can't miss{venue}.",
    "Real people. Real talent. Real wow moments — welcome to {name}{venue}.",
    "You'll laugh, you'll gasp, you'll cheer. {name} delivers it all{venue}.",
    "Bold performances. Brave souls. Big dreams. {name}{venue}.",
    "The most exciting night of the year just got a name: {name}{venue}.",
    "Hidden talents, centre stage — {name} is your must-attend show this season{venue}.",
    "Witness the unexpected at {name} — where anything is possible{venue}.",
    "Prepare to be dazzled. {name} brings the best homegrown talent to one stage{venue}.",
  ],

  conference: [
    "Ideas that move the world start at {name}{venue}. Don't miss this.",
    "Connect with the brightest minds and boldest ideas at {name}{venue}.",
    "Conversations worth having. Insights worth keeping. {name}{venue}.",
    "Where visionaries meet practitioners — {name} is your next growth moment{venue}.",
    "Level up your thinking at {name}, the conference that actually changes things{venue}.",
    "Knowledge shared. Connections made. Careers transformed. Welcome to {name}{venue}.",
    "A room full of answers to questions you haven't asked yet — {name}{venue}.",
    "The future is being built in rooms like this. Join us at {name}{venue}.",
    "Bring your questions. Leave with clarity. {name}{venue}.",
    "Real speakers. Real insights. Real impact — {name}{venue}.",
    "Think bigger. Build better. Meet your people at {name}{venue}.",
    "If you only attend one event this year, make it {name}{venue}.",
    "Innovation doesn't happen in isolation. {name} brings the right people together{venue}.",
    "Come curious. Leave inspired. {name}{venue}.",
    "The agenda is full. The value is priceless. {name}{venue}.",
  ],

  competition: [
    "May the best team win. {name} is where champions are crowned{venue}.",
    "Compete. Conquer. Celebrate. {name} — the ultimate academic showdown{venue}.",
    "Excellence under pressure — that's {name}{venue}.",
    "Sharpen your mind. Bring your A-game. {name} is calling{venue}.",
    "Only the best make it through. Will you? {name}{venue}.",
    "A battlefield of brilliance — welcome to {name}{venue}.",
    "Judges ready. Scores live. Stakes high. {name}{venue}.",
    "The thrill of the contest meets the pride of excellence — {name}{venue}.",
    "One trophy. Many contenders. Zero easy rounds. {name}{venue}.",
    "Compete with honour. Win with grace. {name}{venue}.",
    "Where preparation meets opportunity — {name}{venue}.",
    "Bring your best self to {name} — the competition that pushes limits{venue}.",
    "Victory is earned, not given. {name} separates the best from the rest{venue}.",
    "Precision. Strategy. Heart. Everything it takes is at {name}{venue}.",
    "The scoreboard is watching. Rise to it at {name}{venue}.",
  ],

  drama: [
    "Curtain up on brilliance — {name} brings theatre to life like you've never seen{venue}.",
    "Step into another world at {name}. An unforgettable theatrical experience{venue}.",
    "Drama. Tension. Pure theatrical magic. {name}{venue}.",
    "The stage is calling. The story is ready. {name}{venue}.",
    "From the first line to the final bow — {name} will hold you spellbound{venue}.",
    "Real emotion. Real artistry. Real theatre. Welcome to {name}{venue}.",
    "Lights up on {name} — a performance that will stay with you long after{venue}.",
    "Theatre at its finest. Characters you'll never forget. {name}{venue}.",
    "Lose yourself in the story at {name}{venue}.",
    "Brilliant scripts. Bold performances. One night to remember — {name}{venue}.",
    "The cast is ready. The set is dressed. Are you? {name}{venue}.",
    "Where storytelling becomes an art form — {name}{venue}.",
    "An evening of theatre that will move, challenge, and delight — {name}{venue}.",
    "Come for the story. Stay for the standing ovation. {name}{venue}.",
    "Live theatre at its most powerful — {name}{venue}.",
  ],

  worship: [
    "Come expectant. Leave transformed. {name} — an encounter you won't forget{venue}.",
    "One night. One purpose. Infinite grace. {name}{venue}.",
    "Surrender to the music. Open your heart. Welcome to {name}{venue}.",
    "Where heaven meets earth — {name} is your invitation to encounter{venue}.",
    "Powerful worship. Powerful presence. {name}{venue}.",
    "Come as you are. Leave refreshed, renewed, and full. {name}{venue}.",
    "Lift your voice. Quiet your mind. {name} — a night of pure worship{venue}.",
    "Every song a prayer. Every moment sacred. {name}{venue}.",
    "Worship that breaks barriers and builds faith — {name}{venue}.",
    "Your night of encounter starts here: {name}{venue}.",
    "In a world full of noise, {name} invites you into something deeper{venue}.",
    "Bring your burdens. Find your peace. {name}{venue}.",
    "More than music. More than a service. {name} is an experience{venue}.",
    "Expect the unexpected. Come hungry. {name}{venue}.",
    "A night of praise, surrender, and breakthrough — {name}{venue}.",
  ],

  openmic: [
    "Your stage. Your moment. {name} — the open mic night everyone's talking about{venue}.",
    "Raw talent. Real courage. No filter. {name}{venue}.",
    "Sign up. Show up. Stand out. {name} is where voices are heard{venue}.",
    "Poets, musicians, comedians welcome — {name} is your platform{venue}.",
    "Every mic drop moment starts with stepping up. {name}{venue}.",
    "First-timers and veterans share the same spotlight at {name}{venue}.",
    "Speak your truth. Sing your soul. {name} is listening{venue}.",
    "Brave artists. Buzzing crowd. One great night. {name}{venue}.",
    "No auditions. No gatekeepers. Just you and the mic — {name}{venue}.",
    "The most electric Tuesday/Friday night in town? {name}{venue}.",
    "From spoken word to original songs — {name} celebrates it all{venue}.",
    "The crowd is ready. The mic is live. Your move. {name}{venue}.",
    "Authentic. Unfiltered. Unforgettable. That's {name}{venue}.",
    "Where emerging artists find their audience — {name}{venue}.",
    "One spotlight. Infinite stories. {name}{venue}.",
  ],

  graduation: [
    "A journey ends. A chapter begins. Celebrate the class of the year at {name}{venue}.",
    "Honours earned. Futures bright. Welcome to {name}{venue}.",
    "This moment belongs to them — join us to celebrate at {name}{venue}.",
    "Years of hard work. One unforgettable ceremony. {name}{venue}.",
    "Today they graduate. Tomorrow they change the world. {name}{venue}.",
    "Caps, gowns, and pride — {name} is the celebration they deserve{venue}.",
    "From the classroom to the world — {name} marks the milestone{venue}.",
    "Families, friends, and proud faces — {name} honours the best{venue}.",
    "Excellence rewarded. Dreams launched. {name}{venue}.",
    "A ceremony worth every early morning and late night. {name}{venue}.",
    "The beginning of everything worth celebrating — {name}{venue}.",
    "Join us as we celebrate excellence and send them into the future — {name}{venue}.",
    "Medals, memories, and milestones — all at {name}{venue}.",
    "Their hard work deserves a moment like this. {name}{venue}.",
    "Class dismissed — and the real adventure begins. {name}{venue}.",
  ],

  custom: [
    "An event like no other. {name} is the experience everyone will be talking about{venue}.",
    "Mark your calendar. Clear your schedule. {name} is happening{venue}.",
    "Big things are coming. {name} is where it all goes down{venue}.",
    "You won't want to miss this. {name}{venue}.",
    "This is the one. {name} — an event worth every second{venue}.",
    "Something extraordinary is on the horizon — {name}{venue}.",
    "Expect the unexpected at {name}{venue}.",
    "The event of the season is here — {name}{venue}.",
    "A gathering you'll talk about for years — {name}{venue}.",
    "Be part of something bigger at {name}{venue}.",
    "Reserve your spot. This fills fast. {name}{venue}.",
    "Bold. Brilliant. Unmissable. {name}{venue}.",
    "Whatever you're expecting, {name} will exceed it{venue}.",
    "Come for the event. Stay for the experience. {name}{venue}.",
    "Your next great memory is waiting at {name}{venue}.",
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// DESCRIPTION TEMPLATES  (3-5 sentences, uses {name}, {venue}, {type})
// ─────────────────────────────────────────────────────────────────────────────

const DESCRIPTIONS: Record<EventTypeKey, string[]> = {
  choir: [
    `{name} is a premier choral gathering that brings together the finest voices from across the region{venue}. Whether you're attending to support a group or simply to soak in the beauty of live choral music, you're in for a truly moving evening. Expect breathtaking harmonies, impeccable arrangements, and performances that will give you chills from the very first note. Come ready to be swept away — this is choral music at its most powerful and most human.`,

    `Step into an evening where music does what words alone cannot — {name} is a celebration of vocal artistry and collective spirit{venue}. Each choir brings its own signature sound, personality, and passion, making every performance completely unique. The atmosphere is electric: part concert, part competition, entirely unforgettable. Bring your best ears and an open heart — you'll leave with a melody you won't shake for days.`,

    `{name} is more than a concert — it's a conversation between voices, traditions, and communities{venue}. You'll hear everything from classical arrangements to contemporary gospel, from intimate a capella to full choir pageantry. It's the kind of event that reminds you why live music matters and why the human voice is the world's most powerful instrument. Don't miss your chance to be part of this extraordinary evening.`,

    `What happens when talented choirs share one stage? Pure, spine-tingling magic — and that's exactly what {name} delivers{venue}. The evening features multiple choral groups, each bringing a distinct sound and story to the performance. Whether it's your first choral concert or your hundredth, the energy in that room will feel like something entirely new. Come prepared to be moved, delighted, and inspired.`,

    `{name} celebrates the art of collective song — the kind that only happens when dozens of voices find perfect, breathtaking unity{venue}. Each group has prepared tirelessly, and it shows in every rehearsed breath, every soaring note, every goosebump-inducing chord. Bring your family. Bring your friends. Bring your tissues. This is an evening that changes people, and we can't wait to share it with you.`,

    `There is nothing quite like the sound of a choir in full voice, and {name} brings that experience to life in spectacular fashion{venue}. Featuring a lineup of exceptional choral groups, the evening is designed to move, inspire, and uplift everyone in the audience. The performances range from the deeply traditional to the gloriously contemporary, ensuring there's something for every musical taste. Come early, find a good seat, and let the music do the rest.`,

    `{name} is the region's most anticipated choral event of the year, and for good reason{venue}. The lineup features some of the most talented vocal groups around, each performing a carefully curated set that showcases their unique style and artistry. The energy in the hall is unlike anything else — part reverence, part celebration, entirely electric. Whether you're a lifelong choral enthusiast or a curious first-timer, this night was made for you.`,

    `When voices align and music fills the air, something extraordinary happens — {name} is built around that moment{venue}. The evening brings together choirs of different backgrounds, ages, and styles, united by a love of the craft and a desire to create something beautiful together. Expect a programme that surprises, delights, and occasionally takes your breath away entirely. This is the event choral music lovers wait all year for.`,
  ],

  talent: [
    `{name} is the ultimate celebration of homegrown talent — a high-energy showcase where performers of every kind get their moment under the spotlight{venue}. From singers and dancers to magicians, comedians, and everything in between, the stage belongs to those brave enough to step onto it. The atmosphere is electric, the crowd is enthusiastic, and the performances range from beautifully polished to gloriously spontaneous. Come ready to cheer, gasp, and discover your next favourite act.`,

    `Every performer at {name} has one thing in common: the courage to share their gift with the world{venue}. This celebration of raw, unfiltered talent features acts from beginners to seasoned performers across a wide range of disciplines. Whether you're coming to compete or simply to witness greatness in the making, you're guaranteed a night you'll talk about long after the curtain falls. Bring your loudest cheer — these performers have earned it.`,

    `{name} throws open the stage to the boldest, most talented individuals around, creating an evening of pure entertainment that you simply cannot replicate anywhere else{venue}. The programme is deliberately unpredictable — expect laughs, tears, jaw-dropping moments, and at least one act you'll immediately want to watch again. It's the kind of event that makes you believe in people, in art, and in the power of courage. Don't miss it.`,

    `Talent has a home, and it's called {name}{venue}. This spectacular showcase brings together performers from across a wide range of disciplines, each of them driven by passion, weeks of practice, and the desire to connect with an audience. The energy backstage is electric; the energy in the hall is something else entirely. Come with high expectations — then watch them be exceeded.`,

    `{name} is where potential becomes performance and performers become stars{venue}. The evening is packed with acts that will surprise you, move you, and leave you wondering where these extraordinary people have been hiding. From spoken word and stand-up comedy to stunning vocal performances and physical acts that defy belief, the variety on show is a true testament to human creativity. Arrive early, stay late, and bring your most enthusiastic applause.`,

    `Prepare yourself for an evening of genuinely jaw-dropping entertainment at {name}{venue}. This is a talent show in the truest sense: unpredictable, thrilling, and bursting with heart. Performers have been preparing for weeks, and it shows — every act brings something distinctive, personal, and powerful to the stage. Whether you're in the audience to support someone you know or to discover someone you soon will, this night will deliver.`,

    `{name} celebrates the simple, powerful truth that extraordinary talent exists everywhere — you just need to give it a stage{venue}. This showcase brings together a diverse lineup of performers across multiple categories, unified by their commitment to their craft and their desire to entertain. The crowd is part of the show too: your cheers, your laughter, your standing ovations all add to the magic. Come ready to be amazed.`,

    `What makes {name} special isn't just the acts — it's the atmosphere{venue}. A buzzing crowd, a packed programme, and performers giving everything they have creates an energy that is genuinely impossible to replicate. Across the evening you'll experience a full range of human expression: comedy, drama, music, movement, and moments of pure, surprising beauty. This is entertainment at its most authentic, and we wouldn't have it any other way.`,
  ],

  conference: [
    `{name} is a gathering of minds, a collision of ideas, and a catalyst for the kind of conversations that actually move things forward{venue}. The programme features an exceptional lineup of speakers, practitioners, and thought leaders who bring both depth and practicality to everything they share. Whether you're looking to learn, to network, or to challenge your thinking, you'll find all of that and more across the sessions. Come with questions. Leave with answers — and a whole new set of better questions.`,

    `In a world that never slows down, {name} gives you the rare gift of focused, high-quality thinking time{venue}. The conference brings together leading voices in the field alongside the practitioners and changemakers doing the work every day. The sessions are designed to inform, challenge, and inspire — not just talk at you, but genuinely shift the way you see your work. Block the time. It's worth it.`,

    `{name} is built on a simple premise: the best ideas come from the best conversations, and the best conversations happen when you put the right people in a room{venue}. The programme is carefully curated to balance expert insights with practical application, ensuring that what you learn here translates directly into what you do next. Expect sessions that are substantive, discussions that are honest, and connections that last well beyond the day itself.`,

    `If you're serious about growth — personal, professional, or organizational — {name} is exactly the investment you need to make{venue}. The speaker lineup brings together some of the most respected names in the field, each sharing perspectives that are grounded in experience and fired by genuine conviction. The networking opportunities are equally valuable: the people you meet in the corridors often matter as much as the content on the stage. Come ready to engage fully.`,

    `{name} is the conference that practitioners actually want to attend — because it's built by people who understand what audiences actually need{venue}. Every session is designed with one question in mind: what will this attendee do differently on Monday morning? The result is a programme that's rich in insight but ruthlessly practical, full of actionable ideas rather than abstract theory. Whether this is your first conference or your fiftieth, {name} will deliver something genuinely new.`,

    `Beyond the keynotes and breakout sessions, {name} is really about community{venue}. It's the moment when people who spend most of their time working in isolation discover that they're part of something larger — a field full of talented, passionate, curious individuals who share their challenges and their ambitions. The content is excellent, the speakers are exceptional, and the connections you make will shape your work for years to come. We'll see you there.`,

    `{name} doesn't just report on where the field is going — it helps shape the direction{venue}. Featuring bold thinkers, honest practitioners, and visionary leaders, the conference creates a unique environment where real conversations happen and real decisions get made. The programme spans everything from big-picture strategy to detailed tactical insight, ensuring there's genuine value at every level. Attend and leave knowing your time was spectacularly well spent.`,

    `Great conferences are rare. {name} is one of them{venue}. Every element of the programme has been designed with care — the speakers are genuinely exceptional, the sessions are thoughtfully structured, and the time between sessions is as valuable as the time inside them. You'll walk away with a notebook full of ideas, a phone full of new contacts, and a clarity about your next steps that's hard to find anywhere else. Don't miss it.`,
  ],

  competition: [
    `{name} is the academic and performance competition that separates the best from the excellent{venue}. Participants have invested weeks of preparation, late nights of practice, and enormous reserves of courage to stand in the arena and compete at the highest level. The atmosphere is charged with competitive energy and mutual respect — because everyone here knows what it takes to show up and perform. Come to witness greatness in the making.`,

    `At {name}, the stakes are real, the preparation is serious, and the performances are extraordinary{venue}. This is a competition built on the belief that healthy challenge brings out the best in people — and the results prove it every single time. Judges are rigorous, scoring is live, and the tension in the room is the best kind: electric, respectful, and thrilling to experience as an audience member. Prepare yourself for a masterclass in competitive excellence.`,

    `{name} brings together the sharpest minds and most skilled performers for a competition that raises the bar every year{venue}. Whether participants are representing schools, organizations, or themselves, they bring the same fierce commitment to doing their absolute best. Every round is a window into just how much human potential is possible when someone truly works for something. Come ready to be impressed — and maybe a little humbled.`,

    `Competition makes us better, and {name} is proof{venue}. This carefully structured event creates a platform where participants can test their skills against genuine peers, receive meaningful feedback, and discover exactly what they're capable of under pressure. It's more than a contest — it's a development experience wrapped in high-stakes excitement. For participants, it's a defining moment. For the audience, it's one of the most compelling events of the year.`,

    `{name} is where months of preparation meet a single stage, and where the results tell stories words cannot adequately capture{venue}. The competition spans multiple rounds and categories, with each participant bringing something distinctive to their performance. Judges are looking for precision, creativity, and the kind of composure that only comes from genuine mastery. Whether you're competing, supporting, or simply watching, you're in for an extraordinary day.`,

    `There's nothing quite like watching someone perform at the absolute peak of their ability, and {name} delivers that experience again and again throughout the day{venue}. Every participant has earned their place through preparation, persistence, and no small amount of courage. The competition format is rigorous and fair, designed to give everyone the best opportunity to shine. Come early, stay late, and witness what human dedication actually looks like.`,

    `{name} is the kind of competition where everyone in the room — participant and spectator alike — walks away better for having been there{venue}. The events are challenging, the judging is transparent, and the performances are consistently outstanding. But beyond the scores and the trophies, what you really witness is people discovering what they're truly capable of when the pressure is real and the preparation is complete. That's worth showing up for.`,

    `Excellence is not an accident — it's a choice made repeatedly under pressure — and {name} is the proving ground for that truth{venue}. Participants bring months of hard work to this single event, and the results are nothing short of inspiring. The atmosphere strikes a perfect balance between fierce competition and genuine sportsmanship. For everyone in the room, it's a reminder of what focused human effort can achieve.`,
  ],

  drama: [
    `{name} invites you into a world where stories come alive, emotions run deep, and the boundary between stage and reality blurs in the most beautiful way{venue}. The production has been weeks in the making: the cast has lived inside these characters, the crew has built the world they inhabit, and together they've created something truly special. This is live theatre at its most committed, most vulnerable, and most powerful. Come and let the story take you somewhere unexpected.`,

    `Every great piece of theatre asks something of its audience — it asks you to believe, to feel, and to be changed{venue}. {name} is built on that understanding. The performances are deeply committed, the direction is sharp, and the script is alive with meaning. Whether you're a seasoned theatre-goer or stepping into the world of live drama for the first time, you'll find the experience at once entertaining and genuinely moving. This is storytelling at its finest.`,

    `{name} is the result of extraordinary creative collaboration: writers, directors, actors, designers, and crew members all working toward a single, unified vision{venue}. The result is a theatrical experience that is visually stunning, emotionally resonant, and technically accomplished. The cast brings authenticity and vulnerability to every scene, making the story feel real and urgent in ways that only live performance can achieve. Book your seat — this one will sell out.`,

    `Live theatre is unique precisely because it is unrepeatable — each performance is a singular, irreplaceable event — and {name} honours that truth with every scene{venue}. The cast has brought total commitment to their characters, finding layers of humanity in the text that will surprise and move you. The production design creates a world you'll believe in immediately, and the direction keeps the energy alive throughout. Don't let this one pass you by.`,

    `{name} is a theatrical event that demands your full attention and rewards it completely{venue}. From the moment the lights dim, you're transported into a world crafted with exceptional care and brought to life by a cast of genuinely talented performers. The storytelling is nuanced, the pacing is masterful, and the emotional beats land with real force. This is the kind of theatre that reminds you why we tell stories — and why we need to keep hearing them.`,

    `What separates good theatre from truly great theatre is the degree to which the audience stops being an audience and becomes part of the story — and {name} achieves that transformation{venue}. The production is ambitious in the best sense: it reaches for something real, something human, something true. The cast is exceptional, the design is evocative, and the script is rich with moments that will stay with you long after the curtain falls. See it.`,

    `{name} takes the stage with a production that is as bold as it is beautiful{venue}. The creative team has brought extraordinary vision to this material, finding fresh angles in every scene and coaxing performances that are raw, honest, and completely compelling. The result is an evening of theatre that transcends entertainment and becomes something you carry with you — a story that makes you think, feel, and see the world a little differently. That's what the best theatre does. And this is the best.`,

    `Drama at its finest doesn't just tell you a story — it makes you feel the story from the inside — and that's the promise of {name}{venue}. The cast brings courage and craft to every scene, supported by design work that creates an immersive world with remarkable attention to detail. This is the product of weeks of intensive rehearsal, genuine creative risk-taking, and a deep love for the craft of theatre. Come ready to be transported.`,
  ],

  worship: [
    `{name} is an invitation to step away from the noise and into something truly sacred{venue}. This is not just a concert — it is an encounter; a moment where music becomes a vehicle for something far deeper than entertainment. The atmosphere will be electric yet reverent, full of sound yet strangely still. Come as you are. Come expectant. Come ready to experience the kind of worship that changes the air in a room.`,

    `Something happens when a room full of people give themselves fully to worship — the atmosphere shifts, hearts open, and the presence of God becomes tangible{venue}. {name} is built around that truth. With powerful worship leaders guiding the evening and a community of believers lifting their voices together, this is a night designed to be an encounter, not merely an event. Come hungry. Come open. Leave full.`,

    `{name} is a night of worship for everyone who has ever needed more than the ordinary world can offer{venue}. The programme is rich with music that moves, spoken word that speaks, and prayer that anchors — creating an evening that serves both the soul searching for peace and the spirit hungry for encounter. Leave your week at the door. This space is holy ground, and you are welcome here.`,

    `Worship at its most powerful is a collective act — voices and hearts aligned around something greater — and that is exactly what {name} creates{venue}. The evening brings together a community of believers and seekers under one roof, united by music that points beyond itself. The worship leaders are anointed, the songs are chosen carefully, and the atmosphere has been prepared with prayer. Come as you are. He meets us there.`,

    `{name} is more than a worship night — it is a declaration{venue}. A declaration that in the middle of all the chaos and noise, there is still a people willing to pause, to lift their eyes, and to say: more of You, less of everything else. The evening is crafted to create space for real encounter — through song, through prayer, through the word. This is not a performance. This is an invitation. Will you come?`,

    `Some events entertain. Some events inspire. {name} transforms{venue}. This worship gathering is built from the conviction that God moves when His people gather and praise — and every element of the evening has been designed to create space for exactly that. The worship team is gifted, the community is genuine, and the atmosphere is one of radical openness and expectation. Bring what you have. Leave with what you need.`,

    `{name} is your evening to put down every weight and step into genuine encounter{venue}. The worship programme has been carefully built to take you on a journey — from the familiar to the deep, from the joyful to the solemn, from the sung to the silence where His voice is clearest. Whether you're walking in full of faith or searching for a single reason to believe, this night was designed with you in mind. Come. We've been expecting you.`,

    `The most powerful moments in life are often the quietest — a single song lyric that breaks you open, a moment of prayer that changes everything, a room full of voices saying the same thing in faith{venue}. {name} is built around those moments. The evening flows with intention and grace, carried by worship that is honest, anointed, and undeniably powerful. Open your heart. God is meeting people in rooms like this one.`,
  ],

  openmic: [
    `{name} is the open mic where real voices get a real stage — no auditions, no gatekeepers, no limitations{venue}. Poets, musicians, comedians, storytellers, and spoken word artists share the same spotlight, creating an evening that is by turns hilarious, moving, surprising, and utterly electric. Whether you're signing up to perform or settling in to listen, the energy in the room is something genuinely special. Come and be part of it.`,

    `Every great career starts with one terrifying first step onto a stage — and {name} is where those steps happen{venue}. This open mic night creates a safe, supportive, and energized environment for performers of all experience levels to share their work with a live audience. The crowd is warm, the vibe is celebratory, and the level of raw talent on display will genuinely surprise you. Sign up. Show up. Let yourself be heard.`,

    `{name} is the antidote to the perfectly curated, heavily produced entertainment world — this is real, live, unfiltered human expression{venue}. Over the course of the evening, you'll hear original songs, spoken word that cuts right to the bone, comedy that finds truth in the absurd, and performances that simply cannot be categorized. The variety is the point. The bravery is the beauty. Come and celebrate both.`,

    `There is nothing in the world quite like a genuinely great open mic night — and {name} has built a reputation for delivering exactly that{venue}. The programme is unpredictable in the best possible way: every performer brings something different, something personal, something real. The crowd is enthusiastic and generous, creating an atmosphere where performers feel supported and audience members feel connected. This is community at its most creative.`,

    `{name} celebrates a simple but powerful truth: everyone has a story worth telling and a voice worth hearing{venue}. The open mic format removes the barriers between performer and audience, creating an intimate, electric atmosphere where anything can happen — and usually does. The talent on display ranges from breathtakingly polished to endearingly raw, and the blend is what makes the evening so compelling. Come to perform. Come to listen. Just come.`,

    `When an open mic night is done right, it feels like a secret club where all the most interesting people in the city have gathered to share their most honest work — and that's exactly what {name} is{venue}. Performers bring original material: songs, poems, stories, sets, and occasionally things that don't fit neatly into any category. The crowd is engaged and real. The moments are unrepeatable. Grab a seat before they're gone.`,

    `{name} is where the brave ones go{venue}. It's the stage that belongs to the person with a song that hasn't been heard yet, the poem that's been sitting in a notebook for months, the routine that deserves a room to test it in. The atmosphere is one of radical encouragement — performers cheer for each other because they know exactly how it feels to stand up there. Come and add your voice to the evening.`,

    `An open mic at its best is a love letter to human creativity — and {name} is that letter, written in real time, in front of a live audience{venue}. The range of performers across the evening is extraordinary: ages, backgrounds, styles, and disciplines all sharing the same stage, the same microphone, and the same fundamental desire to connect. This is not polished entertainment. This is something better: it's the real thing. Come and see for yourself.`,
  ],

  graduation: [
    `{name} is the moment the years of sacrifice, discipline, and determination crystallize into something permanent — a credential, a memory, and a launching pad{venue}. Family members have travelled far to be here. Friends have shown up to cheer. Mentors are watching with pride. And the graduates themselves stand at a threshold that only opens once. This ceremony honours all of it — the journey and the destination — with all the dignity and joy it deserves.`,

    `Every graduation ceremony carries weight — the weight of late nights, difficult moments, hard choices, and the stubborn refusal to give up — and {name} honours every ounce of it{venue}. The day belongs entirely to the graduates: their achievement, their future, their transformation. We gather to bear witness to that achievement and to send them into the world with every possible expression of pride and confidence. Come ready to celebrate them fully.`,

    `{name} marks not just the end of a chapter but the beginning of the most important one yet{venue}. The ceremony brings together the families, friends, mentors, and communities who supported these graduates throughout their journey — because no one achieves alone, and every achievement deserves to be celebrated together. Expect moments of genuine emotion, deep pride, and the kind of joy that only comes from watching someone you love succeed.`,

    `Some days you remember for the rest of your life — and graduation day is always one of them{venue}. {name} creates the setting worthy of this moment: a ceremony that honours the seriousness of the achievement while celebrating the brightness of the future ahead. Every name called, every degree conferred, every handshake and photograph is part of a tradition that matters — the recognition of hard work by people who witnessed it and believe in what comes next.`,

    `{name} exists to say, in the most formal and public way possible: you did it, and it matters{venue}. The graduates crossing this stage have earned their place here through years of effort that most people never fully see. This ceremony makes that effort visible, celebrates it loudly, and sends these individuals into their futures with the knowledge that their community saw them, supported them, and believes in everything they are capable of becoming.`,

    `Graduations are about three things: the past, the present, and the future — all of them happening at once in one extraordinary room{venue}. At {name}, we gather to acknowledge the past (the hard work, the growth, the transformation), to celebrate the present (this milestone, this room, this moment of togetherness), and to launch the future (the careers, the lives, the impact that these extraordinary individuals will go on to create). Come and be part of all three.`,

    `{name} is the event that the graduates have been working toward since their very first day — and it is worth every single moment{venue}. The ceremony is designed to be both dignified and joyful: structured enough to honour the achievement, warm enough to reflect the community that made it possible. For every graduate walking across that stage, the moment is personal. For everyone watching, it is a reminder of what dedication and belief can achieve.`,

    `There is a particular kind of pride that comes from watching someone finish what they started — especially when you know what it cost them{venue}. {name} is the culmination of that journey, a ceremony that gathers everyone who played a role in this achievement and says, together: look what they did. Look who they've become. The graduates deserve every moment of recognition coming to them, and this ceremony gives them all of it.`,
  ],

  custom: [
    `{name} is one of those events that's genuinely hard to describe in advance — because its value lies in the experience of being there{venue}. What we can tell you is this: the people behind it have put extraordinary care into every detail, the programme is designed to surprise and delight, and the atmosphere will be unlike anything else on the calendar this season. Trust the buzz. Clear the date. Come and discover what everyone is talking about.`,

    `There are events you attend and forget by the following week — and then there's {name}{venue}. Built around a vision that goes beyond the ordinary, this is the kind of gathering that people mark on their calendars months in advance, plan their schedules around, and talk about long after it's over. The experience has been designed with genuine care and a bold refusal to settle for anything less than remarkable. You're going to love it.`,

    `{name} brings together a community of people who share a conviction that the ordinary can always be extraordinary with the right vision and the right energy{venue}. The programme has been designed to create genuine moments — not filler, not noise, but things that land, that linger, that shift something in the room. Whatever you're expecting, expect more. This event has been built to exceed it.`,

    `Every now and then, an event comes along that captures something in the culture — a mood, a movement, a moment — and turns it into an experience worth showing up for{venue}. {name} is that event. Whether you come for the programme, the people, the atmosphere, or simply because every person you trust told you not to miss it, you'll leave knowing the journey was completely worth it.`,

    `{name} is a gathering designed for people who believe that the best experiences don't happen by accident — they're built by people who care deeply about craft, community, and the power of bringing humans together with intention{venue}. The event features a rich programme of experiences crafted to engage, challenge, and inspire. Come with an open mind and an appetite for something genuinely different.`,

    `What makes {name} different from the dozens of events competing for your time is simple: every single decision about this event was made with the attendee's experience at the centre{venue}. The programme is outstanding. The atmosphere is carefully cultivated. The details have been attended to with a level of care that you will feel the moment you arrive. This is an event that respects your time by making every minute of it count.`,

    `{name} is the result of bold thinking, meticulous planning, and a genuine refusal to settle for average{venue}. The team behind this event started with a question — what would this look like if we removed every compromise? — and built the answer from the ground up. The result is something that stands apart: an experience that is purposeful, polished, and profoundly worth your time. See you there.`,

    `Some events unfold and some events arrive — {name} is the latter{venue}. It has been anticipated, prepared for, and shaped by people who understand that the best gatherings are never just logistical exercises but genuine acts of creativity and community. The programme is strong. The people attending are the kind you'll be glad to have met. And the memories you make will be the kind worth keeping.`,
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a short summary (≤140 chars) for the given event.
 * Deterministic: same inputs always produce the same output.
 */
export function generateLocalSummary(
  eventName: string,
  eventTypeLabel: string,
  venue: string
): string {
  const type = resolveType(eventTypeLabel)
  const pool = SUMMARIES[type]

  // Bias seed toward name keyword if present
  const keyword = detectNameKeyword(eventName)
  const seed = keyword ? `${eventName}-${keyword}` : eventName

  const template = pickFrom(pool, seed)
  const venueStr = venue ? ` at ${venue}` : ''

  return template
    .replace(/\{name\}/g, eventName)
    .replace(/\{venue\}/g, venueStr)
    .slice(0, 140)
}

/**
 * Returns a multi-sentence description (3-5 sentences) for the given event.
 * Deterministic: same inputs always produce the same output.
 */
export function generateLocalDescription(
  eventName: string,
  eventTypeLabel: string,
  venue: string
): string {
  const type = resolveType(eventTypeLabel)
  const pool = DESCRIPTIONS[type]

  const keyword = detectNameKeyword(eventName)
  // Offset seed slightly from summary so they pick different entries
  const seed = keyword ? `${eventName}-desc-${keyword}` : `${eventName}-desc`

  const template = pickFrom(pool, seed)
  const venueStr = venue ? ` at ${venue}` : ''

  return template
    .replace(/\{name\}/g, eventName)
    .replace(/\{venue\}/g, venueStr)
    .replace(/\{type\}/g, eventTypeLabel)
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK SELF-TEST  (run with: npx ts-node eventContentLibrary.ts)
// ─────────────────────────────────────────────────────────────────────────────
// const s = generateLocalSummary('Lagos Choral Festival 2026', 'Choir Concert', 'Tafawa Balewa Square')
// const d = generateLocalDescription('Lagos Choral Festival 2026', 'Choir Concert', 'Tafawa Balewa Square')
// console.log('SUMMARY:', s)
// console.log('DESCRIPTION:', d)