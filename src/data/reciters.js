// Official MP3Quran.net Reciters with verified 114 Surah Timing Data
// Audio files are hosted on MP3Quran's high-speed CDN and server8.mp3quran.net with CORS support.

export const RECITERS = [
  {
    id: "alafasy",
    readId: 123,
    name: "Mishary Rashid Alafasy",
    arabic: "مشاري بن راشد العفاسي",
    rewaya: "Hafs 'an 'Asim",
    quality: "128 kbps Studio (MP3Quran)",
    folderUrl: "https://cdn.mp3quran.net/audio/mishary-alafasy/r1/",
    serverFallback: "https://server8.mp3quran.net/afs/",
    getSurahUrls: (surah) => {
      const s = String(surah).padStart(3, "0");
      return [
        `https://cdn.mp3quran.net/audio/mishary-alafasy/r1/${s}.mp3`,
        `https://server8.mp3quran.net/afs/${s}.mp3`,
      ];
    },
  },
  {
    id: "abdulbasit",
    readId: 53,
    name: "Abdul Basit Abdul Samad (Murattal)",
    arabic: "عبد الباسط عبد الصمد (مرتل)",
    rewaya: "Hafs 'an 'Asim (Murattal)",
    quality: "128 kbps Classic (MP3Quran)",
    folderUrl: "https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3/",
    serverFallback: "https://server8.mp3quran.net/basit/",
    getSurahUrls: (surah) => {
      const s = String(surah).padStart(3, "0");
      return [
        `https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3/${s}.mp3`,
        `https://server8.mp3quran.net/basit/${s}.mp3`,
      ];
    },
  },
  {
    id: "abdulbasit_mujawwad",
    readId: 51,
    name: "Abdul Basit Abdul Samad (Mujawwad)",
    arabic: "عبد الباسط عبد الصمد (مجود)",
    rewaya: "Al-Mus'haf Al-Mujawwad",
    quality: "128 kbps Mujawwad (MP3Quran)",
    folderUrl: "https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r1/",
    serverFallback: "https://server8.mp3quran.net/basit_mjwd/",
    getSurahUrls: (surah) => {
      const s = String(surah).padStart(3, "0");
      return [
        `https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r1/${s}.mp3`,
        `https://server8.mp3quran.net/basit_mjwd/${s}.mp3`,
      ];
    },
  },
  {
    id: "husary",
    readId: 118,
    name: "Mahmoud Khalil Al-Husary",
    arabic: "محمود خليل الحصري",
    rewaya: "Hafs 'an 'Asim",
    quality: "128 kbps Classic (MP3Quran)",
    folderUrl: "https://cdn.mp3quran.net/audio/mahmoud-husary/r1/",
    serverFallback: "https://server8.mp3quran.net/husr/",
    getSurahUrls: (surah) => {
      const s = String(surah).padStart(3, "0");
      return [
        `https://cdn.mp3quran.net/audio/mahmoud-husary/r1/${s}.mp3`,
        `https://server8.mp3quran.net/husr/${s}.mp3`,
      ];
    },
  },
  {
    id: "minshawi",
    readId: 112,
    name: "Mohamed Siddiq Al-Minshawi (Murattal)",
    arabic: "محمد صديق المنشاوي (مرتل)",
    rewaya: "Hafs 'an 'Asim",
    quality: "128 kbps Studio (MP3Quran)",
    folderUrl: "https://cdn.mp3quran.net/audio/muhammad-minshawi/r1/",
    serverFallback: "https://server8.mp3quran.net/minsh/",
    getSurahUrls: (surah) => {
      const s = String(surah).padStart(3, "0");
      return [
        `https://cdn.mp3quran.net/audio/muhammad-minshawi/r1/${s}.mp3`,
        `https://server8.mp3quran.net/minsh/${s}.mp3`,
      ];
    },
  },
  {
    id: "ghamdi",
    readId: 30,
    name: "Saad Al-Ghamdi",
    arabic: "سعد الغامدي",
    rewaya: "Hafs 'an 'Asim",
    quality: "128 kbps (MP3Quran)",
    folderUrl: "https://cdn.mp3quran.net/audio/saad-ghamdi/r1/",
    serverFallback: "https://server8.mp3quran.net/ghamdi/",
    getSurahUrls: (surah) => {
      const s = String(surah).padStart(3, "0");
      return [
        `https://cdn.mp3quran.net/audio/saad-ghamdi/r1/${s}.mp3`,
        `https://server8.mp3quran.net/ghamdi/${s}.mp3`,
      ];
    },
  },
  {
    id: "sudais",
    readId: 54,
    name: "Abdur-Rahman As-Sudais",
    arabic: "عبد الرحمن السديس",
    rewaya: "Hafs 'an 'Asim (Haram Makkah)",
    quality: "128 kbps (MP3Quran)",
    folderUrl: "https://cdn.mp3quran.net/audio/abdulrahman-sudais/r1/",
    serverFallback: "https://server8.mp3quran.net/soudais/",
    getSurahUrls: (surah) => {
      const s = String(surah).padStart(3, "0");
      return [
        `https://cdn.mp3quran.net/audio/abdulrahman-sudais/r1/${s}.mp3`,
        `https://server8.mp3quran.net/soudais/${s}.mp3`,
      ];
    },
  },
  {
    id: "shuraim",
    readId: 31,
    name: "Saud Ash-Shuraim",
    arabic: "سعود الشريم",
    rewaya: "Hafs 'an 'Asim (Haram Makkah)",
    quality: "128 kbps (MP3Quran)",
    folderUrl: "https://cdn.mp3quran.net/audio/saud-shuraim/r1/",
    serverFallback: "https://server8.mp3quran.net/shur/",
    getSurahUrls: (surah) => {
      const s = String(surah).padStart(3, "0");
      return [
        `https://cdn.mp3quran.net/audio/saud-shuraim/r1/${s}.mp3`,
        `https://server8.mp3quran.net/shur/${s}.mp3`,
      ];
    },
  },
  {
    id: "ajmi",
    readId: 5,
    name: "Ahmad Al-Ajmi",
    arabic: "أحمد بن علي العجمي",
    rewaya: "Hafs 'an 'Asim",
    quality: "128 kbps (MP3Quran)",
    folderUrl: "https://cdn.mp3quran.net/audio/ahmad-ajmi/r1/",
    serverFallback: "https://server8.mp3quran.net/ajm/",
    getSurahUrls: (surah) => {
      const s = String(surah).padStart(3, "0");
      return [
        `https://cdn.mp3quran.net/audio/ahmad-ajmi/r1/${s}.mp3`,
        `https://server8.mp3quran.net/ajm/${s}.mp3`,
      ];
    },
  },
  {
    id: "shaatree",
    readId: 4,
    name: "Abu Bakr Ash-Shaatree",
    arabic: "أبو بكر الشاطري",
    rewaya: "Hafs 'an 'Asim",
    quality: "128 kbps Clear (MP3Quran)",
    folderUrl: "https://cdn.mp3quran.net/audio/abubakr-shatri/r1/",
    serverFallback: "https://server8.mp3quran.net/shatri/",
    getSurahUrls: (surah) => {
      const s = String(surah).padStart(3, "0");
      return [
        `https://cdn.mp3quran.net/audio/abubakr-shatri/r1/${s}.mp3`,
        `https://server8.mp3quran.net/shatri/${s}.mp3`,
      ];
    },
  },
];

export const MP3QURAN_RECITERS = RECITERS;
