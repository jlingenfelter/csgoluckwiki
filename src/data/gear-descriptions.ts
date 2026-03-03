// ── Gear product descriptions & specs ────────────────────────────────────────
// Maps exact gear names to structured descriptions shown on gear detail pages.
// Color variants share descriptions via ALIASES.

export interface GearDescription {
  overview: string;
  specs: { label: string; value: string }[];
  prosForCS2: string;
}

// ── MICE ─────────────────────────────────────────────────────────────────────

const MICE: Record<string, GearDescription> = {
  'Logitech G Pro X Superlight 2 Black': {
    overview: 'The Logitech G Pro X Superlight 2 is a lightweight wireless gaming mouse built for competitive FPS. It features the HERO 2 sensor with up to 44,000 DPI, a 2,000Hz polling rate via LIGHTSPEED wireless, and weighs just 60 grams. The symmetrical shape suits a wide range of grip styles.',
    specs: [
      { label: 'Sensor', value: 'HERO 2 (44K DPI)' },
      { label: 'Weight', value: '60g' },
      { label: 'Polling Rate', value: '2,000 Hz (wireless)' },
      { label: 'Connection', value: 'LIGHTSPEED Wireless' },
      { label: 'Shape', value: 'Symmetrical Ambi' },
      { label: 'Battery', value: '~95 hours' },
      { label: 'Switches', value: 'LIGHTFORCE Hybrid (Optical-Mechanical)' },
    ],
    prosForCS2: 'The Superlight 2 is the single most popular mouse in professional CS2. Its sub-60g weight reduces fatigue during long sessions, the HERO 2 sensor provides flawless tracking for low-sens flicks, and 2,000Hz wireless polling ensures minimal input delay. Widely trusted at every major tournament.',
  },
  'Logitech G Pro X Superlight Black': {
    overview: 'The original Logitech G Pro X Superlight is a 63-gram wireless gaming mouse that redefined the lightweight category. Featuring the HERO 25K sensor and LIGHTSPEED wireless at up to 1,000Hz polling, it became one of the most successful esports mice ever released.',
    specs: [
      { label: 'Sensor', value: 'HERO 25K (25,600 DPI)' },
      { label: 'Weight', value: '63g' },
      { label: 'Polling Rate', value: '1,000 Hz (wireless)' },
      { label: 'Connection', value: 'LIGHTSPEED Wireless' },
      { label: 'Shape', value: 'Symmetrical Ambi' },
      { label: 'Battery', value: '~70 hours' },
      { label: 'Switches', value: 'Omron Mechanical' },
    ],
    prosForCS2: 'The original Superlight established the wireless lightweight meta in competitive CS2. Still widely used by pros who prefer its slightly different click feel compared to the Superlight 2. The HERO 25K sensor provides flawless tracking and the LIGHTSPEED connection has proven tournament-reliable.',
  },
  'Logitech G Pro X2 SUPERSTRIKE': {
    overview: 'The Logitech G Pro X2 SUPERSTRIKE is a refinement of the Superlight 2, co-designed with top esports athletes. It features a subtly adjusted shape, upgraded PTFE feet for smoother glide, and maintains the HERO 2 sensor with 2,000Hz LIGHTSPEED wireless.',
    specs: [
      { label: 'Sensor', value: 'HERO 2 (44K DPI)' },
      { label: 'Weight', value: '60g' },
      { label: 'Polling Rate', value: '2,000 Hz (wireless)' },
      { label: 'Connection', value: 'LIGHTSPEED Wireless' },
      { label: 'Shape', value: 'Symmetrical Ambi (refined)' },
      { label: 'Battery', value: '~95 hours' },
      { label: 'Switches', value: 'LIGHTFORCE Hybrid' },
    ],
    prosForCS2: 'The SUPERSTRIKE builds on the dominant Superlight 2 platform with refined ergonomics and improved glide. Pros switching to this model benefit from the same proven sensor and wireless tech with a shape that better accommodates aggressive claw grips common in competitive play.',
  },
  'Razer Viper V3 Pro Black': {
    overview: 'The Razer Viper V3 Pro is Razer\'s flagship competitive mouse featuring the Focus Pro 36K optical sensor, 8,000Hz HyperPolling wireless, and a 54-gram ultralight design. The refined symmetrical shape with a slight hump caters to claw and fingertip grips.',
    specs: [
      { label: 'Sensor', value: 'Focus Pro 36K (36,000 DPI)' },
      { label: 'Weight', value: '54g' },
      { label: 'Polling Rate', value: '8,000 Hz (wireless)' },
      { label: 'Connection', value: 'HyperSpeed Wireless' },
      { label: 'Shape', value: 'Symmetrical Ambi' },
      { label: 'Battery', value: '~90 hours (1KHz)' },
      { label: 'Switches', value: 'Razer Gen-3 Optical' },
    ],
    prosForCS2: 'The Viper V3 Pro is rapidly gaining ground in pro CS2 thanks to its incredibly low weight and industry-leading 8,000Hz wireless polling rate. The optical switches eliminate double-clicking issues, and the low-profile shape gives precise control for micro-adjustments during aim duels.',
  },
  'Razer DeathAdder V4 Pro Black': {
    overview: 'The Razer DeathAdder V4 Pro brings the iconic ergonomic DeathAdder shape into the wireless era. Featuring the Focus Pro 36K sensor, 8,000Hz HyperPolling, and weighing around 63 grams, it offers comfort-oriented ergonomics for palm and relaxed claw grippers.',
    specs: [
      { label: 'Sensor', value: 'Focus Pro 36K (36,000 DPI)' },
      { label: 'Weight', value: '63g' },
      { label: 'Polling Rate', value: '8,000 Hz (wireless)' },
      { label: 'Connection', value: 'HyperSpeed Wireless' },
      { label: 'Shape', value: 'Ergonomic Right-Handed' },
      { label: 'Battery', value: '~100 hours (1KHz)' },
      { label: 'Switches', value: 'Razer Gen-3 Optical' },
    ],
    prosForCS2: 'The DeathAdder shape is one of the most enduring designs in esports history. The V4 Pro combines that comfort with modern specs — 8KHz polling and flawless optical switches. Pros who prefer ergonomic shapes for long tournament days gravitate toward this mouse for its natural hand position and consistent aim.',
  },
  'ZOWIE EC2-CW': {
    overview: 'The ZOWIE EC2-CW is the wireless version of the legendary EC2 ergonomic mouse. It features ZOWIE\'s 3370 sensor, a 1,000Hz wireless polling rate, and the classic EC2 right-handed ergonomic shape in a medium size. The plug-and-play design requires no software.',
    specs: [
      { label: 'Sensor', value: '3370 (3,200 DPI max)' },
      { label: 'Weight', value: '77g' },
      { label: 'Polling Rate', value: '1,000 Hz (wireless)' },
      { label: 'Connection', value: '2.4GHz Wireless' },
      { label: 'Shape', value: 'Ergonomic Right-Handed (Medium)' },
      { label: 'Battery', value: '~70 hours' },
      { label: 'Switches', value: 'Huano Mechanical' },
    ],
    prosForCS2: 'ZOWIE mice have a deep legacy in Counter-Strike. The EC2 shape is considered one of the best ergonomic designs for FPS, and the wireless CW version removes the cable drag that many pros disliked. Its no-software approach means zero hassle at tournament setups — just plug in the receiver and play.',
  },
  'ZOWIE EC2-C': {
    overview: 'The ZOWIE EC2-C is a wired ergonomic gaming mouse featuring a refined version of the classic EC2 shape. It uses the 3370 sensor, a paracord-style cable, and weighs 73 grams. The medium-sized right-handed shape has been a staple in competitive Counter-Strike for over a decade.',
    specs: [
      { label: 'Sensor', value: '3370 (3,200 DPI max)' },
      { label: 'Weight', value: '73g' },
      { label: 'Polling Rate', value: '1,000 Hz' },
      { label: 'Connection', value: 'Wired (paracord cable)' },
      { label: 'Shape', value: 'Ergonomic Right-Handed (Medium)' },
      { label: 'Switches', value: 'Huano Mechanical' },
    ],
    prosForCS2: 'The EC2 shape is a proven performer in Counter-Strike with over a decade of tournament results. The C-series update improved the cable and reduced weight while keeping the signature ergonomics. Preferred by pros who value a consistent wired connection and the EC2\'s natural palm grip support.',
  },
  'Razer Viper V2 Pro Black': {
    overview: 'The Razer Viper V2 Pro is a 58-gram wireless mouse with the Focus Pro 30K sensor and HyperSpeed Wireless technology. Its low-profile symmetrical shape is designed for competitive FPS, and the optical switches provide consistent, bounce-free clicks.',
    specs: [
      { label: 'Sensor', value: 'Focus Pro 30K (30,000 DPI)' },
      { label: 'Weight', value: '58g' },
      { label: 'Polling Rate', value: '1,000 Hz (wireless)' },
      { label: 'Connection', value: 'HyperSpeed Wireless' },
      { label: 'Shape', value: 'Symmetrical Ambi (low-profile)' },
      { label: 'Battery', value: '~80 hours' },
      { label: 'Switches', value: 'Razer Gen-3 Optical' },
    ],
    prosForCS2: 'The Viper V2 Pro brought Razer back to the top of competitive CS2. Its extremely low weight and clean sensor performance made it a tournament favorite. While the V3 Pro has since launched, many pros stick with the V2 Pro due to familiarity with its shape and feel.',
  },
  'FinalMouse UltralightX': {
    overview: 'The FinalMouse UltralightX is an ultra-lightweight wireless mouse weighing just 41 grams. It features an 8,000Hz polling rate, a custom sensor, and FinalMouse\'s signature minimalist design philosophy. The shell uses a solid construction despite the extremely low weight.',
    specs: [
      { label: 'Sensor', value: 'Custom (26K DPI)' },
      { label: 'Weight', value: '41g' },
      { label: 'Polling Rate', value: '8,000 Hz (wireless)' },
      { label: 'Connection', value: '2.4GHz Wireless' },
      { label: 'Shape', value: 'Symmetrical Ambi' },
      { label: 'Battery', value: '~160 hours' },
      { label: 'Switches', value: 'Mechanical' },
    ],
    prosForCS2: 'At 41 grams, the UltralightX is the lightest mouse used by CS2 pros. The extreme weight reduction allows for effortless large arm movements common in low-sensitivity play, and the 8KHz polling rate delivers the fastest possible response times. A bold choice gaining traction in the pro scene.',
  },
  'Pulsar X2V2': {
    overview: 'The Pulsar X2V2 is a lightweight wireless mouse featuring the PAW3395 sensor, a symmetrical shape, and a 55-gram weight. It offers 4,000Hz wireless polling as an optional upgrade and uses Kailh GM 8.0 switches for crisp clicks.',
    specs: [
      { label: 'Sensor', value: 'PAW3395 (26K DPI)' },
      { label: 'Weight', value: '55g' },
      { label: 'Polling Rate', value: 'Up to 4,000 Hz' },
      { label: 'Connection', value: '2.4GHz Wireless' },
      { label: 'Shape', value: 'Symmetrical Ambi' },
      { label: 'Battery', value: '~70 hours' },
      { label: 'Switches', value: 'Kailh GM 8.0' },
    ],
    prosForCS2: 'The Pulsar X2V2 has earned a loyal following among CS2 pros looking for an alternative to Logitech and Razer. Its slightly wider shape suits medium hands well, the PAW3395 sensor is flawless in game, and the optional 4KHz dongle gives a competitive edge in polling speed.',
  },
};

