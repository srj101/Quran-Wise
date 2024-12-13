# Quran Web Application

A modern, responsive Quran web application built with **Next.js 13+ App Directory**, **Tailwind CSS**, and dynamic API integration. This project provides a seamless reading experience with verse-by-verse translations, audio playback, and real-time navigation.

## 🌟 Features

- **Surah Overview**: Displays a list of all Surahs with their English names and translations.
- **Dynamic Surah Page**:
  - Verse-by-verse display with Arabic text, English and Bengali translations, and audio.
  - Real-time tracking of the current verse position while scrolling.
- **API Integration**:
  - Arabic text and audio from [alquran.cloud](https://alquran.cloud/v1/quran/ar.alafasy).
  - English translation from [alquran.cloud](https://alquran.cloud/v1/quran/en.asad).
- **Performance Optimization**:
  - Server-side rendering for better SEO and faster initial load.
  - Infinite scroll support for smooth navigation.
- **Modern UI/UX**: Built with Tailwind CSS for a clean and responsive design.

## 🚀 Technologies Used

- **Framework**: [Next.js 13+](https://nextjs.org/docs)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **API Integration**: Fetching data from [alquran.cloud](https://alquran.cloud/)
- **Languages**: JavaScript, JSX

## 📂 Directory Structure

```
.
├── app
│   ├── quran
│   │   ├── page.jsx          # Quran overview page
│   │   └── [sura]
│   │       └── page.jsx      # Individual Surah page
│   └── api
│       └── quran
│           └── route.js      # Custom API route
├── components
│   ├── SurahList.jsx         # Component for displaying Surah list
│   ├── Verse.jsx             # Component for rendering a single verse
├── public
│   └── assets                # Static assets (e.g., logos, icons)
├── styles
│   └── globals.css           # Tailwind CSS configurations
├── tailwind.config.js        # Tailwind CSS configuration
├── README.md                 # Project documentation
└── package.json              # Project dependencies
```

## 🛠️ Installation

Follow these steps to set up the project locally:

### 1. Clone the Repository

```bash
git clone https://github.com/srjoy01/quran-web-app.git
cd quran-web-app
```

### 2. Install Dependencies

Make sure you have Node.js and npm installed. Then run:

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

### 4. Build for Production

To create an optimized production build:

```bash
npm run build
```

Serve the production build locally:

```bash
npm run start
```

## 🔧 API Configuration

This app integrates with the [alquran.cloud API](https://alquran.cloud/) for fetching Quran data. The following endpoints are used:

- **Arabic Text and Audio**: `https://api.alquran.cloud/v1/surah/{surah}/ar.alafasy`
- **English Translation**: `https://api.alquran.cloud/v1/surah/{surah}/en.asad`
- **Full Quran Data**: `https://api.alquran.cloud/v1/quran`

## ✨ Customization

### Tailwind Theme

The project uses a customized Tailwind CSS theme defined in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: "#3B3030",
      secondary: "#664343",
      accent: "#795757",
      background: "#FFF0D1",
    },
    fontFamily: {
      monsterate: ["Montserrat", "sans-serif"],
    },
  },
},
```

Feel free to modify these values to match your branding.

## 📖 Usage

### Quran Overview Page

- Navigate to `/quran` to view the list of all Surahs.
- Each Surah links to its corresponding verse-by-verse reading page.

### Surah Reading Page

- View Arabic text, translations, and audio for each verse.
- Scroll to navigate through verses while tracking the current verse.

## 🖼️ Screenshots

### Home Page

![Quran Home Page](public/assets/screenshots/homepage.png)

### Surah Page

![Surah Page](public/assets/screenshots/surahpage.png)

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m 'Add a new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [alquran.cloud API](https://alquran.cloud/) for providing Quran data.
- [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/) for making development a joy.

---

**Developed with ❤️ by SR Joy**.
