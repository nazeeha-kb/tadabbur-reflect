# Tadabbur: Quran Reflection App

[![Next.js](https://img.shields.io/badge/Next.js-15.2.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[Live Link](https://tadabbur-reflect.vercel.app/)

A modern, intimate web application that helps Muslims deepen their connection with the Quran through quiet reflection, emotional resonance, and meaningful moments.

## 🌟 Problem Statement

Many Muslims long for the Qur’an to speak to their hearts, but most Quran tools feel like study trackers or content feeds. They need a gentle space to reflect with emotion and life moments, not another checklist.
## Screenshot
![screenshot](screenshot.png)


## 🚀 Solution

Tadabbur offers a calm place to meet the Qur’an through what you are feeling:
- **Verse Discovery**: Find ayahs that resonate with your current heart
- **Reflection Memory Space**: Capture the meaning of a verse in your life
- **Personal Resonance**: Suggestions based on mood, themes, and moments
- **Inner Landscape Insights**: Gentle reminders of what you have reflected on
- **Tafseer Support**: Optional scholarly context without overwhelming the experience

## ✨ Key Features

### 📖 Interactive Quran Browser
- Browse surahs and verses with clean, responsive design
- Audio recitation integration for immersive experience
- Multiple tafseer sources for comprehensive understanding

### ✍️ Rich Reflection Editor
- Live markdown preview while writing
- Tag system for organizing reflections by themes
- Timestamped entries for tracking spiritual journey

### 🎯 Personalized Recommendations
- Emotion-based verse search using natural language processing
- Smart suggestions based on reflection history
- Thematic exploration through reflection tags

### 🧘 Quiet Reflection Journal
- Save every reflection as a personal moment
- Revisit ayahs that helped you feel calm, hopeful, or held
- Soft insights about what themes are surfacing over time
- **Quran Foundation User API Integration**: gentle synchronization for saved reflections

### 🔐 Secure Authentication
- OAuth integration with Quran Foundation API (partially implemented)
- Secure user sessions and data privacy
- Cross-device synchronization (planned)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: Local storage with future MongoDB integration
- **Authentication**: Quran Foundation OAuth (scaffolding in place)
- **AI/NLP**: OpenRouter API for emotion-based verse recommendations, Compromise.js for local NLP processing
- **Quran APIs**: Quran Foundation Content API (for search/verses), User API (streak tracking - demo integration)
- **UI Components**: Custom components with Phosphor Icons
- **Markdown**: React Markdown with remark-breaks

## 📋 Prerequisites

- Node.js >= 20.9.0
- npm, yarn, pnpm, or bun

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tadabbur-reflect.git
   cd tadabbur reflect
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Configure your Quran Foundation API credentials and other settings.

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Getting Started
1. **Sign In**: Open your quiet space and begin without pressure
2. **Share Your Heart**: Describe what you are feeling or what you need
3. **Connect with an Ayah**: Find a verse that speaks softly to you
4. **Write Reflection**: Journal what this verse means in your life
5. **Return to Your Moment**: Revisit reflections that brought calm and clarity

### Advanced Features
- **Emotion Search**: "Find verses about patience" or "verses for hope"
- **Tafseer Notes**: Optional scholarly context when you choose it
- **Tag Organization**: Group reflections by feelings and life moments
- **Audio Recitation**: Listen while reflecting for deeper calm
- **User API Integration**: gentle saving and syncing for your reflections

## 🏗️ Project Structure

```
tadabbur-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   └── page.js            # Homepage
├── components/            # Reusable UI components
├── lib/                   # Utility functions and API clients
├── public/                # Static assets
└── scripts/               # Build and maintenance scripts
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Quran Foundation for Content API access, authentication scaffolding, and User API integration (streak tracking demo)
- Islamic scholars for tafseer sources
- OpenRouter for AI-powered emotion search
- Open source community for amazing tools and libraries

## 📞 Contact

For questions or support, please open an issue on GitHub.

---

*Built with ❤️ for the Muslim community to foster deeper connections with the Quran.*