// ── KEYBOARDS ────────────────────────────────────────────────────────────────

const KEYBOARDS: Record<string, GearDescription> = {
  'Wooting 80HE Black': {
    overview: 'The Wooting 80HE is a TKL (tenkeyless) rapid trigger keyboard with analog Hall Effect switches. It features per-key adjustable actuation from 0.1mm to 4.0mm, Rapid Trigger technology for instant key release detection, and an 8,000Hz polling rate for the fastest possible input.',
    specs: [
      { label: 'Switches', value: 'Lekker (Hall Effect Analog)' },
      { label: 'Layout', value: 'TKL (80%)' },
      { label: 'Actuation', value: '0.1–4.0mm (adjustable)' },
      { label: 'Polling Rate', value: '8,000 Hz' },
      { label: 'Features', value: 'Rapid Trigger, Mod Tap, Toggle' },
      { label: 'Connection', value: 'USB-C Wired' },
    ],
    prosForCS2: 'The Wooting 80HE has become the dominant keyboard in pro CS2 thanks to Rapid Trigger — a feature that resets key input the instant you lift your finger, rather than waiting for a fixed reset point. This allows near-instant counter-strafing for sharper peeking and more responsive movement. The 8KHz polling rate pairs perfectly with high-refresh gaming.',
  },
  'Razer Huntsman V3 Pro TKL Black': {
    overview: 'The Razer Huntsman V3 Pro TKL is Razer\'s answer to rapid trigger keyboards. It features analog optical switches with adjustable actuation down to 0.1mm, Razer\'s Snap Tap (SOCD) and Rapid Trigger technologies, and an 8,000Hz polling rate.',
    specs: [
      { label: 'Switches', value: 'Razer Analog Optical (2nd Gen)' },
      { label: 'Layout', value: 'TKL (80%)' },
      { label: 'Actuation', value: '0.1–4.0mm (adjustable)' },
      { label: 'Polling Rate', value: '8,000 Hz' },
      { label: 'Features', value: 'Rapid Trigger, Snap Tap (SOCD)' },
      { label: 'Connection', value: 'USB-C Wired' },
    ],
    prosForCS2: 'The Huntsman V3 Pro TKL matches the Wooting\'s rapid trigger capability with Razer\'s build quality and ecosystem. Its Snap Tap feature (SOCD filtering) was a major talking point in CS2, allowing instant direction changes. Along with Rapid Trigger, it gives pros razor-sharp movement and counter-strafing.',
  },
  'Razer Huntsman V3 Pro TKL 8KHz Green': {
    overview: 'The Razer Huntsman V3 Pro TKL 8KHz Green Edition is a special colorway of the Huntsman V3 Pro TKL. It features the same analog optical switches, 0.1mm adjustable actuation, Rapid Trigger, Snap Tap, and 8,000Hz polling rate in a distinctive green aesthetic.',
    specs: [
      { label: 'Switches', value: 'Razer Analog Optical (2nd Gen)' },
      { label: 'Layout', value: 'TKL (80%)' },
      { label: 'Actuation', value: '0.1–4.0mm (adjustable)' },
      { label: 'Polling Rate', value: '8,000 Hz' },
      { label: 'Features', value: 'Rapid Trigger, Snap Tap (SOCD)' },
      { label: 'Connection', value: 'USB-C Wired' },
    ],
    prosForCS2: 'Functionally identical to the black version, the green edition is the signature colorway Razer provides to sponsored teams and players. It delivers the same rapid trigger and Snap Tap advantages that make it one of the two dominant keyboard platforms in competitive CS2.',
  },
  'Wooting 60HE+': {
    overview: 'The Wooting 60HE+ is a compact 60% rapid trigger keyboard with Hall Effect analog switches. It pioneered adjustable actuation points and Rapid Trigger in competitive gaming, with per-key tuning from 0.1mm to 4.0mm and an 8,000Hz polling rate.',
    specs: [
      { label: 'Switches', value: 'Lekker (Hall Effect Analog)' },
      { label: 'Layout', value: '60% Compact' },
      { label: 'Actuation', value: '0.1–4.0mm (adjustable)' },
      { label: 'Polling Rate', value: '8,000 Hz' },
      { label: 'Features', value: 'Rapid Trigger, Mod Tap, Toggle' },
      { label: 'Connection', value: 'USB-C Wired' },
    ],
    prosForCS2: 'The 60HE+ started the rapid trigger revolution in competitive CS2. Its compact 60% layout saves desk space for larger mouse movements — ideal for low-sensitivity players. Many pros used this before upgrading to the 80HE, and some still prefer its smaller footprint.',
  },
  'Logitech G Pro X Keyboard': {
    overview: 'The Logitech G Pro X is a TKL mechanical keyboard with hot-swappable switches, allowing players to customize their key feel. It features a compact, tournament-ready design with a detachable USB-C cable and RGB lighting.',
    specs: [
      { label: 'Switches', value: 'Hot-Swappable Mechanical (GX Red/Blue/Brown)' },
      { label: 'Layout', value: 'TKL (87-key)' },
      { label: 'Actuation', value: '1.5–2.0mm (switch dependent)' },
      { label: 'Polling Rate', value: '1,000 Hz' },
      { label: 'Features', value: 'Hot-Swap, RGB, Detachable Cable' },
      { label: 'Connection', value: 'USB-C Wired' },
    ],
    prosForCS2: 'While it lacks rapid trigger, the G Pro X remains popular among Logitech-sponsored pros and players who prefer traditional mechanical switches. The hot-swap capability lets players dial in their preferred switch feel, and the TKL layout is tournament-standard. A reliable choice backed by years of competitive use.',
  },
  'Logitech G Pro X TKL Keyboard Black': {
    overview: 'The Logitech G Pro X TKL is an updated version of the G Pro X keyboard with a refined design, GX2 optical-mechanical switches, and LIGHTSPEED wireless connectivity alongside USB-C wired mode.',
    specs: [
      { label: 'Switches', value: 'GX2 Optical-Mechanical' },
      { label: 'Layout', value: 'TKL (87-key)' },
      { label: 'Actuation', value: '1.3mm' },
      { label: 'Polling Rate', value: '1,000 Hz' },
      { label: 'Features', value: 'Wireless + Wired, RGB' },
      { label: 'Connection', value: 'LIGHTSPEED Wireless / USB-C' },
    ],
    prosForCS2: 'The updated G Pro X TKL modernizes Logitech\'s competitive keyboard offering with optical-mechanical switches for faster actuation than traditional mechanical. While it doesn\'t have rapid trigger, its wireless capability reduces cable clutter at tournament stations, and the optical switches eliminate debounce delay.',
  },
};

