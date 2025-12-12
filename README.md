# Task Manager

A modern, Trello-inspired task management application built with cutting-edge web technologies. Features a beautiful glass morphism design, drag-and-drop functionality, and comprehensive project management tools.

![Task Manager Preview](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Task+Manager+Preview)

## ✨ Features

### 🎯 Core Functionality
- **Drag & Drop**: Intuitive drag-and-drop interface for moving tasks between lists
- **Board Management**: Create and organize multiple boards for different projects
- **List Organization**: Add, edit, and reorder task lists within boards
- **Task Cards**: Create, edit, and manage individual tasks with rich content

### 📝 Rich Content
- **Rich Text Editor**: Full-featured WYSIWYG editor powered by TipTap
- **File Attachments**: Upload and manage file attachments for tasks
- **Due Dates**: Set and track task deadlines with visual indicators
- **Member Assignment**: Assign tasks to team members
- **Comments & Notes**: Add detailed descriptions and notes to tasks

### 🎨 Modern UI/UX
- **Glass Morphism Design**: Beautiful frosted glass effects and modern aesthetics
- **Dark/Light Themes**: Seamless theme switching with professional color schemes
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Internationalization**: Multi-language support with i18next

### 🛠️ Technical Features
- **Real-time Updates**: Instant UI updates with Zustand state management
- **TypeScript**: Full type safety and excellent developer experience
- **Modern Build Tools**: Vite for lightning-fast development and builds
- **Component Architecture**: Modular, reusable React components
- **Accessibility**: WCAG-compliant interface design

## 🚀 Tech Stack

### Frontend Framework
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe JavaScript for robust development
- **Vite** - Next-generation frontend tooling

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework with native @theme
- **Lucide React** - Beautiful, consistent icon library
- **Inter Font** - Modern, highly legible typography

### State Management & Data
- **Zustand** - Lightweight, scalable state management
- **Local Storage** - Persistent data storage

### Libraries & Tools
- **@dnd-kit** - Modern drag-and-drop library
- **TipTap** - Headless rich text editor
- **date-fns** - Modern JavaScript date utility library
- **i18next** - Internationalization framework
- **React Router** - Client-side routing (if needed)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/task-manager.git
   cd task-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Build & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Type Checking
```bash
npm run type-check
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Board.tsx       # Main board component with drag-drop
│   ├── TaskList.tsx    # Individual list containers
│   ├── TaskCard.tsx    # Task card with rich editing
│   ├── Header.tsx      # App header with theme toggle
│   ├── FileUpload.tsx  # File attachment component
│   └── RichTextEditor.tsx # WYSIWYG editor
├── contexts/           # React contexts
│   └── ThemeContext.tsx # Theme management
├── store/              # State management
│   └── taskStore.ts    # Zustand store for tasks/boards
├── assets/             # Static assets
├── i18n.ts            # Internationalization config
├── index.css          # Global styles with Tailwind
└── main.tsx           # App entry point
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3b82f6) with full shade spectrum
- **Background**: Clean whites and dark grays
- **Text**: High contrast slate colors
- **Glass Effects**: Subtle transparency with backdrop blur

### Typography
- **Font Family**: Inter (300-800 weights)
- **Hierarchy**: Clear size and weight scales
- **Readability**: Optimized line heights and spacing

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Consistent sizing with hover states
- **Inputs**: Modern styling with focus indicators
- **Animations**: Smooth transitions and micro-interactions

## 🌍 Internationalization

The app supports multiple languages through i18next. Translation files are located in `src/locales/`.

Currently supported languages:
- English (en)
- Arabic (ar) - RTL support included

## 🔧 Configuration

### Tailwind CSS v4
Custom theme configuration in `src/index.css`:

```css
@theme {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  /* ... full color spectrum */
  --font-family-sans: 'Inter', system-ui, sans-serif;
}
```

### Vite Configuration
Modern build setup with:
- React SWC plugin for fast compilation
- Path aliases for clean imports
- Optimized production builds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing React framework
- **Tailwind CSS** for the utility-first CSS framework
- **Vercel** for inspiration on modern web design
- **Trello** for the original kanban board concept

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the maintainers.

---

**Built with ❤️ using modern web technologies**
