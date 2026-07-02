# BigQuery Release Notes Hub 🚀

A modern, premium web application built with **Python Flask** and **Vanilla HTML, CSS, and JavaScript** that aggregates, filters, searches, and shares Google Cloud BigQuery release notes.

Unlike default RSS readers that render a single date's release notes in a massive text block, this application parses and isolates individual features, changes, and announcements into distinct interactive cards.

---

## ✨ Features

- **Granular Entry Parsing**: Splits Google Cloud's Atom feed entries using heading tags (`Feature`, `Change`, `Announcement`, `Issue`, `Breaking`) to present clean, individual cards.
- **Advanced X/Twitter Sharing Flow**:
  - **Single Update**: Generates a pre-formatted tweet with category tags, custom summary, and the documentation URL.
  - **Multiple Updates (Multi-Select)**: Clicking on cards highlights them. A floating action bar handles compiling them into a combined tweet. It automatically divides the 280-character limit evenly between your selected items, keeping individual documentation anchors intact.
- **Filter and Search**:
  - Filter updates instantly using category pills.
  - Search notes dynamically by content keywords, dates, or tags.
- **Premium Aesthetics**:
  - Out-of-the-box glowing dark theme and clean light theme toggle.
  - Responsive layout (grid scales smoothly from mobile screens up to desktop).
  - Shimmering CSS skeleton loader screens shown while fetching the feed.
  - Tactile selection transitions and toast notifications.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.x, Flask, Requests (HTTP calls), BeautifulSoup4 (HTML parser & cleaner).
- **Frontend**: Vanilla HTML5, CSS3 (variables, transitions, custom keyframes), Vanilla JavaScript (state management, event listeners).
- **Icons**: FontAwesome CDN.
- **Typography**: Google Fonts (Outfit & Inter).

---

## 📁 File Structure

```text
bq-release-notes/
├── app.py                  # Flask backend (Feed parser, REST API, & template router)
├── requirements.txt        # Python dependency registry
├── README.md               # Project documentation
├── .gitignore              # Files to ignore in Git version control
├── templates/
│   └── index.html          # SPA markup structure & modal overlays
└── static/
    ├── css/
    │   └── style.css       # Design tokens, theme mappings, & custom keyframes
    └── js/
        └── app.js          # Client-side state, filters, search, & Twitter intent
```

---

## 🚀 Getting Started

Follow these steps to run the application locally on your machine.

### Prerequisites
Make sure you have **Python 3.x** and **Git** installed on your system.

### 1. Initialize Git & Check out Code
If you haven't done so, clone the repository or enter the project directory:
```bash
git clone https://github.com/yanjunliu-regina/yanjunliu-regina-event-talks-app.git
cd yanjunliu-regina-event-talks-app
```

### 2. Set Up a Virtual Environment (Recommended)
Create and activate an isolated Python environment:
```powershell
# Windows PowerShell
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux Terminal
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
Install Flask, requests, and beautifulsoup4 from `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 4. Run the Flask Server
Start the development server:
```bash
python app.py
```

Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## ⚙️ How the Twitter Sharing Works

The app implements a custom JavaScript character budget distributor:
- Maximum Tweet character limit is **280**.
- The script calculates the static overhead characters (headings, hashtags like `#BigQuery`, spacing, and URL paths).
- It takes the remaining character budget and divides it evenly among all selected updates.
- Descriptions that exceed their assigned segment budget are programmatically truncated with `...` to guarantee the compiled message never breaks X/Twitter's character limit.
- Pushing **Tweet** opens a browser window loaded with Twitter's **Web Intent** API, avoiding the need for developer tokens or backend API configurations.

---

## 📄 License
This project is open-source and available under the MIT License.