// ── HEADSETS ─────────────────────────────────────────────────────────────────

const HEADSETS: Record<string, GearDescription> = {
  'HyperX Cloud II': {
    overview: 'The HyperX Cloud II is a wired gaming headset with 53mm drivers, memory foam ear cushions, and a detachable noise-canceling microphone. Its closed-back design provides passive noise isolation, and it includes a USB sound card with virtual 7.1 surround sound.',
    specs: [
      { label: 'Driver', value: '53mm Neodymium' },
      { label: 'Type', value: 'Closed-Back Over-Ear' },
      { label: 'Frequency', value: '15Hz–25kHz' },
      { label: 'Connection', value: '3.5mm / USB Sound Card' },
      { label: 'Microphone', value: 'Detachable, Noise-Canceling' },
      { label: 'Weight', value: '275g (without cable)' },
    ],
    prosForCS2: 'The HyperX Cloud II is by far the most popular headset in professional CS2. Pros value its comfort for 10+ hour practice days, reliable audio positioning for footstep detection, and the durable build that survives constant travel. Its closed-back design blocks crowd noise at LAN events — a critical advantage in high-stakes matches.',
  },
  'HyperX Cloud II Wireless': {
    overview: 'The HyperX Cloud II Wireless is the wireless version of the legendary Cloud II, featuring 53mm drivers, up to 30 hours of battery life, and a 2.4GHz wireless connection. It maintains the same comfort and audio signature pros rely on.',
    specs: [
      { label: 'Driver', value: '53mm Neodymium' },
      { label: 'Type', value: 'Closed-Back Over-Ear' },
      { label: 'Frequency', value: '15Hz–20kHz' },
      { label: 'Connection', value: '2.4GHz Wireless' },
      { label: 'Battery', value: '~30 hours' },
      { label: 'Weight', value: '309g' },
    ],
    prosForCS2: 'The wireless Cloud II gives pros the freedom of no cable while keeping the audio signature and comfort of the original. The 2.4GHz connection offers low-latency audio critical for competitive play, and the 30-hour battery easily lasts through tournament days.',
  },
  'HyperX Cloud III': {
    overview: 'The HyperX Cloud III builds on the Cloud II legacy with angled 53mm drivers for improved soundstage, ultra-soft memory foam cushions, and a durable aluminum frame. It connects via 3.5mm or USB-C and features DTS Headphone:X spatial audio.',
    specs: [
      { label: 'Driver', value: '53mm Angled Neodymium' },
      { label: 'Type', value: 'Closed-Back Over-Ear' },
      { label: 'Frequency', value: '10Hz–21kHz' },
      { label: 'Connection', value: '3.5mm / USB-C' },
      { label: 'Microphone', value: 'Detachable, Noise-Canceling' },
      { label: 'Weight', value: '293g' },
    ],
    prosForCS2: 'The Cloud III refines the Cloud II formula with angled drivers that improve directional audio — useful for pinpointing enemy footsteps and gunfire direction in CS2. The upgraded cushions increase comfort for extended sessions, while maintaining the durability and passive isolation that made HyperX the go-to headset brand in esports.',
  },
  'Logitech G Pro X Headset': {
    overview: 'The Logitech G Pro X is a wired gaming headset co-developed with pro players, featuring 50mm Pro-G drivers, memory foam leatherette or velour ear pads, and Blue VO!CE microphone technology for real-time voice filtering.',
    specs: [
      { label: 'Driver', value: '50mm Pro-G' },
      { label: 'Type', value: 'Closed-Back Over-Ear' },
      { label: 'Frequency', value: '20Hz–20kHz' },
      { label: 'Connection', value: '3.5mm / USB DAC' },
      { label: 'Microphone', value: 'Detachable with Blue VO!CE' },
      { label: 'Weight', value: '320g' },
    ],
    prosForCS2: 'The G Pro X Headset is the second most popular headset in pro CS2, favored by players in the Logitech ecosystem. Blue VO!CE microphone tech delivers clear team communication, and the dual-pad system lets players choose between leather (more isolation) and velour (more breathable) based on tournament conditions.',
  },
  'Logitech G PRO X 2 Headset Black': {
    overview: 'The Logitech G PRO X 2 is a wireless gaming headset with 50mm graphene drivers, LIGHTSPEED and Bluetooth connectivity, and up to 50 hours of battery life. It features a lightweight design at 345g and DTS Headphone:X 2.0 spatial audio.',
    specs: [
      { label: 'Driver', value: '50mm Graphene' },
      { label: 'Type', value: 'Closed-Back Over-Ear' },
      { label: 'Frequency', value: '20Hz–20kHz' },
      { label: 'Connection', value: 'LIGHTSPEED Wireless / Bluetooth / 3.5mm' },
      { label: 'Battery', value: '~50 hours' },
      { label: 'Microphone', value: 'Detachable, Beamforming' },
      { label: 'Weight', value: '345g' },
    ],
    prosForCS2: 'The G PRO X 2 upgrades to graphene drivers for improved clarity and bass response, while 50 hours of wireless battery life means pros never worry about charging during events. The tri-mode connectivity (LIGHTSPEED, Bluetooth, wired) provides flexibility for different tournament setups.',
  },
  'Razer BlackShark V2 Pro Black': {
    overview: 'The Razer BlackShark V2 Pro is a wireless esports headset with custom-tuned 50mm titanium-coated drivers, THX Spatial Audio, and HyperClear Super Wideband microphone. The closed-back design with breathable memory foam cushions prioritizes comfort and isolation.',
    specs: [
      { label: 'Driver', value: '50mm Titanium-Coated' },
      { label: 'Type', value: 'Closed-Back Over-Ear' },
      { label: 'Frequency', value: '12Hz–28kHz' },
      { label: 'Connection', value: '2.4GHz Wireless / 3.5mm' },
      { label: 'Battery', value: '~70 hours' },
      { label: 'Microphone', value: 'Detachable, HyperClear Super Wideband' },
      { label: 'Weight', value: '320g' },
    ],
    prosForCS2: 'The BlackShark V2 Pro is Razer\'s esports-focused headset, popular among Razer-sponsored players and beyond. Its tuning emphasizes the mid-high frequencies where footsteps and utility sounds live in CS2, giving players an audio advantage in clutch situations. The 70-hour battery life is class-leading.',
  },
  'Razer BlackShark V3 Pro Green': {
    overview: 'The Razer BlackShark V3 Pro is the latest evolution of Razer\'s esports headset line, featuring upgraded 50mm bio-cellulose drivers, an improved HyperClear Wideband microphone, and up to 80 hours of wireless battery life. It supports both 2.4GHz and Bluetooth connections.',
    specs: [
      { label: 'Driver', value: '50mm Bio-Cellulose' },
      { label: 'Type', value: 'Closed-Back Over-Ear' },
      { label: 'Frequency', value: '12Hz–28kHz' },
      { label: 'Connection', value: '2.4GHz Wireless / Bluetooth / 3.5mm' },
      { label: 'Battery', value: '~80 hours' },
      { label: 'Microphone', value: 'Detachable, HyperClear Wideband' },
      { label: 'Weight', value: '310g' },
    ],
    prosForCS2: 'The BlackShark V3 Pro refines the audio tuning that made the V2 Pro popular, with bio-cellulose drivers delivering cleaner sound across the frequency range. The 80-hour battery is virtually limitless for tournament use, and the improved mic ensures clear callouts during intense rounds.',
  },
};

// ── MONITORS ─────────────────────────────────────────────────────────────────

const MONITORS: Record<string, GearDescription> = {
  'ZOWIE XL2566K': {
    overview: 'The BenQ ZOWIE XL2566K is a 24.5-inch 360Hz esports monitor with a TN panel, DyAc+ (Dynamic Accuracy+) technology for motion blur reduction, and Black eQualizer for visibility in dark areas. It is the most popular monitor in professional CS2.',
    specs: [
      { label: 'Panel', value: 'TN' },
      { label: 'Size', value: '24.5"' },
      { label: 'Refresh Rate', value: '360 Hz' },
      { label: 'Resolution', value: '1920x1080 (FHD)' },
      { label: 'Response Time', value: '0.5ms (GtG)' },
      { label: 'Features', value: 'DyAc+, Black eQualizer, XL Setting to Share' },
    ],
    prosForCS2: 'The XL2566K is the most used monitor in professional CS2 by a significant margin. DyAc+ virtually eliminates motion blur during fast flicks and sprays, making targets appear sharper in motion. The 360Hz refresh rate combined with a fast TN panel delivers the lowest input lag available, and XL Setting to Share lets pros instantly load their monitor config at any tournament.',
  },
  'ZOWIE XL2546K': {
    overview: 'The BenQ ZOWIE XL2546K is a 24.5-inch 240Hz esports monitor with a TN panel and DyAc+ technology. A long-standing staple in competitive FPS, it offers proven performance with Black eQualizer and Color Vibrance adjustments.',
    specs: [
      { label: 'Panel', value: 'TN' },
      { label: 'Size', value: '24.5"' },
      { label: 'Refresh Rate', value: '240 Hz' },
      { label: 'Resolution', value: '1920x1080 (FHD)' },
      { label: 'Response Time', value: '0.5ms (GtG)' },
      { label: 'Features', value: 'DyAc+, Black eQualizer, S-Switch' },
    ],
    prosForCS2: 'The XL2546K was the tournament standard for years and remains the second most popular pro monitor. While the 360Hz XL2566K is newer, many pros stick with the 240Hz XL2546K because they\'re accustomed to it and the DyAc+ implementation is identical. The reliability and familiarity factor in competitive play should not be underestimated.',
  },
  'ZOWIE XL2586X+': {
    overview: 'The BenQ ZOWIE XL2586X+ is a 24.5-inch 540Hz Fast-IPS esports monitor — the fastest refresh rate available in a gaming display. It features DyAc 2 technology, an upgraded version of ZOWIE\'s motion blur reduction, with dramatically improved clarity.',
    specs: [
      { label: 'Panel', value: 'Fast IPS' },
      { label: 'Size', value: '24.5"' },
      { label: 'Refresh Rate', value: '540 Hz' },
      { label: 'Resolution', value: '1920x1080 (FHD)' },
      { label: 'Response Time', value: '0.5ms (GtG)' },
      { label: 'Features', value: 'DyAc 2, Black eQualizer, XL Setting to Share' },
    ],
    prosForCS2: 'The XL2586X+ represents the cutting edge of esports displays. At 540Hz, motion appears incredibly smooth and input lag is at its absolute minimum. DyAc 2 pairs with the Fast IPS panel for even cleaner motion than previous TN models. Adoption is growing rapidly among pros looking for every possible visual advantage.',
  },
  'ZOWIE XL2566X+': {
    overview: 'The BenQ ZOWIE XL2566X+ is a 24.5-inch 360Hz Fast-IPS esports monitor that combines the popular 360Hz refresh rate with an IPS panel for improved color accuracy over TN. Features DyAc 2 technology and all standard ZOWIE esports features.',
    specs: [
      { label: 'Panel', value: 'Fast IPS' },
      { label: 'Size', value: '24.5"' },
      { label: 'Refresh Rate', value: '360 Hz' },
      { label: 'Resolution', value: '1920x1080 (FHD)' },
      { label: 'Response Time', value: '0.5ms (GtG)' },
      { label: 'Features', value: 'DyAc 2, Black eQualizer, XL Setting to Share' },
    ],
    prosForCS2: 'The XL2566X+ brings ZOWIE\'s new Fast IPS panel technology to the popular 360Hz category. Pros get better color reproduction and viewing angles over the TN-based XL2566K while maintaining the speed that competitive CS2 demands. DyAc 2 further improves motion clarity over the original DyAc+.',
  },
  'ZOWIE XL2546': {
    overview: 'The BenQ ZOWIE XL2546 is the original 240Hz DyAc esports monitor that established ZOWIE\'s dominance in competitive gaming. It features a 24.5-inch TN panel with the first generation of DyAc and ZOWIE\'s Shield accessory for reduced visual distractions.',
    specs: [
      { label: 'Panel', value: 'TN' },
      { label: 'Size', value: '24.5"' },
      { label: 'Refresh Rate', value: '240 Hz' },
      { label: 'Resolution', value: '1920x1080 (FHD)' },
      { label: 'Response Time', value: '1ms (GtG)' },
      { label: 'Features', value: 'DyAc, Black eQualizer, Shield' },
    ],
    prosForCS2: 'The original XL2546 set the standard for competitive monitors. While newer models have surpassed it in specs, some veteran pros still use it — a testament to how important comfort and familiarity are in competitive play. Its DyAc technology, though first-gen, still provides meaningful motion clarity improvements.',
  },
  'ZOWIE XL2540': {
    overview: 'The BenQ ZOWIE XL2540 is a 24.5-inch 240Hz TN esports monitor from ZOWIE\'s classic lineup. It features Black eQualizer, Color Vibrance, and the ZOWIE Shield for distraction-free competitive gaming.',
    specs: [
      { label: 'Panel', value: 'TN' },
      { label: 'Size', value: '24.5"' },
      { label: 'Refresh Rate', value: '240 Hz' },
      { label: 'Resolution', value: '1920x1080 (FHD)' },
      { label: 'Response Time', value: '1ms (GtG)' },
      { label: 'Features', value: 'Black eQualizer, Color Vibrance, Shield' },
    ],
    prosForCS2: 'The XL2540 is one of the earlier 240Hz monitors in the ZOWIE lineup. Pros who\'ve used it for years sometimes keep it due to muscle memory with its specific color and motion handling. While newer models offer DyAc and faster panels, the XL2540 still delivers the core 240Hz experience that competitive CS2 requires.',
  },
  'ZOWIE XL2540K': {
    overview: 'The BenQ ZOWIE XL2540K is an updated 24.5-inch 240Hz TN monitor with a smaller base design, improved ergonomics, and ZOWIE\'s XL Setting to Share feature. It offers a streamlined tournament setup without DyAc.',
    specs: [
      { label: 'Panel', value: 'TN' },
      { label: 'Size', value: '24.5"' },
      { label: 'Refresh Rate', value: '240 Hz' },
      { label: 'Resolution', value: '1920x1080 (FHD)' },
      { label: 'Response Time', value: '1ms (GtG)' },
      { label: 'Features', value: 'Black eQualizer, XL Setting to Share' },
    ],
    prosForCS2: 'The XL2540K modernizes the XL2540 with a smaller stand footprint and XL Setting to Share for quick setup at tournaments. While it doesn\'t include DyAc, some pros prefer the raw panel response without blur reduction. Its reliable 240Hz TN panel has been a competitive staple for years.',
  },
  'ZOWIE XL2586X': {
    overview: 'The BenQ ZOWIE XL2586X is a 24.5-inch 540Hz Fast-IPS esports monitor similar to the XL2586X+ but without some of the plus-model enhancements. It still delivers the industry-leading 540Hz refresh rate with DyAc 2 technology.',
    specs: [
      { label: 'Panel', value: 'Fast IPS' },
      { label: 'Size', value: '24.5"' },
      { label: 'Refresh Rate', value: '540 Hz' },
      { label: 'Resolution', value: '1920x1080 (FHD)' },
      { label: 'Response Time', value: '0.5ms (GtG)' },
      { label: 'Features', value: 'DyAc 2, Black eQualizer' },
    ],
    prosForCS2: 'At 540Hz, this monitor delivers the smoothest possible visuals in CS2. The Fast IPS panel provides better color reproduction than traditional TN monitors while maintaining the speed required for competitive play. DyAc 2 further reduces perceived motion blur for cleaner target tracking during high-speed engagements.',
  },
  'ASUS ROG SWIFT PG259QN': {
    overview: 'The ASUS ROG SWIFT PG259QN is a 24.5-inch 360Hz Fast-IPS gaming monitor with NVIDIA G-Sync, NVIDIA Reflex Latency Analyzer, and HDR10 support. It offers an alternative to ZOWIE\'s dominance with strong color accuracy.',
    specs: [
      { label: 'Panel', value: 'Fast IPS' },
      { label: 'Size', value: '24.5"' },
      { label: 'Refresh Rate', value: '360 Hz' },
      { label: 'Resolution', value: '1920x1080 (FHD)' },
      { label: 'Response Time', value: '1ms (GtG)' },
      { label: 'Features', value: 'G-Sync, Reflex Analyzer, HDR10' },
    ],
    prosForCS2: 'The PG259QN is the leading non-ZOWIE option among CS2 pros. Its Fast IPS panel delivers excellent color and response times, while the built-in Reflex Latency Analyzer helps players and teams measure and minimize their total system latency. A strong choice for pros who want 360Hz without ZOWIE\'s TN panels.',
  },
  'Alienware AW2521H': {
    overview: 'The Alienware AW2521H is a 24.5-inch 360Hz IPS gaming monitor with NVIDIA G-Sync and Reflex Latency Analyzer. It features a sleek design, factory-calibrated colors, and the speed demanded by competitive FPS.',
    specs: [
      { label: 'Panel', value: 'IPS' },
      { label: 'Size', value: '24.5"' },
      { label: 'Refresh Rate', value: '360 Hz' },
      { label: 'Resolution', value: '1920x1080 (FHD)' },
      { label: 'Response Time', value: '1ms (GtG)' },
      { label: 'Features', value: 'G-Sync, Reflex Analyzer' },
    ],
    prosForCS2: 'The Alienware AW2521H offers a premium 360Hz IPS experience with better out-of-box color accuracy than most competing monitors. Some pros prefer it for its IPS panel characteristics — wider viewing angles and more natural colors — while still getting the 360Hz speed needed for competitive CS2.',
  },
};

// ── MOUSEPADS ────────────────────────────────────────────────────────────────

const MOUSEPADS: Record<string, GearDescription> = {
  'SteelSeries QcK Heavy': {
    overview: 'The SteelSeries QcK Heavy is a thick (6mm) cloth mousepad with a micro-woven surface and a non-slip rubber base. Its extra thickness provides a cushioned feel that absorbs impact, and the cloth surface delivers consistent, controlled tracking.',
    specs: [
      { label: 'Surface', value: 'Cloth (Micro-Woven)' },
      { label: 'Size', value: '450 x 400 x 6mm (Large)' },
      { label: 'Base', value: 'Non-Slip Rubber' },
      { label: 'Thickness', value: '6mm' },
      { label: 'Type', value: 'Control' },
    ],
    prosForCS2: 'The QcK Heavy is the most popular mousepad in professional CS2. Its thick 6mm construction absorbs arm pressure for a consistent glide regardless of how hard a player presses down during tense moments. The cloth surface prioritizes control over speed, which suits the precise micro-adjustments needed for CS2 crosshair placement.',
  },
  'Razer Gigantus V2': {
    overview: 'The Razer Gigantus V2 is a soft cloth mousepad available in multiple sizes, featuring a textured micro-weave surface for balanced speed and control. The anti-slip rubber base keeps it stable during intense gameplay.',
    specs: [
      { label: 'Surface', value: 'Cloth (Micro-Weave)' },
      { label: 'Size', value: 'Multiple (up to 940 x 410 x 4mm)' },
      { label: 'Base', value: 'Anti-Slip Rubber' },
      { label: 'Thickness', value: '3–4mm' },
      { label: 'Type', value: 'Balanced (Speed/Control)' },
    ],
    prosForCS2: 'The Gigantus V2 offers a middle ground between speed and control that many pros appreciate. Its large size options give low-sensitivity players plenty of room for wide sweeps, and the consistent surface texture ensures reliable tracking across the entire pad. A strong all-rounder at a competitive price.',
  },
  'ZOWIE G-SR': {
    overview: 'The ZOWIE G-SR is a deep control cloth mousepad designed specifically for esports. Its rubber surface coating creates high initial friction for stopping power, making it ideal for players who need precise, controlled movements.',
    specs: [
      { label: 'Surface', value: 'Cloth (Rubber-Coated)' },
      { label: 'Size', value: '480 x 400 x 3.5mm' },
      { label: 'Base', value: 'Non-Slip Rubber' },
      { label: 'Thickness', value: '3.5mm' },
      { label: 'Type', value: 'Heavy Control' },
    ],
    prosForCS2: 'The G-SR is known as one of the slowest, most controlled mousepads in esports. Pros who play at higher sensitivities or want maximum stopping power choose the G-SR for its ability to hold the crosshair perfectly still. The trade-off is slower large movements, but for players who value precision above all, it\'s the gold standard.',
  },
  'SteelSeries QcK+': {
    overview: 'The SteelSeries QcK+ is a large cloth mousepad with a smooth micro-woven surface. Thinner than the QcK Heavy at 2mm, it provides a different feel with the surface sitting closer to the desk for a harder, slightly faster glide.',
    specs: [
      { label: 'Surface', value: 'Cloth (Micro-Woven)' },
      { label: 'Size', value: '450 x 400 x 2mm (Large)' },
      { label: 'Base', value: 'Non-Slip Rubber' },
      { label: 'Thickness', value: '2mm' },
      { label: 'Type', value: 'Balanced' },
    ],
    prosForCS2: 'The QcK+ offers the same reliable SteelSeries cloth surface as the Heavy but at 2mm thickness. Pros who prefer a harder surface feel or a slightly faster glide choose this over the thicker variant. It\'s been a tournament staple for nearly two decades — few products in esports have that kind of track record.',
  },
  'Artisan Ninja FX Zero XSoft Black': {
    overview: 'The Artisan Ninja FX Zero is a Japanese-made cloth mousepad renowned for its premium weave and consistency. The XSoft variant uses the softest sponge base, creating a plush feel that absorbs pressure while the Zero surface provides moderate speed with good control.',
    specs: [
      { label: 'Surface', value: 'Cloth (Custom Weave)' },
      { label: 'Size', value: 'Multiple (up to XL)' },
      { label: 'Base', value: 'Non-Slip Rubber (XSoft Sponge)' },
      { label: 'Thickness', value: '4mm' },
      { label: 'Type', value: 'Balanced (Moderate Speed)' },
    ],
    prosForCS2: 'Artisan pads are considered the premium choice in competitive FPS. The Zero XSoft\'s unique sponge base sinks under arm weight, increasing surface contact and control during pressure situations. Its consistency doesn\'t degrade with humidity like some pads, which matters at warm LAN venues. Highly sought after by discerning pros.',
  },
  'Artisan Ninja FX Zero Soft Black': {
    overview: 'The Artisan Ninja FX Zero Soft is the medium-firmness variant of the Zero, offering a balance between the plush XSoft and the firm Mid sponge. The Zero surface provides moderate speed with reliable stopping power.',
    specs: [
      { label: 'Surface', value: 'Cloth (Custom Weave)' },
      { label: 'Size', value: 'Multiple (up to XL)' },
      { label: 'Base', value: 'Non-Slip Rubber (Soft Sponge)' },
      { label: 'Thickness', value: '4mm' },
      { label: 'Type', value: 'Balanced (Moderate Speed)' },
    ],
    prosForCS2: 'The Soft variant gives a firmer base than the XSoft, which some pros prefer for more consistent glide regardless of arm pressure. The Zero surface itself is the most popular Artisan surface in CS2 — fast enough for comfortable sweeps, slow enough for precise micro-adjustments when holding angles.',
  },
  'ZOWIE G-SR III': {
    overview: 'The ZOWIE G-SR III is the third generation of ZOWIE\'s control-oriented mousepad. It refines the surface coating for more consistent performance across different humidity levels while maintaining the high-control characteristics the G-SR line is known for.',
    specs: [
      { label: 'Surface', value: 'Cloth (Updated Coating)' },
      { label: 'Size', value: '480 x 400 x 3.5mm' },
      { label: 'Base', value: 'Non-Slip Rubber' },
      { label: 'Thickness', value: '3.5mm' },
      { label: 'Type', value: 'Control' },
    ],
    prosForCS2: 'The G-SR III addresses the main criticism of the original G-SR — inconsistency in humid conditions. The updated surface maintains control-oriented characteristics while performing more reliably regardless of temperature and humidity. For pros who loved the G-SR\'s stopping power but found it unreliable at some venues, this is the upgrade.',
  },
  'VAXEE PA Black': {
    overview: 'The VAXEE PA is a cloth mousepad from VAXEE, a brand founded by former ZOWIE engineers. It features a balanced surface that sits between speed and control, with a firm rubber base and consistent weave across the entire pad.',
    specs: [
      { label: 'Surface', value: 'Cloth (Balanced Weave)' },
      { label: 'Size', value: '470 x 390 x 3mm' },
      { label: 'Base', value: 'Firm Rubber' },
      { label: 'Thickness', value: '3mm' },
      { label: 'Type', value: 'Balanced' },
    ],
    prosForCS2: 'VAXEE\'s heritage from former ZOWIE designers shows in the PA\'s quality. The balanced surface suits players who don\'t want to commit to full control or full speed. Its consistency across the pad and resilience to wear make it a growing favorite among pros looking for something between the QcK Heavy and faster alternatives.',
  },
  'Logitech G640 Black': {
    overview: 'The Logitech G640 is a large soft cloth mousepad with a moderate-friction surface tuned for Logitech sensors. It provides consistent tracking across its 460 x 400mm surface and features a 1mm rubber base.',
    specs: [
      { label: 'Surface', value: 'Cloth (Soft)' },
      { label: 'Size', value: '460 x 400 x 3mm' },
      { label: 'Base', value: 'Non-Slip Rubber' },
      { label: 'Thickness', value: '3mm' },
      { label: 'Type', value: 'Balanced (Moderate Speed)' },
    ],
    prosForCS2: 'The G640 is Logitech\'s flagship esports mousepad and pairs naturally with Logitech mice. Its moderate speed surface is comfortable for both low-sens arm aimers and higher-sens wrist players. Pros in the Logitech ecosystem often default to the G640 for its reliable, consistent performance.',
  },
};

// ── Merge all descriptions into a single map ────────────────────────────────

const ALL_DESCRIPTIONS: Record<string, GearDescription> = {
  ...MICE,
  ...KEYBOARDS,
  ...HEADSETS,
  ...MONITORS,
  ...MOUSEPADS,
};

// ── Color/variant aliases → point to the same description ────────────────────

const ALIASES: Record<string, string> = {
  // Mouse color variants
  'Logitech G Pro X Superlight 2 Magenta': 'Logitech G Pro X Superlight 2 Black',
  'Logitech G Pro X Superlight 2 White': 'Logitech G Pro X Superlight 2 Black',
  'Logitech G Pro X Superlight 2 Pink': 'Logitech G Pro X Superlight 2 Black',
  'Logitech G Pro X Superlight White': 'Logitech G Pro X Superlight Black',
  'Logitech G Pro X Superlight Red': 'Logitech G Pro X Superlight Black',
  'Razer Viper V3 Pro White': 'Razer Viper V3 Pro Black',
  'Razer DeathAdder V4 Pro Green': 'Razer DeathAdder V4 Pro Black',
  'Razer DeathAdder V4 Pro White': 'Razer DeathAdder V4 Pro Black',
  'Razer Viper V2 Pro White': 'Razer Viper V2 Pro Black',
  // Keyboard color variants
  'Wooting 80HE Frost': 'Wooting 80HE Black',
  'Wooting 80HE Ghost': 'Wooting 80HE Black',
  'Wooting 80HE White': 'Wooting 80HE Black',
  'Razer Huntsman V3 Pro TKL White': 'Razer Huntsman V3 Pro TKL Black',
  // Headset color variants
  'Razer BlackShark V2 Pro White': 'Razer BlackShark V2 Pro Black',
  'Razer BlackShark V2 Pro Green': 'Razer BlackShark V2 Pro Black',
  'Razer BlackShark V3 Pro Black': 'Razer BlackShark V3 Pro Green',
  'Razer BlackShark V3 Pro White': 'Razer BlackShark V3 Pro Green',
  'Logitech G PRO X 2 Headset White': 'Logitech G PRO X 2 Headset Black',
};

// ── Generic fallback descriptions by type ────────────────────────────────────

const GENERIC: Record<string, { overview: string; prosForCS2: string }> = {
  mouse: {
    overview: 'A gaming mouse used by professional CS2 players. Gaming mice designed for competitive FPS typically feature high-precision optical sensors, lightweight construction, and low-latency wired or wireless connectivity.',
    prosForCS2: 'Competitive CS2 demands precise, consistent mouse input. Pros choose their mouse based on sensor accuracy, weight, shape comfort for their grip style, and connection reliability. The right mouse is deeply personal — the best choice is the one that feels natural and lets you aim without thinking about your hardware.',
  },
  keyboard: {
    overview: 'A gaming keyboard used by professional CS2 players. Modern competitive keyboards increasingly feature analog switches with rapid trigger technology, allowing near-instant key release detection for faster counter-strafing.',
    prosForCS2: 'In CS2, keyboard input directly affects movement mechanics. Rapid trigger keyboards have become dominant in the pro scene because they enable faster counter-strafing — the technique of instantly stopping to shoot accurately. Even without rapid trigger, a reliable keyboard with a comfortable layout is essential for consistent performance.',
  },
  headset: {
    overview: 'A gaming headset used by professional CS2 players. Competitive headsets prioritize accurate audio positioning for hearing footsteps and utility sounds, comfortable long-session wear, and a clear microphone for team communication.',
    prosForCS2: 'Audio is a critical competitive advantage in CS2. Hearing an enemy\'s footsteps, reload sounds, or grenade pins can win rounds. Pros choose headsets that accurately reproduce directional audio cues while blocking ambient noise at LAN events. Comfort matters equally — many pros practice 8-12 hours daily.',
  },
  monitor: {
    overview: 'A gaming monitor used by professional CS2 players. Competitive monitors feature high refresh rates (240Hz–540Hz), fast panel response times, and low input lag to display frames as quickly as possible.',
    prosForCS2: 'High refresh rate monitors are essential for competitive CS2. More frames per second mean smoother motion, easier target tracking, and lower input lag. Most pros use at least 240Hz, with 360Hz and 540Hz becoming standard at top events. Monitor choice directly impacts how clearly you can see and react to fast-moving targets.',
  },
  mousepad: {
    overview: 'A gaming mousepad used by professional CS2 players. Competitive mousepads vary from high-control cloth surfaces to faster hard pads, with size and thickness also affecting the feel and performance.',
    prosForCS2: 'The mousepad is often overlooked but significantly affects aim in CS2. Control pads help with precise micro-adjustments for holding angles, while faster pads suit aggressive flick-heavy playstyles. Pad thickness affects how much the surface compresses under arm weight. Most pros use large cloth pads for the balance of speed and control.',
  },
};

// ── Public lookup function ───────────────────────────────────────────────────

export function getGearDescription(name: string, type: string): { overview: string; specs: { label: string; value: string }[] | null; prosForCS2: string } {
  const desc = ALL_DESCRIPTIONS[name] ?? ALL_DESCRIPTIONS[ALIASES[name] ?? ''];
  if (desc) return desc;
  const fallback = GENERIC[type];
  if (fallback) return { overview: fallback.overview, specs: null, prosForCS2: fallback.prosForCS2 };
  return { overview: '', specs: null, prosForCS2: '' };
}
